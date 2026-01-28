import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const call = await prisma.call.findFirst({
      where: { id: params.id, businessId },
      include: {
        agent: { select: { id: true, name: true } },
        phoneNumber: { select: { id: true, number: true, displayName: true } },
        messages: { orderBy: { timestamp: "asc" } },
        events: { orderBy: { timestamp: "asc" } },
      },
    });

    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    return NextResponse.json(call);
  } catch (error) {
    console.error("Error fetching call:", error);
    return NextResponse.json(
      { error: "Failed to fetch call" },
      { status: 500 }
    );
  }
}
