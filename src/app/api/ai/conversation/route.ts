import { NextResponse } from "next/server";
import { getCurrentBusinessId } from "@/lib/session";
import {
  generateResponse,
  detectIntent,
  analyzeSentiment,
  detectLanguage,
  shouldEscalate,
  extractEntities,
} from "@/services/ai";

export async function POST(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, context } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Process the message through AI services
    const [intent, sentiment, language] = await Promise.all([
      detectIntent(message),
      analyzeSentiment(message),
      detectLanguage(message),
    ]);

    const entities = extractEntities(message);

    // Check if we should escalate to human
    const escalation = shouldEscalate(
      context || { history: [], agentConfig: {} },
      sentiment,
      intent
    );

    // Generate response
    const response = await generateResponse(
      context || {
        agentId: "",
        callId: "",
        history: [],
        agentConfig: {
          personality: "professional",
          greeting: "Hello! How can I help you today?",
          fallbackMessage: "I'm sorry, I didn't understand that. Could you please repeat?",
          temperature: 0.7,
          maxTokens: 150,
        },
      },
      message
    );

    return NextResponse.json({
      response,
      analysis: {
        intent,
        sentiment,
        language,
        entities,
      },
      escalation,
    });
  } catch (error) {
    console.error("Error processing conversation:", error);
    return NextResponse.json(
      { error: "Failed to process conversation" },
      { status: 500 }
    );
  }
}
