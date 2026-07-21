// POST /api/campaigns/:id/start
// Fetches pending campaign contacts and initiates an outbound Twilio call for each.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentBusinessId } from "@/lib/session";
import { makeOutboundCall } from "@/services/twilio";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Load the campaign (must belong to this business)
    const campaign = await prisma.campaign.findFirst({
      where: { id: (await params).id, businessId },
      include: {
        contacts: {
          where: { status: "pending" },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status === "running") {
      return NextResponse.json({ error: "Campaign is already running" }, { status: 409 });
    }

    if (campaign.contacts.length === 0) {
      return NextResponse.json(
        { error: "No pending contacts in this campaign" },
        { status: 400 }
      );
    }

    // Mark the campaign as running
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "running", startedAt: new Date() },
    });

    // The TwiML callback URL for outbound calls.
    // We reuse the same /api/voice/incoming webhook so the same AI loop handles both
    // inbound and outbound calls.
    const callbackUrl =
      campaign.callbackUrl ??
      `${process.env.NEXTAUTH_URL}/api/voice/incoming`;

    const results: {
      contactId: string;
      phoneNumber: string;
      success: boolean;
      callSid?: string;
      error?: string;
    }[] = [];

    for (const contact of campaign.contacts) {
      // Mark as calling before we hit Twilio (prevents double-dialling on retry)
      await prisma.campaignContact.update({
        where: { id: contact.id },
        data: {
          status: "calling",
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      const outcome = await makeOutboundCall(
        contact.phoneNumber,
        campaign.fromNumber,
        callbackUrl
      );

      if (outcome.success && outcome.callSid) {
        // Create a Call record in the DB so the status webhook can update it
        const callRecord = await prisma.call.create({
          data: {
            callSid: outcome.callSid,
            direction: "outbound",
            status: "queued",
            from: campaign.fromNumber,
            to: contact.phoneNumber,
            businessId,
            agentId: campaign.agentId ?? null,
          },
        });

        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: {
            callSid: outcome.callSid,
            callId: callRecord.id,
            status: "calling",
          },
        });

        results.push({
          contactId: contact.id,
          phoneNumber: contact.phoneNumber,
          success: true,
          callSid: outcome.callSid,
        });
      } else {
        await prisma.campaignContact.update({
          where: { id: contact.id },
          data: { status: "failed" },
        });

        results.push({
          contactId: contact.id,
          phoneNumber: contact.phoneNumber,
          success: false,
          error: outcome.error,
        });
      }
    }

    // If all contacts failed immediately, mark campaign as failed
    const anySuccess = results.some((r) => r.success);
    if (!anySuccess) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "failed", completedAt: new Date() },
      });
    }

    return NextResponse.json({
      campaignId: campaign.id,
      contactsDialed: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    console.error("Error starting campaign:", error);
    return NextResponse.json({ error: "Failed to start campaign" }, { status: 500 });
  }
}
