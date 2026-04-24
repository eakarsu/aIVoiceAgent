import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(prompt: string, systemPrompt: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5";

  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      "X-Title": "AI Voice Agent Platform",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      max_tokens: 10000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const item = await prisma.speechEnhancement.findFirst({
      where: {
        id,
        businessId: session.user.businessId,
      },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Update status to processing
    await prisma.speechEnhancement.update({
      where: { id },
      data: { status: "processing" },
    });

    // Process with AI asynchronously
    processWithAI(id, item.originalText, item.enhancementType);

    const updated = await prisma.speechEnhancement.findUnique({
      where: { id },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error processing speech enhancement:", error);
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, enhancementType: string) {
  try {
    const systemPrompt = `You are an expert speech enhancement AI. Your task is to enhance the given text based on the enhancement type.

Enhancement type: ${enhancementType}

Analyze the text and provide:
1. An enhanced version of the text
2. A list of specific improvements made
3. Improvement scores (0-100) for: clarity, grammar, fluency, tone
4. Helpful suggestions for further improvement

Respond in JSON format:
{
  "enhancedText": "...",
  "enhancements": ["list of enhancements made"],
  "improvements": {
    "clarity": 85,
    "grammar": 90,
    "fluency": 88,
    "tone": 82
  },
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const prompt = `Please enhance this text for ${enhancementType}:\n\n${text}`;

    const aiResponseText = await callOpenRouter(prompt, systemPrompt);

    let aiResponse;
    let enhancedText = "";

    try {
      const jsonMatch = aiResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
        enhancedText = aiResponse.enhancedText || "";
      } else {
        aiResponse = { rawResponse: aiResponseText };
        enhancedText = aiResponseText;
      }
    } catch {
      aiResponse = { rawResponse: aiResponseText };
      enhancedText = aiResponseText;
    }

    await prisma.speechEnhancement.update({
      where: { id },
      data: {
        enhancedText,
        aiResponse,
        status: "completed",
      },
    });
  } catch (error) {
    console.error("AI processing error:", error);
    await prisma.speechEnhancement.update({
      where: { id },
      data: {
        status: "failed",
        aiResponse: { error: String(error) },
      },
    });
  }
}
