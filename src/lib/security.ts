// Security helpers for aIVoiceAgent
// - applySecurityHeaders: helmet-style headers
// - corsHeaders: env-driven CORS
// - withSecurity: NextResponse wrapper

import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allow =
    ALLOWED_ORIGINS.includes("*") ||
    (origin && ALLOWED_ORIGINS.includes(origin));
  return {
    "Access-Control-Allow-Origin":
      allow && origin ? origin : ALLOWED_ORIGINS.includes("*") ? "*" : "",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,PATCH,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Api-Key, X-User-Id, X-Twilio-Signature",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function securityHeaders(): Record<string, string> {
  return {
    "Strict-Transport-Security":
      "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "0",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy":
      "camera=(), microphone=(self), geolocation=(self), payment=()",
    "Content-Security-Policy":
      process.env.CSP_HEADER ||
      "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://openrouter.ai https://api.twilio.com; frame-ancestors 'none'",
  };
}

export function withSecurity(res: NextResponse, origin?: string | null) {
  const allCors = corsHeaders(origin);
  for (const [k, v] of Object.entries(allCors)) {
    if (v) res.headers.set(k, v);
  }
  for (const [k, v] of Object.entries(securityHeaders())) {
    res.headers.set(k, v);
  }
  return res;
}

export function jsonOk(data: any, init?: ResponseInit & { origin?: string }) {
  const res = NextResponse.json(data, init);
  return withSecurity(res, init?.origin);
}

export function jsonError(
  status: number,
  message: string,
  init?: ResponseInit & { origin?: string }
) {
  const res = NextResponse.json({ error: message }, { ...init, status });
  return withSecurity(res, init?.origin);
}

// Pagination helper for list endpoints
export interface PageOpts {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

export function getPagination(url: URL, defaults: { pageSize?: number } = {}): PageOpts {
  const pageRaw = Number(url.searchParams.get("page") || "1");
  const sizeRaw = Number(
    url.searchParams.get("pageSize") || defaults.pageSize || 20
  );
  const page = Math.max(1, Math.floor(pageRaw) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(sizeRaw) || 20));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function paginatedResponse<T>(
  rows: T[],
  total: number,
  page: number,
  pageSize: number
) {
  return {
    data: rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      hasMore: page * pageSize < total,
    },
  };
}
