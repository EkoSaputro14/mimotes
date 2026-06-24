"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  previousValue?: string | number;
  suffix?: string;
  loading?: boolean;
}

function formatTrend(current: number, previous: number): { text: string; positive: boolean } {
  if (previous === 0) {
    return { text: current > 0 ? "Baru" : "0%", positive: current > 0 };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  return {
    text: `${rounded >= 0 ? "+" : ""}${rounded}%`,
    positive: rounded >= 0,
  };
}

export function KpiCard({
  icon,
  label,
  value,
  previousValue,
  suffix,
  loading = false,
}: KpiCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="mt-2 h-7 w-20" />
          <Skeleton className="mt-1 h-4 w-24" />
        </CardContent>
      </Card>
    );
  }

  const numericValue = typeof value === "number" ? value : parseFloat(String(value)) || 0;
  const numericPrevious = typeof previousValue === "number"
    ? previousValue
    : parseFloat(String(previousValue)) || 0;

  const trend =
    previousValue !== undefined
      ? formatTrend(numericValue, numericPrevious)
      : null;

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-lg text-muted-foreground">{icon}</span>
          {trend && (
            <span
              className={`text-xs font-medium ${
                trend.positive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.text}
            </span>
          )}
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
          {suffix && (
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}

export function KpiCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="mt-2 h-7 w-20" />
        <Skeleton className="mt-1 h-4 w-24" />
      </CardContent>
    </Card>
  );
}
