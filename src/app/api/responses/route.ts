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

    const responses = await prisma.responseLibrary.findMany({
      where: {
        agent: { businessId },
        ...(agentId ? { agentId } : {}),
      },
      include: { agent: { select: { name: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(responses);
  } catch (error) {
    console.error("Error fetching responses:", error);
    return NextResponse.json(
      { error: "Failed to fetch responses" },
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
    const { trigger, response, category, priority, agentId } = body;

    if (!trigger || !response || !agentId) {
      return NextResponse.json(
        { error: "Trigger, response, and agent are required" },
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

    const responseItem = await prisma.responseLibrary.create({
      data: {
        trigger,
        response,
        category,
        priority: priority || 0,
        agentId,
      },
    });

    return NextResponse.json(responseItem, { status: 201 });
  } catch (error) {
    console.error("Error creating response:", error);
    return NextResponse.json(
      { error: "Failed to create response" },
      { status: 500 }
    );
  }
}
