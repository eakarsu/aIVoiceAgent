// POST /api/voice/gather
// Twilio <Gather> action webhook: receives speech transcript, calls AI, returns TwiML <Say>.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  generateResponse,
  detectIntent,
  analyzeSentiment,
  shouldEscalate,
  ConversationContext,
} from "@/services/ai";
import { buildResponseTwiML, buildTransferTwiML } from "@/services/twilio";
import { retrieveKnowledge, buildKnowledgeBlock } from "@/lib/rag";
import { persistAIResult } from "@/lib/ai-helpers";

export async function POST(request: NextRequest) {
  const errorTwiml = (message: string) => `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${message}</Say>
  <Hangup/>
</Response>`;

  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get("callId");

    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body).entries());

    const transcript = params.SpeechResult || params.Digits || "";
    const confidence = parseFloat(params.Confidence || "1");

    if (!callId) {
      return new NextResponse(errorTwiml("An error occurred. Goodbye."), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Load the call with full context (agent config + conversation history)
    const call = await prisma.call.findUnique({
      where: { id: callId },
      include: {
        agent: true,
        messages: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!call) {
      return new NextResponse(errorTwiml("Call not found. Goodbye."), {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Persist the user's transcript
    if (transcript) {
      await prisma.callMessage.create({
        data: {
          role: "user",
          content: transcript,
          callId,
        },
      });
    }

    // If no speech was detected, prompt again
    if (!transcript || confidence < 0.3) {
      const retryTwiml = buildResponseTwiML(
        call.agent?.fallbackMessage ?? "I'm sorry, I didn't catch that. Could you please repeat?",
        `${process.env.NEXTAUTH_URL}/api/voice/gather?callId=${callId}`
      );
      return new NextResponse(retryTwiml, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Build conversation history for the AI
    const history: { role: "user" | "assistant"; content: string }[] =
      call.messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // Retrieve grounded knowledge for this agent based on the user transcript.
    let kbBlock = "";
    if (call.agentId) {
      try {
        const hits = await retrieveKnowledge(call.agentId, transcript, 3);
        kbBlock = buildKnowledgeBlock(hits);
      } catch {}
    }

    const agentConfig = {
      personality: call.agent?.personalityType ?? "professional",
      greeting: call.agent?.greeting ?? "Hello! How can I help you today?",
      fallbackMessage:
        (call.agent?.fallbackMessage ?? "I'm sorry, I didn't understand that.") +
        kbBlock,
      temperature: call.agent?.temperature ?? 0.7,
      maxTokens: call.agent?.maxTokens ?? 150,
    };

    const context: ConversationContext = {
      agentId: call.agentId ?? "",
      callId,
      history,
      agentConfig,
    };

    // Run AI analysis in parallel
    const [aiResponse, intent, sentiment] = await Promise.all([
      generateResponse(context, transcript),
      detectIntent(transcript),
      analyzeSentiment(transcript),
    ]);

    // Save AI response to DB
    await prisma.callMessage.create({
      data: {
        role: "assistant",
        content: aiResponse,
        callId,
      },
    });

    // Update call with latest sentiment/intent analysis
    await prisma.call.update({
      where: { id: callId },
      data: {
        sentiment: sentiment.sentiment,
        sentimentScore: sentiment.score,
        intent: intent.intent,
        entities: intent.entities,
      },
    });

    // Persist this turn to ai_results for analytics + future fine-tuning corpus.
    persistAIResult({
      businessId: call.businessId,
      callId,
      feature: "voice_turn",
      input: { transcript, history },
      output: {
        response: aiResponse,
        intent,
        sentiment,
      },
      model:
        process.env.OPENROUTER_MODEL || "anthropic/claude-3-5-sonnet-20241022",
    });

    // Check if we should escalate to a human agent
    const escalation = shouldEscalate(context, sentiment, intent);

    const gatherUrl = `${process.env.NEXTAUTH_URL}/api/voice/gather?callId=${callId}`;

    if (escalation.shouldTransfer && call.agent?.transferMessage) {
      // Log transfer event
      await prisma.callEvent.create({
        data: {
          type: "transfer",
          data: { reason: escalation.reason },
          callId,
        },
      });

      await prisma.call.update({
        where: { id: callId },
        data: { wasTransferred: true, outcome: "transferred" },
      });

      // If there's a transfer number configured on the agent, transfer; otherwise end gracefully
      const transferNumber = process.env.TRANSFER_PHONE_NUMBER;
      if (transferNumber) {
        const twiml = buildTransferTwiML(call.agent.transferMessage, transferNumber);
        return new NextResponse(twiml, {
          status: 200,
          headers: { "Content-Type": "text/xml" },
        });
      }

      // No transfer number — say goodbye
      const twiml = buildResponseTwiML(
        call.agent.transferMessage + " Unfortunately, all agents are busy right now. Please call back shortly.",
        gatherUrl,
        true
      );
      return new NextResponse(twiml, {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Detect farewells to end the call cleanly
    const isFarewell =
      intent.intent === "farewell" ||
      /\b(bye|goodbye|that's all|no thanks|hang up)\b/i.test(transcript);

    const twiml = buildResponseTwiML(aiResponse, gatherUrl, isFarewell);

    if (isFarewell) {
      await prisma.call.update({
        where: { id: callId },
        data: { outcome: "resolved" },
      });
    }

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error handling gather webhook:", error);
    return new NextResponse(
      errorTwiml("We are experiencing technical difficulties. Please call back later."),
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}
