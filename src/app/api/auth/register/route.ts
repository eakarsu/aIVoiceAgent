import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, businessName } = body;

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if business email already exists
    const existingBusiness = await prisma.business.findUnique({
      where: { email },
    });

    if (existingBusiness) {
      return NextResponse.json(
        { error: "Business with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create business and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          email: email,
        },
      });

      // Create user as admin
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "ADMIN",
          businessId: business.id,
        },
      });

      // Create default subscription
      await tx.subscription.create({
        data: {
          plan: "free",
          status: "active",
          businessId: business.id,
        },
      });

      // Create default agent
      await tx.agent.create({
        data: {
          name: "Default Agent",
          description: "Your first AI voice agent",
          businessId: business.id,
        },
      });

      return { user, business };
    });

    return NextResponse.json(
      {
        message: "Account created successfully",
        userId: result.user.id,
        businessId: result.business.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
