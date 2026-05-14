// GET /api/campaigns  — list campaigns for current business
// POST /api/campaigns — create a new campaign

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET() {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const campaigns = await prisma.campaign.findMany({
      where: { businessId },
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { contacts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, fromNumber, agentId, callbackUrl, contacts } = body;

    if (!name) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }

    if (!fromNumber) {
      return NextResponse.json({ error: "fromNumber is required" }, { status: 400 });
    }

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "contacts array is required and must not be empty" },
        { status: 400 }
      );
    }

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        fromNumber,
        callbackUrl: callbackUrl ?? null,
        agentId: agentId ?? null,
        businessId,
        contacts: {
          create: contacts.map((c: { phoneNumber: string; name?: string; metadata?: object }) => ({
            phoneNumber: c.phoneNumber,
            name: c.name ?? null,
            ...(c.metadata !== undefined ? { metadata: c.metadata } : {}),
          })),
        },
      },
      include: {
        _count: { select: { contacts: true } },
      },
    });

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
