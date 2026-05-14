// Twilio Integration Service
// Handles telephony operations including calls, SMS, and phone number management

import twilio from "twilio";

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

function getClient(): twilio.Twilio {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
  }
  return twilio(accountSid, authToken);
}

// Phone Number Provisioning
export async function searchAvailableNumbers(
  countryCode: string = "US",
  areaCode?: string,
  type: "local" | "tollFree" | "mobile" = "local"
): Promise<{ number: string; friendlyName: string; capabilities: Record<string, boolean> }[]> {
  const client = getClient();

  try {
    let searchFn;
    if (type === "tollFree") {
      searchFn = client.availablePhoneNumbers(countryCode).tollFree.list;
    } else if (type === "mobile") {
      searchFn = client.availablePhoneNumbers(countryCode).mobile.list;
    } else {
      searchFn = client.availablePhoneNumbers(countryCode).local.list;
    }

    const params: Record<string, string | number> = { limit: 10 };
    if (areaCode) params.areaCode = areaCode;

    const numbers = await (type === "tollFree"
      ? client.availablePhoneNumbers(countryCode).tollFree.list(params)
      : type === "mobile"
      ? client.availablePhoneNumbers(countryCode).mobile.list(params)
      : client.availablePhoneNumbers(countryCode).local.list(params));

    return numbers.map((n) => ({
      number: n.phoneNumber,
      friendlyName: n.friendlyName,
      capabilities: {
        voice: n.capabilities.voice ?? false,
        sms: n.capabilities.sms ?? false,
        mms: n.capabilities.mms ?? false,
      },
    }));
  } catch (error) {
    console.error("Error searching Twilio numbers:", error);
    throw error;
  }
}

export async function provisionNumber(
  phoneNumber: string,
  webhookUrl: string
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const client = getClient();

  try {
    const number = await client.incomingPhoneNumbers.create({
      phoneNumber,
      voiceUrl: webhookUrl,
      voiceMethod: "POST",
      statusCallback: webhookUrl.replace("/incoming", "/status"),
      statusCallbackMethod: "POST",
    });

    return { success: true, sid: number.sid };
  } catch (error: any) {
    console.error("Error provisioning Twilio number:", error);
    return { success: false, error: error.message };
  }
}

export async function releaseNumber(sid: string): Promise<boolean> {
  const client = getClient();

  try {
    await client.incomingPhoneNumbers(sid).remove();
    return true;
  } catch (error) {
    console.error("Error releasing Twilio number:", error);
    return false;
  }
}

// Call Management

export async function makeOutboundCall(
  to: string,
  from: string,
  callbackUrl: string
): Promise<{ success: boolean; callSid?: string; error?: string }> {
  const client = getClient();

  try {
    const call = await client.calls.create({
      to,
      from,
      url: callbackUrl,
      method: "POST",
      statusCallback: callbackUrl.replace("/incoming", "/status"),
      statusCallbackMethod: "POST",
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
    });

    return { success: true, callSid: call.sid };
  } catch (error: any) {
    console.error("Error making outbound call:", error);
    return { success: false, error: error.message };
  }
}

// Keep original name as alias for backward compatibility
export const makeCall = makeOutboundCall;

export async function getCallStatus(
  callSid: string
): Promise<{ status: string; duration: string | null; direction: string } | null> {
  const client = getClient();

  try {
    const call = await client.calls(callSid).fetch();
    return {
      status: call.status,
      duration: call.duration,
      direction: call.direction,
    };
  } catch (error) {
    console.error("Error fetching call status:", error);
    return null;
  }
}

// Keep original name as alias
export const getCall = getCallStatus;

export async function endCall(callSid: string): Promise<boolean> {
  const client = getClient();

  try {
    await client.calls(callSid).update({ status: "completed" });
    return true;
  } catch (error) {
    console.error("Error ending call:", error);
    return false;
  }
}

// SMS Operations

export async function sendSMS(
  to: string,
  from: string,
  body: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  const client = getClient();

  try {
    const message = await client.messages.create({ to, from, body });
    return { success: true, messageSid: message.sid };
  } catch (error: any) {
    console.error("Error sending SMS:", error);
    return { success: false, error: error.message };
  }
}

// Call Recording

export async function getRecording(recordingSid: string) {
  const client = getClient();

  try {
    const recording = await client.recordings(recordingSid).fetch();
    return {
      sid: recording.sid,
      status: recording.status,
      duration: recording.duration,
      url: `https://api.twilio.com${recording.uri.replace(".json", ".mp3")}`,
    };
  } catch (error) {
    console.error("Error fetching recording:", error);
    return null;
  }
}

export async function deleteRecording(recordingSid: string): Promise<boolean> {
  const client = getClient();

  try {
    await client.recordings(recordingSid).remove();
    return true;
  } catch (error) {
    console.error("Error deleting recording:", error);
    return false;
  }
}

// Verify Twilio webhook signature
export function verifyWebhookSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) return false;

  try {
    return twilio.validateRequest(authToken, signature, url, params);
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
}

// TwiML Response Builders

export function buildGreetingTwiML(greeting: string, gatherUrl: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(greeting)}</Say>
  <Gather input="speech" action="${escapeXml(gatherUrl)}" method="POST" timeout="5" speechTimeout="auto">
    <Say voice="Polly.Joanna">Please tell me how I can help you.</Say>
  </Gather>
  <Say voice="Polly.Joanna">I didn't catch that. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

export function buildResponseTwiML(
  response: string,
  gatherUrl: string,
  shouldEnd: boolean = false
): string {
  if (shouldEnd) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(response)}</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(response)}</Say>
  <Gather input="speech" action="${escapeXml(gatherUrl)}" method="POST" timeout="5" speechTimeout="auto">
  </Gather>
  <Say voice="Polly.Joanna">Are you still there?</Say>
  <Hangup/>
</Response>`;
}

export function buildTransferTwiML(
  message: string,
  transferNumber: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(message)}</Say>
  <Dial>${escapeXml(transferNumber)}</Dial>
</Response>`;
}

export function buildVoicemailTwiML(
  message: string,
  recordingUrl: string
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(message)}</Say>
  <Record maxLength="120" action="${escapeXml(recordingUrl)}" transcribe="true" />
  <Say voice="Polly.Joanna">I did not receive a recording. Goodbye.</Say>
  <Hangup/>
</Response>`;
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
