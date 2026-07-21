'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const enabled = Boolean(process.env.DATABASE_URL);
let prisma;
let fixture;

test.before(async () => {
  if (!enabled) return;
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient();
  const suffix = crypto.randomUUID();
  const businesses = await Promise.all(['one', 'two'].map((name) => prisma.business.create({
    data: { name: `Media tenant ${name}`, email: `media-${name}-${suffix}@example.test` },
  })));
  fixture = { suffix, businesses };
});

test.after(async () => {
  if (!prisma || !fixture) return;
  const businessIds = fixture.businesses.map(({ id }) => id);
  const providers = await prisma.mediaProvider.findMany({ where: { businessId: { in: businessIds } }, select: { id: true } });
  await prisma.mediaProviderEvent.deleteMany({ where: { providerId: { in: providers.map(({ id }) => id) } } });
  for (const model of ['mediaJobAttempt', 'mediaPipelineJob', 'mediaPreviewApproval', 'mediaCaptionTrack', 'mediaTimelineVersion', 'mediaTimeline', 'mediaUploadSession', 'mediaExportPreset', 'mediaAsset', 'mediaProvider']) {
    await prisma[model].deleteMany({ where: model === 'mediaJobAttempt' ? { jobId: { startsWith: `fixture-${fixture.suffix}` } } : { businessId: { in: businessIds } } }).catch(() => undefined);
  }
  await prisma.business.deleteMany({ where: { id: { in: businessIds } } });
  await prisma.$disconnect();
});

function readyAsset(businessId, suffix, label) {
  return prisma.mediaAsset.create({ data: {
    businessId,
    objectKey: `${businessId}/${label}-${suffix}.wav`,
    state: 'READY',
    kind: 'audio',
    originalFilename: `${label}.wav`,
    mimeType: 'audio/wav',
    sizeBytes: 1024n,
    sha256: crypto.createHash('sha256').update(`${suffix}:${label}`).digest('hex'),
    storageProvider: 'fixture-gateway',
    objectUri: `https://objects.example.test/${businessId}/${label}.wav`,
    durationMs: 2_000,
    codec: 'pcm_s16le',
    probeMetadata: { sampleRate: 48_000, channels: 1 },
    provenance: { fixture: true },
  } });
}

test('database upload sessions are tenant-scoped and idempotent', { skip: !enabled }, async () => {
  const [one, two] = fixture.businesses;
  const [oneAsset, twoAsset] = await Promise.all([
    readyAsset(one.id, fixture.suffix, 'upload'),
    readyAsset(two.id, fixture.suffix, 'upload'),
  ]);
  const idempotencyKey = `upload-${fixture.suffix}`;
  const create = {
    businessId: one.id,
    assetId: oneAsset.id,
    idempotencyKey,
    gatewayTicketId: `ticket-${fixture.suffix}`,
    expiresAt: new Date(Date.now() + 60_000),
  };
  const first = await prisma.mediaUploadSession.upsert({ where: { businessId_idempotencyKey: { businessId: one.id, idempotencyKey } }, create, update: {} });
  const replay = await prisma.mediaUploadSession.upsert({ where: { businessId_idempotencyKey: { businessId: one.id, idempotencyKey } }, create: { ...create, gatewayTicketId: `other-${fixture.suffix}` }, update: {} });
  const tenantTwo = await prisma.mediaUploadSession.create({ data: { ...create, businessId: two.id, assetId: twoAsset.id, gatewayTicketId: `ticket-two-${fixture.suffix}` } });
  assert.equal(first.id, replay.id);
  assert.notEqual(first.id, tenantTwo.id);
});

test('timeline versions, preview evidence, captions, and export jobs persist together', { skip: !enabled }, async () => {
  const businessId = fixture.businesses[0].id;
  const source = await readyAsset(businessId, fixture.suffix, 'source');
  const preview = await readyAsset(businessId, fixture.suffix, 'preview');
  const timeline = await prisma.mediaTimeline.create({ data: { businessId, name: 'Database journey', slug: `journey-${fixture.suffix}`, currentVersion: 1, createdBy: 'fixture-user' } });
  const version = await prisma.mediaTimelineVersion.create({ data: {
    businessId,
    timelineId: timeline.id,
    version: 1,
    editDecisionList: { tracks: [{ type: 'audio', clips: [{ id: 'clip-1', assetId: source.id, startMs: 0, sourceStartMs: 0, durationMs: 1_000 }] }] },
    durationMs: 1_000,
    checksum: crypto.createHash('sha256').update(fixture.suffix).digest('hex'),
    createdBy: 'fixture-user',
  } });
  const approval = await prisma.mediaPreviewApproval.create({ data: { businessId, timelineVersionId: version.id, previewAssetId: preview.id, requestedBy: 'fixture-user' } });
  const caption = await prisma.mediaCaptionTrack.create({ data: { businessId, assetId: preview.id, language: 'en-US', label: 'English', objectUri: `https://objects.example.test/${businessId}/captions.vtt`, cuesDigest: crypto.createHash('sha256').update('WEBVTT').digest('hex'), cueCount: 1, validated: true, isDefault: true } });
  const preset = await prisma.mediaExportPreset.create({ data: { businessId, name: `Accessible MP3 ${fixture.suffix}`, format: 'mp3', config: { bitrateKbps: 192 }, accessible: true } });
  const approved = await prisma.mediaPreviewApproval.update({ where: { id: approval.id }, data: { status: 'APPROVED', reviewedBy: 'fixture-reviewer', decidedAt: new Date() } });
  const idempotencyKey = `export-${fixture.suffix}`;
  const job = await prisma.mediaPipelineJob.upsert({
    where: { businessId_idempotencyKey: { businessId, idempotencyKey } },
    create: { id: `fixture-${fixture.suffix}`, businessId, timelineVersionId: version.id, previewApprovalId: approval.id, jobType: 'EXPORT', preset: { presetId: preset.id, captionTrackIds: [caption.id] }, idempotencyKey, providersTried: [] },
    update: {},
  });
  const replay = await prisma.mediaPipelineJob.upsert({ where: { businessId_idempotencyKey: { businessId, idempotencyKey } }, create: { businessId, jobType: 'EXPORT', idempotencyKey, providersTried: [] }, update: {} });
  assert.equal(approved.status, 'APPROVED');
  assert.equal(caption.validated, true);
  assert.equal(job.id, replay.id);
});

test('provider callback receipts are deduplicated durably', { skip: !enabled }, async () => {
  const businessId = fixture.businesses[0].id;
  const provider = await prisma.mediaProvider.create({ data: { businessId, name: `Fixture provider ${fixture.suffix}`, providerKind: 'MEDIA', capabilities: ['TRANSCODE'], configEncrypted: 'fixture-never-decrypted', status: 'ACTIVE', maxInputBytes: 10_000n, dailyQuota: 10 } });
  const data = { providerId: provider.id, eventId: `event-${fixture.suffix}`, providerJobId: `provider-job-${fixture.suffix}`, eventType: 'completed', payloadDigest: 'a'.repeat(64), signatureDigest: 'b'.repeat(64) };
  await prisma.mediaProviderEvent.create({ data });
  await assert.rejects(() => prisma.mediaProviderEvent.create({ data }), (error) => error?.code === 'P2002');
});
