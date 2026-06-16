"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
}

export function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </div>
            <Skeleton className="size-10 rounded-lg" />
          </div>
          <Skeleton className="mt-3 h-3 w-24" />
        </CardContent>
      </Card>
    );
  }

  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;
  const trendNeutral = trend === undefined || trend === 0;

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {/* E1: aria-live announces stat value to screen readers */}
            <p
              aria-live="polite"
              aria-atomic="true"
              className="mt-1 text-2xl font-bold tracking-tight text-foreground"
            >
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        {trend !== undefined && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            {trendPositive && <TrendingUp className="size-3.5 text-emerald-500" />}
            {trendNegative && <TrendingDown className="size-3.5 text-red-500" />}
            {trendNeutral && <Minus className="size-3.5 text-muted-foreground" />}
            <span
              className={cn(
                "font-medium",
                trendPositive && "text-emerald-600 dark:text-emerald-400",
                trendNegative && "text-red-600 dark:text-red-400",
                trendNeutral && "text-muted-foreground"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
            {trendLabel && (
              <span className="text-muted-foreground">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
