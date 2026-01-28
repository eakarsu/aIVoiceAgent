"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  Phone,
  PhoneOff,
  Clock,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Users,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface Analytics {
  overview: {
    totalCalls: number;
    completedCalls: number;
    missedCalls: number;
    answerRate: number;
    avgDuration: number;
  };
  sentiment: { sentiment: string; count: number }[];
  callsByDay: { date: string; count: number }[];
  topAgents: { agentId: string; name: string; count: number }[];
  outcomes: { outcome: string; count: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("7d");
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (response.ok) {
        setAnalytics(await response.json());
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const sentimentColors = {
    positive: "bg-green-500",
    negative: "bg-red-500",
    neutral: "bg-gray-500",
  };

  const outcomeColors: Record<string, string> = {
    resolved: "bg-green-100 text-green-800",
    transferred: "bg-blue-100 text-blue-800",
    voicemail: "bg-yellow-100 text-yellow-800",
    abandoned: "bg-red-100 text-red-800",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Call performance and insights</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No data available</h3>
        <p className="text-muted-foreground">Analytics will appear once you start receiving calls</p>
      </div>
    );
  }

  const maxCalls = Math.max(...analytics.callsByDay.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Call performance and insights</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                <p className="text-3xl font-bold">{analytics.overview.totalCalls}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Answer Rate</p>
                <p className="text-3xl font-bold">{analytics.overview.answerRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missed Calls</p>
                <p className="text-3xl font-bold">{analytics.overview.missedCalls}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <PhoneOff className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-3xl font-bold">{formatDuration(analytics.overview.avgDuration)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Call Volume Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Call Volume</CardTitle>
            <CardDescription>Calls per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.callsByDay.length > 0 ? (
                analytics.callsByDay.map((day) => (
                  <div key={day.date} className="flex items-center space-x-2">
                    <span className="w-20 text-sm text-muted-foreground">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                      <div
                        className="h-full bg-primary rounded"
                        style={{ width: `${(day.count / maxCalls) * 100}%` }}
                      />
                    </div>
                    <span className="w-10 text-sm font-medium text-right">{day.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No calls in this period</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
            <CardDescription>Caller mood distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.sentiment.length > 0 ? (
              <div className="space-y-4">
                {analytics.sentiment.map((s) => {
                  const total = analytics.sentiment.reduce((sum, item) => sum + item.count, 0);
                  const percentage = total > 0 ? (s.count / total) * 100 : 0;
                  return (
                    <div key={s.sentiment} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {s.sentiment === "positive" && <ThumbsUp className="h-4 w-4 text-green-600" />}
                          {s.sentiment === "negative" && <ThumbsDown className="h-4 w-4 text-red-600" />}
                          {s.sentiment === "neutral" && <Minus className="h-4 w-4 text-gray-600" />}
                          <span className="capitalize">{s.sentiment}</span>
                        </div>
                        <span className="text-sm font-medium">{Math.round(percentage)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded overflow-hidden">
                        <div
                          className={`h-full ${sentimentColors[s.sentiment as keyof typeof sentimentColors] || "bg-gray-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ThumbsUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No sentiment data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Top Agents</CardTitle>
            <CardDescription>By call volume</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.topAgents.length > 0 ? (
              <div className="space-y-4">
                {analytics.topAgents.map((agent, index) => (
                  <div key={agent.agentId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{agent.name}</span>
                    </div>
                    <span className="font-medium">{agent.count} calls</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No agent data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle>Call Outcomes</CardTitle>
            <CardDescription>How calls are resolved</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.outcomes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analytics.outcomes.map((outcome) => (
                  <Badge
                    key={outcome.outcome}
                    className={outcomeColors[outcome.outcome] || "bg-gray-100 text-gray-800"}
                  >
                    {outcome.outcome}: {outcome.count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No outcome data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
