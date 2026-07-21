import crypto from 'node:crypto';
import { Prisma, PrismaClient } from '@prisma/client';
import { decryptMediaSecret } from '../lib/media-secrets';
import { requireObjectUrl, requireProviderUrl } from '../lib/media-network';

const { chooseProvider, classifyProviderFailure, validateUpload, validateProbe, digest } = require('../governance/media-pipeline.cjs');
type ProviderConfig = { baseUrl: string; token: string; startPath?: string; cancelPath?: string };

function providerUrl(config: ProviderConfig, pathName: string): string {
  return requireProviderUrl(new URL(pathName, config.baseUrl).toString()).toString();
}

async function providerRequest(config: ProviderConfig, pathName: string, body: unknown): Promise<any> {
  const response = await fetch(providerUrl(config, pathName), {
    method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw Object.assign(new Error(`provider returned HTTP ${response.status}`), { status: response.status, retryable: response.status === 429 || response.status >= 500 });
  return response.json();
}

async function claim(prisma: PrismaClient, workerId: string): Promise<any | null> {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe<Array<{ id: string; status: string; attempt: number }>>(`SELECT id, status, attempt FROM "MediaPipelineJob" WHERE ((status IN ('QUEUED','RETRY_WAIT') AND "availableAt" <= (clock_timestamp() AT TIME ZONE 'UTC')) OR (status = 'RUNNING' AND attempt < "maxAttempts" AND "leaseExpiresAt" <= (clock_timestamp() AT TIME ZONE 'UTC'))) AND "cancelRequestedAt" IS NULL ORDER BY "createdAt" FOR UPDATE SKIP LOCKED LIMIT 1`);
    if (!rows[0]) return null;
    if (rows[0].status === 'RUNNING' && rows[0].attempt > 0) await tx.mediaJobAttempt.updateMany({ where: { jobId: rows[0].id, attempt: rows[0].attempt, completedAt: null }, data: { status: 'FAILED', errorCode: 'WORKER_LEASE_EXPIRED', retryable: true, completedAt: new Date() } });
    await tx.mediaPipelineJob.update({ where: { id: rows[0].id }, data: { status: 'RUNNING', attempt: { increment: 1 }, leaseOwner: workerId, leaseExpiresAt: new Date(Date.now() + 120_000) } });
    return tx.mediaPipelineJob.findUnique({ where: { id: rows[0].id } });
  });
}

export async function completeMediaJobInTransaction(tx: Prisma.TransactionClient, job: any, provider: any, output: any, providerReceipt: any) {
  if (!output?.objectUri || !output?.mimeType || !output?.filename || !output?.sizeBytes || !output?.sha256 || !providerReceipt?.providerJobId) throw new Error('provider completion is missing output integrity metadata or receipt');
  const objectUri = requireObjectUrl(String(output.objectUri)).toString();
  const objectKey = String(output.objectKey || `${job.businessId}/outputs/${job.id}/${output.filename}`);
  if (!objectKey.startsWith(`${job.businessId}/`)) throw new Error('provider output object key is outside the tenant prefix');
  const declared = validateUpload(output);
  const probe = validateProbe(declared, output.probe);
  const locked = await tx.$queryRawUnsafe<Array<{ status: string }>>(`SELECT status FROM "MediaPipelineJob" WHERE id = $1 FOR UPDATE`, job.id);
  if (!locked[0] || !['RUNNING', 'PROVIDER_PENDING'].includes(locked[0].status)) throw new Error('media job is no longer eligible for completion');
  const outputAsset = await tx.mediaAsset.create({ data: {
    businessId: job.businessId, objectKey, state: 'READY', kind: declared.kind,
    originalFilename: declared.filename, mimeType: declared.mimeType, sizeBytes: BigInt(declared.sizeBytes), sha256: declared.sha256,
    storageProvider: provider.name, objectUri, durationMs: probe.durationMs, codec: probe.codec, probeMetadata: probe,
    provenance: { sourceAssetId: job.inputAssetId, timelineVersionId: job.timelineVersionId, jobId: job.id, providerId: provider.id, providerJobId: providerReceipt.providerJobId, requestDigest: providerReceipt.requestDigest, completedAt: new Date().toISOString() },
  } });
  await tx.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'SUCCEEDED', outputAssetId: outputAsset.id, providerId: provider.id, providerJobId: providerReceipt.providerJobId, providerReceipt, completedAt: new Date(), leaseOwner: null, leaseExpiresAt: null } });
  await tx.mediaJobAttempt.update({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } }, data: { status: 'SUCCEEDED', providerJobId: providerReceipt.providerJobId, completedAt: new Date() } });
  if (job.jobType === 'PREVIEW' && job.timelineVersionId) await tx.mediaPreviewApproval.create({ data: { businessId: job.businessId, timelineVersionId: job.timelineVersionId, previewAssetId: outputAsset.id, requestedBy: String((job.preset as any)?.requestedBy || 'system') } });
  return outputAsset;
}

export async function completeMediaJob(prisma: PrismaClient, job: any, provider: any, output: any, providerReceipt: any) {
  return prisma.$transaction((tx) => completeMediaJobInTransaction(tx, job, provider, output, providerReceipt));
}

async function processCancellations(prisma: PrismaClient) {
  const jobs = await prisma.mediaPipelineJob.findMany({ where: { status: 'PROVIDER_PENDING', cancelRequestedAt: { not: null } }, take: 20 });
  let cancelled = 0;
  for (const job of jobs) {
    const provider = job.providerId ? await prisma.mediaProvider.findUnique({ where: { id: job.providerId } }) : null;
    if (!provider || !job.providerJobId) continue;
    try {
      const config = decryptMediaSecret<ProviderConfig>(provider.configEncrypted);
      const receipt = await providerRequest(config, config.cancelPath || `/v1/jobs/${encodeURIComponent(job.providerJobId)}/cancel`, { providerJobId: job.providerJobId, jobId: job.id });
      if (!receipt.cancelled) throw new Error('provider did not confirm cancellation');
      await prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'CANCELLED', providerReceipt: { cancellation: receipt }, completedAt: new Date() } });
      cancelled += 1;
    } catch (error) { console.error('[media-worker] cancellation failed', job.id, error); }
  }
  return cancelled;
}

async function recoverExhaustedLeases(prisma: PrismaClient) {
  return prisma.$executeRawUnsafe(`UPDATE "MediaPipelineJob" SET status = 'DEAD_LETTER', error = jsonb_build_object('code','WORKER_LEASE_EXHAUSTED','message','worker lease expired after the maximum attempts','retryable',true), "completedAt" = clock_timestamp(), "leaseOwner" = NULL, "leaseExpiresAt" = NULL, "updatedAt" = clock_timestamp() WHERE status = 'RUNNING' AND "leaseExpiresAt" <= (clock_timestamp() AT TIME ZONE 'UTC') AND attempt >= "maxAttempts"`);
}

export async function processMediaJobs(prisma: PrismaClient, workerId = `media-${process.pid}`) {
  const exhausted = await recoverExhaustedLeases(prisma);
  const totals = { processed: 0, succeeded: 0, pending: 0, retried: 0, failed: exhausted, cancelled: await processCancellations(prisma) };
  for (let count = 0; count < 20; count += 1) {
    const job = await claim(prisma, workerId);
    if (!job) break;
    totals.processed += 1;
    let provider: any = null;
    try {
      const inputAsset = job.inputAssetId ? await prisma.mediaAsset.findFirst({ where: { id: job.inputAssetId, businessId: job.businessId, state: 'READY' } }) : null;
      const timelineVersion = job.timelineVersionId ? await prisma.mediaTimelineVersion.findFirst({ where: { id: job.timelineVersionId, businessId: job.businessId } }) : null;
      if (!inputAsset && !timelineVersion) throw Object.assign(new Error('job input asset or timeline version is unavailable'), { code: 'INPUT_NOT_READY' });
      const candidates = await prisma.mediaProvider.findMany({ where: { businessId: job.businessId, status: 'ACTIVE' } });
      provider = chooseProvider(candidates.map((item) => ({ ...item, maxInputBytes: Number(item.maxInputBytes) })), { jobType: job.jobType, inputBytes: inputAsset ? Number(inputAsset.sizeBytes) : Number((job.preset as any)?.estimatedInputBytes || 0), providersTried: job.providersTried });
      const config = decryptMediaSecret<ProviderConfig>(provider.configEncrypted);
      const appPublicUrl = process.env.APP_PUBLIC_URL;
      if (!appPublicUrl || new URL(appPublicUrl).protocol !== 'https:') throw Object.assign(new Error('APP_PUBLIC_URL must be a public HTTPS URL'), { code: 'CALLBACK_URL_INVALID' });
      const request = { jobId: job.id, jobType: job.jobType, input: inputAsset ? { objectUri: inputAsset.objectUri, mimeType: inputAsset.mimeType, sha256: inputAsset.sha256, sizeBytes: Number(inputAsset.sizeBytes) } : null, timeline: timelineVersion?.editDecisionList || null, preset: job.preset, callbackUrl: `${appPublicUrl.replace(/\/$/, '')}/api/media-pipeline/provider-callback` };
      const requestDigest = digest(request);
      await prisma.mediaJobAttempt.create({ data: { jobId: job.id, attempt: job.attempt, providerId: provider.id, requestDigest, status: 'STARTED' } });
      const cancellation = await prisma.mediaPipelineJob.findUnique({ where: { id: job.id }, select: { cancelRequestedAt: true } });
      if (cancellation?.cancelRequestedAt) {
        await prisma.$transaction([
          prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'CANCELLED', completedAt: new Date(), leaseOwner: null, leaseExpiresAt: null } }),
          prisma.mediaJobAttempt.update({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } }, data: { status: 'CANCELLED', completedAt: new Date() } }),
        ]);
        totals.cancelled += 1;
        continue;
      }
      const usageDate = new Date().toISOString().slice(0, 10);
      const reserved = await prisma.$queryRawUnsafe<Array<{ id: string }>>(`UPDATE "MediaProvider" SET "usageDate" = $2, "usedToday" = CASE WHEN "usageDate" = $2 THEN "usedToday" + 1 ELSE 1 END, "updatedAt" = clock_timestamp() WHERE id = $1 AND status = 'ACTIVE' AND ("usageDate" IS DISTINCT FROM $2 OR "usedToday" < "dailyQuota") RETURNING id`, provider.id, usageDate);
      if (!reserved.length) throw Object.assign(new Error('provider daily quota was exhausted concurrently'), { code: 'QUOTA_EXCEEDED', retryable: true });
      const receipt = await providerRequest(config, config.startPath || '/v1/jobs', request);
      if (!receipt.providerJobId) throw Object.assign(new Error('provider did not return a job receipt'), { code: 'PROVIDER_RECEIPT_MISSING', retryable: true });
      await prisma.mediaProvider.update({ where: { id: provider.id }, data: { lastError: null } });
      if (receipt.status === 'completed') {
        await completeMediaJob(prisma, job, provider, receipt.output, { providerJobId: receipt.providerJobId, requestDigest, acceptedAt: receipt.acceptedAt || new Date().toISOString() }); totals.succeeded += 1;
      } else {
        await prisma.$transaction([
          prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'PROVIDER_PENDING', providerId: provider.id, providerJobId: receipt.providerJobId, providerReceipt: { acceptedAt: receipt.acceptedAt || new Date().toISOString() }, providersTried: { push: provider.id }, leaseOwner: null, leaseExpiresAt: null } }),
          prisma.mediaJobAttempt.update({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } }, data: { status: 'PROVIDER_PENDING', providerJobId: receipt.providerJobId } }),
        ]); totals.pending += 1;
      }
    } catch (rawError: any) {
      const failure = classifyProviderFailure(rawError); const tried = provider ? [...job.providersTried, provider.id] : job.providersTried;
      const status = failure.retryable && job.attempt < job.maxAttempts ? 'RETRY_WAIT' : failure.retryable ? 'DEAD_LETTER' : 'FAILED';
      const attempt = await prisma.mediaJobAttempt.findUnique({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } } });
      await prisma.$transaction([
        prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status, providersTried: tried, error: failure, availableAt: new Date(Date.now() + (failure.failover ? 0 : Math.min(300_000, 5_000 * 2 ** (job.attempt - 1)))), leaseOwner: null, leaseExpiresAt: null, completedAt: ['FAILED', 'DEAD_LETTER'].includes(status) ? new Date() : null } }),
        ...(attempt ? [prisma.mediaJobAttempt.update({ where: { id: attempt.id }, data: { status: 'FAILED', errorCode: failure.code, retryable: failure.retryable, completedAt: new Date() } })] : []),
        ...(provider ? [prisma.mediaProvider.update({ where: { id: provider.id }, data: { lastError: failure.message } })] : []),
      ]);
      if (status === 'RETRY_WAIT') totals.retried += 1; else totals.failed += 1;
    }
  }
  return totals;
}
