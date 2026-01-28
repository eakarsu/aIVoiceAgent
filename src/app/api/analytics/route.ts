import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    let startDate = new Date();
    switch (period) {
      case "24h":
        startDate.setHours(startDate.getHours() - 24);
        break;
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
    }

    // Get call statistics
    const [
      totalCalls,
      completedCalls,
      avgDuration,
      sentimentStats,
      callsByDay,
      topAgents,
      outcomeStats,
    ] = await Promise.all([
      // Total calls
      prisma.call.count({
        where: { businessId, startTime: { gte: startDate } },
      }),
      // Completed calls
      prisma.call.count({
        where: { businessId, status: "completed", startTime: { gte: startDate } },
      }),
      // Average duration
      prisma.call.aggregate({
        where: { businessId, startTime: { gte: startDate }, duration: { not: null } },
        _avg: { duration: true },
      }),
      // Sentiment distribution
      prisma.call.groupBy({
        by: ["sentiment"],
        where: { businessId, startTime: { gte: startDate }, sentiment: { not: null } },
        _count: true,
      }),
      // Calls by day
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE("startTime") as date, COUNT(*) as count
        FROM "Call"
        WHERE "businessId" = ${businessId} AND "startTime" >= ${startDate}
        GROUP BY DATE("startTime")
        ORDER BY date ASC
      `,
      // Top agents by call volume
      prisma.call.groupBy({
        by: ["agentId"],
        where: { businessId, startTime: { gte: startDate }, agentId: { not: null } },
        _count: true,
        orderBy: { _count: { agentId: "desc" } },
        take: 5,
      }),
      // Outcome distribution
      prisma.call.groupBy({
        by: ["outcome"],
        where: { businessId, startTime: { gte: startDate }, outcome: { not: null } },
        _count: true,
      }),
    ]);

    // Get agent names for top agents
    const agentIds = topAgents.map((a) => a.agentId).filter(Boolean) as string[];
    const agents = await prisma.agent.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true },
    });

    const topAgentsWithNames = topAgents.map((a) => ({
      ...a,
      name: agents.find((agent) => agent.id === a.agentId)?.name || "Unknown",
    }));

    // Calculate metrics
    const missedCalls = totalCalls - completedCalls;
    const answerRate = totalCalls > 0 ? (completedCalls / totalCalls) * 100 : 0;

    return NextResponse.json({
      overview: {
        totalCalls,
        completedCalls,
        missedCalls,
        answerRate: Math.round(answerRate * 10) / 10,
        avgDuration: Math.round(avgDuration._avg.duration || 0),
      },
      sentiment: sentimentStats.map((s) => ({
        sentiment: s.sentiment,
        count: s._count,
      })),
      callsByDay: callsByDay.map((d) => ({
        date: d.date.toISOString().split("T")[0],
        count: Number(d.count),
      })),
      topAgents: topAgentsWithNames.map((a) => ({
        agentId: a.agentId,
        name: a.name,
        count: a._count,
      })),
      outcomes: outcomeStats.map((o) => ({
        outcome: o.outcome,
        count: o._count,
      })),
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
