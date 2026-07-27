import crypto from 'node:crypto';

function key(): Buffer {
  const value = process.env.MEDIA_SECRET_KEY;
  if (!value) throw new Error('MEDIA_SECRET_KEY is required');
  const decoded = /^[a-f0-9]{64}$/i.test(value) ? Buffer.from(value, 'hex') : Buffer.from(value, 'base64');
  if (decoded.length !== 32) throw new Error('MEDIA_SECRET_KEY must encode exactly 32 bytes');
  return decoded;
}

export function encryptMediaSecret(config: unknown): string {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('provider config must be an object');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(config), 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptMediaSecret<T extends Record<string, unknown>>(value: string): T {
  const [version, iv, tag, ciphertext] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('encrypted provider config is invalid');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8')) as T;
}
