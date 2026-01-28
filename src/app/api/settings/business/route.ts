import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/settings/business - Get business settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const business = await prisma.business.findUnique({
      where: { id: session.user.businessId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        timezone: true,
        industry: true,
        address: true,
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Failed to fetch business settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch business settings" },
      { status: 500 }
    );
  }
}

// PUT /api/settings/business - Update business settings
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, website, timezone, industry, address } = body;

    const business = await prisma.business.update({
      where: { id: session.user.businessId },
      data: {
        name,
        email,
        phone,
        website,
        timezone,
        industry,
        address,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        website: true,
        timezone: true,
        industry: true,
        address: true,
      },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Failed to update business settings:", error);
    return NextResponse.json(
      { error: "Failed to update business settings" },
      { status: 500 }
    );
  }
}
