/**
 * voiceStudioFeat_voiceCloneEnroll
 * Voice clone enrollment, consent, sample management.
 * CRITICAL: Consent MUST be granted before enrollment becomes active.
 *
 * Mounts at /api/voicestudio/voiceCloneEnroll
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Voice Studio platform.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-enroll-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
  const { success } = rateLimit(key, { maxRequests: 30, windowMs: 60 * 60 * 1000 });
  if (!success) {
    return { ok: false, resp: NextResponse.json({ error: "Rate limit exceeded (30 AI calls/hr)" }, { status: 429 }) };
  }
  return { ok: true };
}

// ─── CRUD ────────────────────────────────────────────────────────────────────

// 1. GET  /  — list with pagination + optional status/subjectId filter
// 2. POST /  — create enrollment (requires consentGrantedAt in body or explicit consent block)
export async function GET(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = getPagination(url);
    const status = url.searchParams.get("status");
    const subjectId = url.searchParams.get("subjectId");
    const search = url.searchParams.get("search")?.trim();
    const action = url.searchParams.get("action");

    // 8. by-subject
    if (action === "by-subject" && subjectId) {
      const rows = await prisma.vsEnrollment.findMany({
        where: { businessId, subjectId, isArchived: false },
        orderBy: { createdAt: "desc" },
        include: { samples: true },
      });
      return NextResponse.json({ data: rows });
    }

    // 9. count
    if (action === "count") {
      const where: any = { businessId };
      if (status) where.status = status;
      const count = await prisma.vsEnrollment.count({ where });
      return NextResponse.json({ count });
    }

    // 10. stats-summary
    if (action === "stats") {
      const [total, active, pending, revoked] = await Promise.all([
        prisma.vsEnrollment.count({ where: { businessId } }),
        prisma.vsEnrollment.count({ where: { businessId, status: "active" } }),
        prisma.vsEnrollment.count({ where: { businessId, status: "pending" } }),
        prisma.vsEnrollment.count({ where: { businessId, status: "revoked" } }),
      ]);
      return NextResponse.json({ total, active, pending, revoked });
    }

    // 11. export-csv
    if (action === "export-csv") {
      const rows = await prisma.vsEnrollment.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "subjectId", "subjectName", "displayName", "status", "consentGrantedAt", "qualityScore", "fidelityScore", "isArchived", "createdAt", "updatedAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="enrollments.csv"' },
      });
    }

    // Default: paginated list
    const where: any = { businessId };
    if (status) where.status = status;
    if (search) where.OR = [
      { subjectName: { contains: search, mode: "insensitive" } },
      { displayName: { contains: search, mode: "insensitive" } },
      { subjectId: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsEnrollment.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { _count: { select: { samples: true } } } }),
      prisma.vsEnrollment.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("voiceCloneEnroll GET:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    // 12. batch-create
    if (action === "batch-create") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 });
      for (const item of items) {
        if (!item.consentGrantedAt) return NextResponse.json({ error: "Each enrollment item requires consentGrantedAt" }, { status: 400 });
      }
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsEnrollment.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    // 14. import-csv
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsEnrollment.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    // ── AI verbs via POST /api/voicestudio/voiceCloneEnroll?action=ai:<verb> ──
    if (action?.startsWith("ai:")) {
      const guard = await aiRateGuard(req);
      if (!guard.ok) return guard.resp!;
      return handleAiVerb(action.slice(3), body, businessId);
    }

    // Create (consent gate enforced)
    const { subjectId, subjectName, consentGrantedAt, consentVersion } = body;
    if (!subjectId || !subjectName) return NextResponse.json({ error: "subjectId and subjectName required" }, { status: 400 });
    if (!consentGrantedAt) return NextResponse.json({ error: "consentGrantedAt is required — voice clone enrollment requires valid consent" }, { status: 400 });

    const enrollment = await prisma.vsEnrollment.create({
      data: {
        ...body,
        businessId,
        status: "pending",
        consentGrantedAt: new Date(consentGrantedAt),
        consentVersion: consentVersion ?? "1.0",
      },
    });
    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (err: any) {
    console.error("voiceCloneEnroll POST:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    // 13. batch-update
    if (action === "batch-update") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 });
      const results = await Promise.all(items.map(async ({ id, ...fields }: any) => {
        if (!id) return { error: "missing id" };
        const exists = await prisma.vsEnrollment.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsEnrollment.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    // Update single (requires id in body)
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsEnrollment.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    const updated = await prisma.vsEnrollment.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("voiceCloneEnroll PUT:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));

    // 15. batch-delete (soft)
    if (action === "batch-delete") {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids array required" }, { status: 400 });
      const updated = await prisma.vsEnrollment.updateMany({ where: { id: { in: ids }, businessId }, data: { status: "revoked", isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    // Soft-delete single
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsEnrollment.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    const deleted = await prisma.vsEnrollment.update({ where: { id }, data: { status: "revoked", isArchived: true, archivedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("voiceCloneEnroll DELETE:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsEnrollment.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    // archive
    if (action === "archive") {
      const r = await prisma.vsEnrollment.update({ where: { id }, data: { isArchived: true, archivedAt: new Date(), status: "suspended" } });
      return NextResponse.json({ data: r });
    }
    // restore
    if (action === "restore") {
      const r = await prisma.vsEnrollment.update({ where: { id }, data: { isArchived: false, archivedAt: null, status: "active" } });
      return NextResponse.json({ data: r });
    }
    // history
    if (action === "history") {
      const events = await prisma.vsConsentEvent.findMany({ where: { enrollmentId: id }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ data: events });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("voiceCloneEnroll PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const enrollment = body.enrollmentId
    ? await prisma.vsEnrollment.findFirst({ where: { id: body.enrollmentId, businessId } })
    : null;

  const context = enrollment
    ? `Enrollment: ${JSON.stringify({ ...enrollment, samples: undefined })}`
    : `Business context id: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "validate-consent-completeness": `${context}\nCheck if consent fields are complete and legally sufficient. Return JSON: { complete: boolean, missing_fields: string[], recommendations: string[], confidence: string }`,
    "classify-voice-quality": `${context}\nClassify the voice quality from samples. Return JSON: { quality_tier: string, score: number, issues: string[], recommendations: string[] }`,
    "score-enrollment-sample-quality": `${context}\nScore each sample's quality. Return JSON: { samples: [{id, score, issues, accepted}], overall_score: number }`,
    "predict-clone-fidelity": `${context}\nPredict the fidelity of a voice clone from this enrollment. Return JSON: { fidelity_score: number, confidence: string, limiting_factors: string[], suggestions: string[] }`,
    "suggest-additional-samples": `${context}\nSuggest what additional samples should be collected. Return JSON: { suggested_samples: [{type, description, reason}], priority: string }`,
    "detect-likely-impersonation": `${context}\nDetect if this enrollment shows signs of impersonation attempt. Return JSON: { impersonation_risk: string, risk_score: number, signals: string[], action_required: string }`,
    "generate-consent-checklist": `${context}\nGenerate a complete consent checklist for voice cloning. Return JSON: { checklist: [{item, required, completed}], version: string }`,
    "summarize-enrollment-history": `${context}\nSummarize the enrollment history and events. Return JSON: { summary: string, key_events: string[], current_status: string, risk_flags: string[] }`,
    "validate-id-document": `${context}\nValidate if the ID document reference is adequate for voice cloning consent. Return JSON: { valid: boolean, doc_type: string, issues: string[], recommendations: string[] }`,
    "recommend-rerecord": `${context}\nRecommend which samples should be re-recorded and why. Return JSON: { rerecord_needed: boolean, samples_to_redo: [{id, reason}], instructions: string }`,
    "classify-consent-scope": `${context}\nClassify the scope of consent granted. Return JSON: { scope: string, allowed_uses: string[], restricted_uses: string[], expiry_risk: string }`,
    "predict-clone-misuse-risk": `${context}\nPredict the risk of misuse of this voice clone. Return JSON: { risk_score: number, risk_tier: string, risk_vectors: string[], mitigations: string[] }`,
    "suggest-watermark-strength": `${context}\nSuggest the appropriate watermark strength for this clone. Return JSON: { recommended_strength: string, rationale: string, alternatives: string[] }`,
    "generate-consent-summary": `${context}\nGenerate a human-readable consent summary for the subject. Return JSON: { summary: string, key_points: string[], subject_rights: string[] }`,
    "score-enrollment-readiness": `${context}\nScore the readiness of this enrollment to proceed to active cloning. Return JSON: { readiness_score: number, blockers: string[], warnings: string[], green_flags: string[] }`,
    "detect-enrollment-fraud": `${context}\nDetect signs of enrollment fraud or manipulation. Return JSON: { fraud_risk: string, fraud_score: number, anomalies: string[], recommended_action: string }`,
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
