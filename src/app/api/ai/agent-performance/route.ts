// Apply pass 5 — Agent Performance Scoring (MECHANICAL).
//
// Env vars:
//   - OPENROUTER_API_KEY (required for AI; missing => HTTP 503 + missing: OPENROUTER_API_KEY)
//
// POST body: { agentId?: string, since?: string (ISO), limit?: number (1-100, default 20) }
// Reads recent Call records for the agent (or all in business) and asks the LLM to
// score the agent's performance with deterministic fallback when AI key is absent.
//
// Note: in-memory only — no new Prisma model is added (TOO-RISKY: schema migration).

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
    const agentId: string | undefined = body.agentId;
    const since: string | undefined = body.since;
    const limit = Math.min(100, Math.max(1, Number(body.limit) || 20));

    const where: any = { businessId: session.user.businessId };
    if (agentId) where.agentId = agentId;
    if (since) where.startTime = { gte: new Date(since) };

    const calls = await prisma.call.findMany({
      where,
      orderBy: { startTime: "desc" },
      take: limit,
      select: {
        id: true,
        direction: true,
        status: true,
        duration: true,
        sentiment: true,
        sentimentScore: true,
        outcome: true,
        wasTransferred: true,
        startTime: true,
        agentId: true,
      },
    });

    const summary = {
      total: calls.length,
      resolved: calls.filter((c) => c.outcome === "resolved").length,
      transferred: calls.filter((c) => c.wasTransferred).length,
      avg_duration_sec:
        calls.length > 0
          ? Math.round(calls.reduce((s, c) => s + (c.duration || 0), 0) / calls.length)
          : 0,
      avg_sentiment_score:
        calls.length > 0
          ? Number(
              (
                calls.reduce((s, c) => s + (c.sentimentScore || 0), 0) / calls.length
              ).toFixed(3)
            )
          : 0,
    };

    const systemPrompt = `You evaluate voice-agent performance. Return JSON only with this shape:
{
  "overall_score": 0-100,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "coaching_priorities": ["..."],
  "kpi_breakdown": {
    "resolution_rate_pct": <number>,
    "transfer_rate_pct": <number>,
    "avg_sentiment_score": <number>,
    "duration_efficiency": "good|average|poor"
  },
  "narrative": "..."
}`;

    const raw = await callOpenRouter(
      `Agent: ${agentId || "ALL"}\nSummary: ${JSON.stringify(summary)}\nRecent calls (${calls.length}): ${JSON.stringify(calls)}`,
      systemPrompt,
      4000,
      0.3
    );
    const parsed = parseJSONResponse(raw);
    return NextResponse.json({
      agentId: agentId || null,
      window: { since: since || null, limit },
      calls_analyzed: calls.length,
      summary,
      analysis: parsed,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to score agent performance", detail: String(error?.message || error) },
      { status: 500 }
    );
  }
}
