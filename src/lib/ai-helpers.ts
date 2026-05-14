// Shared AI helpers for aIVoiceAgent
// - Standardized model: anthropic/claude-3-5-sonnet-20241022 (overridable via env)
// - parseAIJson: 3-strategy JSON parser (raw -> fenced -> brace-extract)
// - aiRateLimiter: 20 calls per hour per user/key
// - persistAIResult: writes ai_results JSONB rows for observability
// - billingMeter: increments UsageBilling tokens for tenant

import prisma from "@/lib/prisma";

export const DEFAULT_AI_MODEL =
  process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMsg {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  systemPrompt?: string;
  userPrompt?: string;
  messages?: OpenRouterMsg[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
  jsonMode?: boolean;
}

export interface AICallResult {
  text: string;
  raw?: any;
  tokens?: { prompt?: number; completion?: number; total?: number };
  model?: string;
  durationMs: number;
}

export async function callAI(opts: AICallOptions): Promise<AICallResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = opts.model || DEFAULT_AI_MODEL;
  const start = Date.now();

  const msgs: OpenRouterMsg[] = opts.messages
    ? [...opts.messages]
    : [
        ...(opts.systemPrompt
          ? [{ role: "system", content: opts.systemPrompt } as OpenRouterMsg]
          : []),
        ...(opts.userPrompt
          ? [{ role: "user", content: opts.userPrompt } as OpenRouterMsg]
          : []),
      ];

  if (!apiKey) {
    return {
      text: "",
      durationMs: Date.now() - start,
      model,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const body: any = {
      model,
      messages: msgs,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.7,
    };
    if (opts.jsonMode) {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
        "X-Title": "AI Voice Agent Platform",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`OpenRouter error ${res.status}: ${txt}`);
    }

    const data = await res.json();
    return {
      text: data.choices?.[0]?.message?.content || "",
      raw: data,
      tokens: data.usage
        ? {
            prompt: data.usage.prompt_tokens,
            completion: data.usage.completion_tokens,
            total: data.usage.total_tokens,
          }
        : undefined,
      model,
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timeout);
  }
}

// 3-strategy JSON parser (raw -> fenced ```json``` -> first {...} brace block)
export function parseAIJson<T = any>(text: string): T | null {
  if (!text) return null;

  // Strategy 1: try raw JSON parse
  try {
    return JSON.parse(text) as T;
  } catch {}

  // Strategy 2: extract fenced JSON block
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {}
  }

  // Strategy 3: extract first balanced { ... }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      return JSON.parse(slice) as T;
    } catch {}
  }

  // Final attempt: find array form
  const aStart = text.indexOf("[");
  const aEnd = text.lastIndexOf("]");
  if (aStart !== -1 && aEnd !== -1 && aEnd > aStart) {
    try {
      return JSON.parse(text.slice(aStart, aEnd + 1)) as T;
    } catch {}
  }

  return null;
}

// Rate limit: 20 AI calls per hour per identity (userId / apiKey / IP).
// Uses an in-memory sliding window. For a multi-instance deployment swap for Redis.
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = Number(process.env.AI_RATE_PER_HOUR ?? 20);
const aiCalls = new Map<string, number[]>();

export interface AIRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function aiRateLimiter(identity: string): AIRateLimitResult {
  const now = Date.now();
  const list = (aiCalls.get(identity) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (list.length >= RATE_MAX) {
    const resetAt = list[0] + RATE_WINDOW_MS;
    aiCalls.set(identity, list);
    return { allowed: false, remaining: 0, resetAt };
  }
  list.push(now);
  aiCalls.set(identity, list);
  return {
    allowed: true,
    remaining: RATE_MAX - list.length,
    resetAt: now + RATE_WINDOW_MS,
  };
}

// Persist AI usage to ai_results JSONB pool (preferred) and best-effort
// AiTrainingData mirror (legacy). Both calls are non-throwing.
export async function persistAIResult(params: {
  businessId?: string | null;
  userId?: string | null;
  callId?: string | null;
  feature: string;
  input: any;
  output: any;
  model: string;
  tokens?: number;
  durationMs?: number;
  category?: string;
}) {
  // Primary: ai_results JSONB row.
  try {
    if ((prisma as any).aiResult?.create) {
      await (prisma as any).aiResult.create({
        data: {
          feature: params.feature,
          businessId: params.businessId || null,
          userId: params.userId || null,
          callId: params.callId || null,
          model: params.model,
          input: params.input as any,
          output: params.output as any,
          tokens: params.tokens || null,
          durationMs: params.durationMs || null,
        },
      });
    }
  } catch (err) {
    console.warn("persistAIResult.aiResult failed", err);
  }

  // Mirror to AiTrainingData when present so existing tooling keeps working.
  try {
    await prisma.aiTrainingData.create({
      data: {
        input: typeof params.input === "string"
          ? params.input
          : JSON.stringify(params.input),
        output: typeof params.output === "string"
          ? params.output
          : JSON.stringify(params.output),
        context: JSON.stringify({
          feature: params.feature,
          model: params.model,
          tokens: params.tokens,
          durationMs: params.durationMs,
          businessId: params.businessId,
        }),
        category: params.category || params.feature,
        isApproved: false,
      },
    });
  } catch {
    // Mirror is best-effort.
  }
}

// Increment UsageBilling for tenant (per-month aggregation row).
export async function billingMeter(params: {
  businessId: string;
  aiTokens?: number;
  callMinutes?: number;
  smsCount?: number;
}) {
  try {
    const month = new Date();
    month.setUTCDate(1);
    month.setUTCHours(0, 0, 0, 0);

    const existing = await prisma.usageBilling.findFirst({
      where: { businessId: params.businessId, month },
    });

    if (existing) {
      await prisma.usageBilling.update({
        where: { id: existing.id },
        data: {
          aiTokens: { increment: params.aiTokens || 0 },
          callMinutes: { increment: params.callMinutes || 0 },
          smsCount: { increment: params.smsCount || 0 },
        },
      });
    } else {
      await prisma.usageBilling.create({
        data: {
          businessId: params.businessId,
          month,
          aiTokens: params.aiTokens || 0,
          callMinutes: params.callMinutes || 0,
          smsCount: params.smsCount || 0,
        },
      });
    }
  } catch (err) {
    console.warn("billingMeter failed", err);
  }
}

// Helper: identity for rate limiting from a NextRequest (userId from header / x-api-key / IP)
export function identifyRequest(req: Request): string {
  const headers = (req as any).headers as Headers;
  const userId = headers.get?.("x-user-id");
  if (userId) return `user:${userId}`;
  const apiKey = headers.get?.("x-api-key") || headers.get?.("authorization");
  if (apiKey) return `key:${apiKey.slice(-16)}`;
  const fwd = headers.get?.("x-forwarded-for") || "";
  const ip = fwd.split(",")[0]?.trim() || "anon";
  return `ip:${ip}`;
}
