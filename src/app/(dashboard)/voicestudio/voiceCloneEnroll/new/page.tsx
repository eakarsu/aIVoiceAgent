"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Mic, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function VoiceCloneEnrollNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    subjectId: "",
    subjectName: "",
    displayName: "",
    consentGrantedAt: "",
    consentVersion: "1.0",
    consentChecked: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.consentChecked) {
      toast({ title: "Consent Required", description: "You must confirm the subject has granted consent before enrolling.", variant: "destructive" });
      return;
    }
    if (!form.consentGrantedAt) {
      toast({ title: "Consent Date Required", description: "Please provide the consent grant date.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        subjectId: form.subjectId.trim(),
        subjectName: form.subjectName.trim(),
        consentGrantedAt: new Date(form.consentGrantedAt).toISOString(),
        consentVersion: form.consentVersion,
      };
      if (form.displayName.trim()) body.displayName = form.displayName.trim();

      const res = await fetch("/api/voicestudio/voiceCloneEnroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create enrollment");
      toast({ title: "Enrollment created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/voiceCloneEnroll");
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
        <Link href="/voicestudio/voiceCloneEnroll">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mic className="h-6 w-6" /> New Voice Clone Enrollment
          </h1>
          <p className="text-muted-foreground text-sm">Register a new subject for voice cloning</p>
        </div>
      </div>

      <div className="flex items-start gap-3 border border-orange-400 bg-orange-50 text-orange-900 rounded-lg p-4">
        <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">
          <strong>Consent is mandatory.</strong> Voice cloning requires explicit informed consent from the subject. The enrollment will be rejected without a valid <code>consentGrantedAt</code> date.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enrollment Details</CardTitle>
          <CardDescription>All fields marked * are required by the backend.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="subjectId">Subject ID *</Label>
              <Input
                id="subjectId"
                required
                placeholder="e.g. usr-123 or employee-456"
                value={form.subjectId}
                onChange={(e) => setForm((p) => ({ ...p, subjectId: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Unique identifier for the subject in your system</p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="subjectName">Subject Name *</Label>
              <Input
                id="subjectName"
                required
                placeholder="Full name of the subject"
                value={form.subjectName}
                onChange={(e) => setForm((p) => ({ ...p, subjectName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="displayName">Display Name (optional)</Label>
              <Input
                id="displayName"
                placeholder="Friendly name for the cloned voice"
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="consentVersion">Consent Version</Label>
              <Input
                id="consentVersion"
                value={form.consentVersion}
                onChange={(e) => setForm((p) => ({ ...p, consentVersion: e.target.value }))}
              />
            </div>

            {/* CONSENT GATE */}
            <div className="border-2 border-orange-300 rounded-lg p-4 space-y-3 bg-orange-50">
              <h3 className="font-semibold text-orange-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Consent Confirmation (Required)
              </h3>

              <div className="space-y-1">
                <Label htmlFor="consentGrantedAt" className="text-orange-900">
                  Consent Granted At *
                </Label>
                <Input
                  id="consentGrantedAt"
                  type="datetime-local"
                  required
                  value={form.consentGrantedAt}
                  onChange={(e) => setForm((p) => ({ ...p, consentGrantedAt: e.target.value }))}
                  className="border-orange-300 focus:ring-orange-400"
                />
                <p className="text-xs text-orange-800">
                  Date and time when the subject gave explicit consent for voice cloning
                </p>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentChecked"
                  className="mt-1 h-4 w-4 accent-orange-600"
                  required
                  checked={form.consentChecked}
                  onChange={(e) => setForm((p) => ({ ...p, consentChecked: e.target.checked }))}
                />
                <Label htmlFor="consentChecked" className="text-sm text-orange-900 leading-relaxed cursor-pointer">
                  I confirm that the subject named above has provided <strong>explicit, informed written consent</strong> for their voice to be cloned on{" "}
                  {form.consentGrantedAt
                    ? new Date(form.consentGrantedAt).toLocaleString()
                    : "[select date above]"}
                  , and that this consent is documented and retrievable. Enrollment without valid consent violates platform policy.
                </Label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting || !form.consentChecked}>
                {submitting ? "Creating..." : "Create Enrollment"}
              </Button>
              <Link href="/voicestudio/voiceCloneEnroll">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
