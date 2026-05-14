// // === Batch 08 Gaps & Frontend Mounts ===
// Feature: No predictive call outcome scoring before transfer
'use client'
import { useState } from 'react'

export default function GapNoPredictiveCallOutcomeScoringBeforeTransferPage() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const submit = async (e: any) => {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const res = await fetch(`/api/gap-no-predictive-call-outcome-scoring-before-transfer/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, feature: 'gap-no-predictive-call-outcome-scoring-before-transfer', project: 'aIVoiceAgent' })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setResult(data)
    } catch (err: any) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">No predictive call outcome scoring before transfer</h1>
        <p className="text-sm text-muted-foreground mt-1">Batch 08 · gap_ai · aIVoiceAgent</p>
      </div>
      <form onSubmit={submit} className="border rounded-xl p-5 mb-4 bg-card">
        <label className="block text-sm font-medium mb-1">Input</label>
        <textarea className="w-full border rounded-lg px-3 py-2 text-sm" rows={6}
          value={input} onChange={(e) => setInput(e.target.value)} />
        <button type="submit" disabled={loading || !input.trim()} className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Running...' : 'Run Feature'}
        </button>
      </form>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">{error}</div>}
      {result && (
        <div className="border rounded-xl p-5 bg-card">
          <h2 className="font-semibold mb-2">Result</h2>
          <pre className="text-xs bg-muted p-3 rounded overflow-x-auto whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
