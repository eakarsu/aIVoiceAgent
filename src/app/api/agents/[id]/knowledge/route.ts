// AgentKnowledge CRUD + paginated list
// POST   /api/agents/:id/knowledge          { title, content, sourceUrl?, source? }
// GET    /api/agents/:id/knowledge?page=1   paginated list
// Tokens are derived server-side for cheap retrieval (lower-cased word stems).

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { getPagination, paginatedResponse } from "@/lib/security";

interface Ctx { params: Promise<{ id: string }> }

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
  ).slice(0, 200);
}

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await prisma.agent.findFirst({
      where: { id: (await params).id, businessId },
    });
    if (!agent)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = getPagination(url);

    const [rows, total] = await Promise.all([
      (prisma as any).agentKnowledge.findMany({
        where: { agentId: (await params).id },
        orderBy: { updatedAt: "desc" },
        skip,
        take,
      }),
      (prisma as any).agentKnowledge.count({ where: { agentId: (await params).id } }),
    ]);

    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err) {
    console.error("knowledge GET failed", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Ctx) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const agent = await prisma.agent.findFirst({
      where: { id: (await params).id, businessId },
    });
    if (!agent)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { title, content, sourceUrl, source } = await req.json();
    if (!title || !content) {
      return NextResponse.json(
        { error: "title and content required" },
        { status: 400 }
      );
    }

    const row = await (prisma as any).agentKnowledge.create({
      data: {
        agentId: (await params).id,
        title,
        content,
        source: source || (sourceUrl ? "url" : "text"),
        sourceUrl: sourceUrl || null,
        tokens: tokenize(`${title} ${content}`),
      },
    });

    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    console.error("knowledge POST failed", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
