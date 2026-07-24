import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { APPLICATION_SESSION_COOKIE, createApplicationSession } from "@/lib/application-session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.isActive || !(await bcrypt.compare(password, user.password))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, businessId: user.businessId },
  });
  response.cookies.set(APPLICATION_SESSION_COOKIE, createApplicationSession(user.id, user.email), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return response;
}
