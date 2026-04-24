import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const item = await prisma.emotionDetection.findFirst({ where: { id, businessId: session.user.businessId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await request.json();
    const updated = await prisma.emotionDetection.update({ where: { id }, data: { title: body.title, description: body.description, inputText: body.inputText, status: "processing" } });
    processWithAI(id, body.inputText);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await prisma.emotionDetection.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string) {
  try {
    const response = await callOpenRouter(`Detect emotions:\n\n${text}`, AI_PROMPTS.emotionDetector.system());
    const aiResponse = parseJSONResponse(response);
    await prisma.emotionDetection.update({ where: { id }, data: { primaryEmotion: aiResponse.primaryEmotion, emotions: aiResponse.emotions, sentiment: aiResponse.sentiment, sentimentScore: aiResponse.sentimentScore, aiResponse, status: "completed" } });
  } catch (error) {
    await prisma.emotionDetection.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
