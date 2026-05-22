"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fingerprint, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function WatermarkProvenanceNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ assetUrl: "", watermarkStrength: "medium", watermarkType: "perceptual", enrollmentId: "", c2paEnabled: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        watermarkStrength: form.watermarkStrength,
        watermarkType: form.watermarkType,
        c2paEnabled: form.c2paEnabled,
      };
      if (form.assetUrl) body.assetUrl = form.assetUrl;
      if (form.enrollmentId) body.enrollmentId = form.enrollmentId;

      const res = await fetch("/api/voicestudio/watermarkProvenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create provenance record");
      toast({ title: "Provenance record created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/watermarkProvenance");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/watermarkProvenance"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Fingerprint className="h-6 w-6" />New Provenance Record</h1>
          <p className="text-muted-foreground text-sm">Register watermark and provenance metadata for a content asset</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Watermark Configuration</CardTitle>
          <CardDescription>Define watermark parameters and C2PA provenance settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="assetUrl">Asset URL</Label>
              <Input id="assetUrl" placeholder="https://..." value={form.assetUrl} onChange={(e) => setForm((p) => ({ ...p, assetUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="watermarkStrength">Watermark Strength</Label>
                <select id="watermarkStrength" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.watermarkStrength} onChange={(e) => setForm((p) => ({ ...p, watermarkStrength: e.target.value }))}>
                  <option value="light">Light</option>
                  <option value="medium">Medium</option>
                  <option value="strong">Strong</option>
                  <option value="maximum">Maximum</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="watermarkType">Watermark Type</Label>
                <select id="watermarkType" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.watermarkType} onChange={(e) => setForm((p) => ({ ...p, watermarkType: e.target.value }))}>
                  <option value="perceptual">Perceptual</option>
                  <option value="imperceptible">Imperceptible</option>
                  <option value="forensic">Forensic</option>
                  <option value="c2pa">C2PA</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="enrollmentId">Enrollment ID (optional)</Label>
              <Input id="enrollmentId" placeholder="Link to voice clone enrollment" value={form.enrollmentId} onChange={(e) => setForm((p) => ({ ...p, enrollmentId: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="c2paEnabled"
                className="h-4 w-4"
                checked={form.c2paEnabled}
                onChange={(e) => setForm((p) => ({ ...p, c2paEnabled: e.target.checked }))}
              />
              <Label htmlFor="c2paEnabled" className="cursor-pointer">Enable C2PA Content Credentials Manifest</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Record"}</Button>
              <Link href="/voicestudio/watermarkProvenance"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
