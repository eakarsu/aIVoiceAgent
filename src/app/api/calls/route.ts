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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const direction = searchParams.get("direction");
    const agentId = searchParams.get("agentId");

    const where: any = { businessId };
    if (status) where.status = status;
    if (direction) where.direction = direction;
    if (agentId) where.agentId = agentId;

    const [calls, total] = await Promise.all([
      prisma.call.findMany({
        where,
        include: {
          agent: { select: { id: true, name: true } },
          phoneNumber: { select: { id: true, number: true, displayName: true } },
        },
        orderBy: { startTime: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.call.count({ where }),
    ]);

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch calls" },
      { status: 500 }
    );
  }
}
