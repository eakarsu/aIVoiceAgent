import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const item = await prisma.languageTranslation.findFirst({ where: { id, businessId: session.user.businessId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.languageTranslation.update({ where: { id }, data: { status: "processing" } });
    processWithAI(id, item.originalText, item.sourceLanguage, item.targetLanguage, item.category);
    return NextResponse.json(await prisma.languageTranslation.findUnique({ where: { id } }));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, source: string, target: string, category: string) {
  try {
    const response = await callOpenRouter(`Translate from ${source} to ${target}:\n\n${text}`, AI_PROMPTS.translator.system(source, target, category));
    const aiResponse = parseJSONResponse(response);
    await prisma.languageTranslation.update({ where: { id }, data: { translatedText: aiResponse.translation || response, aiResponse, status: "completed" } });
  } catch (error) {
    await prisma.languageTranslation.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
