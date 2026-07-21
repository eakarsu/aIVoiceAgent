import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const phoneNumber = await prisma.phoneNumber.findFirst({
      where: { id: (await params).id, businessId },
      include: {
        agent: { select: { id: true, name: true } },
        routingRules: true,
        calls: {
          take: 10,
          orderBy: { startTime: "desc" },
        },
      },
    });

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    return NextResponse.json(phoneNumber);
  } catch (error) {
    console.error("Error fetching phone number:", error);
    return NextResponse.json(
      { error: "Failed to fetch phone number" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existingNumber = await prisma.phoneNumber.findFirst({
      where: { id: (await params).id, businessId },
    });

    if (!existingNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    const phoneNumber = await prisma.phoneNumber.update({
      where: { id: (await params).id },
      data: {
        displayName: body.displayName,
        callHandling: body.callHandling,
        forwardTo: body.forwardTo,
        voicemailEnabled: body.voicemailEnabled,
        recordingEnabled: body.recordingEnabled,
        status: body.status,
        agentId: body.agentId,
      },
      include: {
        agent: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(phoneNumber);
  } catch (error) {
    console.error("Error updating phone number:", error);
    return NextResponse.json(
      { error: "Failed to update phone number" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existingNumber = await prisma.phoneNumber.findFirst({
      where: { id: (await params).id, businessId },
    });

    if (!existingNumber) {
      return NextResponse.json({ error: "Phone number not found" }, { status: 404 });
    }

    await prisma.phoneNumber.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: "Phone number deleted successfully" });
  } catch (error) {
    console.error("Error deleting phone number:", error);
    return NextResponse.json(
      { error: "Failed to delete phone number" },
      { status: 500 }
    );
  }
}
