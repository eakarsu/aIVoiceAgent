import { createHmac, timingSafeEqual } from "node:crypto";

export const APPLICATION_SESSION_COOKIE = "application_session";

type ApplicationSession = {
  userId: string;
  email: string;
  expiresAt: number;
};

function secret() {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value || value.length < 32) throw new Error("NEXTAUTH_SECRET is required");
  return value;
}

function signature(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createApplicationSession(userId: string, email: string) {
  const claims: ApplicationSession = {
    userId,
    email,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  return `${payload}.${signature(payload)}`;
}

export function verifyApplicationSession(token?: string): ApplicationSession | null {
  if (!token) return null;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;
  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ApplicationSession;
    if (!claims.userId || !claims.email || claims.expiresAt <= Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}
