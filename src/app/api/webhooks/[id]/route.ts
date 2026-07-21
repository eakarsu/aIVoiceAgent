import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

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

    const existing = await prisma.webhook.findFirst({
      where: { id: (await params).id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    const webhook = await prisma.webhook.update({
      where: { id: (await params).id },
      data: {
        name: body.name,
        url: body.url,
        events: body.events,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
    return NextResponse.json(
      { error: "Failed to update webhook" },
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

    const existing = await prisma.webhook.findFirst({
      where: { id: (await params).id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return NextResponse.json(
      { error: "Failed to delete webhook" },
      { status: 500 }
    );
  }
}
