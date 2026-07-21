import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { Prisma } from '@prisma/client';

const { digest } = require('@/governance/media-pipeline.cjs');

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const job = await prisma.mediaPipelineJob.findFirst({ where: { id, businessId: user.businessId } });
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    return NextResponse.json({ job, attempts: await prisma.mediaJobAttempt.findMany({ where: { jobId: job.id }, orderBy: { attempt: 'desc' } }) });
  }
  return NextResponse.json({ jobs: await prisma.mediaPipelineJob.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: 'desc' }, take: 200 }) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const idempotencyKey = String(req.headers.get('idempotency-key') || '').trim();
  if (!idempotencyKey || idempotencyKey.length > 200) return NextResponse.json({ error: 'Idempotency-Key header is required' }, { status: 422 });
  const body = await req.json();
  if (!['TRANSCODE', 'RENDER', 'CAPTION', 'DUB'].includes(body.jobType)) return NextResponse.json({ error: 'Unsupported media job type' }, { status: 422 });
  const asset = await prisma.mediaAsset.findFirst({ where: { id: body.inputAssetId, businessId: user.businessId, state: 'READY' } });
  if (!asset) return NextResponse.json({ error: 'Ready input asset not found' }, { status: 404 });
  const requestDigest = digest({ jobType: body.jobType, inputAssetId: asset.id, preset: body.preset || {} });
  const existing = await prisma.mediaPipelineJob.findUnique({ where: { businessId_idempotencyKey: { businessId: user.businessId, idempotencyKey } } });
  if (existing && (existing.preset as any)?._requestDigest !== requestDigest) return NextResponse.json({ error: 'Idempotency-Key was already used for a different media job' }, { status: 409 });
  const job = existing || await prisma.mediaPipelineJob.create({ data: { businessId: user.businessId, inputAssetId: asset.id, jobType: body.jobType, preset: { ...(body.preset || {}), _requestDigest: requestDigest }, idempotencyKey } });
  return NextResponse.json({ job }, { status: 202 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json(); const action = new URL(req.url).searchParams.get('action');
  const job = await prisma.mediaPipelineJob.findFirst({ where: { id: body.id, businessId: user.businessId } });
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (action === 'cancel') {
    if (['QUEUED', 'RETRY_WAIT'].includes(job.status)) return NextResponse.json({ job: await prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'CANCELLED', cancelRequestedAt: new Date(), completedAt: new Date() } }) });
    if (['RUNNING', 'PROVIDER_PENDING'].includes(job.status)) return NextResponse.json({ job: await prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { cancelRequestedAt: new Date() } }) }, { status: 202 });
    return NextResponse.json({ error: 'Only pending or provider-running jobs can be cancelled' }, { status: 409 });
  }
  if (action === 'retry') {
    if (!['ADMIN', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Reviewer role required' }, { status: 403 });
    if (!['FAILED', 'DEAD_LETTER'].includes(job.status)) return NextResponse.json({ error: 'Only failed jobs can be retried' }, { status: 409 });
    return NextResponse.json({ job: await prisma.mediaPipelineJob.update({ where: { id: job.id }, data: { status: 'RETRY_WAIT', maxAttempts: Math.min(job.maxAttempts + 3, 20), providersTried: [], availableAt: new Date(), error: Prisma.DbNull, completedAt: null, cancelRequestedAt: null } }) });
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 422 });
}
