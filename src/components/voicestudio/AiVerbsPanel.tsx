"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiVerbsPanelProps {
  endpoint: string; // e.g. "voiceCloneEnroll"
  verbs: string[];
  contextBody?: Record<string, unknown>;
}

export function AiVerbsPanel({ endpoint, verbs, contextBody = {} }: AiVerbsPanelProps) {
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const runVerb = async (verb: string) => {
    setLoading(verb);
    try {
      const res = await fetch(`/api/voicestudio/${endpoint}?action=ai:${verb}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contextBody),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "AI verb failed");
      setResults((prev) => ({ ...prev, [verb]: json.result }));
      setExpanded((prev) => ({ ...prev, [verb]: true }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "AI Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Verbs Panel
          <Badge variant="secondary">{verbs.length} actions</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {verbs.map((verb) => (
          <div key={verb} className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-muted/50">
              <code className="text-xs font-mono text-foreground">{verb}</code>
              <div className="flex items-center gap-1">
                {Object.prototype.hasOwnProperty.call(results, verb) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setExpanded((p) => ({ ...p, [verb]: !p[verb] }))}
                  >
                    {expanded[verb] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={loading === verb}
                  onClick={() => runVerb(verb)}
                >
                  {loading === verb ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Run
                </Button>
              </div>
            </div>
            {Object.prototype.hasOwnProperty.call(results, verb) && expanded[verb] && (
              <pre className="p-3 text-xs bg-background overflow-auto max-h-64 whitespace-pre-wrap break-all">
                {JSON.stringify(results[verb], null, 2)}
              </pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
