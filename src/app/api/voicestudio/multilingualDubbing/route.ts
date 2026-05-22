/**
 * voiceStudioFeat_multilingualDubbing
 * Dubbing jobs across languages with voice preservation.
 *
 * Mounts at /api/voicestudio/multilingualDubbing
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Multilingual Dubbing system.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-dub-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
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
    const status = url.searchParams.get("status");
    const sourceLanguage = url.searchParams.get("sourceLanguage");
    const targetMarket = url.searchParams.get("targetMarket");
    const search = url.searchParams.get("search")?.trim();

    if (action === "by-source-language" && sourceLanguage) {
      const [rows, total] = await Promise.all([
        prisma.vsDubbingJob.findMany({ where: { businessId, sourceLanguage }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsDubbingJob.count({ where: { businessId, sourceLanguage } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "by-target-market" && targetMarket) {
      const [rows, total] = await Promise.all([
        prisma.vsDubbingJob.findMany({ where: { businessId, targetMarket }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsDubbingJob.count({ where: { businessId, targetMarket } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "count") {
      const where: any = { businessId };
      if (status) where.status = status;
      const count = await prisma.vsDubbingJob.count({ where });
      return NextResponse.json({ count });
    }

    if (action === "stats") {
      const [total, queued, completed, failed] = await Promise.all([
        prisma.vsDubbingJob.count({ where: { businessId } }),
        prisma.vsDubbingJob.count({ where: { businessId, status: "queued" } }),
        prisma.vsDubbingJob.count({ where: { businessId, status: "completed" } }),
        prisma.vsDubbingJob.count({ where: { businessId, status: "failed" } }),
      ]);
      return NextResponse.json({ total, queued, completed, failed });
    }

    if (action === "export-csv") {
      const rows = await prisma.vsDubbingJob.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "name", "sourceLanguage", "status", "voicePreservationScore", "dubQualityScore", "culturalFitScore", "emotionMismatch", "isArchived", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="dubbing_jobs.csv"' },
      });
    }

    const where: any = { businessId };
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsDubbingJob.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsDubbingJob.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("multilingualDubbing GET:", err.message);
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsDubbingJob.create({ data: { ...d, businessId } })));
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsDubbingJob.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    const { name, sourceAudioUrl, sourceLanguage } = body;
    if (!name || !sourceAudioUrl || !sourceLanguage) return NextResponse.json({ error: "name, sourceAudioUrl, and sourceLanguage required" }, { status: 400 });
    const job = await prisma.vsDubbingJob.create({ data: { ...body, businessId, status: "queued" } });
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (err: any) {
    console.error("multilingualDubbing POST:", err.message);
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
        const exists = await prisma.vsDubbingJob.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsDubbingJob.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsDubbingJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Dubbing job not found" }, { status: 404 });
    const updated = await prisma.vsDubbingJob.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("multilingualDubbing PUT:", err.message);
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
      const updated = await prisma.vsDubbingJob.updateMany({ where: { id: { in: ids }, businessId }, data: { status: "cancelled", isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsDubbingJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Dubbing job not found" }, { status: 404 });
    const deleted = await prisma.vsDubbingJob.update({ where: { id }, data: { status: "cancelled", isArchived: true, archivedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("multilingualDubbing DELETE:", err.message);
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
    const exists = await prisma.vsDubbingJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Dubbing job not found" }, { status: 404 });

    if (action === "archive") {
      const r = await prisma.vsDubbingJob.update({ where: { id }, data: { isArchived: true, archivedAt: new Date(), status: "cancelled" } });
      return NextResponse.json({ data: r });
    }
    if (action === "restore") {
      const r = await prisma.vsDubbingJob.update({ where: { id }, data: { isArchived: false, archivedAt: null, status: "queued" } });
      return NextResponse.json({ data: r });
    }
    if (action === "history") {
      return NextResponse.json({ data: exists, note: "Full job history not yet indexed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("multilingualDubbing PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const job = body.jobId ? await prisma.vsDubbingJob.findFirst({ where: { id: body.jobId, businessId } }) : null;
  const ctx = job ? `Dubbing Job: ${JSON.stringify(job)}` : `Business: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "classify-dub-difficulty": `${ctx}\nClassify the difficulty of dubbing this content. Return JSON: { difficulty: string, drivers: string[], estimated_hours: number, risk_factors: string[] }`,
    "predict-voice-preservation-quality": `${ctx}\nPredict how well the original voice characteristics will be preserved. Return JSON: { preservation_score: number, preserved_attributes: string[], at_risk_attributes: string[], recommendations: string[] }`,
    "suggest-language-pair-glossary": `${ctx}\nSuggest a glossary of important terms for this language pair. Return JSON: { glossary: [{source_term, target_term, notes}], technical_terms: string[], cultural_adaptations: string[] }`,
    "recommend-cultural-adaptation": `${ctx}\nRecommend cultural adaptations for the target language market. Return JSON: { adaptations: [{original, adapted, reason}], cultural_notes: string[], sensitivity_flags: string[] }`,
    "score-dub-quality": `${ctx}\nScore the dubbing quality across multiple dimensions. Return JSON: { overall_score: number, dimensions: {voice_match, timing, naturalness, cultural_fit}, improvements: string[] }`,
    "generate-dub-script": `${ctx}\nGenerate a dubbing script adapting source text for the target language. Return JSON: { script: string, timing_notes: string[], length_matched: boolean, adaptation_summary: string }`,
    "summarize-dub-job": `${ctx}\nSummarize the dubbing job status and quality metrics. Return JSON: { summary: string, target_languages: string[], completed_count: number, quality_overview: string, next_steps: string[] }`,
    "validate-timing-fit": `${ctx}\nValidate that dubbed audio fits within the original timing constraints. Return JSON: { fits: boolean, overage_ms: number, segments_over: string[], compression_needed: boolean, suggestions: string[] }`,
    "suggest-back-translation-check": `${ctx}\nSuggest back-translation checks to verify dub accuracy. Return JSON: { check_needed: boolean, critical_segments: string[], back_translation_process: string, expected_accuracy: number }`,
    "detect-mismatched-emotion": `${ctx}\nDetect emotion mismatches between source and dubbed audio. Return JSON: { mismatches: [{segment, source_emotion, dubbed_emotion, severity}], overall_mismatch: string, fixes: string[] }`,
    "classify-target-market": `${ctx}\nClassify the target market and its localization requirements. Return JSON: { market: string, localization_requirements: string[], compliance_notes: string[], audience_profile: string }`,
    "predict-listener-acceptance": `${ctx}\nPredict listener acceptance rate for this dubbed content. Return JSON: { acceptance_rate: number, acceptance_drivers: string[], risk_factors: string[], improvements: string[] }`,
    "recommend-voice-actor-fallback": `${ctx}\nRecommend voice actor fallback options if voice cloning is insufficient. Return JSON: { fallback_needed: boolean, recommended_profiles: string[], selection_criteria: string[], cost_implication: string }`,
    "generate-dub-narrative": `${ctx}\nGenerate a narrative summary of what this dubbed content communicates. Return JSON: { narrative: string, key_messages: string[], tone: string, cultural_resonance: string }`,
    "score-cultural-fit": `${ctx}\nScore how well the dubbed content fits the target culture. Return JSON: { cultural_fit_score: number, strong_areas: string[], weak_areas: string[], required_adjustments: string[] }`,
    "summarize-multi-lang-coverage": `${ctx}\nSummarize language coverage across all dubbing jobs for this business. Return JSON: { languages_covered: string[], coverage_gaps: string[], quality_by_language: [{lang, score}], recommendations: string[] }`,
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
