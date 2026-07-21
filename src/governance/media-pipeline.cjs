'use strict';

const crypto = require('node:crypto');

class MediaError extends Error {
  constructor(code, message, status = 422, retryable = false) {
    super(message);
    this.name = 'MediaError'; this.code = code; this.status = status; this.retryable = retryable;
  }
}

const FORMATS = Object.freeze({
  'audio/wav': { kind: 'audio', maxBytes: 256 * 1024 ** 2, codecs: ['pcm_s16le', 'pcm_s24le', 'pcm_f32le'] },
  'audio/mpeg': { kind: 'audio', maxBytes: 256 * 1024 ** 2, codecs: ['mp3'] },
  'audio/mp4': { kind: 'audio', maxBytes: 256 * 1024 ** 2, codecs: ['aac', 'alac'] },
  'audio/flac': { kind: 'audio', maxBytes: 256 * 1024 ** 2, codecs: ['flac'] },
  'video/mp4': { kind: 'video', maxBytes: 2 * 1024 ** 3, codecs: ['h264', 'hevc', 'av1'] },
  'video/webm': { kind: 'video', maxBytes: 2 * 1024 ** 3, codecs: ['vp8', 'vp9', 'av1'] },
});

function bounded(value, name, max = 500) {
  if (typeof value !== 'string' || !value.trim() || Buffer.byteLength(value) > max || value.includes('\0')) throw new MediaError('INVALID_INPUT', `${name} is required and must be at most ${max} bytes`);
  return value.trim();
}

function digest(value) {
  return crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : stable(value)).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

function validateUpload(input) {
  const filename = bounded(input.filename, 'filename', 255);
  if (filename !== filename.split(/[\\/]/).pop() || filename.startsWith('.')) throw new MediaError('INVALID_FILENAME', 'filename must not contain a path or begin with a dot');
  const format = FORMATS[input.mimeType];
  if (!format) throw new MediaError('UNSUPPORTED_FORMAT', 'media type is not supported', 415);
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > format.maxBytes) throw new MediaError('SIZE_LIMIT', `file exceeds the ${format.maxBytes} byte limit`, 413);
  const sha256 = String(input.sha256 || '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(sha256)) throw new MediaError('CHECKSUM_REQUIRED', 'a lowercase SHA-256 checksum is required');
  return Object.freeze({ filename, mimeType: input.mimeType, kind: format.kind, sizeBytes: input.sizeBytes, sha256, format });
}

function objectKey(businessId, input, id) {
  const safeBusiness = bounded(businessId, 'businessId', 128).replace(/[^a-zA-Z0-9_-]/g, '_');
  const ext = input.filename.includes('.') ? input.filename.slice(input.filename.lastIndexOf('.')).toLowerCase().replace(/[^a-z0-9.]/g, '') : '';
  return `${safeBusiness}/${input.sha256.slice(0, 2)}/${input.sha256}/${bounded(id, 'assetId', 128)}${ext}`;
}

function validateProbe(upload, probe) {
  if (!probe || typeof probe !== 'object') throw new MediaError('PROBE_REQUIRED', 'object storage must provide probe metadata');
  if (probe.mimeType !== upload.mimeType) throw new MediaError('MIME_MISMATCH', 'declared and detected media types differ');
  if (!upload.format.codecs.includes(probe.codec)) throw new MediaError('CODEC_NOT_ALLOWED', `codec ${probe.codec || 'unknown'} is not allowed`);
  if (!Number.isFinite(probe.durationMs) || probe.durationMs <= 0 || probe.durationMs > 4 * 60 * 60 * 1000) throw new MediaError('DURATION_LIMIT', 'duration must be between zero and four hours');
  if (upload.kind === 'audio') {
    if (!Number.isInteger(probe.sampleRate) || probe.sampleRate < 8_000 || probe.sampleRate > 192_000) throw new MediaError('INVALID_SAMPLE_RATE', 'audio sample rate must be 8-192 kHz');
    if (![1, 2, 6, 8].includes(probe.channels)) throw new MediaError('INVALID_CHANNELS', 'audio channel count is unsupported');
  } else {
    if (!Number.isInteger(probe.width) || !Number.isInteger(probe.height) || probe.width < 16 || probe.height < 16 || probe.width * probe.height > 33_177_600) throw new MediaError('INVALID_DIMENSIONS', 'video dimensions are invalid or exceed 8K');
    if (!Number.isFinite(probe.fps) || probe.fps <= 0 || probe.fps > 120) throw new MediaError('INVALID_FRAME_RATE', 'frame rate must be at most 120 fps');
  }
  return Object.freeze({ ...probe, probedAt: new Date().toISOString(), probeDigest: digest(probe) });
}

const JOB_TRANSITIONS = Object.freeze({
  QUEUED: new Set(['RUNNING', 'CANCELLED']), RUNNING: new Set(['PROVIDER_PENDING', 'SUCCEEDED', 'RETRY_WAIT', 'FAILED', 'CANCELLED']),
  PROVIDER_PENDING: new Set(['SUCCEEDED', 'RETRY_WAIT', 'FAILED', 'CANCELLED']), RETRY_WAIT: new Set(['RUNNING', 'CANCELLED']),
  SUCCEEDED: new Set(), FAILED: new Set(['RETRY_WAIT']), CANCELLED: new Set(), DEAD_LETTER: new Set(['RETRY_WAIT']),
});

function transitionJob(job, to, data = {}) {
  if (!JOB_TRANSITIONS[job.status]?.has(to)) throw new MediaError('INVALID_JOB_TRANSITION', `${job.status} cannot transition to ${to}`, 409);
  if (to === 'SUCCEEDED' && (!data.providerReceipt?.providerJobId || !data.outputAssetId)) throw new MediaError('RECEIPT_REQUIRED', 'successful work requires a provider receipt and output asset');
  if (to === 'CANCELLED' && job.status === 'PROVIDER_PENDING' && !data.providerCancellationConfirmed) throw new MediaError('PROVIDER_CANCELLATION_REQUIRED', 'provider cancellation confirmation is required');
  return Object.freeze({ ...job, ...data, status: to, updatedAt: new Date(data.at || Date.now()).toISOString() });
}

function chooseProvider(providers, job, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const eligible = providers.filter((provider) => provider.status === 'ACTIVE' && provider.capabilities?.includes(job.jobType) && !job.providersTried?.includes(provider.id) && provider.maxInputBytes >= job.inputBytes && (provider.usageDate !== date || provider.usedToday < provider.dailyQuota));
  eligible.sort((a, b) => a.priority - b.priority || a.costWeight - b.costWeight || a.id.localeCompare(b.id));
  if (!eligible[0]) throw new MediaError('NO_PROVIDER_CAPACITY', 'no configured provider has compatible quota and format capacity', 503, true);
  return Object.freeze({ ...eligible[0] });
}

function classifyProviderFailure(error) {
  const status = Number(error?.status || 0);
  const code = String(error?.code || 'PROVIDER_FAILURE');
  const retryable = Boolean(error?.retryable) || status === 429 || status >= 500 || /timeout|ECONN|temporar/i.test(String(error?.message || ''));
  return Object.freeze({ code, message: String(error?.message || 'provider failed').slice(0, 1000), retryable, failover: retryable || ['UNSUPPORTED_FORMAT', 'QUOTA_EXCEEDED'].includes(code) });
}

function validateTimeline(input, assetDurations = {}) {
  if (!input || !Array.isArray(input.tracks) || !input.tracks.length || input.tracks.length > 64) throw new MediaError('INVALID_TIMELINE', 'timeline requires 1-64 tracks');
  const ids = new Set();
  let durationMs = 0;
  const tracks = input.tracks.map((track, trackIndex) => {
    if (!['audio', 'video', 'caption'].includes(track.type) || !Array.isArray(track.clips) || track.clips.length > 10_000) throw new MediaError('INVALID_TRACK', `track ${trackIndex} is invalid`);
    let previousEnd = -1;
    const clips = track.clips.map((clip) => {
      const id = bounded(clip.id, 'clip.id', 128);
      if (ids.has(id)) throw new MediaError('DUPLICATE_CLIP', `duplicate clip ${id}`);
      ids.add(id);
      const sourceDuration = assetDurations[clip.assetId];
      for (const key of ['startMs', 'sourceStartMs', 'durationMs']) if (!Number.isSafeInteger(clip[key]) || clip[key] < 0) throw new MediaError('INVALID_CLIP_TIME', `${key} must be a non-negative integer`);
      if (clip.durationMs === 0 || (sourceDuration !== undefined && clip.sourceStartMs + clip.durationMs > sourceDuration)) throw new MediaError('CLIP_OUT_OF_RANGE', `clip ${id} exceeds its source`);
      if (clip.startMs < previousEnd) throw new MediaError('CLIP_OVERLAP', `clips overlap on track ${trackIndex}`);
      previousEnd = clip.startMs + clip.durationMs; durationMs = Math.max(durationMs, previousEnd);
      return Object.freeze({ id, assetId: bounded(clip.assetId, 'clip.assetId', 128), startMs: clip.startMs, sourceStartMs: clip.sourceStartMs, durationMs: clip.durationMs, gainDb: Math.max(-60, Math.min(12, Number(clip.gainDb || 0))) });
    });
    return Object.freeze({ type: track.type, clips: Object.freeze(clips) });
  });
  if (durationMs > 4 * 60 * 60 * 1000) throw new MediaError('TIMELINE_TOO_LONG', 'timeline exceeds four hours');
  const canonical = { tracks, durationMs };
  return Object.freeze({ ...canonical, checksum: digest(canonical) });
}

function nextTimelineVersion(previous, editDecisionList, assetDurations) {
  const validated = validateTimeline(editDecisionList, assetDurations);
  if (previous?.checksum === validated.checksum) throw new MediaError('NO_TIMELINE_CHANGE', 'new timeline version must differ from the prior version', 409);
  return Object.freeze({ version: (previous?.version || 0) + 1, ...validated, immutable: true });
}

function decidePreview(approval, command) {
  if (approval.status !== 'PENDING') throw new MediaError('APPROVAL_ALREADY_DECIDED', 'preview approval is immutable after decision', 409);
  if (!['APPROVED', 'REJECTED'].includes(command.decision)) throw new MediaError('INVALID_DECISION', 'decision must be APPROVED or REJECTED');
  if (command.decision === 'REJECTED' && !String(command.comment || '').trim()) throw new MediaError('COMMENT_REQUIRED', 'rejection requires a comment');
  return Object.freeze({ ...approval, status: command.decision, reviewedBy: bounded(command.reviewedBy, 'reviewedBy', 128), comment: command.comment ? String(command.comment).slice(0, 1000) : null, decidedAt: new Date(command.at || Date.now()).toISOString() });
}

function validateCaptions(input) {
  const language = bounded(input.language, 'language', 35);
  if (!/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2}|-[0-9]{3})?$/.test(language)) throw new MediaError('INVALID_LANGUAGE', 'caption language must be a bounded BCP-47 tag');
  if (!Array.isArray(input.cues) || !input.cues.length || input.cues.length > 20_000) throw new MediaError('INVALID_CAPTIONS', 'captions require 1-20000 cues');
  let lastEnd = -1;
  const cues = input.cues.map((cue, index) => {
    if (!Number.isSafeInteger(cue.startMs) || !Number.isSafeInteger(cue.endMs) || cue.startMs < 0 || cue.endMs <= cue.startMs || cue.startMs < lastEnd || cue.endMs - cue.startMs > 60_000) throw new MediaError('INVALID_CUE_TIME', `caption cue ${index} has invalid timing`);
    const text = bounded(cue.text, `cue ${index} text`, 2000).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
    lastEnd = cue.endMs;
    return Object.freeze({ startMs: cue.startMs, endMs: cue.endMs, text });
  });
  return Object.freeze({ language, cues: Object.freeze(cues), cuesDigest: digest(cues), durationMs: lastEnd });
}

function timestamp(ms) {
  const hours = Math.floor(ms / 3_600_000); const minutes = Math.floor((ms % 3_600_000) / 60_000); const seconds = Math.floor((ms % 60_000) / 1000); const millis = ms % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

function toWebVtt(captions) {
  const valid = validateCaptions(captions);
  return `WEBVTT\n\n${valid.cues.map((cue, index) => `${index + 1}\n${timestamp(cue.startMs)} --> ${timestamp(cue.endMs)}\n${cue.text}`).join('\n\n')}\n`;
}

function createExport(input) {
  if (input.previewApproval?.status !== 'APPROVED') throw new MediaError('PREVIEW_APPROVAL_REQUIRED', 'export requires an approved preview', 409);
  if (!input.preset || !['mp3', 'wav', 'aac', 'mp4-h264', 'webm-vp9'].includes(input.preset.format)) throw new MediaError('INVALID_EXPORT_PRESET', 'export preset is unsupported');
  if (input.preset.accessible && !input.captionTrackIds?.length) throw new MediaError('CAPTIONS_REQUIRED', 'accessible export requires captions');
  return Object.freeze({ jobType: 'EXPORT', preset: structuredClone(input.preset), timelineVersionId: input.timelineVersionId, captionTrackIds: Object.freeze([...(input.captionTrackIds || [])]), approvalId: input.previewApproval.id });
}

function accessiblePlaybackManifest({ asset, captions = [], transcriptUrl }) {
  if (asset.state !== 'READY' || !asset.objectUri) throw new MediaError('ASSET_NOT_READY', 'playback asset is not ready', 409);
  return Object.freeze({
    src: asset.objectUri, type: asset.mimeType, durationMs: asset.durationMs, controls: true, keyboardAccessible: true,
    captions: Object.freeze(captions.filter((caption) => caption.validated).map((caption) => ({ src: caption.objectUri, srclang: caption.language, label: caption.label || caption.language, default: Boolean(caption.isDefault) }))),
    transcriptUrl: transcriptUrl || null, provenance: asset.provenance || null,
  });
}

class DurableQueueModel {
  constructor({ now = () => Date.now(), id = () => crypto.randomUUID() } = {}) { this.now = now; this.id = id; this.jobs = new Map(); this.keys = new Map(); }
  enqueue(input) {
    const key = `${input.businessId}:${bounded(input.idempotencyKey, 'idempotencyKey', 200)}`;
    if (this.keys.has(key)) return structuredClone(this.jobs.get(this.keys.get(key)));
    const job = { ...structuredClone(input), id: this.id(), status: 'QUEUED', attempt: 0, maxAttempts: input.maxAttempts || 3, availableAt: this.now(), leaseOwner: null, leaseUntil: null, providersTried: [] };
    this.jobs.set(job.id, job); this.keys.set(key, job.id); return structuredClone(job);
  }
  claim(workerId, leaseMs = 60_000) {
    const job = [...this.jobs.values()].find((item) => ['QUEUED', 'RETRY_WAIT'].includes(item.status) && item.availableAt <= this.now());
    if (!job) return null; job.status = 'RUNNING'; job.attempt += 1; job.leaseOwner = workerId; job.leaseUntil = this.now() + leaseMs; return structuredClone(job);
  }
  fail(id, workerId, failure) {
    const job = this.lease(id, workerId); const classified = classifyProviderFailure(failure); job.error = classified;
    job.status = classified.retryable && job.attempt < job.maxAttempts ? 'RETRY_WAIT' : classified.retryable ? 'DEAD_LETTER' : 'FAILED'; job.availableAt = this.now() + Math.min(300_000, 5_000 * 2 ** (job.attempt - 1)); job.leaseOwner = null; return structuredClone(job);
  }
  complete(id, workerId, data) { const job = this.lease(id, workerId); const next = transitionJob(job, 'SUCCEEDED', data); this.jobs.set(id, { ...next, leaseOwner: null, leaseUntil: null }); return structuredClone(this.jobs.get(id)); }
  cancel(businessId, id) { const job = this.jobs.get(id); if (!job || job.businessId !== businessId) throw new MediaError('NOT_FOUND', 'job not found', 404); if (!['QUEUED', 'RETRY_WAIT'].includes(job.status)) throw new MediaError('INVALID_JOB_STATE', 'only pending jobs can be cancelled', 409); job.status = 'CANCELLED'; return structuredClone(job); }
  lease(id, workerId) { const job = this.jobs.get(id); if (!job || job.status !== 'RUNNING' || job.leaseOwner !== workerId || job.leaseUntil < this.now()) throw new MediaError('LEASE_CONFLICT', 'active job lease required', 409, true); return job; }
}

module.exports = { MediaError, FORMATS, digest, validateUpload, objectKey, validateProbe, transitionJob, chooseProvider, classifyProviderFailure, validateTimeline, nextTimelineVersion, decidePreview, validateCaptions, toWebVtt, createExport, accessiblePlaybackManifest, DurableQueueModel };
