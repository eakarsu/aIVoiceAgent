import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const items = await prisma.emotionDetection.findMany({ where: { businessId: session.user.businessId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, description, inputText } = await request.json();
    if (!title || !inputText) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const item = await prisma.emotionDetection.create({
      data: { title, description, inputText, status: "processing", businessId: session.user.businessId },
    });
    processWithAI(item.id, inputText);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string) {
  try {
    const response = await callOpenRouter(`Detect emotions in this text:\n\n${text}`, AI_PROMPTS.emotionDetector.system());
    const aiResponse = parseJSONResponse(response);
    await prisma.emotionDetection.update({
      where: { id },
      data: { primaryEmotion: aiResponse.primaryEmotion, emotions: aiResponse.emotions, sentiment: aiResponse.sentiment, sentimentScore: aiResponse.sentimentScore, aiResponse, status: "completed" },
    });
  } catch (error) {
    await prisma.emotionDetection.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
