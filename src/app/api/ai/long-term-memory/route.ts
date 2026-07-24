import { NextResponse } from "next/server";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { persistAIResult } from "@/lib/ai-helpers";

// Long-term contextual conversation memory across sessions
// Feature: long-term-memory

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessId = session.user.businessId;
    const body = await request.json().catch(() => ({}));
    const { customerId, recentTurns = [], summarizeAfter = 12 } = body || {};

    if (!customerId) {
      return NextResponse.json(
        { error: "customerId is required" },
        { status: 400 }
      );
    }

    const systemPrompt =
      'You maintain durable cross-session memory for AI voice agent customers. Return strict JSON only.';
    const userPrompt = `Customer: ${customerId}. Business: ${businessId}.
Recent turns (most recent last): ${JSON.stringify(recentTurns).slice(0, 3500)}.
If turns exceed ${summarizeAfter}, compress earliest into durable facts.
Return JSON: { durable_facts:[], open_threads:[], preferences:{}, sentiments_recent:[], summary }`;

    const text = await callOpenRouter(userPrompt, systemPrompt);
    if (!text.trim()) throw new Error("OpenRouter returned empty content");
    const parsed = parseJSONResponse(text);
    const output = parsed || { response: text };
    const model = process.env.OPENROUTER_MODEL || "";
    await persistAIResult({
      businessId,
      userId: session.user.id,
      feature: "long-term-memory",
      input: { customerId, recentTurns, summarizeAfter },
      output,
      model,
    });

    return NextResponse.json({
      success: true,
      feature: "long-term-memory",
      customerId,
      businessId,
      model,
      ...output,
    });
  } catch (err: any) {
    console.error("long-term-memory error:", err.message);
    return NextResponse.json(
      { error: err.message || "AI request failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    feature: "long-term-memory",
    title: "Long-term contextual conversation memory across sessions",
    method: "POST",
  });
}
