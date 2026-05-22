"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

const EVENT_TYPES = ["grant", "revoke", "update", "renew", "witness-attest", "subject-confirm"];

export default function ConsentLedgerNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    enrollmentId: "",
    subjectId: "",
    eventType: "grant",
    scope: "",
    grantedAt: "",
    witnessId: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        eventType: form.eventType,
      };
      if (form.enrollmentId.trim()) body.enrollmentId = form.enrollmentId.trim();
      if (form.subjectId.trim()) body.subjectId = form.subjectId.trim();
      if (form.scope.trim()) body.scope = form.scope.trim();
      if (form.grantedAt) body.grantedAt = new Date(form.grantedAt).toISOString();
      if (form.witnessId.trim()) body.witnessId = form.witnessId.trim();
      if (form.notes.trim()) body.notes = form.notes.trim();

      const res = await fetch("/api/voicestudio/consentLedger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create consent entry");
      toast({ title: "Consent entry created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/consentLedger");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/consentLedger">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> New Consent Entry
          </h1>
          <p className="text-muted-foreground text-sm">Append a new record to the immutable consent ledger</p>
        </div>
      </div>

      <div className="flex items-start gap-3 border border-blue-400 bg-blue-50 text-blue-900 rounded-lg p-4">
        <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Append-only — entries cannot be edited or deleted.</strong> Once submitted, this consent record is permanently part of the audit trail. Ensure all details are correct before submitting.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Consent Event Details</CardTitle>
          <CardDescription>Record a consent event for a subject enrollment.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="eventType">Event Type *</Label>
              <select
                id="eventType"
                required
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.eventType}
                onChange={(e) => setForm((p) => ({ ...p, eventType: e.target.value }))}
              >
                {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="enrollmentId">Enrollment ID</Label>
              <Input
                id="enrollmentId"
                placeholder="Link to a voiceCloneEnroll record"
                value={form.enrollmentId}
                onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="subjectId">Subject ID</Label>
              <Input
                id="subjectId"
                placeholder="Subject identifier"
                value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="scope">Consent Scope</Label>
              <Input
                id="scope"
                placeholder="e.g. voice-clone:read, tts:generate"
                value={form.scope}
                onChange={(e) => setForm((p) => ({ ...p, scope: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="grantedAt">Granted At</Label>
              <Input
                id="grantedAt"
                type="datetime-local"
                value={form.grantedAt}
                onChange={(e) => setForm((p) => ({ ...p, grantedAt: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="witnessId">Witness ID</Label>
              <Input
                id="witnessId"
                placeholder="ID of the witness/attestor"
                value={form.witnessId}
                onChange={(e) => setForm((p) => ({ ...p, witnessId: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Additional notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Appending..." : "Append to Ledger"}
              </Button>
              <Link href="/voicestudio/consentLedger">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
