'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Captions, CheckCircle2, Film, Play, RefreshCw, RotateCcw, Settings2, ShieldCheck, UploadCloud, XCircle } from 'lucide-react';

type Asset = { id: string; originalFilename: string; state: string; mimeType: string; sizeBytes: string; durationMs?: number; objectUri?: string };
type CaptionTrack = { id: string; assetId: string; language: string; label: string; objectUri: string; validated: boolean; isDefault: boolean };
type Job = { id: string; jobType: string; status: string; attempt: number; error?: { code?: string; message?: string } };
type Timeline = { id: string; name: string; slug: string; currentVersion: number; state: string };
type TimelineVersion = { id: string; version: number; durationMs: number; checksum: string; editDecisionList: unknown; changeNote?: string };
type Approval = { id: string; timelineVersionId: string; previewAssetId: string; status: string; requestedAt: string; comment?: string };
type Preset = { id: string; name: string; format: string; accessible: boolean; captionsBurned: boolean };
type Provider = { id: string; name: string; status: string; capabilities: string[]; priority: number; dailyQuota: number; usedToday: number; configured: boolean };
type Playback = { src: string; type: string; controls: boolean; keyboardAccessible: boolean; captions: Array<{ src: string; srclang: string; label: string; default: boolean }>; provenance?: unknown };
type TimelineDetail = { timeline: Timeline; versions: TimelineVersion[]; approvals: Approval[]; jobs: Job[] };

const defaultCues = JSON.stringify([
  { startMs: 0, endMs: 2000, text: 'Verified caption text' },
], null, 2);

async function jsonRequest(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed with HTTP ${response.status}`);
  return body;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-700">{children}</label>;
}

export default function MediaProductionPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedTimelineId, setSelectedTimelineId] = useState('');
  const [detail, setDetail] = useState<TimelineDetail | null>(null);
  const [captionTracks, setCaptionTracks] = useState<Record<string, CaptionTrack[]>>({});
  const [playback, setPlayback] = useState<{ asset: Asset; manifest: Playback } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState('');
  const [timelineName, setTimelineName] = useState('');
  const [timelineSlug, setTimelineSlug] = useState('');
  const [timelineJson, setTimelineJson] = useState('');
  const [captionAssetId, setCaptionAssetId] = useState('');
  const [captionLanguage, setCaptionLanguage] = useState('en-US');
  const [captionLabel, setCaptionLabel] = useState('English');
  const [captionCues, setCaptionCues] = useState(defaultCues);
  const [presetName, setPresetName] = useState('Accessible MP3');
  const [presetFormat, setPresetFormat] = useState('mp3');
  const [presetAccessible, setPresetAccessible] = useState(true);
  const [providerName, setProviderName] = useState('');
  const [providerBaseUrl, setProviderBaseUrl] = useState('');
  const [providerToken, setProviderToken] = useState('');
  const [exportPresets, setExportPresets] = useState<Record<string, string>>({});

  const readyAssets = useMemo(() => assets.filter((asset) => asset.state === 'READY'), [assets]);

  const loadTimeline = useCallback(async (id: string) => {
    if (!id) { setDetail(null); return; }
    const data = await jsonRequest(`/api/media-pipeline/timelines?id=${encodeURIComponent(id)}`) as TimelineDetail;
    setDetail(data);
    const assetIds = [...new Set(data.approvals.map((approval) => approval.previewAssetId))];
    const tracks = await Promise.all(assetIds.map(async (assetId) => [assetId, (await jsonRequest(`/api/media-pipeline/captions?assetId=${encodeURIComponent(assetId)}`)).captions || []] as const));
    setCaptionTracks((current) => ({ ...current, ...Object.fromEntries(tracks) }));
  }, []);

  const load = useCallback(async () => {
    setBusy('refresh');
    try {
      const [assetData, jobData, timelineData, presetData, providerData] = await Promise.all([
        jsonRequest('/api/media-pipeline/assets'),
        jsonRequest('/api/media-pipeline/jobs'),
        jsonRequest('/api/media-pipeline/timelines'),
        jsonRequest('/api/media-pipeline/presets'),
        jsonRequest('/api/media-pipeline/providers'),
      ]);
      setAssets(assetData.assets || []); setJobs(jobData.jobs || []); setTimelines(timelineData.timelines || []); setPresets(presetData.presets || []); setProviders(providerData.providers || []);
      if (selectedTimelineId) await loadTimeline(selectedTimelineId);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Media data could not be loaded'); }
    finally { setBusy(''); }
  }, [loadTimeline, selectedTimelineId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (selectedTimelineId) void loadTimeline(selectedTimelineId).catch((error) => setMessage(error.message)); }, [loadTimeline, selectedTimelineId]);
  useEffect(() => {
    if (!timelineJson && readyAssets[0]) setTimelineJson(JSON.stringify({ tracks: [{ type: readyAssets[0].mimeType.startsWith('video/') ? 'video' : 'audio', clips: [{ id: crypto.randomUUID(), assetId: readyAssets[0].id, startMs: 0, sourceStartMs: 0, durationMs: readyAssets[0].durationMs || 1000 }] }] }, null, 2));
    if (!captionAssetId && readyAssets[0]) setCaptionAssetId(readyAssets[0].id);
  }, [captionAssetId, readyAssets, timelineJson]);

  async function run(name: string, operation: () => Promise<void>) {
    setBusy(name); setMessage('');
    try { await operation(); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Operation failed'); }
    finally { setBusy(''); }
  }

  async function upload(event: FormEvent) {
    event.preventDefault();
    if (!file || !/^[a-f0-9]{64}$/.test(sha256)) { setMessage('Choose a supported media file and provide its lowercase SHA-256 checksum.'); return; }
    await run('upload', async () => {
      const ticket = await jsonRequest('/api/media-pipeline/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ filename: file.name, mimeType: file.type, sizeBytes: file.size, sha256 }) });
      if (!ticket.uploadUrl) throw new Error('Upload ticket did not include a signed URL');
      const response = await fetch(ticket.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type, 'X-Content-SHA256': sha256 }, body: file });
      if (!response.ok) throw new Error(`Object storage returned HTTP ${response.status}`);
      setFile(null); setSha256(''); setMessage('Upload bytes accepted. The asset remains pending until the signed integrity callback succeeds.');
    });
  }

  async function saveTimeline(action: 'create' | 'new-version') {
    await run(`timeline-${action}`, async () => {
      const editDecisionList = JSON.parse(timelineJson);
      const body = action === 'create' ? { name: timelineName, slug: timelineSlug, editDecisionList } : { timelineId: selectedTimelineId, editDecisionList, changeNote: 'Edited in media production workspace' };
      const result = await jsonRequest(`/api/media-pipeline/timelines?action=${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (result.timeline?.id) setSelectedTimelineId(result.timeline.id);
      setMessage(action === 'create' ? 'Timeline and immutable version 1 created.' : 'A new immutable timeline version was created.');
    });
  }

  async function requestPreview(version: TimelineVersion) {
    await run(`preview-${version.id}`, async () => {
      await jsonRequest('/api/media-pipeline/timelines?action=request-preview', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ timelineVersionId: version.id, format: 'mp4-h264' }) });
      setMessage('Preview job queued. Approval becomes available only after a provider returns verified output.');
    });
  }

  async function decide(approval: Approval, decision: 'APPROVED' | 'REJECTED') {
    const comment = decision === 'REJECTED' ? window.prompt('Reason for rejection (required):') : '';
    if (decision === 'REJECTED' && !comment) return;
    await run(`decision-${approval.id}`, async () => {
      await jsonRequest('/api/media-pipeline/timelines?action=decide-preview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ approvalId: approval.id, decision, comment }) });
      setMessage(`Preview ${decision.toLowerCase()}.`);
    });
  }

  async function requestExport(approval: Approval) {
    const presetId = exportPresets[approval.id] || presets[0]?.id;
    if (!presetId) { setMessage('Create an export preset first.'); return; }
    const preset = presets.find((item) => item.id === presetId)!;
    const tracks = (captionTracks[approval.previewAssetId] || []).filter((track) => track.validated);
    if (preset.accessible && !tracks.length) { setMessage('This accessible preset requires a validated caption track on the approved preview.'); return; }
    await run(`export-${approval.id}`, async () => {
      await jsonRequest('/api/media-pipeline/timelines?action=request-export', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() }, body: JSON.stringify({ timelineVersionId: approval.timelineVersionId, approvalId: approval.id, presetId, captionTrackIds: tracks.map((track) => track.id) }) });
      setMessage('Approved export queued with its preset and validated caption evidence.');
    });
  }

  async function saveCaptions(event: FormEvent) {
    event.preventDefault();
    await run('captions', async () => {
      const result = await jsonRequest('/api/media-pipeline/captions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: captionAssetId, language: captionLanguage, label: captionLabel, cues: JSON.parse(captionCues), isDefault: true }) });
      setCaptionTracks((current) => ({ ...current, [captionAssetId]: [result.track] }));
      setMessage('Caption track validated, written to object storage, and attached as the default track.');
    });
  }

  async function createPreset(event: FormEvent) {
    event.preventDefault();
    await run('preset', async () => {
      await jsonRequest('/api/media-pipeline/presets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: presetName, format: presetFormat, accessible: presetAccessible, config: { format: presetFormat, normalizeLoudness: true } }) });
      setMessage('Export preset created.');
    });
  }

  async function createProvider(event: FormEvent) {
    event.preventDefault();
    await run('provider', async () => {
      await jsonRequest('/api/media-pipeline/providers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: providerName, providerKind: 'HTTP_MEDIA', capabilities: ['TRANSCODE', 'RENDER', 'PREVIEW', 'EXPORT', 'CAPTION', 'DUB'], config: { baseUrl: providerBaseUrl, token: providerToken, healthPath: '/health', startPath: '/v1/jobs' }, maxInputBytes: 2147483648, dailyQuota: 1000, priority: 100 }) });
      setProviderName(''); setProviderBaseUrl(''); setProviderToken(''); setMessage('Provider configuration encrypted and saved inactive. Verify it before jobs can use it.');
    });
  }

  async function verifyProvider(provider: Provider) {
    await run(`provider-${provider.id}`, async () => {
      await jsonRequest('/api/media-pipeline/providers', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: provider.id }) });
      setMessage('Provider health contract verified and provider activated.');
    });
  }

  async function jobAction(job: Job, action: 'cancel' | 'retry') {
    await run(`job-${job.id}`, async () => {
      await jsonRequest(`/api/media-pipeline/jobs?action=${action}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: job.id }) });
      setMessage(action === 'cancel' ? 'Cancellation recorded.' : 'Failed job returned to the durable retry queue.');
    });
  }

  async function openPlayback(asset: Asset) {
    await run(`playback-${asset.id}`, async () => {
      const result = await jsonRequest(`/api/media-pipeline/assets?id=${encodeURIComponent(asset.id)}&view=playback`);
      setPlayback({ asset: result.asset, manifest: result.playback });
    });
  }

  return <div className="space-y-8 pb-16">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold text-slate-900">Governed media production</h1><p className="mt-1 text-sm text-slate-600">Direct uploads, immutable timelines, verified providers, approved previews, captions, accessible exports, and durable receipts.</p></div><button type="button" onClick={() => void load()} disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-50"><RefreshCw className="h-4 w-4"/>Refresh</button></div>
    {message && <div role="status" aria-live="polite" className="rounded border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-900">{message}</div>}

    <form onSubmit={upload} className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><UploadCloud className="h-5 w-5"/>1. Direct object-storage upload</h2><p className="my-3 text-sm text-slate-600">The API accepts metadata only. Bytes go to a short-lived allowlisted URL and remain unavailable until a signed callback confirms checksum, type, codec, duration, and probe limits.</p><div className="grid gap-3 md:grid-cols-3"><FieldLabel>Supported media file<input type="file" required accept="audio/wav,audio/mpeg,audio/mp4,audio/flac,video/mp4,video/webm" onChange={(event) => setFile(event.target.files?.[0] || null)} className="mt-1 block w-full rounded border p-2 text-sm"/></FieldLabel><FieldLabel>Lowercase SHA-256<input required value={sha256} onChange={(event) => setSha256(event.target.value.trim().toLowerCase())} pattern="[a-f0-9]{64}" className="mt-1 block w-full rounded border p-2 font-mono text-xs"/></FieldLabel><button disabled={Boolean(busy)} className="mt-5 rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">Create ticket and upload</button></div></form>

    <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><Play className="h-5 w-5"/>Ready assets and accessible playback</h2><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{assets.length ? assets.slice(0, 30).map((asset) => <article key={asset.id} className="rounded border p-3 text-sm"><p className="font-medium break-all">{asset.originalFilename}</p><p className="text-slate-500">{asset.state} · {asset.mimeType} · {asset.sizeBytes} bytes</p>{asset.state === 'READY' && <button type="button" onClick={() => void openPlayback(asset)} className="mt-2 text-indigo-700 underline">Open verified playback manifest</button>}</article>) : <p className="text-sm text-slate-500">No media assets yet.</p>}</div>{playback && <div className="mt-5 rounded border bg-slate-50 p-4"><h3 className="font-medium">{playback.asset.originalFilename}</h3>{playback.manifest.type.startsWith('video/') ? <video className="mt-3 max-h-96 w-full bg-black" controls preload="metadata" src={playback.manifest.src}>{playback.manifest.captions.map((track) => <track key={track.src} kind="captions" src={track.src} srcLang={track.srclang} label={track.label} default={track.default}/>)}</video> : <audio className="mt-3 w-full" controls preload="metadata" src={playback.manifest.src}/>}<p className="mt-2 text-xs text-slate-600">Keyboard controls: {playback.manifest.keyboardAccessible ? 'enabled' : 'unavailable'} · validated caption tracks: {playback.manifest.captions.length}</p>{playback.manifest.captions.length > 0 && <ul className="mt-2 list-disc pl-5 text-sm">{playback.manifest.captions.map((track) => <li key={track.src}><a className="text-indigo-700 underline" href={track.src}>{track.label} captions</a></li>)}</ul>}</div>}</section>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><Film className="h-5 w-5"/>2. Timeline and immutable versions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><FieldLabel>Timeline name<input value={timelineName} onChange={(event) => { setTimelineName(event.target.value); if (!timelineSlug) setTimelineSlug(event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); }} className="mt-1 w-full rounded border p-2"/></FieldLabel><FieldLabel>Slug<input value={timelineSlug} onChange={(event) => setTimelineSlug(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel></div><FieldLabel>Edit decision list JSON<textarea value={timelineJson} onChange={(event) => setTimelineJson(event.target.value)} rows={12} className="mt-1 w-full rounded border p-2 font-mono text-xs"/></FieldLabel><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void saveTimeline('create')} disabled={!timelineName || !timelineSlug || !timelineJson || Boolean(busy)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">Create timeline</button><button type="button" onClick={() => void saveTimeline('new-version')} disabled={!selectedTimelineId || !timelineJson || Boolean(busy)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Save new version</button></div><FieldLabel>Inspect timeline<select value={selectedTimelineId} onChange={(event) => setSelectedTimelineId(event.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Select a timeline</option>{timelines.map((timeline) => <option key={timeline.id} value={timeline.id}>{timeline.name} · v{timeline.currentVersion}</option>)}</select></FieldLabel>{detail && <div className="mt-4 space-y-2">{detail.versions.map((version) => <article key={version.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>Version {version.version}</strong><p className="text-xs text-slate-500">{version.durationMs} ms · {version.checksum.slice(0, 16)}…</p></div><div className="flex gap-2"><button type="button" onClick={() => setTimelineJson(JSON.stringify({ tracks: version.editDecisionList }, null, 2))} className="rounded border px-2 py-1">Load editor</button><button type="button" onClick={() => void requestPreview(version)} disabled={Boolean(busy)} className="rounded bg-slate-900 px-2 py-1 text-white">Request preview</button></div></div></article>)}</div>}</section>

      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><Captions className="h-5 w-5"/>3. Validated captions</h2><form onSubmit={saveCaptions} className="mt-4 space-y-3"><FieldLabel>Ready asset<select required value={captionAssetId} onChange={(event) => setCaptionAssetId(event.target.value)} className="mt-1 w-full rounded border p-2"><option value="">Select an asset</option>{readyAssets.map((asset) => <option key={asset.id} value={asset.id}>{asset.originalFilename}</option>)}</select></FieldLabel><div className="grid gap-3 sm:grid-cols-2"><FieldLabel>BCP-47 language<input required value={captionLanguage} onChange={(event) => setCaptionLanguage(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel><FieldLabel>Track label<input required value={captionLabel} onChange={(event) => setCaptionLabel(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel></div><FieldLabel>Caption cues JSON<textarea required value={captionCues} onChange={(event) => setCaptionCues(event.target.value)} rows={9} className="mt-1 w-full rounded border p-2 font-mono text-xs"/></FieldLabel><button disabled={!captionAssetId || Boolean(busy)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">Validate and store WebVTT</button></form></section>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><ShieldCheck className="h-5 w-5"/>4. Preview approvals and exports</h2><p className="mt-2 text-sm text-slate-600">Approval records appear after a preview provider returns a verified output. Approved accessible exports require captions attached to that preview.</p><div className="mt-4 space-y-3">{detail?.approvals.length ? detail.approvals.map((approval) => <article key={approval.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{approval.status}</strong><p className="text-xs text-slate-500">Preview {approval.previewAssetId.slice(0, 12)}… · captions {(captionTracks[approval.previewAssetId] || []).length}</p>{approval.comment && <p>{approval.comment}</p>}</div>{approval.status === 'PENDING' && <div className="flex gap-2"><button type="button" onClick={() => void decide(approval, 'APPROVED')} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-white"><CheckCircle2 className="h-3 w-3"/>Approve</button><button type="button" onClick={() => void decide(approval, 'REJECTED')} className="inline-flex items-center gap-1 rounded bg-red-700 px-2 py-1 text-white"><XCircle className="h-3 w-3"/>Reject</button></div>}</div>{approval.status === 'APPROVED' && <div className="mt-3 flex gap-2"><select aria-label="Export preset" value={exportPresets[approval.id] || presets[0]?.id || ''} onChange={(event) => setExportPresets((current) => ({ ...current, [approval.id]: event.target.value }))} className="min-w-0 flex-1 rounded border p-2">{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name} · {preset.format}{preset.accessible ? ' · accessible' : ''}</option>)}</select><button type="button" onClick={() => void requestExport(approval)} className="rounded bg-indigo-600 px-3 py-2 text-white">Queue export</button></div>}</article>) : <p className="text-sm text-slate-500">Select a timeline with a completed preview to review approval evidence.</p>}</div></section>

      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 font-medium"><Settings2 className="h-5 w-5"/>Export presets</h2><form onSubmit={createPreset} className="mt-4 space-y-3"><FieldLabel>Preset name<input required value={presetName} onChange={(event) => setPresetName(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel><FieldLabel>Format<select value={presetFormat} onChange={(event) => setPresetFormat(event.target.value)} className="mt-1 w-full rounded border p-2"><option value="mp3">MP3</option><option value="wav">WAV</option><option value="aac">AAC</option><option value="mp4-h264">MP4 H.264</option><option value="webm-vp9">WebM VP9</option></select></FieldLabel><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={presetAccessible} onChange={(event) => setPresetAccessible(event.target.checked)}/>Require validated captions</label><button disabled={Boolean(busy)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">Create preset</button></form><ul className="mt-4 space-y-2 text-sm">{presets.map((preset) => <li key={preset.id} className="rounded border p-2">{preset.name} · {preset.format} · {preset.accessible ? 'captions required' : 'captions optional'}</li>)}</ul></section>
    </div>

    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="font-medium">5. Production provider contracts</h2><p className="mt-2 text-sm text-slate-600">Only allowlisted HTTPS providers can be stored. Credentials are encrypted, providers start inactive, and activation performs a real health request.</p><form onSubmit={createProvider} className="mt-4 space-y-3"><FieldLabel>Provider name<input required value={providerName} onChange={(event) => setProviderName(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel><FieldLabel>Allowlisted HTTPS base URL<input required type="url" value={providerBaseUrl} onChange={(event) => setProviderBaseUrl(event.target.value)} placeholder="https://media-provider.example.com" className="mt-1 w-full rounded border p-2"/></FieldLabel><FieldLabel>Bearer token<input required type="password" autoComplete="new-password" value={providerToken} onChange={(event) => setProviderToken(event.target.value)} className="mt-1 w-full rounded border p-2"/></FieldLabel><button disabled={Boolean(busy)} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">Encrypt and save inactive</button></form><div className="mt-4 space-y-2">{providers.map((provider) => <article key={provider.id} className="flex items-center justify-between gap-3 rounded border p-3 text-sm"><div><strong>{provider.name}</strong><p className="text-xs text-slate-500">{provider.status} · {provider.usedToday}/{provider.dailyQuota} today · {provider.capabilities.join(', ')}</p></div>{provider.status !== 'ACTIVE' && <button type="button" onClick={() => void verifyProvider(provider)} disabled={Boolean(busy)} className="rounded border px-2 py-1">Verify and activate</button>}</article>)}</div></section>

      <section className="rounded-lg border bg-white p-5 shadow-sm"><h2 className="font-medium">6. Durable job status, retry, and cancellation</h2><div className="mt-4 space-y-2">{jobs.length ? jobs.slice(0, 50).map((job) => <article key={job.id} className="rounded border p-3 text-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><strong>{job.jobType}</strong> · {job.status}<p className="text-xs text-slate-500">Attempt {job.attempt}</p></div><div className="flex gap-2">{['QUEUED', 'RETRY_WAIT', 'PROVIDER_PENDING'].includes(job.status) && <button type="button" onClick={() => void jobAction(job, 'cancel')} className="rounded border px-2 py-1">Cancel</button>}{['FAILED', 'DEAD_LETTER'].includes(job.status) && <button type="button" onClick={() => void jobAction(job, 'retry')} className="inline-flex items-center gap-1 rounded border px-2 py-1"><RotateCcw className="h-3 w-3"/>Retry</button>}</div></div>{job.error?.message && <p className="mt-2 text-red-700">{job.error.code}: {job.error.message}</p>}</article>) : <p className="text-sm text-slate-500">No durable media jobs yet.</p>}</div></section>
    </div>
  </div>;
}
