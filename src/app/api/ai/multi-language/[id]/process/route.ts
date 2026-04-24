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
    const item = await prisma.multiLanguageSupport.findFirst({ where: { id, businessId: session.user.businessId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.multiLanguageSupport.update({ where: { id }, data: { status: "processing" } });
    processWithAI(id, item.inputText);
    return NextResponse.json(await prisma.multiLanguageSupport.findUnique({ where: { id } }));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string) {
  try {
    const response = await callOpenRouter(`Detect language:\n\n${text}`, AI_PROMPTS.multiLanguage.system());
    const aiResponse = parseJSONResponse(response);
    await prisma.multiLanguageSupport.update({ where: { id }, data: { detectedLanguage: aiResponse.detectedLanguage, languageName: aiResponse.languageName, confidence: aiResponse.confidence, aiResponse, status: "completed" } });
  } catch (error) {
    await prisma.multiLanguageSupport.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
