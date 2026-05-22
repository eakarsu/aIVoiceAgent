/**
 * voiceStudioFeat_avatarRender
 * Avatar 3D/2D render job orchestration.
 *
 * Mounts at /api/voicestudio/avatarRender
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent Avatar Render orchestration system.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-avatar-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
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
    const renderTier = url.searchParams.get("renderTier");
    const enrollmentId = url.searchParams.get("enrollmentId");
    const search = url.searchParams.get("search")?.trim();

    if (action === "by-enrollment" && enrollmentId) {
      const rows = await prisma.vsAvatarRenderJob.findMany({ where: { businessId, enrollmentId }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ data: rows });
    }

    if (action === "by-tier" && renderTier) {
      const [rows, total] = await Promise.all([
        prisma.vsAvatarRenderJob.findMany({ where: { businessId, renderTier }, orderBy: { createdAt: "desc" }, skip, take }),
        prisma.vsAvatarRenderJob.count({ where: { businessId, renderTier } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "count") {
      const where: any = { businessId };
      if (status) where.status = status;
      const count = await prisma.vsAvatarRenderJob.count({ where });
      return NextResponse.json({ count });
    }

    if (action === "stats") {
      const [total, queued, processing, completed, failed] = await Promise.all([
        prisma.vsAvatarRenderJob.count({ where: { businessId } }),
        prisma.vsAvatarRenderJob.count({ where: { businessId, status: "queued" } }),
        prisma.vsAvatarRenderJob.count({ where: { businessId, status: "processing" } }),
        prisma.vsAvatarRenderJob.count({ where: { businessId, status: "completed" } }),
        prisma.vsAvatarRenderJob.count({ where: { businessId, status: "failed" } }),
      ]);
      return NextResponse.json({ total, queued, processing, completed, failed });
    }

    if (action === "export-csv") {
      const rows = await prisma.vsAvatarRenderJob.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "name", "assetType", "renderTier", "status", "predictedTimeSec", "predictedCostUsd", "fidelityScore", "isArchived", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="avatar_renders.csv"' },
      });
    }

    const where: any = { businessId };
    if (status) where.status = status;
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsAvatarRenderJob.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsAvatarRenderJob.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("avatarRender GET:", err.message);
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsAvatarRenderJob.create({ data: { ...d, businessId } })));
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsAvatarRenderJob.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    const { name } = body;
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const job = await prisma.vsAvatarRenderJob.create({ data: { ...body, businessId, status: "queued" } });
    return NextResponse.json({ data: job }, { status: 201 });
  } catch (err: any) {
    console.error("avatarRender POST:", err.message);
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
        const exists = await prisma.vsAvatarRenderJob.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsAvatarRenderJob.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsAvatarRenderJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Render job not found" }, { status: 404 });
    const updated = await prisma.vsAvatarRenderJob.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("avatarRender PUT:", err.message);
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
      const updated = await prisma.vsAvatarRenderJob.updateMany({ where: { id: { in: ids }, businessId }, data: { status: "cancelled", isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsAvatarRenderJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Render job not found" }, { status: 404 });
    const deleted = await prisma.vsAvatarRenderJob.update({ where: { id }, data: { status: "cancelled", isArchived: true, archivedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("avatarRender DELETE:", err.message);
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
    const exists = await prisma.vsAvatarRenderJob.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Render job not found" }, { status: 404 });

    if (action === "archive") {
      const r = await prisma.vsAvatarRenderJob.update({ where: { id }, data: { isArchived: true, archivedAt: new Date(), status: "cancelled" } });
      return NextResponse.json({ data: r });
    }
    if (action === "restore") {
      const r = await prisma.vsAvatarRenderJob.update({ where: { id }, data: { isArchived: false, archivedAt: null, status: "queued" } });
      return NextResponse.json({ data: r });
    }
    if (action === "history") {
      const lipsyncJobs = await prisma.vsLipsyncJob.findMany({ where: { renderJobId: id }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ data: lipsyncJobs });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("avatarRender PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const job = body.jobId ? await prisma.vsAvatarRenderJob.findFirst({ where: { id: body.jobId, businessId } }) : null;
  const ctx = job ? `Job: ${JSON.stringify(job)}` : `Business: ${businessId}. Input: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "classify-render-job-complexity": `${ctx}\nClassify the complexity of this avatar render job. Return JSON: { complexity_class: string, drivers: string[], tier_recommendation: string }`,
    "predict-render-time": `${ctx}\nPredict the render time for this job. Return JSON: { predicted_seconds: number, range: {min, max}, factors: string[] }`,
    "recommend-render-tier": `${ctx}\nRecommend the best render tier (draft/standard/premium) for this use case. Return JSON: { tier: string, rationale: string, cost_benefit: string, alternatives: string[] }`,
    "suggest-asset-optimization": `${ctx}\nSuggest asset optimizations to reduce render time and cost. Return JSON: { suggestions: [{optimization, estimated_saving, priority}], overall_impact: string }`,
    "score-output-fidelity": `${ctx}\nScore the expected output fidelity for this render configuration. Return JSON: { fidelity_score: number, limiting_factors: string[], improvements: string[] }`,
    "generate-render-config": `${ctx}\nGenerate a complete render configuration JSON. Return JSON: { config: {resolution, fps, codec, quality, output_format}, notes: string }`,
    "summarize-render-queue": `${ctx}\nSummarize the current render queue status. Return JSON: { queue_depth: number, estimated_wait_mins: number, priority_jobs: string[], bottlenecks: string[] }`,
    "validate-asset-licensing": `${ctx}\nValidate that all assets in this render job are properly licensed. Return JSON: { licensed: boolean, issues: [{asset, issue}], recommendations: string[] }`,
    "detect-render-failure-cause": `${ctx}\nAnalyze and detect the likely cause of render failure. Return JSON: { likely_cause: string, confidence: string, diagnostic_steps: string[], fix: string }`,
    "classify-asset-type": `${ctx}\nClassify the asset types in this render job. Return JSON: { asset_types: [{url, type, format, quality_class}], pipeline_compatibility: string }`,
    "predict-cost": `${ctx}\nPredict the cost of this avatar render job. Return JSON: { estimated_usd: number, breakdown: [{component, cost}], range: {min, max} }`,
    "recommend-quality-vs-speed-tradeoff": `${ctx}\nRecommend the optimal quality vs speed tradeoff for this job. Return JSON: { recommendation: string, tradeoff_options: [{label, quality, speed, cost}], best_for: string }`,
    "generate-render-preview-spec": `${ctx}\nGenerate a specification for a render preview/thumbnail. Return JSON: { preview_config: {resolution, duration_sec, format}, generation_steps: string[] }`,
    "score-asset-pipeline-health": `${ctx}\nScore the health of the asset pipeline for this render. Return JSON: { health_score: number, issues: string[], warnings: string[], healthy_components: string[] }`,
    "suggest-cache-strategy": `${ctx}\nSuggest a caching strategy for render assets and outputs. Return JSON: { strategy: string, cache_keys: string[], ttl_recommendations: [{asset_type, ttl_hours}] }`,
    "summarize-job-history": `${ctx}\nSummarize the render job history for this business. Return JSON: { total_jobs: number, success_rate: number, avg_render_time: number, common_failures: string[], trends: string }`,
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
