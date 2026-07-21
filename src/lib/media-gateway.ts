import crypto from 'node:crypto';
import { requireObjectUrl } from './media-network';

type GatewayConfig = { baseUrl: string; token: string };

function gatewayConfig(): GatewayConfig {
  const baseUrl = process.env.MEDIA_OBJECT_GATEWAY_URL;
  const token = process.env.MEDIA_OBJECT_GATEWAY_TOKEN;
  if (!baseUrl || !token) throw new Error('MEDIA_OBJECT_GATEWAY_URL and MEDIA_OBJECT_GATEWAY_TOKEN are required');
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:') throw new Error('media object gateway must use HTTPS');
  return { baseUrl: url.toString().replace(/\/$/, ''), token };
}

async function gateway(path: string, init: RequestInit): Promise<any> {
  const config = gatewayConfig();
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    signal: AbortSignal.timeout(20_000),
    headers: { Accept: 'application/json', Authorization: `Bearer ${config.token}`, ...init.headers },
  });
  if (!response.ok) throw Object.assign(new Error(`media object gateway returned HTTP ${response.status}`), { status: response.status, retryable: response.status === 429 || response.status >= 500 });
  return response.json();
}

export async function createGatewayUpload(input: { objectKey: string; mimeType: string; sizeBytes: number; sha256: string; callbackUrl: string }) {
  const body = await gateway('/v1/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!body.uploadUrl || !body.objectUri || !body.expiresAt || !body.ticketId) throw new Error('media object gateway response is incomplete');
  const uploadUrl = requireObjectUrl(String(body.uploadUrl)).toString();
  const objectUri = requireObjectUrl(String(body.objectUri)).toString();
  const expiresAt = new Date(body.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date() || expiresAt.getTime() > Date.now() + 60 * 60 * 1000) throw new Error('media object gateway returned an invalid upload expiry');
  return { uploadUrl, objectUri, expiresAt, ticketId: String(body.ticketId) };
}

export async function writeGatewayObject(input: { objectKey: string; mimeType: string; bytesBase64: string; sha256: string }) {
  const body = await gateway('/v1/objects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!body.objectUri || !body.receiptId) throw new Error('media object write receipt is incomplete');
  return { objectUri: requireObjectUrl(String(body.objectUri)).toString(), receiptId: String(body.receiptId) };
}

export function verifyGatewayCallback(rawBody: string, signature: string | null): boolean {
  const secret = process.env.MEDIA_GATEWAY_CALLBACK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const left = Buffer.from(expected); const right = Buffer.from(signature);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function callbackDigest(value: unknown): string {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
