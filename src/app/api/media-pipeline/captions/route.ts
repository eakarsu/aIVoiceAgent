import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { writeGatewayObject } from '@/lib/media-gateway';

const { validateCaptions, toWebVtt, digest } = require('@/governance/media-pipeline.cjs');

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const assetId = new URL(req.url).searchParams.get('assetId'); if (!assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 422 });
  return NextResponse.json({ captions: await prisma.mediaCaptionTrack.findMany({ where: { businessId: user.businessId, assetId }, orderBy: [{ isDefault: 'desc' }, { language: 'asc' }] }) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const asset = await prisma.mediaAsset.findFirst({ where: { id: body.assetId, businessId: user.businessId, state: 'READY' } });
    if (!asset) return NextResponse.json({ error: 'Ready media asset not found' }, { status: 404 });
    const validated = validateCaptions({ language: body.language, cues: body.cues }); const vtt = toWebVtt(validated);
    if (Buffer.byteLength(vtt) > 5 * 1024 * 1024) return NextResponse.json({ error: 'Caption track exceeds 5 MiB' }, { status: 413 });
    const sha256 = digest(vtt); const objectKey = `${user.businessId}/captions/${asset.id}/${validated.language}-${sha256}.vtt`;
    const receipt = await writeGatewayObject({ objectKey, mimeType: 'text/vtt', bytesBase64: Buffer.from(vtt).toString('base64'), sha256 });
    const track = await prisma.$transaction(async (tx) => {
      if (body.isDefault) await tx.mediaCaptionTrack.updateMany({ where: { businessId: user.businessId, assetId: asset.id }, data: { isDefault: false } });
      return tx.mediaCaptionTrack.upsert({
        where: { assetId_language_format: { assetId: asset.id, language: validated.language, format: 'WEBVTT' } },
        create: { businessId: user.businessId, assetId: asset.id, language: validated.language, label: String(body.label || validated.language).slice(0, 100), objectUri: receipt.objectUri, cuesDigest: validated.cuesDigest, cueCount: validated.cues.length, validated: true, isDefault: Boolean(body.isDefault) },
        update: { label: String(body.label || validated.language).slice(0, 100), objectUri: receipt.objectUri, cuesDigest: validated.cuesDigest, cueCount: validated.cues.length, validated: true, isDefault: Boolean(body.isDefault) },
      });
    });
    return NextResponse.json({ track, storageReceiptId: receipt.receiptId }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message, code: error.code }, { status: error.status || 422 }); }
}
