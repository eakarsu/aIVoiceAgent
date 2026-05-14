// POST /api/voice/incoming
// Twilio webhook: handles inbound calls and initiates the greeting / gather loop.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature, buildGreetingTwiML } from "@/services/twilio";

export async function POST(request: NextRequest) {
  try {
    // Parse the form-encoded body Twilio sends
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body).entries());

    const {
      CallSid: callSid,
      From: from,
      To: to,
      CallStatus: callStatus,
    } = params;

    // Optionally validate Twilio's signature in production
    const signature = request.headers.get("x-twilio-signature") || "";
    const url = `${process.env.NEXTAUTH_URL}/api/voice/incoming`;

    if (process.env.TWILIO_VALIDATE_SIGNATURE === "true") {
      const valid = verifyWebhookSignature(signature, url, params);
      if (!valid) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Find the phone number record and its linked agent
    const phoneNumberRecord = await prisma.phoneNumber.findFirst({
      where: { number: to },
      include: { agent: true, business: true },
    });

    const agent = phoneNumberRecord?.agent ?? null;
    const businessId = phoneNumberRecord?.businessId ?? null;

    // Greeting text: prefer agent greeting, fall back to a generic one
    const greeting = agent?.greeting ?? "Hello! How can I help you today?";

    // Create (or upsert) the call record in the DB
    const callRecord = await prisma.call.upsert({
      where: { callSid },
      create: {
        callSid,
        direction: "inbound",
        status: callStatus ?? "ringing",
        from,
        to,
        startTime: new Date(),
        businessId: businessId!,
        phoneNumberId: phoneNumberRecord?.id ?? null,
        agentId: agent?.id ?? null,
      },
      update: {
        status: callStatus ?? "ringing",
      },
    });

    // Save the initial system event
    await prisma.callEvent.create({
      data: {
        type: "answered",
        data: { callSid, from, to },
        callId: callRecord.id,
      },
    });

    const gatherUrl = `${process.env.NEXTAUTH_URL}/api/voice/gather?callId=${callRecord.id}`;

    const twiml = buildGreetingTwiML(greeting, gatherUrl);

    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error handling incoming call:", error);
    // Always return valid TwiML even on error so Twilio doesn't retry infinitely
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>We are experiencing technical difficulties. Please call back later.</Say>
  <Hangup/>
</Response>`;
    return new NextResponse(errorTwiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}
