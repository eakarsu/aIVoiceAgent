import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // If user exists, create a reset token
    if (user) {
      const token = crypto.randomUUID();

      await prisma.passwordResetToken.create({
        data: {
          token,
          email: user.email,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Log the reset link (in production, this would send an email)
      console.log(
        `Password reset link: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`
      );
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
