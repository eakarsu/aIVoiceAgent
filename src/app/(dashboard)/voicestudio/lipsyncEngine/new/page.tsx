"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlignCenter, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function LipsyncEngineNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ videoAssetUrl: "", audioAssetUrl: "", language: "en", enrollmentId: "", avatarRenderId: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { language: form.language };
      if (form.videoAssetUrl) body.videoAssetUrl = form.videoAssetUrl;
      if (form.audioAssetUrl) body.audioAssetUrl = form.audioAssetUrl;
      if (form.enrollmentId) body.enrollmentId = form.enrollmentId;
      if (form.avatarRenderId) body.avatarRenderId = form.avatarRenderId;

      const res = await fetch("/api/voicestudio/lipsyncEngine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create lipsync job");
      toast({ title: "Lipsync job created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/lipsyncEngine");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/lipsyncEngine"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><AlignCenter className="h-6 w-6" />New Lipsync Job</h1>
          <p className="text-muted-foreground text-sm">Submit assets for lipsync processing</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Job Configuration</CardTitle>
          <CardDescription>Specify video/audio assets and language settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="videoAssetUrl">Video Asset URL</Label>
              <Input id="videoAssetUrl" placeholder="https://..." value={form.videoAssetUrl} onChange={(e) => setForm((p) => ({ ...p, videoAssetUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audioAssetUrl">Audio Asset URL</Label>
              <Input id="audioAssetUrl" placeholder="https://..." value={form.audioAssetUrl} onChange={(e) => setForm((p) => ({ ...p, audioAssetUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="language">Language *</Label>
              <Input id="language" required placeholder="e.g. en, es, fr" value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="enrollmentId">Enrollment ID (optional)</Label>
              <Input id="enrollmentId" placeholder="Link to voice clone enrollment" value={form.enrollmentId} onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="avatarRenderId">Avatar Render ID (optional)</Label>
              <Input id="avatarRenderId" placeholder="Link to avatar render job" value={form.avatarRenderId} onChange={(e) => setForm((p) => ({ ...p, avatarRenderId: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit Job"}</Button>
              <Link href="/voicestudio/lipsyncEngine"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
