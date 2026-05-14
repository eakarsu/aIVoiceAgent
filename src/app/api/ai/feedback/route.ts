// AI training-feedback API
// POST: persists agent/user corrections to AiTrainingData & ConversationFeedback
// GET: paginated list for admin review.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { getPagination, paginatedResponse } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    const body = await req.json();

    const {
      callId,
      input,
      originalResponse,
      correctedResponse,
      rating,
      feedbackType,
      category,
    } = body || {};

    if (!input || !originalResponse) {
      return NextResponse.json(
        { error: "input and originalResponse are required" },
        { status: 400 }
      );
    }

    // Persist as AiTrainingData (for fine-tuning corpus) AND ConversationFeedback (call-scoped).
    const training = await prisma.aiTrainingData.create({
      data: {
        input,
        output: correctedResponse || originalResponse,
        context: JSON.stringify({
          originalResponse,
          feedbackType,
          rating,
          businessId,
          callId,
        }),
        category: category || "agent_correction",
        isApproved: feedbackType === "positive",
      },
    });

    if (callId && rating) {
      await prisma.conversationFeedback.create({
        data: {
          callId,
          rating: Number(rating),
          feedback: correctedResponse || null,
          category: category || feedbackType || "general",
        },
      });
    }

    return NextResponse.json({ ok: true, id: training.id });
  } catch (err) {
    console.error("feedback POST error", err);
    return NextResponse.json(
      { error: "Failed to record feedback" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const { page, pageSize, skip, take } = getPagination(url);
    const isApproved = url.searchParams.get("isApproved");

    const where: any = {
      ...(isApproved !== null && isApproved !== undefined && isApproved !== ""
        ? { isApproved: isApproved === "true" }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.aiTrainingData.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.aiTrainingData.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(rows, total, page, pageSize));
  } catch (err) {
    console.error("feedback GET error", err);
    return NextResponse.json(
      { error: "Failed to load feedback" },
      { status: 500 }
    );
  }
}
