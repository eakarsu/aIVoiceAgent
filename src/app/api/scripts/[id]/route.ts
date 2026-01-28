import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const script = await prisma.script.findFirst({
      where: {
        id: params.id,
        agent: { businessId },
      },
      include: { agent: { select: { name: true } } },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json(script);
  } catch (error) {
    console.error("Error fetching script:", error);
    return NextResponse.json(
      { error: "Failed to fetch script" },
      { status: 500 }
    );
  }
}

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
    const existingScript = await prisma.script.findFirst({
      where: {
        id: params.id,
        agent: { businessId },
      },
    });

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const script = await prisma.script.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        content: body.content,
        category: body.category,
        tags: body.tags,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(script);
  } catch (error) {
    console.error("Error updating script:", error);
    return NextResponse.json(
      { error: "Failed to update script" },
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

    const existingScript = await prisma.script.findFirst({
      where: {
        id: params.id,
        agent: { businessId },
      },
    });

    if (!existingScript) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    await prisma.script.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Script deleted successfully" });
  } catch (error) {
    console.error("Error deleting script:", error);
    return NextResponse.json(
      { error: "Failed to delete script" },
      { status: 500 }
    );
  }
}
