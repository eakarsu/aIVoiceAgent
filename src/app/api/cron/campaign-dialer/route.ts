// GET /api/cron/campaign-dialer
// Idempotent dialer worker. Picks up the next batch of pending contacts in any
// running campaign and dials them via Twilio. Designed to be invoked by a
// scheduler (Vercel cron, BullMQ poller, external curl, etc.).
//
// Auth: requires CRON_SECRET via `?token=` or `Authorization: Bearer <secret>`.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { makeOutboundCall } from "@/services/twilio";

export const dynamic = "force-dynamic";

const BATCH_SIZE = Number(process.env.CAMPAIGN_BATCH_SIZE || 5);
const MAX_ATTEMPTS = Number(process.env.CAMPAIGN_MAX_ATTEMPTS || 3);

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const fromQuery = req.nextUrl.searchParams.get("token");
  const fromHeader = req.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  return fromQuery === secret || fromHeader === secret;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const runningCampaigns = await prisma.campaign.findMany({
    where: { status: "running" },
    take: 20,
  });

  let dialed = 0;
  const results: Array<{ campaignId: string; contactId: string; ok: boolean }> = [];

  for (const camp of runningCampaigns) {
    const contacts = await prisma.campaignContact.findMany({
      where: {
        campaignId: camp.id,
        status: "pending",
        attempts: { lt: MAX_ATTEMPTS },
      },
      take: BATCH_SIZE,
    });

    if (contacts.length === 0) {
      // No pending — check if everything is terminal
      const remaining = await prisma.campaignContact.count({
        where: {
          campaignId: camp.id,
          status: { in: ["pending", "calling"] },
        },
      });
      if (remaining === 0) {
        await prisma.campaign.update({
          where: { id: camp.id },
          data: { status: "completed", completedAt: new Date() },
        });
      }
      continue;
    }

    const callbackUrl =
      camp.callbackUrl ?? `${process.env.NEXTAUTH_URL}/api/voice/incoming`;

    for (const c of contacts) {
      await prisma.campaignContact.update({
        where: { id: c.id },
        data: {
          status: "calling",
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      const outcome = await makeOutboundCall(
        c.phoneNumber,
        camp.fromNumber,
        callbackUrl
      );

      if (outcome.success && outcome.callSid) {
        const callRecord = await prisma.call.create({
          data: {
            callSid: outcome.callSid,
            direction: "outbound",
            status: "queued",
            from: camp.fromNumber,
            to: c.phoneNumber,
            businessId: camp.businessId,
            agentId: camp.agentId ?? null,
          },
        });
        await prisma.campaignContact.update({
          where: { id: c.id },
          data: { callSid: outcome.callSid, callId: callRecord.id },
        });
        dialed++;
        results.push({ campaignId: camp.id, contactId: c.id, ok: true });
      } else {
        await prisma.campaignContact.update({
          where: { id: c.id },
          data: {
            status:
              c.attempts + 1 >= MAX_ATTEMPTS ? "failed" : "pending",
          },
        });
        results.push({ campaignId: camp.id, contactId: c.id, ok: false });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    runningCampaigns: runningCampaigns.length,
    dialed,
    results,
  });
}
