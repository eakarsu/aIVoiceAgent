// Stripe metered billing helper for aIVoiceAgent.
// Plans (env-driven):
//   STRIPE_PRICE_AI_TOKENS, STRIPE_PRICE_CALL_MINUTES, STRIPE_PRICE_SMS
//
// We compute monthly UsageBilling totals and (optionally) report them to Stripe
// usage records when STRIPE_SECRET_KEY is configured. If Stripe is not set up
// the helper short-circuits and only writes the local UsageBilling row.

import prisma from "@/lib/prisma";

const PER_MIN_USD = Number(process.env.PRICE_PER_CALL_MINUTE ?? 0.05);
const PER_SMS_USD = Number(process.env.PRICE_PER_SMS ?? 0.02);
const PER_1K_TOKEN_USD = Number(process.env.PRICE_PER_1K_AI_TOKENS ?? 0.01);

export function calcUsageAmount(opts: {
  callMinutes?: number;
  smsCount?: number;
  aiTokens?: number;
}) {
  return (
    (opts.callMinutes || 0) * PER_MIN_USD +
    (opts.smsCount || 0) * PER_SMS_USD +
    ((opts.aiTokens || 0) / 1000) * PER_1K_TOKEN_USD
  );
}

export async function getOrCreateMonthRow(businessId: string) {
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);

  let row = await prisma.usageBilling.findFirst({
    where: { businessId, month },
  });
  if (!row) {
    row = await prisma.usageBilling.create({
      data: { businessId, month },
    });
  }
  return row;
}

export async function recordUsage(opts: {
  businessId: string;
  callMinutes?: number;
  smsCount?: number;
  aiTokens?: number;
}) {
  const month = new Date();
  month.setUTCDate(1);
  month.setUTCHours(0, 0, 0, 0);

  const row = await getOrCreateMonthRow(opts.businessId);

  const newCallMin = row.callMinutes + (opts.callMinutes || 0);
  const newSms = row.smsCount + (opts.smsCount || 0);
  const newTokens = row.aiTokens + (opts.aiTokens || 0);

  const totalAmount = calcUsageAmount({
    callMinutes: newCallMin,
    smsCount: newSms,
    aiTokens: newTokens,
  });

  await prisma.usageBilling.update({
    where: { id: row.id },
    data: {
      callMinutes: newCallMin,
      smsCount: newSms,
      aiTokens: newTokens,
      totalAmount,
    },
  });

  // Optional: report to Stripe usage records (no-op if not configured).
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_USAGE_REPORTING === "true") {
    try {
      // Lazy import so build doesn't require stripe pkg
      // @ts-ignore - Stripe pkg may not be installed; guarded.
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: "2024-09-30.acacia" as any,
      });

      // Map businessId -> stripe subscription item id via env JSON map.
      const subMap = process.env.STRIPE_SUB_ITEM_MAP
        ? JSON.parse(process.env.STRIPE_SUB_ITEM_MAP)
        : {};
      const itemId = subMap[opts.businessId];
      if (itemId) {
        if (opts.callMinutes) {
          await stripe.subscriptionItems.createUsageRecord(itemId, {
            quantity: opts.callMinutes,
            timestamp: Math.floor(Date.now() / 1000),
            action: "increment",
          });
        }
      }
    } catch (err) {
      console.warn("stripe usage report failed", err);
    }
  }
}
