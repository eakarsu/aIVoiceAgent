import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limit store for middleware (edge runtime compatible)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function getRateLimitResult(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

function applyCors(res: NextResponse, origin: string | null) {
  const allow =
    ALLOWED_ORIGINS.includes("*") ||
    (origin && ALLOWED_ORIGINS.includes(origin));
  if (allow && origin) {
    res.headers.set("Access-Control-Allow-Origin", origin);
  } else if (ALLOWED_ORIGINS.includes("*")) {
    res.headers.set("Access-Control-Allow-Origin", "*");
  }
  res.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,PATCH,OPTIONS"
  );
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, Idempotency-Key, X-Api-Key, X-User-Id, X-Twilio-Signature, X-Media-Signature, X-Media-Provider-Signature"
  );
  res.headers.set("Access-Control-Max-Age", "86400");
  res.headers.set("Vary", "Origin");
}

function applySecurityHeaders(res: NextResponse) {
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "0");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(self), geolocation=(self), payment=()"
  );
  res.headers.set(
    "Content-Security-Policy",
    process.env.CSP_HEADER ||
      "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://openrouter.ai https://api.twilio.com; frame-ancestors 'none'"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.headers.get("origin");
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const retiredPrototype =
    pathname.startsWith('/api/gap-') ||
    pathname.startsWith('/api/voicestudio/') ||
    (pathname.startsWith('/api/ai/') && pathname !== '/api/ai/long-term-memory') ||
    pathname.startsWith('/gap-') ||
    pathname.startsWith('/cf-') ||
    pathname.startsWith('/voicestudio/') ||
    pathname.startsWith('/ai/');
  if (retiredPrototype) {
    const res = NextResponse.json({ error: 'Generated simulation retired; use /api/media-pipeline for governed media production' }, { status: 410 });
    applyCors(res, origin); applySecurityHeaders(res); return res;
  }

  // CORS preflight
  if (request.method === "OPTIONS" && pathname.startsWith("/api/")) {
    const res = new NextResponse(null, { status: 204 });
    applyCors(res, origin);
    applySecurityHeaders(res);
    return res;
  }

  // Rate-limit credential submissions, not read-only NextAuth discovery and
  // session checks used by health probes and signed-in clients.
  if (request.method === "POST" &&
      (pathname.startsWith("/api/auth/callback/") || pathname === "/api/auth/login")) {
    const key = `auth:${ip}`;
    const result = getRateLimitResult(key, 10, 15 * 60 * 1000);
    if (!result.success) {
      const res = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      applyCors(res, origin);
      applySecurityHeaders(res);
      return res;
    }
  }

  // Rate limit general API endpoints (skip Twilio webhooks — provider IPs vary)
  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/voice/")
  ) {
    const key = `api:${ip}`;
    const result = getRateLimitResult(key, 100, 60 * 1000);
    if (!result.success) {
      const res = NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
      applyCors(res, origin);
      applySecurityHeaders(res);
      return res;
    }
  }

  const res = NextResponse.next();
  applyCors(res, origin);
  applySecurityHeaders(res);
  return res;
}

export const config = {
  matcher: ["/api/:path*", "/gap-:path*", "/cf-:path*", "/voicestudio/:path*", "/ai/:path*"],
};
