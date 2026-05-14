// Lightweight token-overlap RAG retrieval over AgentKnowledge.
// Avoids vector DB dependency; suitable for small-to-medium KBs.

import prisma from "@/lib/prisma";

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      (text || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    )
  );
}

export async function retrieveKnowledge(
  agentId: string,
  query: string,
  topK = 3
): Promise<Array<{ title: string; content: string; score: number }>> {
  if (!agentId || !query) return [];

  const qTokens = tokenize(query);
  if (qTokens.length === 0) return [];

  let rows: any[] = [];
  try {
    rows = await (prisma as any).agentKnowledge.findMany({
      where: { agentId, isActive: true },
      take: 200,
    });
  } catch {
    return [];
  }

  const scored = rows
    .map((r) => {
      const overlap = (r.tokens || []).filter((t: string) =>
        qTokens.includes(t)
      ).length;
      return { title: r.title, content: r.content, score: overlap };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

export function buildKnowledgeBlock(
  hits: Array<{ title: string; content: string }>
): string {
  if (!hits.length) return "";
  const blocks = hits
    .map(
      (h, i) =>
        `[KB-${i + 1}] ${h.title}\n${h.content.slice(0, 800)}`.trim()
    )
    .join("\n\n");
  return `\n\nRelevant business knowledge (cite as [KB-N] when used):\n${blocks}\n`;
}
