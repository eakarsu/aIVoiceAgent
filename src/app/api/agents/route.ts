import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET() {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agents = await prisma.agent.findMany({
      where: { businessId },
      include: {
        _count: {
          select: {
            scripts: true,
            responses: true,
            callFlows: true,
            phoneNumbers: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(agents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
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
      name,
      description,
      voiceId,
      voiceName,
      voiceProvider,
      voiceSpeed,
      voicePitch,
      personalityType,
      greeting,
      fallbackMessage,
      transferMessage,
      aiModel,
      temperature,
      maxTokens,
      primaryLanguage,
      supportedLanguages,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Agent name is required" },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.create({
      data: {
        name,
        description,
        voiceId,
        voiceName: voiceName || "Default",
        voiceProvider: voiceProvider || "system",
        voiceSpeed: voiceSpeed || 1.0,
        voicePitch: voicePitch || 1.0,
        personalityType: personalityType || "professional",
        greeting: greeting || "Hello! How can I help you today?",
        fallbackMessage: fallbackMessage || "I'm sorry, I didn't understand that. Could you please repeat?",
        transferMessage: transferMessage || "Let me transfer you to a human agent.",
        aiModel: aiModel || "gpt-4",
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 150,
        primaryLanguage: primaryLanguage || "en",
        supportedLanguages: supportedLanguages || ["en"],
        businessId,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
