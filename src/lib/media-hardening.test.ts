import test from 'node:test';
import assert from 'node:assert/strict';
import { BodyLimitError, readBoundedText } from './http-body';
import { requireObjectUrl, requireProviderUrl } from './media-network';
import { PrismaClient } from '@prisma/client';
import { processMediaJobs } from '../services/media-worker';

const databaseEnabled = Boolean(process.env.DATABASE_URL);

test('bounded reader accepts chunked UTF-8 under the limit', async () => {
  const request = new Request('https://callback.example.test', { method: 'POST', body: new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('{"ok":')); controller.enqueue(new TextEncoder().encode('true}')); controller.close(); } }), duplex: 'half' } as RequestInit & { duplex: string });
  assert.equal(await readBoundedText(request, 64), '{"ok":true}');
});

test('bounded reader cancels a chunked body over the limit', async () => {
  const request = new Request('https://callback.example.test', { method: 'POST', body: 'x'.repeat(65) });
  await assert.rejects(() => readBoundedText(request, 64), BodyLimitError);
});

test('provider URLs require HTTPS and an explicit host allowlist', () => {
  process.env.MEDIA_PROVIDER_HOST_ALLOWLIST = 'provider.example.test';
  assert.equal(requireProviderUrl('https://provider.example.test/v1/jobs').hostname, 'provider.example.test');
  assert.throws(() => requireProviderUrl('http://provider.example.test/v1/jobs'), /HTTPS/);
  assert.throws(() => requireProviderUrl('https://metadata.example.test/latest'), /allowlisted/);
});

test('object URLs reject embedded credentials and untrusted hosts', () => {
  process.env.MEDIA_OBJECT_HOST_ALLOWLIST = 'objects.example.test';
  assert.equal(requireObjectUrl('https://objects.example.test/tenant/object').protocol, 'https:');
  assert.throws(() => requireObjectUrl('https://token@objects.example.test/tenant/object'), /without embedded credentials/);
  assert.throws(() => requireObjectUrl('https://other.example.test/tenant/object'), /allowlisted/);
});

test('worker dead-letters a real database job instead of simulating a provider', { skip: !databaseEnabled }, async () => {
  const prisma = new PrismaClient();
  const suffix = crypto.randomUUID();
  const business = await prisma.business.create({ data: { name: 'Worker failure fixture', email: `worker-${suffix}@example.test` } });
  try {
    const asset = await prisma.mediaAsset.create({ data: { businessId: business.id, objectKey: `${business.id}/input.wav`, state: 'READY', kind: 'audio', originalFilename: 'input.wav', mimeType: 'audio/wav', sizeBytes: BigInt(100), sha256: 'c'.repeat(64), storageProvider: 'fixture', objectUri: 'https://objects.example.test/input.wav', durationMs: 1000, codec: 'pcm_s16le', provenance: { fixture: true } } });
    const job = await prisma.mediaPipelineJob.create({ data: { businessId: business.id, inputAssetId: asset.id, jobType: 'TRANSCODE', idempotencyKey: `worker-${suffix}`, providersTried: [], maxAttempts: 1 } });
    const totals = await processMediaJobs(prisma, 'database-failure-test');
    const persisted = await prisma.mediaPipelineJob.findUniqueOrThrow({ where: { id: job.id } });
    assert.equal(totals.failed, 1);
    assert.equal(persisted.status, 'DEAD_LETTER');
    assert.equal(persisted.outputAssetId, null);
    assert.equal(await prisma.mediaAsset.count({ where: { businessId: business.id } }), 1);
  } finally {
    const jobs = await prisma.mediaPipelineJob.findMany({ where: { businessId: business.id }, select: { id: true } });
    await prisma.mediaJobAttempt.deleteMany({ where: { jobId: { in: jobs.map(({ id }) => id) } } });
    await prisma.mediaPipelineJob.deleteMany({ where: { businessId: business.id } });
    await prisma.mediaAsset.deleteMany({ where: { businessId: business.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.$disconnect();
  }
});

test('worker converts an exhausted expired lease into durable dead letter state', { skip: !databaseEnabled }, async () => {
  const prisma = new PrismaClient();
  const suffix = crypto.randomUUID();
  const business = await prisma.business.create({ data: { name: 'Lease fixture', email: `lease-${suffix}@example.test` } });
  try {
    const job = await prisma.mediaPipelineJob.create({ data: { businessId: business.id, jobType: 'RENDER', idempotencyKey: `lease-${suffix}`, providersTried: [], status: 'RUNNING', attempt: 1, maxAttempts: 1, leaseOwner: 'crashed-worker', leaseExpiresAt: new Date(Date.now() - 1000) } });
    await processMediaJobs(prisma, 'lease-recovery-test');
    const persisted = await prisma.mediaPipelineJob.findUniqueOrThrow({ where: { id: job.id } });
    assert.equal(persisted.status, 'DEAD_LETTER');
    assert.equal((persisted.error as { code: string }).code, 'WORKER_LEASE_EXHAUSTED');
    assert.equal(persisted.leaseOwner, null);
  } finally {
    const jobs = await prisma.mediaPipelineJob.findMany({ where: { businessId: business.id }, select: { id: true } });
    await prisma.mediaJobAttempt.deleteMany({ where: { jobId: { in: jobs.map(({ id }) => id) } } });
    await prisma.mediaPipelineJob.deleteMany({ where: { businessId: business.id } });
    await prisma.business.delete({ where: { id: business.id } });
    await prisma.$disconnect();
  }
});
