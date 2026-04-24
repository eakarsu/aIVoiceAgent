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
    const item = await prisma.hearingTest.findFirst({ where: { id, businessId: session.user.businessId } });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await prisma.hearingTest.update({ where: { id }, data: { status: "processing" } });
    processWithAI(id, item.frequencies, item.testType, item.patientAge);
    return NextResponse.json(await prisma.hearingTest.findUnique({ where: { id } }));
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, frequencies: any, testType: string, patientAge: number | null) {
  try {
    const dataStr = JSON.stringify({ frequencies, testType, patientAge });
    const response = await callOpenRouter(`Analyze hearing test:\n\n${dataStr}`, AI_PROMPTS.hearingTest.system(testType));
    const aiResponse = parseJSONResponse(response);
    await prisma.hearingTest.update({ where: { id }, data: { results: aiResponse, recommendations: aiResponse.recommendations?.join(". ") || null, aiResponse, status: "completed" } });
  } catch (error) {
    await prisma.hearingTest.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
