/**
 * voiceStudioFeat_consentLedger
 * Append-only consent ledger — who consented to what voice/avatar use.
 * Records are immutable after creation (no updatedAt mutation).
 *
 * Mounts at /api/voicestudio/consentLedger
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Voice Studio consent ledger system.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-consent-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
  const { success } = rateLimit(key, { maxRequests: 30, windowMs: 60 * 60 * 1000 });
  if (!success) return { ok: false, resp: NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 }) };
  return { ok: true };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = getPagination(url);
    const action = url.searchParams.get("action");
    const subjectId = url.searchParams.get("subjectId");
    const scope = url.searchParams.get("scope");
    const eventType = url.searchParams.get("eventType");
    const search = url.searchParams.get("search")?.trim();

    // by-subject
    if (action === "by-subject" && subjectId) {
      const rows = await prisma.vsConsentEvent.findMany({
        where: { businessId, subjectId },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ data: rows });
    }

    // by-scope
    if (action === "by-scope" && scope) {
      const [rows, total] = await Promise.all([
        prisma.vsConsentEvent.findMany({ where: { businessId, scope }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsConsentEvent.count({ where: { businessId, scope } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    // count
    if (action === "count") {
      const where: any = { businessId };
      if (eventType) where.eventType = eventType;
      if (scope) where.scope = scope;
      const count = await prisma.vsConsentEvent.count({ where });
      return NextResponse.json({ count });
    }

    // stats-summary
    if (action === "stats") {
      const [total, granted, revoked, expired] = await Promise.all([
        prisma.vsConsentEvent.count({ where: { businessId } }),
        prisma.vsConsentEvent.count({ where: { businessId, eventType: "granted" } }),
        prisma.vsConsentEvent.count({ where: { businessId, eventType: "revoked" } }),
        prisma.vsConsentEvent.count({ where: { businessId, eventType: "expired" } }),
      ]);
      return NextResponse.json({ total, granted, revoked, expired });
    }

    // export-csv
    if (action === "export-csv") {
      const rows = await prisma.vsConsentEvent.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "subjectId", "eventType", "scope", "consentVersion", "witnessId", "isTampered", "expiresAt", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="consent_ledger.csv"' },
      });
    }

    // search
    if (action === "search" || search) {
      const q = search ?? "";
      const [rows, total] = await Promise.all([
        prisma.vsConsentEvent.findMany({
          where: { businessId, OR: [
            { subjectId: { contains: q, mode: "insensitive" } },
            { scope: { contains: q, mode: "insensitive" } },
            { notes: { contains: q, mode: "insensitive" } },
          ]},
          orderBy: { createdAt: "desc" }, skip, take,
        }),
        prisma.vsConsentEvent.count({ where: { businessId, OR: [
          { subjectId: { contains: q, mode: "insensitive" } },
        ]} }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    // Default list
    const where: any = { businessId };
    if (eventType) where.eventType = eventType;
    if (scope) where.scope = scope;
    const [rows, total] = await Promise.all([
      prisma.vsConsentEvent.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsConsentEvent.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("consentLedger GET:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Ledger is append-only — POST creates, no PUT/DELETE on ledger records
export async function POST(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    // AI verbs
    if (action?.startsWith("ai:")) {
      const guard = await aiRateGuard(req);
      if (!guard.ok) return guard.resp!;
      return handleAiVerb(action.slice(3), body, businessId);
    }

    // batch-create (append-only records)
    if (action === "batch-create") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 });
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsConsentEvent.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    // import-csv
    if (action === "import-csv") {
      const { csv } = body;
      if (!csv) return NextResponse.json({ error: "csv field required" }, { status: 400 });
      const lines = (csv as string).split("\n").map((l: string) => l.trim()).filter(Boolean);
      if (lines.length < 2) return NextResponse.json({ error: "CSV must have header + rows" }, { status: 400 });
      const headers = lines[0].split(",").map((h: string) => h.replace(/"/g, "").trim());
      const items = lines.slice(1).map((line: string) => {
        const vals = line.match(/(".*?"|[^,]+)/g) || [];
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = vals[i] ? vals[i].replace(/^"|"$/g, "").replace(/""/g, '"') : null; });
        return obj;
      });
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsConsentEvent.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    // Create single consent event
    const { subjectId, eventType, scope, consentVersion } = body;
    if (!subjectId || !eventType || !scope || !consentVersion) {
      return NextResponse.json({ error: "subjectId, eventType, scope, consentVersion required" }, { status: 400 });
    }
    const event = await prisma.vsConsentEvent.create({ data: { ...body, businessId } });
    return NextResponse.json({ data: event }, { status: 201 });
  } catch (err: any) {
    console.error("consentLedger POST:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// READ-ONLY ledger: PUT is disallowed to preserve integrity
export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: "Consent ledger is append-only. Records cannot be modified." }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Consent ledger is append-only. Records cannot be deleted." }, { status: 405 });
}

// PATCH for meta-only operations (archive, history lookups)
export async function PATCH(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    // history: get all events for enrollmentId
    if (action === "history") {
      const { enrollmentId, subjectId } = body;
      const where: any = { businessId };
      if (enrollmentId) where.enrollmentId = enrollmentId;
      if (subjectId) where.subjectId = subjectId;
      const rows = await prisma.vsConsentEvent.findMany({ where, orderBy: { createdAt: "asc" } });
      return NextResponse.json({ data: rows });
    }

    return NextResponse.json({ error: "Unknown action. Ledger is immutable." }, { status: 400 });
  } catch (err: any) {
    console.error("consentLedger PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const ctx = `Business: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "classify-consent-event": `${ctx}\nClassify this consent event type and its legal implications. Return JSON: { classification: string, legal_weight: string, implications: string[], risk: string }`,
    "validate-ledger-integrity": `${ctx}\nValidate the integrity of the consent ledger entries. Return JSON: { integrity_ok: boolean, issues: string[], tamper_indicators: string[], recommendation: string }`,
    "detect-tamper": `${ctx}\nDetect if any consent ledger records show signs of tampering. Return JSON: { tampered: boolean, tamper_score: number, anomalies: string[], recommended_action: string }`,
    "suggest-additional-attestation": `${ctx}\nSuggest additional attestation requirements for stronger consent evidence. Return JSON: { suggestions: [{type, description, priority}], rationale: string }`,
    "predict-consent-revocation": `${ctx}\nPredict likelihood of consent revocation based on patterns. Return JSON: { revocation_probability: number, risk_factors: string[], retention_suggestions: string[] }`,
    "generate-consent-statement": `${ctx}\nGenerate a formal consent statement for this scope. Return JSON: { statement: string, version: string, key_clauses: string[], subject_rights: string[] }`,
    "summarize-consent-history-for-subject": `${ctx}\nSummarize all consent events for this subject. Return JSON: { summary: string, active_consents: string[], revocations: string[], timeline: string[] }`,
    "score-ledger-completeness": `${ctx}\nScore the completeness of consent ledger records. Return JSON: { score: number, missing_fields: string[], strong_fields: string[], recommendations: string[] }`,
    "suggest-scope-tightening": `${ctx}\nSuggest ways to tighten consent scopes to reduce risk. Return JSON: { suggestions: [{current_scope, tightened_scope, rationale}], overall_recommendation: string }`,
    "classify-revocation-impact": `${ctx}\nClassify the impact of a consent revocation. Return JSON: { impact_tier: string, affected_uses: string[], immediate_actions: string[], downstream_effects: string[] }`,
    "generate-revocation-effects-list": `${ctx}\nGenerate a complete list of effects from consent revocation. Return JSON: { effects: [{area, description, urgency}], timeline_to_comply: string }`,
    "validate-witness-attestation": `${ctx}\nValidate if the witness attestation is legally sufficient. Return JSON: { valid: boolean, issues: string[], missing: string[], strength: string }`,
    "recommend-retention-period": `${ctx}\nRecommend the appropriate data retention period for consent records. Return JSON: { recommended_months: number, legal_basis: string, factors: string[] }`,
    "detect-stale-consent": `${ctx}\nDetect consent records that are stale or near expiry. Return JSON: { stale_records: [{id, expiry, days_remaining}], action_required: boolean, notifications_needed: string[] }`,
    "summarize-consent-by-scope": `${ctx}\nSummarize consent coverage by scope type. Return JSON: { by_scope: [{scope, count, active, revoked}], coverage_gaps: string[] }`,
    "score-consent-clarity": `${ctx}\nScore the clarity and comprehensibility of consent language. Return JSON: { clarity_score: number, reading_level: string, ambiguous_clauses: string[], improvements: string[] }`,
  };

  const prompt = verbPrompts[verb];
  if (!prompt) return NextResponse.json({ error: `Unknown AI verb: ${verb}` }, { status: 400 });

  try {
    const text = await callOpenRouter(prompt, SYSTEM);
    const parsed = parseJSONResponse(text);
    return NextResponse.json({ success: true, verb, result: parsed });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
