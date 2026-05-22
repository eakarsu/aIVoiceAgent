"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Fingerprint } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AiVerbsPanel } from "@/components/voicestudio/AiVerbsPanel";

const AI_VERBS = [
  "classify-content-origin-claim",
  "validate-c2pa-manifest",
  "detect-tamper",
  "predict-detection-survival",
  "recommend-watermark-strength",
  "generate-provenance-summary",
  "summarize-content-chain-of-custody",
  "score-watermark-robustness",
  "suggest-additional-metadata",
  "classify-redaction-event",
  "generate-public-provenance-card",
  "validate-signer-trust",
  "recommend-revocation",
  "predict-attribution-confidence",
  "score-trust-network-health",
  "summarize-provenance-events",
];

export default function WatermarkProvenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/voicestudio/watermarkProvenance?action=list`);
        const json = await res.json();
        setRecord((json.data || []).find((r: Record<string, unknown>) => r.id === id) || null);
      } catch {
        toast({ title: "Error", description: "Failed to load provenance record", variant: "destructive" });
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  if (!record) return <div className="text-center py-20 text-muted-foreground">Provenance record not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/watermarkProvenance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Fingerprint className="h-6 w-6" />Provenance Record</h1>
          <p className="text-muted-foreground text-sm">ID: {id}</p>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Watermark Record</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {["id","assetUrl","enrollmentId","watermarkStrength","watermarkType","detectionSurvivalRate","robustnessScore","c2paEnabled","signerTrust","createdAt","updatedAt"].map((key) => (
              <div key={key} className="flex justify-between border-b pb-1 last:border-0">
                <span className="text-muted-foreground capitalize">{key}</span>
                <span className="font-medium max-w-xs text-right break-all">
                  {record[key] !== undefined && record[key] !== null
                    ? (typeof record[key] === "object" ? JSON.stringify(record[key]).slice(0, 80) : String(record[key]))
                    : "-"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <AiVerbsPanel endpoint="watermarkProvenance" verbs={AI_VERBS} contextBody={{ recordId: id }} />
      </div>
    </div>
  );
}
