import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const existing = await prisma.integration.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    const integration = await prisma.integration.update({
      where: { id: params.id },
      data: {
        name: body.name,
        config: body.config,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(integration);
  } catch (error) {
    console.error("Error updating integration:", error);
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.integration.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Integration not found" }, { status: 404 });
    }

    await prisma.integration.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Integration deleted successfully" });
  } catch (error) {
    console.error("Error deleting integration:", error);
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 }
    );
  }
}
