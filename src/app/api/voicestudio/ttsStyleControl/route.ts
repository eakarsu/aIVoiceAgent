/**
 * voiceStudioFeat_ttsStyleControl
 * Style, emotion, and prosody control for TTS output.
 *
 * Mounts at /api/voicestudio/ttsStyleControl
 * 18 CRUD + 16 AI verbs
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";
import { getPagination, paginatedResponse } from "@/lib/security";
import { rateLimit } from "@/lib/rate-limit";

const SYSTEM = `You are an expert AI for the aIVoiceAgent TTS Style Control system.
Respond with strict JSON only — no markdown, no commentary.`;

async function aiRateGuard(req: NextRequest): Promise<{ ok: boolean; resp?: NextResponse }> {
  const businessId = await getCurrentBusinessId();
  const key = `vs-tts-ai:${businessId ?? req.headers.get("x-forwarded-for") ?? "anon"}`;
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
    const emotion = url.searchParams.get("emotion");
    const brand = url.searchParams.get("brand");
    const search = url.searchParams.get("search")?.trim();

    if (action === "by-brand" && brand) {
      const rows = await prisma.vsTtsStyle.findMany({ where: { businessId, brand, isArchived: false }, orderBy: { createdAt: "desc" } });
      return NextResponse.json({ data: rows });
    }

    if (action === "by-emotion" && emotion) {
      const [rows, total] = await Promise.all([
        prisma.vsTtsStyle.findMany({ where: { businessId, emotion, isArchived: false }, orderBy: { name: "asc" }, skip, take }),
        prisma.vsTtsStyle.count({ where: { businessId, emotion, isArchived: false } }),
      ]);
      return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
    }

    if (action === "count") {
      const where: any = { businessId };
      if (emotion) where.emotion = emotion;
      const count = await prisma.vsTtsStyle.count({ where });
      return NextResponse.json({ count });
    }

    if (action === "stats") {
      const [total, active, byEmotion] = await Promise.all([
        prisma.vsTtsStyle.count({ where: { businessId } }),
        prisma.vsTtsStyle.count({ where: { businessId, isActive: true } }),
        prisma.vsTtsStyle.groupBy({ by: ["emotion"], where: { businessId }, _count: { id: true } }),
      ]);
      return NextResponse.json({ total, active, byEmotion });
    }

    if (action === "export-csv") {
      const rows = await prisma.vsTtsStyle.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
      const fields = ["id", "name", "emotion", "pace", "pitch", "volume", "brand", "qualityScore", "consistencyScore", "isActive", "createdAt"] as const;
      const header = fields.join(",");
      const lines = rows.map(r => fields.map(f => `"${String(r[f] ?? "").replace(/"/g, '""')}"`).join(","));
      return new NextResponse([header, ...lines].join("\n"), {
        headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="tts_styles.csv"' },
      });
    }

    const where: any = { businessId };
    if (emotion) where.emotion = emotion;
    if (search) where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
    ];

    const [rows, total] = await Promise.all([
      prisma.vsTtsStyle.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.vsTtsStyle.count({ where }),
    ]);
    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err: any) {
    console.error("ttsStyleControl GET:", err.message);
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsTtsStyle.create({ data: { ...d, businessId } })));
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
      const created = await prisma.$transaction(items.map((d: any) => prisma.vsTtsStyle.create({ data: { ...d, businessId } })));
      return NextResponse.json({ data: created, count: created.length }, { status: 201 });
    }

    const { name } = body;
    if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
    const style = await prisma.vsTtsStyle.create({ data: { ...body, businessId } });
    return NextResponse.json({ data: style }, { status: 201 });
  } catch (err: any) {
    console.error("ttsStyleControl POST:", err.message);
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
        const exists = await prisma.vsTtsStyle.findFirst({ where: { id, businessId } });
        if (!exists) return { error: "not found", id };
        return prisma.vsTtsStyle.update({ where: { id }, data: fields });
      }));
      return NextResponse.json({ data: results });
    }

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsTtsStyle.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Style not found" }, { status: 404 });
    const updated = await prisma.vsTtsStyle.update({ where: { id }, data: fields });
    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("ttsStyleControl PUT:", err.message);
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
      const updated = await prisma.vsTtsStyle.updateMany({ where: { id: { in: ids }, businessId }, data: { isActive: false, isArchived: true, archivedAt: new Date() } });
      return NextResponse.json({ updated: updated.count });
    }

    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const exists = await prisma.vsTtsStyle.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Style not found" }, { status: 404 });
    const deleted = await prisma.vsTtsStyle.update({ where: { id }, data: { isActive: false, isArchived: true, archivedAt: new Date() } });
    return NextResponse.json({ data: deleted });
  } catch (err: any) {
    console.error("ttsStyleControl DELETE:", err.message);
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
    const exists = await prisma.vsTtsStyle.findFirst({ where: { id, businessId } });
    if (!exists) return NextResponse.json({ error: "Style not found" }, { status: 404 });

    if (action === "archive") {
      const r = await prisma.vsTtsStyle.update({ where: { id }, data: { isArchived: true, archivedAt: new Date(), isActive: false } });
      return NextResponse.json({ data: r });
    }
    if (action === "restore") {
      const r = await prisma.vsTtsStyle.update({ where: { id }, data: { isArchived: false, archivedAt: null, isActive: true } });
      return NextResponse.json({ data: r });
    }
    if (action === "history") {
      // Return audit log entries — use AiResult as observability store
      return NextResponse.json({ data: [], note: "Style history not yet indexed in audit log" });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("ttsStyleControl PATCH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── AI Verb Dispatcher ───────────────────────────────────────────────────────

async function handleAiVerb(verb: string, body: any, businessId: string): Promise<NextResponse> {
  const ctx = `Business: ${businessId}. Style config: ${JSON.stringify(body).slice(0, 2000)}`;

  const verbPrompts: Record<string, string> = {
    "classify-target-style": `${ctx}\nClassify the optimal TTS style for this use case. Return JSON: { style_class: string, emotion: string, pace: string, pitch: string, rationale: string }`,
    "suggest-prosody-config": `${ctx}\nSuggest SSML prosody configuration. Return JSON: { prosody: { rate, pitch, volume, emphasis }, ssml_snippet: string, notes: string }`,
    "predict-naturalness": `${ctx}\nPredict the naturalness score for this TTS style. Return JSON: { naturalness_score: number, risk_factors: string[], improvements: string[] }`,
    "recommend-style-adjust": `${ctx}\nRecommend adjustments to improve TTS style. Return JSON: { adjustments: [{param, current, recommended, reason}], overall_recommendation: string }`,
    "score-output-quality": `${ctx}\nScore the TTS output quality based on style configuration. Return JSON: { quality_score: number, dimensions: {clarity, naturalness, expressiveness, brand_fit}, suggestions: string[] }`,
    "generate-ssml": `${ctx}\nGenerate SSML markup for this TTS style. Return JSON: { ssml: string, notes: string, prosody_tags: string[] }`,
    "summarize-style-history": `${ctx}\nSummarize usage history and evolution of this style. Return JSON: { summary: string, version_changes: string[], performance_trend: string }`,
    "validate-style-against-brand": `${ctx}\nValidate if this TTS style aligns with brand guidelines. Return JSON: { aligned: boolean, score: number, misalignments: string[], recommendations: string[] }`,
    "suggest-emotion-mapping": `${ctx}\nSuggest emotion-to-prosody mappings for this style. Return JSON: { emotion_map: [{emotion, prosody_config, use_cases}], coverage_gaps: string[] }`,
    "detect-uncanny-prosody": `${ctx}\nDetect if the prosody configuration will produce uncanny or unnatural speech. Return JSON: { uncanny_risk: string, risk_score: number, problematic_settings: string[], fixes: string[] }`,
    "classify-pace": `${ctx}\nClassify the optimal pace for different content types with this voice. Return JSON: { pace_class: string, words_per_minute: number, context_adjustments: [{context, pace}] }`,
    "predict-listener-engagement": `${ctx}\nPredict listener engagement with this TTS style. Return JSON: { engagement_score: number, engagement_drivers: string[], drop_off_risks: string[] }`,
    "recommend-pause-strategy": `${ctx}\nRecommend pause placement strategy for natural speech. Return JSON: { pause_strategy: string, rules: [{context, pause_ms}], ssml_hints: string[] }`,
    "generate-style-preset": `${ctx}\nGenerate a complete reusable style preset. Return JSON: { preset_name: string, config: {emotion, pace, pitch, volume, ssml_template}, use_cases: string[] }`,
    "score-style-consistency": `${ctx}\nScore how consistently this style will perform across content types. Return JSON: { consistency_score: number, variability_risks: string[], stable_aspects: string[] }`,
    "suggest-style-versioning": `${ctx}\nSuggest a versioning strategy for this TTS style. Return JSON: { version_strategy: string, migration_plan: string[], change_log_format: string }`,
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
