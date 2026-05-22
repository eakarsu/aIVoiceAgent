"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function AvatarRenderNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ avatarAssetUrl: "", audioAssetUrl: "", renderTier: "standard", resolution: "1920x1080", fps: "30", codec: "h264", outputFormat: "mp4" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        renderTier: form.renderTier,
        resolution: form.resolution,
        fps: form.fps ? parseInt(form.fps) : undefined,
        codec: form.codec,
        outputFormat: form.outputFormat,
      };
      if (form.avatarAssetUrl) body.avatarAssetUrl = form.avatarAssetUrl;
      if (form.audioAssetUrl) body.audioAssetUrl = form.audioAssetUrl;

      const res = await fetch("/api/voicestudio/avatarRender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create render job");
      toast({ title: "Render job created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/avatarRender");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="flex items-center gap-3">
        <Link href="/voicestudio/avatarRender"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="h-6 w-6" />New Render Job</h1>
          <p className="text-muted-foreground text-sm">Queue a new avatar render job</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Render Configuration</CardTitle>
          <CardDescription>Specify asset URLs and output settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="avatarAssetUrl">Avatar Asset URL</Label>
              <Input id="avatarAssetUrl" placeholder="https://..." value={form.avatarAssetUrl} onChange={(e) => setForm((p) => ({ ...p, avatarAssetUrl: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="audioAssetUrl">Audio Asset URL</Label>
              <Input id="audioAssetUrl" placeholder="https://..." value={form.audioAssetUrl} onChange={(e) => setForm((p) => ({ ...p, audioAssetUrl: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="renderTier">Render Tier</Label>
                <select id="renderTier" className="w-full border rounded-md px-3 py-2 text-sm bg-background" value={form.renderTier} onChange={(e) => setForm((p) => ({ ...p, renderTier: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="resolution">Resolution</Label>
                <Input id="resolution" placeholder="1920x1080" value={form.resolution} onChange={(e) => setForm((p) => ({ ...p, resolution: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fps">FPS</Label>
                <Input id="fps" type="number" placeholder="30" value={form.fps} onChange={(e) => setForm((p) => ({ ...p, fps: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="codec">Codec</Label>
                <Input id="codec" placeholder="h264" value={form.codec} onChange={(e) => setForm((p) => ({ ...p, codec: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="outputFormat">Output Format</Label>
              <Input id="outputFormat" placeholder="mp4" value={form.outputFormat} onChange={(e) => setForm((p) => ({ ...p, outputFormat: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Queuing..." : "Queue Render"}</Button>
              <Link href="/voicestudio/avatarRender"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
