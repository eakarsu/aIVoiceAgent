/**
 * voiceStudioFeat_watermarkProvenance
 * C2PA-style provenance metadata + audible watermark tracking.
 *
 * Mounts at /api/voicestudio/watermarkProvenance
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Watermark and Provenance system (C2PA-aligned).
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-wm-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
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
    const assetType = url.searchParams.get("assetType");
    const watermarkStrength = url.searchParams.get("watermarkStrength");
    const search = url.searchParams.get("search")?.trim();

    if (action === "by-asset-type" && assetType) {
      const [rows, total] = await Promise.all([
        prisma.vsProvenanceRecord.findMany({ where: { businessId, assetType }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsProvenanceRecord.count({ where: { businessId, assetType } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "by-watermark-strength" && watermarkStrength) {
      const [rows, total] = await Promise.all([
        prisma.vsProvenanceRecord.findMany({ where: { businessId, watermarkStrength }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsProvenanceRecord.count({ where: { businessId, watermarkStrength } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "count") {
      const where: any = { businessId };
      if (assetType) where.assetType = assetType;
      const count = await prisma.vsProvenanceRecord.count({ where });
      return NextResponse.json({ count });
    }

    if (action === "stats") {
      const [total, tampered, revoked, manifestValid] = await Promise.all([
        prisma.vsProvenanceRecord.count({ where: { businessId } }),
        prisma.vsProvenanceRecord.count({ where: { businessId, isTampered: true } }),
        prisma.vsProvenanceRecord.count({ where: { businessId, revokedAt: { not: null } } }),
        prisma.vsProvenanceRecord.count({ where: { businessId, manifestValid: true } }),
      ]);
      return NextResponse.json({ total, tampered, revoked, manifestValid });
    }

    if (action === "export-csv") {
      const rows = await prisma.vsProvenanceRecord.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "assetType", "originClaim", "manifestValid", "isTampered", "watermarkStrength", "watermarkType", "robustnessScore", "attributionConfidence", "isArchived", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="provenance_records.csv"' },
      });
    }

    const where: any = { businessId };
    if (assetType) where.assetType = assetType;
    if (search) where.OR = [
      { assetUrl: { contains: search, mode: "insensitive" } },
      { originClaim: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsProvenanceRecord.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsProvenanceRecord.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("watermarkProvenance GET:", err.message);
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

    if (action?.startsWith("ai:")) {
      const guard = await aiRateGuard(req);
      if (!guard.ok) return guard.resp!;
      return handleAiVerb(action.slice(3), body, businessId);
    }

    if (action === "batch-create") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 });
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsProvenanceRecord.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsProvenanceRecord.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    const { assetUrl } = body;
    if (!assetUrl) return NextResponse.json({ error: "assetUrl required" }, { status: 400 });
    const record = await prisma.vsProvenanceRecord.create({ data: { ...body, businessId } });
    return NextResponse.json({ data: record }, { status: 201 });
  } catch (err: any) {
    console.error("watermarkProvenance POST:", err.message);
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

    if (action === "batch-update") {
      const { items } = body;
      if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: "items array required" }, { status: 400 });
      const results = await Promise.all(items.map(async ({ id, ...fields }: any) => {
        if (!id) return { error: "missing id" };
        const exists = await prisma.vsProvenanceRecord.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsProvenanceRecord.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsProvenanceRecord.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Provenance record not found" }, { status: 404 });
    const updated = await prisma.vsProvenanceRecord.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("watermarkProvenance PUT:", err.message);
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

    if (action === "batch-delete") {
      const { ids } = body;
      if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "ids array required" }, { status: 400 });
      const updated = await prisma.vsProvenanceRecord.updateMany({ where: { id: { in: ids }, businessId }, data: { isArchived: true, archivedAt: new Date(), revokedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsProvenanceRecord.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Provenance record not found" }, { status: 404 });
    const deleted = await prisma.vsProvenanceRecord.update({ where: { id }, data: { isArchived: true, archivedAt: new Date(), revokedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("watermarkProvenance DELETE:", err.message);
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
    const exists = await prisma.vsProvenanceRecord.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Provenance record not found" }, { status: 404 });

    if (action === "archive") {
      const r = await prisma.vsProvenanceRecord.update({ where: { id }, data: { isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ data: r });
    }
    if (action === "restore") {
      const r = await prisma.vsProvenanceRecord.update({ where: { id }, data: { isArchived: false, archivedAt: null } });
      return NextResponse.json({ data: r });
    }
    if (action === "history") {
      return NextResponse.json({ data: exists, chainOfCustody: exists.chainOfCustody });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("watermarkProvenance PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const record = body.recordId ? await prisma.vsProvenanceRecord.findFirst({ where: { id: body.recordId, businessId } }) : null;
  const ctx = record ? `Provenance Record: ${JSON.stringify(record)}` : `Business: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "classify-content-origin-claim": `${ctx}\nClassify the content origin claim and its verifiability. Return JSON: { origin_class: string, verifiable: boolean, claim_strength: string, issues: string[] }`,
    "validate-c2pa-manifest": `${ctx}\nValidate a C2PA content credentials manifest. Return JSON: { valid: boolean, issues: [{field, severity, description}], trust_level: string, recommendations: string[] }`,
    "detect-tamper": `${ctx}\nDetect if this content or its provenance record has been tampered with. Return JSON: { tampered: boolean, tamper_score: number, indicators: string[], recommended_action: string }`,
    "predict-detection-survival": `${ctx}\nPredict how well the watermark will survive common processing operations. Return JSON: { survival_rate: number, at_risk_operations: string[], robust_operations: string[], strength_recommendation: string }`,
    "recommend-watermark-strength": `${ctx}\nRecommend the appropriate watermark strength and type for this asset. Return JSON: { strength: string, type: string, rationale: string, trade_offs: string[] }`,
    "generate-provenance-summary": `${ctx}\nGenerate a human-readable provenance summary for this asset. Return JSON: { summary: string, creation_info: string, modification_history: string[], chain_of_trust: string }`,
    "summarize-content-chain-of-custody": `${ctx}\nSummarize the full chain of custody for this content. Return JSON: { chain: [{actor, action, timestamp, location}], integrity: string, gaps: string[] }`,
    "score-watermark-robustness": `${ctx}\nScore the robustness of the watermark against attacks. Return JSON: { robustness_score: number, attack_vectors: [{attack, resistance}], overall_strength: string, improvements: string[] }`,
    "suggest-additional-metadata": `${ctx}\nSuggest additional provenance metadata to strengthen attribution. Return JSON: { suggestions: [{field, value_type, importance}], rationale: string, compliance_benefit: string }`,
    "classify-redaction-event": `${ctx}\nClassify a content redaction event and its provenance impact. Return JSON: { redaction_class: string, provenance_impact: string, disclosure_required: boolean, documentation_needed: string[] }`,
    "generate-public-provenance-card": `${ctx}\nGenerate a public-facing provenance card for this content. Return JSON: { card: {title, creator, created_at, modification_summary, trust_signals, verification_url}, format: string }`,
    "validate-signer-trust": `${ctx}\nValidate the trust level of content signers/attestors. Return JSON: { trust_valid: boolean, signer_tier: string, issues: string[], recommendation: string }`,
    "recommend-revocation": `${ctx}\nRecommend whether content credentials should be revoked. Return JSON: { revoke_recommended: boolean, reason: string, urgency: string, revocation_steps: string[] }`,
    "predict-attribution-confidence": `${ctx}\nPredict the confidence level for content attribution. Return JSON: { confidence: number, confidence_tier: string, limiting_factors: string[], strengthening_actions: string[] }`,
    "score-trust-network-health": `${ctx}\nScore the health of the trust network for provenance verification. Return JSON: { health_score: number, network_issues: string[], strong_nodes: string[], improvements: string[] }`,
    "summarize-provenance-events": `${ctx}\nSummarize all provenance events for this asset or business. Return JSON: { event_count: number, summary: string, event_types: [{type, count}], risk_flags: string[] }`,
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
