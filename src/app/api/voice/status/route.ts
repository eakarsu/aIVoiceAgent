// POST /api/voice/status
// Twilio status-callback webhook: updates the call record as the call progresses.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateCallSummary } from "@/services/ai";
import { recordUsage } from "@/lib/billing";
import { verifyWebhookSignature } from "@/services/twilio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body).entries());

    const {
      CallSid: callSid,
      CallStatus: callStatus,
      CallDuration: callDuration,
      RecordingUrl: recordingUrl,
      RecordingSid: recordingSid,
    } = params;

    if (!callSid) {
      return NextResponse.json({ error: "Missing CallSid" }, { status: 400 });
    }

    // Always validate Twilio signature on the status webhook in production.
    if (process.env.TWILIO_VALIDATE_SIGNATURE === "true") {
      const signature = request.headers.get("x-twilio-signature") || "";
      const url = `${process.env.NEXTAUTH_URL}/api/voice/status`;
      const ok = verifyWebhookSignature(signature, url, params);
      if (!ok) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Map Twilio statuses to our DB enum values
    const normalizedStatus = callStatus ?? "unknown";

    const updateData: Record<string, unknown> = {
      status: normalizedStatus,
    };

    if (callDuration) {
      updateData.duration = parseInt(callDuration, 10);
    }

    if (recordingUrl) {
      updateData.recordingUrl = recordingUrl;
    }

    if (recordingSid) {
      updateData.recordingSid = recordingSid;
    }

    // Mark end time when the call is terminal
    const terminalStatuses = ["completed", "failed", "busy", "no-answer", "canceled"];
    if (terminalStatuses.includes(normalizedStatus)) {
      updateData.endTime = new Date();
    }

    const call = await prisma.call.update({
      where: { callSid },
      data: updateData,
      include: { messages: true },
    });

    // Save status-change event
    await prisma.callEvent.create({
      data: {
        type: "status_change",
        data: { callStatus: normalizedStatus, callDuration },
        callId: call.id,
      },
    });

    // When the call ends, generate an AI summary if there was conversation
    if (normalizedStatus === "completed" && call.messages.length > 0) {
      try {
        const messages = call.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const summary = await generateCallSummary(messages);

        await prisma.call.update({
          where: { id: call.id },
          data: { summary },
        });
      } catch (summaryError) {
        console.error("Error generating call summary:", summaryError);
        // Non-fatal — don't fail the webhook
      }
    }

    // Increment usage billing for the business (also reports to Stripe if enabled)
    if (normalizedStatus === "completed" && callDuration && call.businessId) {
      const durationMinutes = Math.ceil(parseInt(callDuration, 10) / 60);
      await recordUsage({
        businessId: call.businessId,
        callMinutes: durationMinutes,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error handling call status callback:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
