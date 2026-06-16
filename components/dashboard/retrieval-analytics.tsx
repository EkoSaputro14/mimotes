"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./stat-card";
import { formatWeekdayShort } from "@/lib/date-utils";
import { BarChart3, Clock, Zap, Search, CheckCircle, Activity } from "lucide-react";

interface RetrievalAnalytics {
  totalSearches: number;
  avgLatency: {
    total: number;
    embedding: number;
    search: number;
    reranker: number;
  };
  hybridUsage: {
    hybridCount: number;
    totalCount: number;
    percentage: number;
  };
  topQueries: Array<{ query: string; count: number; avgLatency: number }>;
  successRate: {
    successCount: number;
    totalCount: number;
    percentage: number;
  };
  dailyTrend: Array<{ date: string; count: number; avgLatency: number }>;
  modeDistribution: Array<{ mode: string; count: number }>;
}

interface RetrievalAnalyticsWidgetProps {
  workspaceId?: string;
  days?: number;
}

export function RetrievalAnalyticsWidget({ days = 7 }: RetrievalAnalyticsWidgetProps) {
  const [data, setData] = useState<RetrievalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/retrieval?days=${days}`);
        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [days]);

  if (error) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-6">
          <p className="text-sm text-destructive">Error loading analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<BarChart3 className="size-5" />}
          label="Total Searches"
          value={data?.totalSearches ?? 0}
          loading={loading}
        />
        <StatCard
          icon={<Clock className="size-5" />}
          label="Avg Latency"
          value={data ? `${data.avgLatency.total}ms` : "0ms"}
          loading={loading}
        />
        <StatCard
          icon={<Zap className="size-5" />}
          label="Hybrid Usage"
          value={data ? `${data.hybridUsage.percentage}%` : "0%"}
          trend={data?.hybridUsage.percentage ? data.hybridUsage.percentage - 50 : undefined}
          trendLabel="vs vector-only"
          loading={loading}
        />
        <StatCard
          icon={<CheckCircle className="size-5" />}
          label="Success Rate"
          value={data ? `${data.successRate.percentage}%` : "0%"}
          loading={loading}
        />
      </div>

      {/* Latency Breakdown + Top Queries */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Latency Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Clock className="size-4" />
              Latency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Embedding</span>
                  <span className="font-medium">{data?.avgLatency.embedding ?? 0}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Search</span>
                  <span className="font-medium">{data?.avgLatency.search ?? 0}ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reranker</span>
                  <span className="font-medium">{data?.avgLatency.reranker ?? 0}ms</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-bold">{data?.avgLatency.total ?? 0}ms</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Search className="size-4" />
              Top Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-8 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : data?.topQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground">No queries yet</p>
            ) : (
              <div className="space-y-3">
                {data?.topQueries.map((q, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="truncate text-sm" title={q.query}>
                      {q.query}
                    </span>
                    <span className="ml-4 shrink-0 text-xs text-muted-foreground">
                      {q.count}x
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Search Mode Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Activity className="size-4" />
            Search Mode Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 w-24 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data?.modeDistribution.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {data?.modeDistribution.map((m, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium capitalize">
                    {m.mode}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {m.count} ({data.totalSearches > 0 ? Math.round((m.count / data.totalSearches) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <BarChart3 className="size-4" />
            Daily Volume Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : data?.dailyTrend.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            <div className="flex items-end gap-1">
              {data?.dailyTrend.map((d, i) => {
                const maxCount = Math.max(...(data?.dailyTrend.map((t) => t.count) || [1]));
                const height = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{d.count}</span>
                    <div
                      className="w-full rounded bg-primary/20 transition-all hover:bg-primary/40"
                      style={{ height: `${Math.max(height, 4)}px` }}
                      title={`${d.date}: ${d.count} searches, avg ${d.avgLatency}ms`}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {formatWeekdayShort(d.date)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
