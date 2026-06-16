"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

interface LeadAnalyticsData {
  totalLeads: number;
  conversionRate: number;
  leadsByStatus: Record<string, number>;
  leadsByScore: Record<string, number>;
  topIntents: { intent: string; count: number }[];
  knowledgeGaps: {
    totalMessages: number;
    gapCount: number;
    gapRate: number;
  };
  dailyTrend: { date: string; count: number }[];
  recentHighLeads: {
    id: string;
    leadName: string | null;
    leadEmail: string | null;
    leadScore: string;
    leadStatus: string;
    leadIntent: string | null;
    startedAt: string;
    widget: { name: string } | null;
  }[];
  period: { days: number; startDate: string };
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-primary",
  contacted: "bg-warning",
  qualified: "bg-orange-500",
  converted: "bg-success",
  lost: "bg-muted",
};

const SCORE_COLORS: Record<string, string> = {
  high: "bg-destructive",
  medium: "bg-warning",
  low: "bg-muted",
};

export function LeadAnalytics() {
  const [data, setData] = useState<LeadAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/leads?days=${days}`);
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Failed to fetch lead analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-20 animate-pulse bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statusEntries = Object.entries(data.leadsByStatus);
  const scoreEntries = Object.entries(data.leadsByScore);
  const maxDaily = Math.max(...data.dailyTrend.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Lead Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Track lead conversion, intent distribution, and knowledge gaps.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm bg-background"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Total Leads
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {data.totalLeads}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Users className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Conversion Rate
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {data.conversionRate}%
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-success/10 text-success">
                <TrendingUp className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  High-Intent Leads
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {data.leadsByScore["high"] || 0}
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Zap className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Knowledge Gap Rate
                </p>
                <p className="mt-1 text-3xl font-bold text-foreground">
                  {data.knowledgeGaps.gapRate}%
                </p>
              </div>
              <div className="flex size-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <AlertTriangle className="size-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5" />
              Leads by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const percentage =
                  data.totalLeads > 0
                    ? Math.round((count / data.totalLeads) * 100)
                    : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STATUS_COLORS[status] || "bg-muted"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {statusEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No leads yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leads by Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-5" />
              Leads by Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scoreEntries.map(([score, count]) => {
                const percentage =
                  data.totalLeads > 0
                    ? Math.round((count / data.totalLeads) * 100)
                    : 0;
                return (
                  <div key={score} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{score}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SCORE_COLORS[score] || "bg-muted"}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {scoreEntries.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No leads yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Lead Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyTrend.length > 0 ? (
            <div className="flex items-end gap-1 h-32">
              {data.dailyTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="w-full bg-primary/20 rounded-t" style={{ height: `${(day.count / maxDaily) * 100}%`, minHeight: day.count > 0 ? "4px" : "0" }}>
                    <div className="w-full bg-primary rounded-t" style={{ height: "100%" }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {day.date.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No data for this period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Intents & Knowledge Gaps */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Intents</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topIntents.length > 0 ? (
              <div className="space-y-2">
                {data.topIntents.map((item, i) => (
                  <div
                    key={item.intent}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-5">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {item.intent}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No intent data yet
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Gaps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-foreground">
                  {data.knowledgeGaps.gapRate}%
                </p>
                <p className="text-sm text-muted-foreground">
                  of responses had no matching source
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {data.knowledgeGaps.totalMessages}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total Responses
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold">
                    {data.knowledgeGaps.gapCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Without Sources
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent High Leads */}
      {data.recentHighLeads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="size-5 text-destructive" />
              Recent High-Intent Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.recentHighLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {lead.leadName || lead.leadEmail || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.leadIntent ? `Intent: ${lead.leadIntent}` : "No intent"}{" "}
                      • {lead.widget?.name || "Widget"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                      {lead.leadStatus}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(lead.startedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
