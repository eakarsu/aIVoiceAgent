import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");

    const scripts = await prisma.script.findMany({
      where: {
        agent: { businessId },
        ...(agentId ? { agentId } : {}),
      },
      include: { agent: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(scripts);
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: "Failed to fetch scripts" },
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
    const { name, description, content, category, tags, agentId } = body;

    if (!name || !content || !agentId) {
      return NextResponse.json(
        { error: "Name, content, and agent are required" },
        { status: 400 }
      );
    }

    // Verify agent belongs to business
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, businessId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    const script = await prisma.script.create({
      data: {
        name,
        description,
        content,
        category,
        tags: tags || [],
        agentId,
      },
    });

    return NextResponse.json(script, { status: 201 });
  } catch (error) {
    console.error("Error creating script:", error);
    return NextResponse.json(
      { error: "Failed to create script" },
      { status: 500 }
    );
  }
}
