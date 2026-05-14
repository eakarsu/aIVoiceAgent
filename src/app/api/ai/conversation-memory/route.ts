// Apply pass 5 — Conversation Memory Summary (TOO-RISKY for full vector store; this is an
// additive in-memory summary endpoint that uses the LLM to fold past CallMessages into
// a rolling per-caller memory string. No new Prisma model is added.
//
// Env vars:
//   - OPENROUTER_API_KEY (required; missing => 503 + missing: OPENROUTER_API_KEY)
//
// POST body: { from?: string (caller phone), agentId?: string, lookback_days?: number (1-90, default 30) }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";

function aiKeyMissing() {
  return NextResponse.json(
    {
      error: "AI service not configured",
      detail: "OPENROUTER_API_KEY environment variable is not set. Configure it to enable AI analysis.",
      missing: "OPENROUTER_API_KEY",
    },
    { status: 503 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!process.env.OPENROUTER_API_KEY) return aiKeyMissing();

    const body = await request.json().catch(() => ({}));
    const from: string | undefined = body.from;
    const agentId: string | undefined = body.agentId;
    const lookback = Math.min(90, Math.max(1, Number(body.lookback_days) || 30));

    const since = new Date();
    since.setDate(since.getDate() - lookback);

    const where: any = {
      businessId: session.user.businessId,
      startTime: { gte: since },
    };
    if (from) where.from = from;
    if (agentId) where.agentId = agentId;

    const calls = await prisma.call.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: 50,
      select: {
        id: true,
        from: true,
        startTime: true,
        sentiment: true,
        intent: true,
        outcome: true,
        summary: true,
        transcription: true,
        messages: { orderBy: { timestamp: "asc" }, take: 50, select: { role: true, content: true } },
      },
    });

    const systemPrompt = `You build a compact, multi-call conversation memory for a voice-agent
system. Return JSON only:
{
  "memory_summary": "<= 600 chars, third-person",
  "key_facts": ["..."],
  "preferences": ["..."],
  "recurring_intents": [{"intent": "...", "count": <int>}],
  "open_issues": ["..."],
  "next_best_actions": ["..."]
}`;

    const compact = calls.map((c) => ({
      id: c.id,
      from: c.from,
      startTime: c.startTime,
      sentiment: c.sentiment,
      intent: c.intent,
      outcome: c.outcome,
      summary: c.summary,
      transcript_excerpt: (c.transcription || "").slice(0, 1500),
      messages: c.messages,
    }));

    const raw = await callOpenRouter(
      `Caller: ${from || "ALL"}\nLookback days: ${lookback}\nCalls (${calls.length}): ${JSON.stringify(compact)}`,
      systemPrompt,
      4000,
      0.3
    );
    const parsed = parseJSONResponse(raw);

    return NextResponse.json({
      from: from || null,
      agentId: agentId || null,
      lookback_days: lookback,
      calls_analyzed: calls.length,
      memory: parsed,
      // PRODUCT-DECISION: full vector-store memory persistence is TOO-RISKY (new
      // Prisma model + embeddings infra). This endpoint instead returns a folded
      // in-memory summary on each call.
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to build conversation memory", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}
