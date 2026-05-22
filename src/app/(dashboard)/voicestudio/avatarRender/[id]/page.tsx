"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AiVerbsPanel } from "@/components/voicestudio/AiVerbsPanel";

const AI_VERBS = [
  "classify-render-job-complexity",
  "predict-render-time",
  "recommend-render-tier",
  "suggest-asset-optimization",
  "score-output-fidelity",
  "generate-render-config",
  "summarize-render-queue",
  "validate-asset-licensing",
  "detect-render-failure-cause",
  "classify-asset-type",
  "predict-cost",
  "recommend-quality-vs-speed-tradeoff",
  "generate-render-preview-spec",
  "score-asset-pipeline-health",
  "suggest-cache-strategy",
  "summarize-job-history",
];

export default function AvatarRenderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/voicestudio/avatarRender?action=list`);
        const json = await res.json();
        setRecord((json.data || []).find((r: Record<string, unknown>) => r.id === id) || null);
      } catch {
        toast({ title: "Error", description: "Failed to load render job", variant: "destructive" });
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  if (!record) return <div className="text-center py-20 text-muted-foreground">Render job not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/avatarRender"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6" />Render Job</h1>
          <p className="text-muted-foreground text-sm">ID: {id}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Job Record</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {["id","status","renderTier","avatarAssetUrl","audioAssetUrl","resolution","fps","codec","outputFormat","errorMessage","createdAt","updatedAt"].map((key) => (
              <div key={key} className="flex justify-between border-b pb-1 last:border-0">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-medium max-w-xs text-right break-all">
                  {record[key] !== undefined && record[key] !== null ? String(record[key]) : "-"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <AiVerbsPanel endpoint="avatarRender" verbs={AI_VERBS} contextBody={{ jobId: id }} />
      </div>
    </div>
  );
}
