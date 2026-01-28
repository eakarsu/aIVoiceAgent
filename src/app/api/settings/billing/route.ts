import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/settings/billing - Get subscription and usage data
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get subscription
    const subscription = await prisma.subscription.findFirst({
      where: { businessId: session.user.businessId },
      orderBy: { createdAt: "desc" },
    });

    // Get current month's usage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const usage = await prisma.usageBilling.findFirst({
      where: {
        businessId: session.user.businessId,
        month: {
          gte: startOfMonth,
        },
      },
      orderBy: { month: "desc" },
    });

    // Get call stats for current month
    const callStats = await prisma.call.aggregate({
      where: {
        businessId: session.user.businessId,
        startTime: {
          gte: startOfMonth,
        },
      },
      _count: true,
      _sum: {
        duration: true,
      },
    });

    // Get agent count
    const agentCount = await prisma.agent.count({
      where: { businessId: session.user.businessId },
    });

    // Plan limits based on subscription
    const planLimits: Record<string, { minutes: number; agents: number; price: number }> = {
      starter: { minutes: 1000, agents: 2, price: 29 },
      professional: { minutes: 5000, agents: 10, price: 99 },
      enterprise: { minutes: 20000, agents: 50, price: 299 },
      free: { minutes: 100, agents: 1, price: 0 },
    };

    const plan = subscription?.plan || "free";
    const limits = planLimits[plan] || planLimits.free;

    // Calculate actual usage
    const totalMinutes = Math.round((callStats._sum.duration || 0) / 60);
    const totalCalls = callStats._count || 0;

    // Features based on plan
    const planFeatures: Record<string, string[]> = {
      starter: ["basic_ivr", "voicemail", "recording"],
      professional: ["basic_ivr", "voicemail", "recording", "analytics", "integrations", "api_access"],
      enterprise: ["basic_ivr", "voicemail", "recording", "analytics", "integrations", "api_access", "custom_voice", "priority_support"],
      free: ["basic_ivr"],
    };

    return NextResponse.json({
      subscription: {
        plan: plan,
        status: subscription?.status || "active",
        price: limits.price,
        startDate: subscription?.startDate,
        endDate: subscription?.endDate,
        features: planFeatures[plan] || [],
      },
      usage: {
        callMinutes: totalMinutes,
        callMinutesLimit: limits.minutes,
        agents: agentCount,
        agentsLimit: limits.agents,
        totalCalls: totalCalls,
        aiTokens: usage?.aiTokens || 0,
        smsCount: usage?.smsCount || 0,
      },
      billing: {
        currentAmount: usage?.totalAmount || 0,
        isPaid: usage?.isPaid || false,
        paymentMethod: {
          type: "card",
          last4: "4242",
          brand: "Visa",
          expiryMonth: 12,
          expiryYear: 2025,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch billing:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing information" },
      { status: 500 }
    );
  }
}
