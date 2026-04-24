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

const MODEL_TITLES: Record<string, string> = {
  "speech-enhancer": "Speech Enhancements",
  "accent-adapter": "Accent Adaptations",
  "intent-classifier": "Intent Classifications",
  "emotion-detector": "Emotion Detections",
  "multi-language": "Multi-Language Support",
  "translator": "Language Translations",
  "hearing-test": "Hearing Tests",
  "agents": "Agents",
  "calls": "Calls",
};

function generatePDFHTML(data: any[], title: string): string {
  if (data.length === 0) {
    return `<html><body><h1>${title}</h1><p>No data to export.</p></body></html>`;
  }

  const excludeKeys = ["aiResponse", "entities", "emotions", "frequencies", "results", "flowData", "config", "credentials", "conditionValue", "businessId"];
  const keys = Object.keys(data[0]).filter(
    (k) => !excludeKeys.includes(k) && typeof data[0][k] !== "object"
  );

  const headerRow = keys.map((k) => `<th style="border:1px solid #ddd;padding:6px 8px;background:#f5f5f5;font-size:11px;text-align:left;">${k}</th>`).join("");
  const bodyRows = data
    .map(
      (item) =>
        "<tr>" +
        keys
          .map((key) => {
            let value = item[key];
            if (value === null || value === undefined) value = "";
            const str = String(value);
            const truncated = str.length > 80 ? str.substring(0, 80) + "..." : str;
            return `<td style="border:1px solid #ddd;padding:4px 8px;font-size:10px;">${truncated}</td>`;
          })
          .join("") +
        "</tr>"
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title} Export</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { font-size: 18px; color: #333; }
    p { font-size: 12px; color: #666; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>${title} Export</h1>
  <p>Generated: ${new Date().toLocaleString()} | Total Records: ${data.length}</p>
  <table>
    <thead><tr>${headerRow}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
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
    const title = MODEL_TITLES[model] || model;
    const html = generatePDFHTML(data, title);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="${model}-export-${new Date().toISOString().split("T")[0]}.html"`,
      },
    });
  } catch (error) {
    console.error("PDF export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
