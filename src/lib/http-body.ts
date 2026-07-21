export class BodyLimitError extends Error {
  status = 413;
  code = 'BODY_TOO_LARGE';

  constructor(limit: number) {
    super(`Request body exceeds the ${limit} byte limit`);
  }
}

export async function readBoundedText(request: Request, limit: number): Promise<string> {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > limit) throw new BodyLimitError(limit);
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new BodyLimitError(limit);
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(body);
}
