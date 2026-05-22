"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AiVerbsPanel } from "@/components/voicestudio/AiVerbsPanel";

const AI_VERBS = [
  "classify-consent-event",
  "validate-ledger-integrity",
  "detect-tamper",
  "suggest-additional-attestation",
  "predict-consent-revocation",
  "generate-consent-statement",
  "summarize-consent-history-for-subject",
  "score-ledger-completeness",
  "suggest-scope-tightening",
  "classify-revocation-impact",
  "generate-revocation-effects-list",
  "validate-witness-attestation",
  "recommend-retention-period",
  "detect-stale-consent",
  "summarize-consent-by-scope",
  "score-consent-clarity",
];

export default function ConsentLedgerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/voicestudio/consentLedger?action=list`);
        const json = await res.json();
        const found = (json.data || []).find((r: Record<string, unknown>) => r.id === id);
        setRecord(found || null);
      } catch {
        toast({ title: "Error", description: "Failed to load consent entry", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <div className="animate-pulse h-40 bg-muted rounded-lg" />;
  if (!record) return <div className="text-center py-20 text-muted-foreground">Entry not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/consentLedger">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Consent Entry
          </h1>
          <p className="text-muted-foreground text-sm">ID: {id}</p>
        </div>
      </div>

      <div className="flex items-start gap-3 border border-blue-400 bg-blue-50 text-blue-900 rounded-lg p-4">
        <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Append-only — entries cannot be edited or deleted.</strong> This record is part of the immutable consent audit trail.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Consent Record</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              ["ID", "id"],
              ["Event Type", "eventType"],
              ["Enrollment ID", "enrollmentId"],
              ["Subject ID", "subjectId"],
              ["Scope", "scope"],
              ["Granted At", "grantedAt"],
              ["Revoked At", "revokedAt"],
              ["Witness ID", "witnessId"],
              ["Notes", "notes"],
              ["Created", "createdAt"],
            ].map(([label, key]) => (
              <div key={key} className="flex justify-between border-b pb-1 last:border-0">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium max-w-xs text-right break-all">
                  {record[key]
                    ? (typeof record[key] === "string" && key.endsWith("At")
                      ? new Date(String(record[key])).toLocaleString()
                      : String(record[key]))
                    : "-"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <AiVerbsPanel
          endpoint="consentLedger"
          verbs={AI_VERBS}
          contextBody={{ ledgerId: id, subjectId: record.subjectId }}
        />
      </div>
    </div>
  );
}
