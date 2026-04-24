import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, PhoneCall, Bot, TrendingUp, Clock, CheckCircle, Sparkles, Mic, Brain, Heart, Globe, Languages, Ear, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/lib/utils";

async function getDashboardData(businessId: string) {
  const [agents, phoneNumbers, recentCalls, todayStats] = await Promise.all([
    prisma.agent.count({ where: { businessId, isActive: true } }),
    prisma.phoneNumber.count({ where: { businessId, status: "active" } }),
    prisma.call.findMany({
      where: { businessId },
      orderBy: { startTime: "desc" },
      take: 5,
      include: { agent: true },
    }),
    prisma.call.aggregate({
      where: {
        businessId,
        startTime: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _count: true,
      _avg: { duration: true },
    }),
  ]);

  return { agents, phoneNumbers, recentCalls, todayStats };
}

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData(session!.user.businessId);

  const stats = [
    {
      name: "Active Agents",
      value: data.agents,
      icon: Bot,
      href: "/agents",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Phone Numbers",
      value: data.phoneNumbers,
      icon: Phone,
      href: "/phone",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Calls Today",
      value: data.todayStats._count,
      icon: PhoneCall,
      href: "/calls",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "Avg Duration",
      value: data.todayStats._avg.duration
        ? formatDuration(Math.round(data.todayStats._avg.duration))
        : "0:00",
      icon: Clock,
      href: "/analytics",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {session?.user.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* AI Features */}
      <div>
        <h2 className="text-xl font-semibold mb-4">AI Features</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            { name: "Speech Enhancer", description: "Enhance speech clarity, grammar, and fluency", icon: Sparkles, href: "/ai/speech-enhancer", color: "text-violet-600", bgColor: "bg-violet-100" },
            { name: "Accent Adapter", description: "Adapt text between different accents and dialects", icon: Mic, href: "/ai/accent-adapter", color: "text-pink-600", bgColor: "bg-pink-100" },
            { name: "Intent Classifier", description: "Detect customer intent and extract entities", icon: Brain, href: "/ai/intent-classifier", color: "text-indigo-600", bgColor: "bg-indigo-100" },
            { name: "Emotion Detector", description: "Analyze emotions and sentiment in text", icon: Heart, href: "/ai/emotion-detector", color: "text-red-600", bgColor: "bg-red-100" },
            { name: "Multi-Language", description: "Detect and identify languages automatically", icon: Globe, href: "/ai/multi-language", color: "text-teal-600", bgColor: "bg-teal-100" },
            { name: "Translator", description: "Translate text between multiple languages", icon: Languages, href: "/ai/translator", color: "text-cyan-600", bgColor: "bg-cyan-100" },
            { name: "Hearing Test", description: "AI-powered audiological analysis and testing", icon: Ear, href: "/ai/hearing-test", color: "text-amber-600", bgColor: "bg-amber-100" },
          ].map((feature) => (
            <Link key={feature.name} href={feature.href}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer h-full">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${feature.bgColor}`}>
                      <feature.icon className={`h-5 w-5 ${feature.color}`} />
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold text-sm">{feature.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Calls</CardTitle>
              <CardDescription>Latest call activity</CardDescription>
            </div>
            <Link href="/calls">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentCalls.length > 0 ? (
              <div className="space-y-4">
                {data.recentCalls.map((call) => (
                  <div key={call.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        call.status === "completed" ? "bg-green-100" : "bg-yellow-100"
                      }`}>
                        <PhoneCall className={`h-4 w-4 ${
                          call.status === "completed" ? "text-green-600" : "text-yellow-600"
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{call.from}</p>
                        <p className="text-xs text-muted-foreground">
                          {call.agent?.name || "Unknown Agent"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{call.duration ? formatDuration(call.duration) : "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.startTime).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <PhoneCall className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No calls yet</p>
                <p className="text-sm">Calls will appear here once your agents start receiving them</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/agents/new" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Bot className="h-4 w-4 mr-2" />
                Create New Agent
              </Button>
            </Link>
            <Link href="/phone/provision" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Phone className="h-4 w-4 mr-2" />
                Get Phone Number
              </Button>
            </Link>
            <Link href="/integrations" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                Connect Integration
              </Button>
            </Link>
            <Link href="/settings" className="block">
              <Button variant="outline" className="w-full justify-start">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Setup
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
