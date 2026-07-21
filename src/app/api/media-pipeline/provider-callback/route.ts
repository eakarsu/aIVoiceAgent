import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { completeMediaJobInTransaction } from '@/services/media-worker';
import { BodyLimitError, readBoundedText } from '@/lib/http-body';

const { classifyProviderFailure, digest } = require('@/governance/media-pipeline.cjs');

function validSignature(raw: string, signature: string | null): boolean {
  const secret = process.env.MEDIA_PROVIDER_CALLBACK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
  const left = Buffer.from(expected); const right = Buffer.from(signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  let raw: string;
  try { raw = await readBoundedText(req, 128 * 1024); }
  catch (error) { return NextResponse.json({ error: error instanceof BodyLimitError ? error.message : 'Callback body is not valid UTF-8' }, { status: error instanceof BodyLimitError ? 413 : 400 }); }
  const signature = req.headers.get('x-media-provider-signature');
  if (!validSignature(raw, signature)) return NextResponse.json({ error: 'Invalid provider callback signature' }, { status: 401 });
  try {
    const body = JSON.parse(raw);
    if (!body.providerId || !body.providerJobId || !body.eventId || !body.status) return NextResponse.json({ error: 'Callback receipt is incomplete' }, { status: 422 });
    const provider = await prisma.mediaProvider.findUnique({ where: { id: String(body.providerId) } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    const job = await prisma.mediaPipelineJob.findFirst({ where: { providerId: provider.id, providerJobId: String(body.providerJobId), status: 'PROVIDER_PENDING' } });
    if (!job) return NextResponse.json({ processed: 0 });
    if (!['completed', 'failed'].includes(body.status)) return NextResponse.json({ error: 'Unsupported callback status' }, { status: 422 });
    const eventData = { providerId: provider.id, eventId: String(body.eventId), providerJobId: String(body.providerJobId), eventType: String(body.status), payloadDigest: digest(body), signatureDigest: digest(signature || ''), mediaJobId: job.id };
    if (body.status === 'completed') {
      const attempt = await prisma.mediaJobAttempt.findUniqueOrThrow({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } } });
      await prisma.$transaction(async (tx) => {
        const event = await tx.mediaProviderEvent.create({ data: eventData });
        await completeMediaJobInTransaction(tx, job, provider, body.output, { providerJobId: body.providerJobId, requestDigest: attempt.requestDigest, acceptedAt: body.acceptedAt, completedAt: body.completedAt || new Date().toISOString() });
        await tx.mediaProviderEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
      });
    } else if (body.status === 'failed') {
      const failure = classifyProviderFailure(body.error || { message: 'provider reported failure' });
      const status = failure.retryable && job.attempt < job.maxAttempts ? 'RETRY_WAIT' : failure.retryable ? 'DEAD_LETTER' : 'FAILED';
      await prisma.$transaction(async (tx) => {
        const event = await tx.mediaProviderEvent.create({ data: eventData });
        const locked = await tx.$queryRawUnsafe<Array<{ status: string }>>(`SELECT status FROM "MediaPipelineJob" WHERE id = $1 FOR UPDATE`, job.id);
        if (locked[0]?.status !== 'PROVIDER_PENDING') throw new Error('media job is no longer eligible for failure processing');
        await tx.mediaPipelineJob.update({ where: { id: job.id }, data: { status, error: failure, availableAt: new Date(), completedAt: status === 'RETRY_WAIT' ? null : new Date(), providersTried: { push: provider.id } } });
        await tx.mediaJobAttempt.update({ where: { jobId_attempt: { jobId: job.id, attempt: job.attempt } }, data: { status: 'FAILED', errorCode: failure.code, retryable: failure.retryable, completedAt: new Date() } });
        await tx.mediaProviderEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
      });
    }
    return NextResponse.json({ processed: 1 });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ processed: 0, duplicate: true });
    console.error('[media-provider-callback]', error);
    return NextResponse.json({ error: 'Provider callback processing failed' }, { status: 500 });
  }
}
