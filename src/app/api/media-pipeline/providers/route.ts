import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/session';
import { decryptMediaSecret, encryptMediaSecret } from '@/lib/media-secrets';
import { requireProviderUrl } from '@/lib/media-network';

const capabilities = new Set(['TRANSCODE', 'RENDER', 'PREVIEW', 'EXPORT', 'CAPTION', 'DUB']);
function admin(user: any) { return user && ['ADMIN', 'MANAGER'].includes(user.role); }
function safe(provider: any) { const { configEncrypted: _secret, ...rest } = provider; return { ...rest, maxInputBytes: provider.maxInputBytes.toString(), configured: true }; }

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.mediaProvider.findMany({ where: { businessId: user.businessId }, orderBy: [{ priority: 'asc' }, { name: 'asc' }] });
  return NextResponse.json({ providers: rows.map(safe) });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!admin(user)) return NextResponse.json({ error: 'Administrator or manager role required' }, { status: 403 });
    const body = await req.json();
    requireProviderUrl(String(body.config?.baseUrl || ''));
    if (!String(body.name || '').trim() || !String(body.config?.token || '').trim()) throw new Error('provider name and bearer token are required');
    if (!Array.isArray(body.capabilities) || !body.capabilities.length || body.capabilities.some((item: string) => !capabilities.has(item))) throw new Error('valid provider capabilities are required');
    const maxInputBytes = Number(body.maxInputBytes); const dailyQuota = Number(body.dailyQuota);
    if (!Number.isSafeInteger(maxInputBytes) || maxInputBytes <= 0 || maxInputBytes > 2 * 1024 ** 3 || !Number.isInteger(dailyQuota) || dailyQuota <= 0 || dailyQuota > 1_000_000) throw new Error('provider limits are invalid');
    const provider = await prisma.mediaProvider.create({ data: { businessId: user!.businessId, name: String(body.name).trim().slice(0, 200), providerKind: String(body.providerKind || 'HTTP_MEDIA'), capabilities: body.capabilities, configEncrypted: encryptMediaSecret(body.config), priority: Number(body.priority || 100), costWeight: Number(body.costWeight || 1), maxInputBytes: BigInt(maxInputBytes), dailyQuota, status: 'INACTIVE' } });
    return NextResponse.json({ provider: safe(provider) }, { status: 201 });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Provider could not be created' }, { status: 422 }); }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!admin(user)) return NextResponse.json({ error: 'Administrator or manager role required' }, { status: 403 });
    const { id } = await req.json();
    const provider = await prisma.mediaProvider.findFirst({ where: { id, businessId: user!.businessId } });
    if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    const config = decryptMediaSecret<any>(provider.configEncrypted);
    const url = requireProviderUrl(new URL(config.healthPath || '/health', config.baseUrl).toString());
    const response = await fetch(url, { headers: { Authorization: `Bearer ${config.token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`provider health check returned HTTP ${response.status}`);
    await prisma.mediaProvider.update({ where: { id: provider.id }, data: { status: 'ACTIVE', lastError: null } });
    return NextResponse.json({ verified: true, status: response.status });
  } catch (error: any) { return NextResponse.json({ error: error.message || 'Provider verification failed' }, { status: 502 }); }
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!admin(user)) return NextResponse.json({ error: 'Administrator or manager role required' }, { status: 403 });
  const body = await req.json();
  const provider = await prisma.mediaProvider.findFirst({ where: { id: body.id, businessId: user!.businessId } });
  if (!provider) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
  const data: any = {};
  if (['ACTIVE', 'INACTIVE'].includes(body.status)) data.status = body.status;
  if (body.config) {
    try { requireProviderUrl(String(body.config.baseUrl || '')); }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Provider URL is invalid' }, { status: 422 }); }
    if (!String(body.config.token || '').trim()) return NextResponse.json({ error: 'Provider bearer token is required' }, { status: 422 });
    data.configEncrypted = encryptMediaSecret(body.config); data.status = 'INACTIVE';
  }
  if (Number.isInteger(body.priority)) data.priority = body.priority;
  const updated = await prisma.mediaProvider.update({ where: { id: provider.id }, data });
  return NextResponse.json({ provider: safe(updated) });
}
