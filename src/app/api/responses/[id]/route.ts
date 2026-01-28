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

    // Verify ownership
    const existingResponse = await prisma.responseLibrary.findFirst({
      where: {
        id: params.id,
        agent: { businessId },
      },
    });

    if (!existingResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    const response = await prisma.responseLibrary.update({
      where: { id: params.id },
      data: {
        trigger: body.trigger,
        response: body.response,
        category: body.category,
        priority: body.priority,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating response:", error);
    return NextResponse.json(
      { error: "Failed to update response" },
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

    const existingResponse = await prisma.responseLibrary.findFirst({
      where: {
        id: params.id,
        agent: { businessId },
      },
    });

    if (!existingResponse) {
      return NextResponse.json({ error: "Response not found" }, { status: 404 });
    }

    await prisma.responseLibrary.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Response deleted successfully" });
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
