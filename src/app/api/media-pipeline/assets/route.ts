import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const { accessiblePlaybackManifest } = require('@/governance/media-pipeline.cjs');
function safe(asset: any) { return { ...asset, sizeBytes: asset.sizeBytes.toString() }; }

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const url = new URL(req.url); const id = url.searchParams.get('id');
    if (id) {
      const asset = await prisma.mediaAsset.findFirst({ where: { id, businessId: user.businessId } });
      if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      if (url.searchParams.get('view') === 'playback') {
        const captions = await prisma.mediaCaptionTrack.findMany({ where: { businessId: user.businessId, assetId: asset.id, validated: true } });
        return NextResponse.json({ asset: safe(asset), playback: accessiblePlaybackManifest({ asset, captions, transcriptUrl: captions.length ? `/api/media-pipeline/captions?assetId=${encodeURIComponent(asset.id)}` : null }) });
      }
      return NextResponse.json({ asset: safe(asset) });
    }
    const assets = await prisma.mediaAsset.findMany({ where: { businessId: user.businessId }, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ assets: assets.map(safe) });
  } catch (error: any) { return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 422 }); }
}
