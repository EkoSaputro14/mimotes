"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface CostData {
  provider: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgCostPerQuery: number;
}

export function CostSummary() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCost() {
      try {
        const res = await fetch("/api/dashboard/cost?days=30");
        const json = await res.json();
        setData(json);
      } catch {
        console.error("Failed to fetch cost data");
      } finally {
        setLoading(false);
      }
    }
    fetchCost();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Cost Estimation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Cost Estimation</CardTitle>
        <span className="text-xs text-muted-foreground capitalize">
          {data?.provider || "N/A"}
        </span>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <DollarSign className="size-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">
              ${data?.totalCost?.toFixed(2) || "0.00"}
            </p>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Input tokens</span>
            <span className="font-medium">
              {data?.totalInputTokens?.toLocaleString() || "0"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Output tokens</span>
            <span className="font-medium">
              {data?.totalOutputTokens?.toLocaleString() || "0"}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs border-t pt-2">
            <span className="text-muted-foreground">Avg cost/query</span>
            <span className="font-medium">
              ${data?.avgCostPerQuery?.toFixed(3) || "0.000"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
