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

type DateRange = "7d" | "30d" | "90d";

interface ChatData {
  kpis: {
    totalSessions: number;
    previousSessions: number;
    todaySessions: number;
    avgMessages: number;
    sourceRate: number;
    avgSources: number;
  };
  dailyVolume: { date: string; count: number }[];
  responseQuality: {
    withSources: number;
    withoutSources: number;
    total: number;
    sourceRate: number;
  };
  topQuestions: { question: string; count: number }[];
  sessionDuration: { bucket: string; count: number }[];
  topDocuments: {
    id: string;
    title: string;
    fileType: string;
    references: number;
  }[];
}

const DURATION_COLORS: Record<string, string> = {
  "<1min": "hsl(var(--chart-1))",
  "1-5min": "hsl(var(--chart-2))",
  "5-15min": "hsl(var(--chart-3))",
  "15min+": "hsl(var(--chart-4))",
};

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  txt: "📃",
  csv: "📊",
  xlsx: "📗",
  xls: "📗",
  url: "🔗",
};

export default function ChatAnalytics() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/chat?range=${range}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch chat analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const maxRefs = data?.topDocuments?.length
    ? Math.max(...data.topDocuments.map((d) => d.references))
    : 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Deep dive into chat metrics and response quality
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <KpiCard
              key={i}
              icon=""
              label=""
              value={0}
              loading
            />
          ))
        ) : data ? (
          <>
            <KpiCard
              icon="💬"
              label="Total Sessions"
              value={data.kpis.totalSessions}
              previousValue={data.kpis.previousSessions}
            />
            <KpiCard
              icon="📅"
              label="Today's Sessions"
              value={data.kpis.todaySessions}
            />
            <KpiCard
              icon="📊"
              label="Avg Messages/Session"
              value={data.kpis.avgMessages}
              suffix="msgs"
            />
            <KpiCard
              icon="⏱"
              label="Source Rate"
              value={data.kpis.sourceRate}
              suffix="%"
            />
            <KpiCard
              icon="📎"
              label="Avg Sources/Response"
              value={data.kpis.avgSources}
            />
          </>
        ) : null}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Chat Volume Over Time */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📈 Chat Volume" icon="">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.dailyVolume}>
                <defs>
                  <linearGradient id="colorChats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
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
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={(v) =>
                    formatDateSafe(String(v))
                  }
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#colorChats)"
                  name="Sessions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        ) : null}

        {/* Response Quality */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📊 Response Quality" icon="">
            <div className="space-y-6 pt-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">With Sources</span>
                  <span className="font-medium">
                    {data.responseQuality.withSources} ({data.responseQuality.sourceRate}%)
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-success transition-all"
                    style={{ width: `${data.responseQuality.sourceRate}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Without Sources</span>
                  <span className="font-medium">
                    {data.responseQuality.withoutSources} ({100 - data.responseQuality.sourceRate}%)
                  </span>
                </div>
                <div className="h-4 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-orange-500 transition-all"
                    style={{ width: `${100 - data.responseQuality.sourceRate}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 text-center">
                <div className="text-3xl font-bold text-success">
                  {data.responseQuality.sourceRate}%
                </div>
                <div className="text-sm text-muted-foreground">Source Hit Rate</div>
              </div>
            </div>
          </ChartCard>
        ) : null}
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Top Questions */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📝 Top Questions" icon="">
            {data.topQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">💬</span>
                <p className="text-muted-foreground text-sm">No questions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.topQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm">{q.question}</span>
                    <span className="shrink-0 text-xs font-medium text-muted-foreground">
                      ×{q.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
        ) : null}

        {/* Session Duration */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="📊 Session Duration" icon="">
            {data.sessionDuration.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">⏱</span>
                <p className="text-muted-foreground text-sm">No session data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.sessionDuration}>
                  <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Sessions" radius={[4, 4, 0, 0]}>
                    {data.sessionDuration.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={DURATION_COLORS[entry.bucket] || "hsl(var(--chart-1))"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}
      </div>

      {/* Most Referenced Documents */}
      {loading ? (
        <Skeleton className="h-[250px] w-full rounded-lg" />
      ) : data ? (
        <ChartCard title="📄 Most Referenced Documents" icon="">
          {data.topDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-3">📚</span>
              <p className="text-muted-foreground text-sm">No document references yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.topDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3">
                  <span className="text-lg">
                    {FILE_ICONS[doc.fileType] || "📄"}
                  </span>
                  <span className="flex-1 truncate text-sm font-medium">
                    {doc.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-32 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${(doc.references / maxRefs) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs font-medium text-muted-foreground">
                      {doc.references} refs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      ) : null}
    </div>
  );
}
