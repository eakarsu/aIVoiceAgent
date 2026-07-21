import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const { nextTimelineVersion, decidePreview, createExport, digest } = require('@/governance/media-pipeline.cjs');

async function assetDurations(businessId: string, edl: any) {
  const ids = [...new Set((edl?.tracks || []).flatMap((track: any) => (track.clips || []).map((clip: any) => clip.assetId)))].filter(Boolean) as string[];
  const assets = await prisma.mediaAsset.findMany({ where: { id: { in: ids }, businessId, state: 'READY' } });
  if (assets.length !== ids.length) throw Object.assign(new Error('timeline references unavailable or cross-tenant assets'), { code: 'ASSET_NOT_READY' });
  return Object.fromEntries(assets.map((asset) => [asset.id, asset.durationMs]));
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const timeline = await prisma.mediaTimeline.findFirst({ where: { id, businessId: user.businessId } });
    if (!timeline) return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
    const [versions, approvals, jobs] = await Promise.all([
      prisma.mediaTimelineVersion.findMany({ where: { timelineId: id, businessId: user.businessId }, orderBy: { version: 'desc' } }),
      prisma.mediaPreviewApproval.findMany({ where: { businessId: user.businessId, timelineVersionId: { in: (await prisma.mediaTimelineVersion.findMany({ where: { timelineId: id }, select: { id: true } })).map((item) => item.id) } }, orderBy: { requestedAt: 'desc' } }),
      prisma.mediaPipelineJob.findMany({ where: { businessId: user.businessId, timelineVersionId: { not: null } }, orderBy: { createdAt: 'desc' }, take: 100 }),
    ]);
    return NextResponse.json({ timeline, versions, approvals, jobs: jobs.filter((job) => versions.some((version) => version.id === job.timelineVersionId)) });
  }
  return NextResponse.json({ timelines: await prisma.mediaTimeline.findMany({ where: { businessId: user.businessId }, orderBy: { updatedAt: 'desc' }, take: 100 }) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json(); const action = new URL(req.url).searchParams.get('action') || 'create';
    if (action === 'create') {
      const name = String(body.name || '').trim(); const slug = String(body.slug || '').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!name || name.length > 200 || !slug) throw new Error('name and slug are required');
      const version = nextTimelineVersion(null, body.editDecisionList, await assetDurations(user.businessId, body.editDecisionList));
      const timelineId = crypto.randomUUID();
      const [timeline, createdVersion] = await prisma.$transaction([
        prisma.mediaTimeline.create({ data: { id: timelineId, businessId: user.businessId, name, slug, currentVersion: 1, createdBy: user.id } }),
        prisma.mediaTimelineVersion.create({ data: { businessId: user.businessId, timelineId, version: 1, editDecisionList: version.tracks, durationMs: version.durationMs, checksum: version.checksum, createdBy: user.id, changeNote: body.changeNote || 'Initial version' } }),
      ]);
      return NextResponse.json({ timeline, version: createdVersion }, { status: 201 });
    }
    if (action === 'new-version') {
      const timeline = await prisma.mediaTimeline.findFirst({ where: { id: body.timelineId, businessId: user.businessId } });
      if (!timeline) return NextResponse.json({ error: 'Timeline not found' }, { status: 404 });
      const previous = await prisma.mediaTimelineVersion.findUnique({ where: { timelineId_version: { timelineId: timeline.id, version: timeline.currentVersion } } });
      const version = nextTimelineVersion(previous, body.editDecisionList, await assetDurations(user.businessId, body.editDecisionList));
      const created = await prisma.$transaction(async (tx) => {
        const changed = await tx.mediaTimeline.updateMany({ where: { id: timeline.id, currentVersion: timeline.currentVersion }, data: { currentVersion: version.version, state: 'DRAFT' } });
        if (!changed.count) throw Object.assign(new Error('timeline changed concurrently'), { status: 409 });
        return tx.mediaTimelineVersion.create({ data: { businessId: user.businessId, timelineId: timeline.id, version: version.version, editDecisionList: version.tracks, durationMs: version.durationMs, checksum: version.checksum, createdBy: user.id, changeNote: String(body.changeNote || '').slice(0, 500) || null } });
      });
      return NextResponse.json({ version: created }, { status: 201 });
    }
    if (action === 'request-preview') {
      const version = await prisma.mediaTimelineVersion.findFirst({ where: { id: body.timelineVersionId, businessId: user.businessId } });
      if (!version) return NextResponse.json({ error: 'Timeline version not found' }, { status: 404 });
      const key = String(req.headers.get('idempotency-key') || '').trim(); if (!key || key.length > 200) return NextResponse.json({ error: 'A bounded Idempotency-Key header is required' }, { status: 422 });
      const previewSpec = { format: body.format || 'mp4-h264', requestedBy: user.id, estimatedInputBytes: body.estimatedInputBytes || 0 };
      const requestDigest = digest({ timelineVersionId: version.id, previewSpec });
      const existing = await prisma.mediaPipelineJob.findUnique({ where: { businessId_idempotencyKey: { businessId: user.businessId, idempotencyKey: key } } });
      if (existing && (existing.preset as any)?._requestDigest !== requestDigest) return NextResponse.json({ error: 'Idempotency-Key was already used for a different preview' }, { status: 409 });
      const job = existing || await prisma.mediaPipelineJob.create({ data: { businessId: user.businessId, timelineVersionId: version.id, jobType: 'PREVIEW', idempotencyKey: key, preset: { ...previewSpec, _requestDigest: requestDigest } } });
      return NextResponse.json({ job }, { status: 202 });
    }
    if (action === 'decide-preview') {
      if (!['ADMIN', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Reviewer role required' }, { status: 403 });
      const approval = await prisma.mediaPreviewApproval.findFirst({ where: { id: body.approvalId, businessId: user.businessId } });
      if (!approval) return NextResponse.json({ error: 'Approval not found' }, { status: 404 });
      const decided = decidePreview(approval, { decision: body.decision, comment: body.comment, reviewedBy: user.id });
      const changed = await prisma.mediaPreviewApproval.updateMany({ where: { id: approval.id, status: 'PENDING' }, data: { status: decided.status, reviewedBy: user.id, comment: decided.comment, decidedAt: new Date(decided.decidedAt) } });
      if (!changed.count) return NextResponse.json({ error: 'Approval was already decided' }, { status: 409 });
      const updated = await prisma.mediaPreviewApproval.findUniqueOrThrow({ where: { id: approval.id } });
      return NextResponse.json({ approval: updated });
    }
    if (action === 'request-export') {
      const version = await prisma.mediaTimelineVersion.findFirst({ where: { id: body.timelineVersionId, businessId: user.businessId } });
      const approval = await prisma.mediaPreviewApproval.findFirst({ where: { id: body.approvalId, businessId: user.businessId, timelineVersionId: version?.id, status: 'APPROVED' } });
      const preset = await prisma.mediaExportPreset.findFirst({ where: { id: body.presetId, businessId: user.businessId, isActive: true } });
      if (!version || !approval || !preset) return NextResponse.json({ error: 'Approved preview, timeline version, and active preset are required' }, { status: 422 });
      const captionIds = Array.isArray(body.captionTrackIds) ? body.captionTrackIds : [];
      const captions = await prisma.mediaCaptionTrack.count({ where: { id: { in: captionIds }, businessId: user.businessId, assetId: approval.previewAssetId, validated: true } });
      if (captions !== captionIds.length) return NextResponse.json({ error: 'Caption tracks are invalid or cross-tenant' }, { status: 422 });
      const spec = createExport({ timelineVersionId: version.id, previewApproval: approval, preset: { ...(preset.config as object), format: preset.format, accessible: preset.accessible }, captionTrackIds: captionIds });
      const key = String(req.headers.get('idempotency-key') || '').trim(); if (!key || key.length > 200) return NextResponse.json({ error: 'A bounded Idempotency-Key header is required' }, { status: 422 });
      const requestDigest = digest(spec);
      const existing = await prisma.mediaPipelineJob.findUnique({ where: { businessId_idempotencyKey: { businessId: user.businessId, idempotencyKey: key } } });
      if (existing && (existing.preset as any)?._requestDigest !== requestDigest) return NextResponse.json({ error: 'Idempotency-Key was already used for a different export' }, { status: 409 });
      const job = existing || await prisma.mediaPipelineJob.create({ data: { businessId: user.businessId, timelineVersionId: version.id, previewApprovalId: approval.id, jobType: 'EXPORT', idempotencyKey: key, preset: { ...spec, _requestDigest: requestDigest } } });
      return NextResponse.json({ job }, { status: 202 });
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 422 });
  } catch (error: any) { return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 422 }); }
}
