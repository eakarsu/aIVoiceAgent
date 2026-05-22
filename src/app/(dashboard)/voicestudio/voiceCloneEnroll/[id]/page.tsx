"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AiVerbsPanel } from "@/components/voicestudio/AiVerbsPanel";

const AI_VERBS = [
  "validate-consent-completeness",
  "classify-voice-quality",
  "score-enrollment-sample-quality",
  "predict-clone-fidelity",
  "suggest-additional-samples",
  "detect-likely-impersonation",
  "generate-consent-checklist",
  "summarize-enrollment-history",
  "validate-id-document",
  "recommend-rerecord",
  "classify-consent-scope",
  "predict-clone-misuse-risk",
  "suggest-watermark-strength",
  "generate-consent-summary",
  "score-enrollment-readiness",
  "detect-enrollment-fraud",
];

export default function VoiceCloneEnrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/voicestudio/voiceCloneEnroll?action=list`);
        const json = await res.json();
        const found = (json.data || []).find((r: Record<string, unknown>) => r.id === id);
        setRecord(found || null);
      } catch {
        toast({ title: "Error", description: "Failed to load enrollment", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  if (!record) return <div className="text-center py-20 text-muted-foreground">Enrollment not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/voiceCloneEnroll">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6" />
            {String(record.subjectName || "Enrollment")}
          </h1>
          <p className="text-muted-foreground text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Enrollment Record</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["Subject ID", "subjectId"],
              ["Subject Name", "subjectName"],
              ["Display Name", "displayName"],
              ["Status", "status"],
              ["Consent Granted", "consentGrantedAt"],
              ["Consent Version", "consentVersion"],
              ["Quality Score", "qualityScore"],
              ["Fidelity Score", "fidelityScore"],
              ["Archived", "isArchived"],
              ["Created", "createdAt"],
              ["Updated", "updatedAt"],
            ].map(([label, key]) => (
              <div key={key} className="flex justify-between border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium max-w-xs text-right break-all">
                  {key === "status" ? (
                    <Badge>{String(record[key] ?? "-")}</Badge>
                  ) : typeof record[key] === "boolean" ? (
                    String(record[key])
                  ) : record[key] instanceof Date || (typeof record[key] === "string" && key.endsWith("At")) ? (
                    record[key] ? new Date(String(record[key])).toLocaleString() : "-"
                  ) : (
                    String(record[key] ?? "-")
                  )}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <AiVerbsPanel
          endpoint="voiceCloneEnroll"
          verbs={AI_VERBS}
          contextBody={{ enrollmentId: id }}
        />
      </div>
    </div>
  );
}
