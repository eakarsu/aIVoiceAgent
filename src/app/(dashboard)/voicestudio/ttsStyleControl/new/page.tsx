"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Volume2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

export default function TtsStyleControlNewPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", emotion: "", pace: "", pitch: "", volume: "", language: "", ssmlTemplate: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = { name: form.name.trim() };
      if (form.emotion) body.emotion = form.emotion;
      if (form.pace) body.pace = form.pace;
      if (form.pitch) body.pitch = form.pitch;
      if (form.volume) body.volume = form.volume;
      if (form.language) body.language = form.language;
      if (form.ssmlTemplate) body.ssmlTemplate = form.ssmlTemplate;

      const res = await fetch("/api/voicestudio/ttsStyleControl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create style");
      toast({ title: "Style created", description: `ID: ${json.data?.id}` });
      router.push("/voicestudio/ttsStyleControl");
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
        <Link href="/voicestudio/ttsStyleControl">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Volume2 className="h-6 w-6" />New TTS Style</h1>
          <p className="text-muted-foreground text-sm">Create a new text-to-speech style configuration</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Style Configuration</CardTitle>
          <CardDescription>Define prosody and voice characteristics for this style.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" required placeholder="e.g. Calm Professional" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="emotion">Emotion</Label>
                <Input id="emotion" placeholder="e.g. calm, friendly" value={form.emotion} onChange={(e) => setForm((p) => ({ ...p, emotion: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pace">Pace</Label>
                <Input id="pace" placeholder="e.g. medium, slow" value={form.pace} onChange={(e) => setForm((p) => ({ ...p, pace: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="pitch">Pitch</Label>
                <Input id="pitch" placeholder="e.g. medium, +2st" value={form.pitch} onChange={(e) => setForm((p) => ({ ...p, pitch: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="volume">Volume</Label>
                <Input id="volume" placeholder="e.g. medium, loud" value={form.volume} onChange={(e) => setForm((p) => ({ ...p, volume: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="language">Language</Label>
              <Input id="language" placeholder="e.g. en-US" value={form.language} onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ssmlTemplate">SSML Template</Label>
              <Input id="ssmlTemplate" placeholder="<speak>...</speak>" value={form.ssmlTemplate} onChange={(e) => setForm((p) => ({ ...p, ssmlTemplate: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>{submitting ? "Creating..." : "Create Style"}</Button>
              <Link href="/voicestudio/ttsStyleControl"><Button type="button" variant="outline">Cancel</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
