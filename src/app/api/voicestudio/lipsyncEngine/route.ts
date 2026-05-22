/**
 * voiceStudioFeat_lipsyncEngine
 * Lipsync timing alignment to audio.
 *
 * Mounts at /api/voicestudio/lipsyncEngine
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Lipsync Engine system.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-lipsync-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
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
    const renderJobId = url.searchParams.get("renderJobId");
    const language = url.searchParams.get("language");
    const search = url.searchParams.get("search")?.trim();

    if (action === "by-render-job" && renderJobId) {
      const rows = await prisma.vsLipsyncJob.findMany({ where: { businessId, renderJobId }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ data: rows });
    }

    if (action === "by-language" && language) {
      const [rows, total] = await Promise.all([
        prisma.vsLipsyncJob.findMany({ where: { businessId, language }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsLipsyncJob.count({ where: { businessId, language } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "count") {
      const where: any = { businessId };
      if (status) where.status = status;
      const count = await prisma.vsLipsyncJob.count({ where });
      return NextResponse.json({ count });
    }

    if (action === "stats") {
      const [total, completed, failed, manualTouchUp] = await Promise.all([
        prisma.vsLipsyncJob.count({ where: { businessId } }),
        prisma.vsLipsyncJob.count({ where: { businessId, status: "completed" } }),
        prisma.vsLipsyncJob.count({ where: { businessId, status: "failed" } }),
        prisma.vsLipsyncJob.count({ where: { businessId, manualTouchUpNeeded: true } }),
      ]);
      return NextResponse.json({ total, completed, failed, manualTouchUp });
    }

    if (action === "export-csv") {
      const rows = await prisma.vsLipsyncJob.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "name", "language", "status", "driftMs", "qualityScore", "naturalLookScore", "manualTouchUpNeeded", "isArchived", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="lipsync_jobs.csv"' },
      });
    }

    const where: any = { businessId };
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsLipsyncJob.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsLipsyncJob.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("lipsyncEngine GET:", err.message);
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsLipsyncJob.create({ data: { ...d, businessId } })));
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsLipsyncJob.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    const { name, audioUrl } = body;
    if (!name || !audioUrl) return NextResponse.json({ error: "name and audioUrl required" }, { status: 400 });
    const job = await prisma.vsLipsyncJob.create({ data: { ...body, businessId, status: "queued" } });
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (err: any) {
    console.error("lipsyncEngine POST:", err.message);
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
        const exists = await prisma.vsLipsyncJob.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsLipsyncJob.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsLipsyncJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Lipsync job not found" }, { status: 404 });
    const updated = await prisma.vsLipsyncJob.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("lipsyncEngine PUT:", err.message);
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
      const updated = await prisma.vsLipsyncJob.updateMany({ where: { id: { in: ids }, businessId }, data: { status: "failed", isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsLipsyncJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Lipsync job not found" }, { status: 404 });
    const deleted = await prisma.vsLipsyncJob.update({ where: { id }, data: { status: "failed", isArchived: true, archivedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("lipsyncEngine DELETE:", err.message);
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
    const exists = await prisma.vsLipsyncJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Lipsync job not found" }, { status: 404 });

    if (action === "archive") {
      const r = await prisma.vsLipsyncJob.update({ where: { id }, data: { isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ data: r });
    }
    if (action === "restore") {
      const r = await prisma.vsLipsyncJob.update({ where: { id }, data: { isArchived: false, archivedAt: null, status: "queued" } });
      return NextResponse.json({ data: r });
    }
    if (action === "history") {
      return NextResponse.json({ data: exists, note: "Full audit history not yet indexed" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("lipsyncEngine PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const job = body.jobId ? await prisma.vsLipsyncJob.findFirst({ where: { id: body.jobId, businessId } }) : null;
  const ctx = job ? `Lipsync Job: ${JSON.stringify(job)}` : `Business: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "detect-lipsync-drift": `${ctx}\nDetect lipsync drift in milliseconds. Return JSON: { drift_detected: boolean, drift_ms: number, severity: string, affected_segments: string[], corrections: string[] }`,
    "classify-phoneme-mismatch": `${ctx}\nClassify phoneme mismatches in this lipsync job. Return JSON: { mismatches: [{phoneme, position_ms, severity}], mismatch_class: string, overall_severity: string }`,
    "predict-perceived-mismatch": `${ctx}\nPredict how perceptible lipsync mismatches will be to viewers. Return JSON: { perceived_mismatch: string, perceptibility_score: number, threshold_ms: number, viewer_segments_affected: string[] }`,
    "suggest-realignment": `${ctx}\nSuggest realignment corrections for lipsync issues. Return JSON: { realignment_steps: [{segment, shift_ms, method}], estimated_improvement: number }`,
    "score-lipsync-quality": `${ctx}\nScore the overall lipsync quality. Return JSON: { quality_score: number, dimensions: {timing_accuracy, phoneme_fidelity, natural_look}, recommendations: string[] }`,
    "generate-viseme-track": `${ctx}\nGenerate a viseme timing track specification. Return JSON: { visemes: [{time_ms, viseme, duration_ms, blend_weight}], format: string, language: string }`,
    "summarize-job-quality": `${ctx}\nSummarize the quality metrics for this lipsync job. Return JSON: { summary: string, pass_fail: string, key_metrics: {}, action_items: string[] }`,
    "validate-frame-rate-match": `${ctx}\nValidate that frame rate matches between audio and video. Return JSON: { matched: boolean, audio_fps: number, video_fps: number, mismatch_impact: string, fix: string }`,
    "suggest-language-specific-viseme-set": `${ctx}\nSuggest the optimal viseme set for this language. Return JSON: { language: string, recommended_viseme_set: string, phoneme_count: number, notes: string }`,
    "detect-occluded-mouth": `${ctx}\nDetect frames where the mouth region is occluded or unclear. Return JSON: { occluded_frames: number[], occlusion_percentage: number, impact: string, mitigation: string }`,
    "classify-mouth-shape-difficulty": `${ctx}\nClassify the difficulty of mouth shapes required for this content. Return JSON: { difficulty: string, hard_phonemes: string[], coarticulation_risk: string, preparation_needed: string[] }`,
    "predict-render-correction-time": `${ctx}\nPredict time needed to correct lipsync issues in post. Return JSON: { correction_hours: number, breakdown: [{issue, hours}], auto_fixable: number, manual_required: number }`,
    "recommend-manual-touch-up": `${ctx}\nRecommend specific manual touch-up actions. Return JSON: { touch_up_needed: boolean, actions: [{segment, action, priority}], estimated_effort_hours: number }`,
    "generate-qa-report": `${ctx}\nGenerate a quality assurance report for this lipsync job. Return JSON: { qa_report: {pass_rate, critical_issues, warnings, grade}, detailed_findings: string[], sign_off_ready: boolean }`,
    "score-natural-look": `${ctx}\nScore how natural the lipsync looks to human viewers. Return JSON: { natural_look_score: number, uncanny_valley_risk: string, improvements: string[], strong_aspects: string[] }`,
    "suggest-lipsync-style-pack": `${ctx}\nSuggest a lipsync style pack for this language and content type. Return JSON: { style_pack: string, settings: {}, language_optimizations: string[], expected_quality: string }`,
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
