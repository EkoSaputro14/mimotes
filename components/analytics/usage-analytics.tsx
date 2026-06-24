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
  Legend,
} from "recharts";
import { formatDateSafe } from "@/lib/date-utils";
import { FileText, MessageSquare, Users, Upload, Search, Trash2, Settings, Zap, Activity, Clock, List, BarChart3 } from "lucide-react";
import { KpiCard } from "@/components/analytics/kpi-card";
import { ChartCard } from "@/components/analytics/chart-card";
import { DateRangeSelector } from "@/components/analytics/date-range-selector";
import { Skeleton } from "@/components/ui/skeleton";

type DateRange = "7d" | "30d" | "90d";

interface UsageData {
  kpis: {
    totalDocuments: number;
    previousDocuments: number;
    totalChats: number;
    previousChats: number;
    activeUsers: number;
    previousUsers: number;
    uploads: number;
    previousUploads: number;
    searches: number;
    previousSearches: number;
  };
  dailyActivity: { date: string; counts: Record<string, number> }[];
  featureAdoption: { feature: string; count: number }[];
  hourlyActivity: { dow: number; hour: number; count: number }[];
  recentEvents: {
    id: string;
    eventType: string;
    userName: string;
    metadata: unknown;
    createdAt: string;
  }[];
}

const EVENT_CONFIG: Record<string, { label: string; icon: React.ReactNode }> = {
  chat_message: { label: "Chat", icon: <MessageSquare className="size-4" /> },
  document_upload: { label: "Upload", icon: <Upload className="size-4" /> },
  document_delete: { label: "Delete", icon: <Trash2 className="size-4" /> },
  search_similarity: { label: "Search", icon: <Search className="size-4" /> },
  settings_update: { label: "Settings", icon: <Settings className="size-4" /> },
  session_create: { label: "Session", icon: <Zap className="size-4" /> },
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function UsageAnalytics() {
  const [range, setRange] = useState<DateRange>("30d");
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/usage?range=${range}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch usage analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build daily activity chart data
  const dailyChartData =
    data?.dailyActivity.map((d) => ({
      date: d.date,
      chats: d.counts["chat_message"] || 0,
      uploads: d.counts["document_upload"] || 0,
      searches: d.counts["search_similarity"] || 0,
    })) || [];

  // Build heatmap data
  const heatmapData = data?.hourlyActivity || [];
  const maxHeatmap = heatmapData.length
    ? Math.max(...heatmapData.map((h) => h.count))
    : 1;

  function getHeatColor(count: number): string {
    if (count === 0) return "bg-secondary";
    const intensity = count / maxHeatmap;
    if (intensity > 0.75) return "bg-primary";
    if (intensity > 0.5) return "bg-primary/70";
    if (intensity > 0.25) return "bg-primary/40";
    return "bg-primary/20";
  }

  function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
          <p className="text-muted-foreground text-sm">
            Track platform usage, feature adoption, and activity patterns
          </p>
        </div>
        <DateRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <KpiCard key={i} icon="" label="" value={0} loading />
          ))
        ) : data ? (
          <>
            <KpiCard
              icon={<FileText className="size-5" />}
              label="Documents Uploaded"
              value={data.kpis.totalDocuments}
              previousValue={data.kpis.previousDocuments}
            />
            <KpiCard
              icon={<MessageSquare className="size-5" />}
              label="Chat Sessions"
              value={data.kpis.totalChats}
              previousValue={data.kpis.previousChats}
            />
            <KpiCard
              icon={<Users className="size-5" />}
              label="Active Users"
              value={data.kpis.activeUsers}
              previousValue={data.kpis.previousUsers}
            />
            <KpiCard
              icon={<Upload className="size-5" />}
              label="Uploads"
              value={data.kpis.uploads}
              previousValue={data.kpis.previousUploads}
            />
            <KpiCard
              icon={<Search className="size-5" />}
              label="Searches"
              value={data.kpis.searches}
              previousValue={data.kpis.previousSearches}
            />
          </>
        ) : null}
      </div>

      {/* Activity Over Time */}
      {loading ? (
        <Skeleton className="h-[350px] w-full rounded-lg" />
      ) : dailyChartData.length > 0 ? (
        <ChartCard title="Activity Over Time" icon={<Activity className="size-4 text-muted-foreground" />}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyChartData}>
              <defs>
                <linearGradient id="colorChatsU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorUploadsU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSearchesU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
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
              <Legend />
              <Area
                type="monotone"
                dataKey="chats"
                stroke="hsl(var(--chart-1))"
                fill="url(#colorChatsU)"
                name="Chats"
              />
              <Area
                type="monotone"
                dataKey="uploads"
                stroke="hsl(var(--chart-2))"
                fill="url(#colorUploadsU)"
                name="Uploads"
              />
              <Area
                type="monotone"
                dataKey="searches"
                stroke="hsl(var(--chart-3))"
                fill="url(#colorSearchesU)"
                name="Searches"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      ) : null}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Feature Adoption */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="Feature Adoption" icon={<BarChart3 className="size-4 text-muted-foreground" />}>
            {data.featureAdoption.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No feature usage yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.featureAdoption} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                    name="Usage"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        ) : null}

        {/* Peak Usage Hours Heatmap */}
        {loading ? (
          <Skeleton className="h-[350px] w-full rounded-lg" />
        ) : data ? (
          <ChartCard title="Peak Usage Hours" icon={<Clock className="size-4 text-muted-foreground" />}>
            <div className="space-y-1">
              {/* Hour labels */}
              <div className="flex gap-0.5 ml-10 mb-1">
                {Array.from({ length: 24 }).map((_, h) => (
                  <div
                    key={h}
                    className="flex-1 text-center text-[9px] text-muted-foreground"
                  >
                    {h % 6 === 0 ? `${h}h` : ""}
                  </div>
                ))}
              </div>
              {/* Heatmap rows */}
              {DAY_LABELS.map((day, dow) => (
                <div key={dow} className="flex items-center gap-0.5">
                  <span className="w-10 text-xs text-muted-foreground text-right pr-1">
                    {day}
                  </span>
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const cell = heatmapData.find(
                      (h: { dow: number; hour: number; count: number }) =>
                        h.dow === dow && h.hour === hour
                    );
                    const count: number = cell?.count || 0;
                    return (
                      <div
                        key={hour}
                        className={`flex-1 h-5 rounded-sm ${getHeatColor(count)} transition-colors`}
                        title={`${day} ${hour}:00 — ${count} events`}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="h-3 w-3 rounded-sm bg-secondary" />
                <div className="h-3 w-3 rounded-sm bg-primary/20" />
                <div className="h-3 w-3 rounded-sm bg-primary/40" />
                <div className="h-3 w-3 rounded-sm bg-primary/70" />
                <div className="h-3 w-3 rounded-sm bg-primary" />
                <span>More</span>
              </div>
            </div>
          </ChartCard>
        ) : null}
      </div>

      {/* Recent Activity Log */}
      {loading ? (
        <Skeleton className="h-[300px] w-full rounded-lg" />
      ) : data ? (
        <ChartCard title="Recent Activity" icon={<List className="size-4 text-muted-foreground" />}>
          {data.recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <List className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="shrink-0 text-muted-foreground">
                    {EVENT_CONFIG[event.eventType]?.icon || <Zap className="size-4" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">
                      {event.userName}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      · {EVENT_CONFIG[event.eventType]?.label || event.eventType}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTimeAgo(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      ) : null}
    </div>
  );
}
