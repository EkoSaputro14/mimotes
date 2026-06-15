"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { formatDateSafe } from "@/lib/date-utils";
import { KpiCard } from "@/components/analytics/kpi-card";
import { ChartCard } from "@/components/analytics/chart-card";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

type DateRange = "7d" | "30d" | "90d";

interface CostData {
  kpis: {
    estimatedCost: number;
    previousCost: number;
    avgCostPerQuery: number;
    inputTokens: number;
    previousInputTokens: number;
    outputTokens: number;
    previousOutputTokens: number;
  };
  costOverTime: {
    date: string;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    inputTokens: number;
    outputTokens: number;
  }[];
  tokenBreakdown: {
    chatInput: number;
    chatOutput: number;
    total: number;
    chatInputPct: number;
    chatOutputPct: number;
  };
  costByModel: {
    model: string;
    provider: string;
    tokens: number;
    cost: number;
  }[];
  message: string;
}

const TOKEN_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))"];

export default function CostAnalytics() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/cost?range=${range}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch cost analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cost Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track and estimate AI provider costs based on token usage
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <KpiCard key={i} icon="" label="" value={0} loading />
          ))
        ) : data ? (
          <>
            <KpiCard
              icon="💵"
              label="Estimated Cost"
              value={`$${data.kpis.estimatedCost.toFixed(2)}`}
              previousValue={`$${data.kpis.previousCost.toFixed(2)}`}
            />
            <KpiCard
              icon="🪙"
              label="Avg Cost/Query"
              value={`$${data.kpis.avgCostPerQuery.toFixed(4)}`}
            />
            <KpiCard
              icon="📥"
              label="Input Tokens"
              value={data.kpis.inputTokens}
              previousValue={data.kpis.previousInputTokens}
            />
            <KpiCard
              icon="📤"
              label="Output Tokens"
              value={data.kpis.outputTokens}
              previousValue={data.kpis.previousOutputTokens}
            />
          </>
        ) : null}
      </div>

      {/* Cost Over Time */}
      {loading ? (
        <Skeleton className="h-[350px] w-full rounded-lg" />
      ) : data && data.costOverTime.length > 0 ? (
        <ChartCard title="💰 Cost Over Time" icon="">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.costOverTime}>
              <defs>
                <linearGradient id="colorInput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorOutput" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                labelFormatter={(v) =>
                  formatDateSafe(String(v))
                }
                formatter={(value, name) => [
                  `$${Number(value).toFixed(4)}`,
                  String(name),
                ]}
              />
              <Area
                type="monotone"
                dataKey="inputCost"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorInput)"
                name="Input Cost"
                stackId="1"
              />
              <Area
                type="monotone"
                dataKey="outputCost"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorOutput)"
                name="Output Cost"
                stackId="1"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Token Breakdown */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📊 Token Breakdown" icon="">
            <div className="space-y-6 pt-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Chat Input Tokens
                  </span>
                  <span className="font-medium">
                    {data.tokenBreakdown.chatInput.toLocaleString()} ({data.tokenBreakdown.chatInputPct}%)
                  </span>
                </div>
                <div className="h-5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.tokenBreakdown.chatInputPct}%`,
                      backgroundColor: TOKEN_COLORS[0],
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Chat Output Tokens
                  </span>
                  <span className="font-medium">
                    {data.tokenBreakdown.chatOutput.toLocaleString()} ({data.tokenBreakdown.chatOutputPct}%)
                  </span>
                </div>
                <div className="h-5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data.tokenBreakdown.chatOutputPct}%`,
                      backgroundColor: TOKEN_COLORS[1],
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-center pt-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {data.tokenBreakdown.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Tokens Estimated
                  </div>
                </div>
              </div>
            </div>
          </ChartCard>
        ) : null}

        {/* Cost by Model Table */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📋 Cost by Model">
            {data.costByModel.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">📋</span>
                <p className="text-muted-foreground text-sm">No model data yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Model
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-muted-foreground">
                          Provider
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                          Tokens
                        </th>
                        <th className="text-right py-2 px-3 font-medium text-muted-foreground">
                          Est. Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.costByModel.map((model, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-3 font-medium">
                            {model.model}
                          </td>
                          <td className="py-3 px-3 text-muted-foreground capitalize">
                            {model.provider}
                          </td>
                          <td className="py-3 px-3 text-right tabular-nums">
                            {model.tokens.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-medium tabular-nums">
                            ${model.cost.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground px-3">
                  {data.message}
                </p>
              </div>
            )}
          </ChartCard>
        ) : null}
      </div>

      {/* Note */}
      {!loading && data && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Note:</strong> {data.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
