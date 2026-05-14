import { NextResponse } from "next/server";
import { getCurrentBusinessId } from "@/lib/session";
import { callOpenRouter, parseJSONResponse } from "@/lib/openrouter";

// Real-time sentiment intervention coaching agents mid-call
// Feature: realtime-coach

export async function POST(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const systemPrompt =
      'You are an expert assistant for the "aIVoiceAgent" platform. Always return strict JSON only — no markdown, no commentary.';
    const userPrompt = `Feature: Real-time sentiment intervention coaching agents mid-call.\nInput: ${JSON.stringify(body).slice(0, 3500)}\nReturn JSON: { summary, findings:[], recommendations:[], score:0.0, details:{} }`;

    const text = await callOpenRouter(userPrompt, systemPrompt);
    const parsed = parseJSONResponse(text);

    return NextResponse.json({
      success: true,
      feature: "realtime-coach",
      businessId,
      ...parsed,
    });
  } catch (err: any) {
    console.error("realtime-coach error:", err.message);
    return NextResponse.json(
      { error: err.message || "AI request failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    feature: "realtime-coach",
    title: "Real-time sentiment intervention coaching agents mid-call",
    method: "POST",
  });
}
