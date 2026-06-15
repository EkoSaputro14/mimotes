"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "./stat-card";
import { formatDateSafe, formatDateTimeSafe, formatWeekdayShort } from "@/lib/date-utils";
import { Target, BarChart3, TrendingUp, AlertTriangle, Activity } from "lucide-react";

interface EvalMetrics {
  precisionAt5: number;
  recallAt5: number;
  mrr: number;
}

interface EvalHistory {
  runId: string;
  precisionAt5: number;
  recallAt5: number;
  mrr: number;
  avgLatencyMs: number;
  queryCount: number;
  createdAt: string;
}

interface EvalAnalytics {
  latestMetrics: EvalMetrics & { runId: string; createdAt: string } | null;
  history: EvalHistory[];
  byCategory: Array<{ category: string; avgPrecision: number; avgRecall: number; avgMrr: number; count: number }>;
  byDifficulty: Array<{ difficulty: string; avgPrecision: number; avgRecall: number; avgMrr: number; count: number }>;
  totalBenchmarkQueries: number;
  totalEvaluations: number;
  worstPerformers: Array<{ query: string; category: string; difficulty: string; precisionAt5: number; recallAt5: number; mrr: number; latencyMs: number }>;
}

interface EvaluationAnalyticsWidgetProps {
  days?: number;
}

export function EvaluationAnalyticsWidget({ days = 30 }: EvaluationAnalyticsWidgetProps) {
  const [data, setData] = useState<EvalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/evaluation?days=${days}`);
        if (!response.ok) throw new Error("Failed to fetch evaluation analytics");
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
          <p className="text-sm text-destructive">Error loading evaluation analytics: {error}</p>
        </CardContent>
      </Card>
    );
  }

  const fmt = (n: number) => (n * 100).toFixed(1) + "%";

  return (
    <div className="space-y-4">
      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Target className="size-5" />}
          label="Precision@5"
          value={data?.latestMetrics ? fmt(data.latestMetrics.precisionAt5) : "—"}
          loading={loading}
        />
        <StatCard
          icon={<BarChart3 className="size-5" />}
          label="Recall@5"
          value={data?.latestMetrics ? fmt(data.latestMetrics.recallAt5) : "—"}
          loading={loading}
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          label="MRR"
          value={data?.latestMetrics ? fmt(data.latestMetrics.mrr) : "—"}
          loading={loading}
        />
        <StatCard
          icon={<Activity className="size-5" />}
          label="Benchmark Queries"
          value={data?.totalBenchmarkQueries ?? 0}
          trend={data?.totalEvaluations ? data.totalEvaluations : undefined}
          trendLabel="evaluations run"
          loading={loading}
        />
      </div>

      {/* Metrics by Category + Difficulty */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Target className="size-4" />
              Metrics by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : data?.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evaluations yet. Run the eval script first.</p>
            ) : (
              <div className="space-y-3">
                {data?.byCategory.map((c) => (
                  <div key={c.category} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{c.category}</span>
                      <span className="text-xs text-muted-foreground">{c.count} queries</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>P: {fmt(c.avgPrecision)}</span>
                      <span>R: {fmt(c.avgRecall)}</span>
                      <span>MRR: {fmt(c.avgMrr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <Activity className="size-4" />
              Metrics by Difficulty
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-12 animate-pulse rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : data?.byDifficulty.length === 0 ? (
              <p className="text-sm text-muted-foreground">No evaluations yet.</p>
            ) : (
              <div className="space-y-3">
                {data?.byDifficulty.map((d) => (
                  <div key={d.difficulty} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{d.difficulty}</span>
                      <span className="text-xs text-muted-foreground">{d.count} queries</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <span>P: {fmt(d.avgPrecision)}</span>
                      <span>R: {fmt(d.avgRecall)}</span>
                      <span>MRR: {fmt(d.avgMrr)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benchmark History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="size-4" />
            Benchmark History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : data?.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No benchmark runs yet. Run: npx tsx scripts/run-rag-eval.ts</p>
          ) : (
            <div className="space-y-3">
              {data?.history.map((h) => (
                <div key={h.runId} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTimeSafe(h.createdAt)}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">({h.queryCount} queries)</span>
                  </div>
                  <div className="flex gap-4 text-xs font-medium">
                    <span>P: {fmt(h.precisionAt5)}</span>
                    <span>R: {fmt(h.recallAt5)}</span>
                    <span>MRR: {fmt(h.mrr)}</span>
                    <span className="text-muted-foreground">{h.avgLatencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Worst Performers */}
      {data?.worstPerformers && data.worstPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4" />
              Worst Performers (Lowest MRR)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.worstPerformers.map((w, i) => (
                <div key={i} className="flex items-start justify-between border-b pb-2 last:border-0">
                  <div className="flex-1">
                    <span className="text-sm">{w.query}</span>
                    <div className="flex gap-2 mt-0.5">
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize">{w.category}</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize">{w.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-right shrink-0 ml-4">
                    <span>P: {fmt(w.precisionAt5)}</span>
                    <span>R: {fmt(w.recallAt5)}</span>
                    <span className="font-medium">MRR: {fmt(w.mrr)}</span>
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
