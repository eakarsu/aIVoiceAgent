import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";
import {
  aiRateLimiter,
  parseAIJson,
  persistAIResult,
  identifyRequest,
} from "@/lib/ai-helpers";
import { getPagination, paginatedResponse } from "@/lib/security";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const { page, pageSize, skip, take } = getPagination(url);

    const where = { businessId: session.user.businessId };
    const [items, total] = await Promise.all([
      prisma.intentClassification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.intentClassification.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(items, total, page, pageSize));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Per-user AI rate limit (20/hr).
    const rl = aiRateLimiter(`user:${session.user.id}` || identifyRequest(request));
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: "AI rate limit exceeded",
          remaining: 0,
          resetAt: rl.resetAt,
        },
        { status: 429 }
      );
    }

    const { title, description, inputText } = await request.json();
    if (!title || !inputText)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const item = await prisma.intentClassification.create({
      data: {
        title,
        description,
        inputText,
        status: "processing",
        businessId: session.user.businessId,
      },
    });
    processWithAI(item.id, inputText, session.user.businessId);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, businessId: string) {
  try {
    const response = await callOpenRouter(
      `Classify the intent of this text:\n\n${text}`,
      AI_PROMPTS.intentClassifier.system()
    );
    // Use the 3-strategy parser; fall back to legacy on null.
    const aiResponse =
      parseAIJson<any>(response) ?? parseJSONResponse(response);

    await prisma.intentClassification.update({
      where: { id },
      data: {
        detectedIntent: aiResponse?.intent,
        confidence: aiResponse?.confidence,
        entities: aiResponse?.entities,
        aiResponse,
        status: "completed",
      },
    });

    // Persist to ai_results JSONB pool for observability + future training.
    await persistAIResult({
      businessId,
      feature: "intent_classifier",
      input: text,
      output: aiResponse,
      model:
        process.env.OPENROUTER_MODEL ||
        "anthropic/claude-3-5-sonnet-20241022",
    });
  } catch (error) {
    await prisma.intentClassification.update({
      where: { id },
      data: {
        status: "failed",
        aiResponse: { error: String(error) } as any,
      },
    });
  }
}
