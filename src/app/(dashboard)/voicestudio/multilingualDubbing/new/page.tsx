"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Languages, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function MultilingualDubbingNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ sourceAudioUrl: "", sourceLanguage: "en", targetLanguage: "", enrollmentId: "", glossary: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        sourceLanguage: form.sourceLanguage,
        targetLanguage: form.targetLanguage,
      };
      if (form.sourceAudioUrl) body.sourceAudioUrl = form.sourceAudioUrl;
      if (form.enrollmentId) body.enrollmentId = form.enrollmentId;
      if (form.glossary) body.glossary = form.glossary;

      const res = await fetch("/api/voicestudio/multilingualDubbing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create dubbing job");
      toast({ title: "Dubbing job created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/multilingualDubbing");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/multilingualDubbing"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Languages className="h-6 w-6" />New Dubbing Job</h1>
          <p className="text-muted-foreground text-sm">Submit audio for multilingual dubbing</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Dubbing Configuration</CardTitle>
          <CardDescription>Specify source audio and target language settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="sourceAudioUrl">Source Audio URL</Label>
              <Input id="sourceAudioUrl" placeholder="https://..." value={form.sourceAudioUrl} onChange={(e) => setForm((p) => ({ ...p, sourceAudioUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="sourceLanguage">Source Language *</Label>
                <Input id="sourceLanguage" required placeholder="e.g. en" value={form.sourceLanguage} onChange={(e) => setForm((p) => ({ ...p, sourceLanguage: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="targetLanguage">Target Language *</Label>
                <Input id="targetLanguage" required placeholder="e.g. es, fr, de" value={form.targetLanguage} onChange={(e) => setForm((p) => ({ ...p, targetLanguage: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="enrollmentId">Enrollment ID (optional)</Label>
              <Input id="enrollmentId" placeholder="Use specific voice clone" value={form.enrollmentId} onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="glossary">Glossary / Special Terms</Label>
              <Input id="glossary" placeholder="term1=translation1, term2=translation2" value={form.glossary} onChange={(e) => setForm((p) => ({ ...p, glossary: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Job"}</Button>
              <Link href="/voicestudio/multilingualDubbing"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
