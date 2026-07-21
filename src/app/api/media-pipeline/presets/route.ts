import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';

const formats = new Set(['mp3', 'wav', 'aac', 'mp4-h264', 'webm-vp9']);
export async function GET() {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json({ presets: await prisma.mediaExportPreset.findMany({ where: { businessId: user.businessId, isActive: true }, orderBy: { name: 'asc' } }) });
}
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!['ADMIN', 'MANAGER'].includes(user.role)) return NextResponse.json({ error: 'Administrator or manager role required' }, { status: 403 });
  const body = await req.json();
  if (!String(body.name || '').trim() || !formats.has(body.format) || !body.config || typeof body.config !== 'object' || Array.isArray(body.config)) return NextResponse.json({ error: 'name, supported format, and config are required' }, { status: 422 });
  const preset = await prisma.mediaExportPreset.create({ data: { businessId: user.businessId, name: String(body.name).trim().slice(0, 100), format: body.format, config: body.config, accessible: body.accessible !== false, captionsBurned: Boolean(body.captionsBurned) } });
  return NextResponse.json({ preset }, { status: 201 });
}
