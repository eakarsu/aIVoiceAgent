// POST /api/voice/recording
// Twilio recording-status callback. Persists recording URL/SID to the Call row,
// optionally pulls transcription text, and emits a webhook event.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyWebhookSignature, getRecording } from "@/services/twilio";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = Object.fromEntries(new URLSearchParams(body).entries());

    const {
      CallSid: callSid,
      RecordingSid: recordingSid,
      RecordingUrl: recordingUrl,
      RecordingStatus: recordingStatus,
      RecordingDuration: recordingDuration,
    } = params;

    // Optional Twilio signature validation
    if (process.env.TWILIO_VALIDATE_SIGNATURE === "true") {
      const signature = request.headers.get("x-twilio-signature") || "";
      const url = `${process.env.NEXTAUTH_URL}/api/voice/recording`;
      const ok = verifyWebhookSignature(signature, url, params);
      if (!ok) return new NextResponse("Forbidden", { status: 403 });
    }

    if (!callSid) {
      return NextResponse.json({ error: "CallSid required" }, { status: 400 });
    }

    const call = await prisma.call.findUnique({ where: { callSid } });
    if (!call) {
      // Provider may deliver before we know about the call — accept silently
      return NextResponse.json({ ok: true, note: "call not found" });
    }

    // Optional: pull recording media URL info from Twilio (presence check only)
    let mediaUrl: string | null = recordingUrl || null;
    if (recordingSid && process.env.TWILIO_FETCH_RECORDING_META === "true") {
      try {
        const meta = await getRecording(recordingSid);
        if (meta?.mediaUrl) mediaUrl = meta.mediaUrl;
      } catch (err) {
        console.warn("getRecording failed", err);
      }
    }

    await prisma.call.update({
      where: { id: call.id },
      data: {
        recordingUrl: mediaUrl,
        recordingSid: recordingSid || null,
        duration: recordingDuration
          ? Number(recordingDuration)
          : call.duration,
      },
    });

    await prisma.callEvent.create({
      data: {
        type: "recording",
        data: { recordingSid, recordingStatus, recordingDuration, mediaUrl },
        callId: call.id,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("recording webhook error", err);
    // Always 200 so Twilio doesn't infinite-retry
    return NextResponse.json({ ok: false });
  }
}
