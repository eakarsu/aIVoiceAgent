import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callOpenRouter, parseJSONResponse, AI_PROMPTS } from "@/lib/openrouter";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const items = await prisma.hearingTest.findMany({ where: { businessId: session.user.businessId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { title, description, patientName, patientAge, testType, frequencies } = await request.json();
    if (!title) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const item = await prisma.hearingTest.create({
      data: { title, description, patientName, patientAge, testType: testType || "pure-tone", frequencies, status: "processing", businessId: session.user.businessId },
    });
    processWithAI(item.id, frequencies, testType || "pure-tone", patientAge);
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function processWithAI(id: string, frequencies: any, testType: string, patientAge: number | null) {
  try {
    const dataStr = JSON.stringify({ frequencies, testType, patientAge });
    const response = await callOpenRouter(`Analyze this hearing test data and provide a professional assessment:\n\n${dataStr}`, AI_PROMPTS.hearingTest.system(testType));
    const aiResponse = parseJSONResponse(response);
    await prisma.hearingTest.update({
      where: { id },
      data: { results: aiResponse, recommendations: aiResponse.recommendations?.join(". ") || null, aiResponse, status: "completed" },
    });
  } catch (error) {
    await prisma.hearingTest.update({ where: { id }, data: { status: "failed", aiResponse: { error: String(error) } } });
  }
}
