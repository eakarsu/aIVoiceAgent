import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const items = await prisma.accentAdaptation.findMany({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { title, description, originalText, sourceAccent, targetAccent } = await request.json();
    if (!title || !originalText) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const item = await prisma.accentAdaptation.create({
      data: { title, description, originalText, sourceAccent, targetAccent, status: "processing", businessId: session.user.businessId },
    });

    processWithAI(item.id, originalText, sourceAccent, targetAccent);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, source: string, target: string) {
  try {
    const response = await callOpenRouter(
      `Adapt this text from ${source} accent to ${target} accent:\n\n${text}`,
      AI_PROMPTS.accentAdapter.system(source, target)
    );
    const aiResponse = parseJSONResponse(response);
    await prisma.accentAdaptation.update({
      where: { id },
      data: { adaptedText: aiResponse.adaptedText || response, aiResponse, status: "completed" },
    });
  } catch (error) {
    await prisma.accentAdaptation.update({
      where: { id },
      data: { status: "failed", aiResponse: { error: String(error) } },
    });
  }
}
