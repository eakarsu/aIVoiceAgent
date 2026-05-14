// // === Batch 08 Gaps & Frontend Mounts ===
// Feature: No predictive call outcome scoring before transfer
// Kind: gap_ai  Project: aIVoiceAgent
import { NextResponse } from 'next/server'

async function callOpenRouter(systemPrompt: string, userPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022'
  const base = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
  if (!apiKey) return { ai_disabled: true, note: 'OPENROUTER_API_KEY missing', echo: userPrompt.slice(0, 240) }
  const resp = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1500,
      temperature: 0.6,
    }),
  })
  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    throw new Error(`OpenRouter ${resp.status}: ${txt.slice(0, 200)}`)
  }
  const data = await resp.json()
  let raw: string = (data.choices?.[0]?.message?.content) || ''
  raw = raw.trim().replace(/^```(?:json|JSON)?\s*\n?/, '').replace(/\n?\s*```\s*$/, '')
  try { return JSON.parse(raw) } catch { return { raw } }
}

export async function POST(req: Request) {
  try {
    const input = await req.json().catch(() => ({}))
    const sys = 'You are an assistant for the "No predictive call outcome scoring before transfer" feature in project aIVoiceAgent. Respond as strict JSON.'
    const user = `Feature: No predictive call outcome scoring before transfer\nUser input:\n` + JSON.stringify(input).slice(0, 4000) + '\nReturn JSON with summary, findings array, recommendations array.'
    const out = await callOpenRouter(sys, user)
    return NextResponse.json({ success: true, feature: 'gap-no-predictive-call-outcome-scoring-before-transfer', kind: 'gap_ai', result: out })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'gap feature failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ history: [] })
}
