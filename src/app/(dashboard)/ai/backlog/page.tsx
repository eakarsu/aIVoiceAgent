// Apply pass 5 — Backlog AI page exercising:
//   POST /api/ai/agent-performance       (MECHANICAL)
//   POST /api/ai/conversation-memory     (TOO-RISKY-stub: in-memory summary)
//
// 503 + missing: OPENROUTER_API_KEY surfaced inline when the key is unset.

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type AnyJson = Record<string, any> | null;

export default function BacklogAIPage() {
  // agent-performance state
  const [agentId, setAgentId] = useState<string>("");
  const [perfLimit, setPerfLimit] = useState<number>(20);
  const [perfLoading, setPerfLoading] = useState<boolean>(false);
  const [perfResult, setPerfResult] = useState<AnyJson>(null);
  const [perfError, setPerfError] = useState<string | null>(null);

  // conversation-memory state
  const [from, setFrom] = useState<string>("");
  const [memoryAgentId, setMemoryAgentId] = useState<string>("");
  const [lookback, setLookback] = useState<number>(30);
  const [memLoading, setMemLoading] = useState<boolean>(false);
  const [memResult, setMemResult] = useState<AnyJson>(null);
  const [memError, setMemError] = useState<string | null>(null);

  const runPerf = async () => {
    setPerfLoading(true); setPerfError(null); setPerfResult(null);
    try {
      const res = await fetch("/api/ai/agent-performance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId || undefined, limit: perfLimit }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.missing) {
          setPerfError(`AI service not configured (missing ${data.missing}). ${data.detail || ""}`);
        } else {
          setPerfError(data?.error || `HTTP ${res.status}`);
        }
        return;
      }
      setPerfResult(data);
    } catch (e: any) {
      setPerfError(String(e?.message || e));
    } finally {
      setPerfLoading(false);
    }
  };

  const runMem = async () => {
    setMemLoading(true); setMemError(null); setMemResult(null);
    try {
      const res = await fetch("/api/ai/conversation-memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from || undefined,
          agentId: memoryAgentId || undefined,
          lookback_days: lookback,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.missing) {
          setMemError(`AI service not configured (missing ${data.missing}). ${data.detail || ""}`);
        } else {
          setMemError(data?.error || `HTTP ${res.status}`);
        }
        return;
      }
      setMemResult(data);
    } catch (e: any) {
      setMemError(String(e?.message || e));
    } finally {
      setMemLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Backlog AI</h1>
        <p className="text-muted-foreground text-sm">
          Apply pass 5 endpoints. Both require <code>OPENROUTER_API_KEY</code> (returns 503 when unset).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input placeholder="Agent ID (optional)" value={agentId} onChange={(e) => setAgentId(e.target.value)} />
            <Input
              type="number"
              min={1}
              max={100}
              placeholder="Limit (1-100)"
              value={perfLimit}
              onChange={(e) => setPerfLimit(parseInt(e.target.value) || 20)}
            />
          </div>
          <Button onClick={runPerf} disabled={perfLoading}>
            {perfLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Score Agent Performance
          </Button>
          {perfError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{perfError}</div>
          )}
          {perfResult && (
            <pre className="text-xs bg-slate-900 text-green-200 p-3 rounded overflow-x-auto">
              {JSON.stringify(perfResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Conversation Memory Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Caller phone (optional)" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input placeholder="Agent ID (optional)" value={memoryAgentId} onChange={(e) => setMemoryAgentId(e.target.value)} />
            <Input
              type="number"
              min={1}
              max={90}
              placeholder="Lookback days (1-90)"
              value={lookback}
              onChange={(e) => setLookback(parseInt(e.target.value) || 30)}
            />
          </div>
          <Button onClick={runMem} disabled={memLoading}>
            {memLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Build Memory Summary
          </Button>
          {memError && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{memError}</div>
          )}
          {memResult && (
            <pre className="text-xs bg-slate-900 text-green-200 p-3 rounded overflow-x-auto">
              {JSON.stringify(memResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
