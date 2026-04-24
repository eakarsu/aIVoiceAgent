import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const items = await prisma.languageTranslation.findMany({ where: { businessId: session.user.businessId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, description, originalText, sourceLanguage, targetLanguage, category } = await request.json();
    if (!title || !originalText) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const item = await prisma.languageTranslation.create({
      data: { title, description, originalText, sourceLanguage: sourceLanguage || "auto", targetLanguage: targetLanguage || "en", category: category || "general", status: "processing", businessId: session.user.businessId },
    });
    processWithAI(item.id, originalText, sourceLanguage || "auto", targetLanguage || "en", category || "general");
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, source: string, target: string, category: string) {
  try {
    const response = await callOpenRouter(`Translate this text from ${source} to ${target}:\n\n${text}`, AI_PROMPTS.translator.system(source, target, category));
    const aiResponse = parseJSONResponse(response);
    await prisma.languageTranslation.update({
      where: { id },
      data: { translatedText: aiResponse.translation || response, aiResponse, status: "completed" },
    });
  } catch (error) {
    await prisma.languageTranslation.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
