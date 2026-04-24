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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit auth endpoints more strictly (10 requests per 15 minutes)
  if (pathname.startsWith("/api/auth/")) {
    const key = `auth:${ip}`;
    const result = getRateLimitResult(key, 10, 15 * 60 * 1000);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // Rate limit general API endpoints (100 requests per minute)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
    const key = `api:${ip}`;
    const result = getRateLimitResult(key, 100, 60 * 1000);

    if (!result.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
