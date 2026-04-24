import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MODEL_MAP: Record<string, (businessId: string) => Promise<any[]>> = {
  "speech-enhancer": (businessId) =>
    prisma.speechEnhancement.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "accent-adapter": (businessId) =>
    prisma.accentAdaptation.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "intent-classifier": (businessId) =>
    prisma.intentClassification.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "emotion-detector": (businessId) =>
    prisma.emotionDetection.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "multi-language": (businessId) =>
    prisma.multiLanguageSupport.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "translator": (businessId) =>
    prisma.languageTranslation.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "hearing-test": (businessId) =>
    prisma.hearingTest.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "agents": (businessId) =>
    prisma.agent.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } }),
  "calls": (businessId) =>
    prisma.call.findMany({ where: { businessId }, orderBy: { startTime: "desc" }, take: 500 }),
};

function objectToCSV(data: any[]): string {
  if (data.length === 0) return "";

  // Get all keys, excluding complex objects and internal fields
  const excludeKeys = ["aiResponse", "entities", "emotions", "frequencies", "results", "flowData", "config", "credentials", "conditionValue"];
  const keys = Object.keys(data[0]).filter(
    (k) => !excludeKeys.includes(k) && typeof data[0][k] !== "object"
  );

  const header = keys.join(",");
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key];
        if (value === null || value === undefined) return "";
        const str = String(value);
        // Escape CSV values containing commas, quotes, or newlines
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(",")
  );

  return [header, ...rows].join("\n");
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const model = searchParams.get("model");

    if (!model || !MODEL_MAP[model]) {
      return NextResponse.json(
        { error: "Invalid model. Valid models: " + Object.keys(MODEL_MAP).join(", ") },
        { status: 400 }
      );
    }

    const data = await MODEL_MAP[model](session.user.businessId);
    const csv = objectToCSV(data);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${model}-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
