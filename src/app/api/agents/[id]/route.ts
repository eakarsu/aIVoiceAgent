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

    const agent = await prisma.agent.findFirst({
      where: { id: params.id, businessId },
      include: {
        scripts: true,
        responses: true,
        callFlows: true,
        phoneNumbers: true,
      },
    });

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent" },
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
    const existingAgent = await prisma.agent.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const agent = await prisma.agent.update({
      where: { id: params.id },
      data: {
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        voiceId: body.voiceId,
        voiceName: body.voiceName,
        voiceProvider: body.voiceProvider,
        voiceSpeed: body.voiceSpeed,
        voicePitch: body.voicePitch,
        personalityType: body.personalityType,
        greeting: body.greeting,
        fallbackMessage: body.fallbackMessage,
        transferMessage: body.transferMessage,
        aiModel: body.aiModel,
        temperature: body.temperature,
        maxTokens: body.maxTokens,
        primaryLanguage: body.primaryLanguage,
        supportedLanguages: body.supportedLanguages,
      },
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json(
      { error: "Failed to update agent" },
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

    // Verify ownership
    const existingAgent = await prisma.agent.findFirst({
      where: { id: params.id, businessId },
    });

    if (!existingAgent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Agent deleted successfully" });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json(
      { error: "Failed to delete agent" },
      { status: 500 }
    );
  }
}
