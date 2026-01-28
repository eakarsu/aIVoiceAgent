import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET() {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phoneNumbers = await prisma.phoneNumber.findMany({
      where: { businessId },
      include: {
        agent: { select: { id: true, name: true } },
        _count: { select: { calls: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(phoneNumbers);
  } catch (error) {
    console.error("Error fetching phone numbers:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone numbers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      number,
      displayName,
      country,
      type,
      provider,
      callHandling,
      forwardTo,
      voicemailEnabled,
      recordingEnabled,
      agentId,
    } = body;

    if (!number) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Check if number already exists
    const existing = await prisma.phoneNumber.findUnique({
      where: { number },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 400 }
      );
    }

    const phoneNumber = await prisma.phoneNumber.create({
      data: {
        number,
        displayName,
        country: country || "US",
        type: type || "local",
        provider: provider || "twilio",
        callHandling: callHandling || "agent",
        forwardTo,
        voicemailEnabled: voicemailEnabled ?? true,
        recordingEnabled: recordingEnabled ?? true,
        agentId: agentId || null,
        businessId,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(phoneNumber, { status: 201 });
  } catch (error) {
    console.error("Error creating phone number:", error);
    return NextResponse.json(
      { error: "Failed to create phone number" },
      { status: 500 }
    );
  }
}
