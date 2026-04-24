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
    const item = await prisma.accentAdaptation.findFirst({ where: { id, businessId: session.user.businessId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.accentAdaptation.update({ where: { id }, data: { status: "processing" } });
    processWithAI(id, item.originalText, item.sourceAccent, item.targetAccent);
    return NextResponse.json(await prisma.accentAdaptation.findUnique({ where: { id } }));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, text: string, source: string, target: string) {
  try {
    const response = await callOpenRouter(`Adapt this text from ${source} accent to ${target} accent:\n\n${text}`, AI_PROMPTS.accentAdapter.system(source, target));
    const aiResponse = parseJSONResponse(response);
    await prisma.accentAdaptation.update({ where: { id }, data: { adaptedText: aiResponse.adaptedText || response, aiResponse, status: "completed" } });
  } catch (error) {
    await prisma.accentAdaptation.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
