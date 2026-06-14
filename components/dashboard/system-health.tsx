"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatTimeSafe } from "@/lib/date-utils";
import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HealthCheck {
  service: string;
  status: "ok" | "error" | "degraded";
  latency?: number;
  message?: string;
}

interface HealthData {
  status: "ok" | "error" | "degraded";
  checks: HealthCheck[];
  timestamp: string;
}

const serviceLabels: Record<string, string> = {
  database: "Database",
  vector_store: "Vector Store",
  ai_provider: "AI Provider",
};

interface SystemHealthProps {
  /** E1: Only show expanded view when there are issues */
  compact?: boolean;
}

export function SystemHealth({ compact = false }: SystemHealthProps) {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchHealth() {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/health");
      const json = await res.json();
      setData(json);
    } catch {
      console.error("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
  }, []);

  function StatusIcon({ status }: { status: string }) {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="size-4 text-emerald-500" />;
      case "degraded":
        return <AlertCircle className="size-4 text-amber-500" />;
      case "error":
        return <XCircle className="size-4 text-red-500" />;
      default:
        return <AlertCircle className="size-4 text-muted-foreground" />;
    }
  }

  const allOk = data?.status === "ok";

  // E1: Compact mode — show simple badge when all ok
  if (compact && allOk && !loading) {
    return (
      <div
        role="region"
        aria-label="Status sistem"
        className="bg-card border border-border/20 rounded-lg px-4 py-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-sm text-muted-foreground">Semua sistem berjalan normal</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={fetchHealth}
            className="text-muted-foreground"
            aria-label="Periksa ulang kesehatan sistem"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border/20 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium">System Health</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Status sistem" className="bg-card border border-border/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">System Health</h3>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={fetchHealth}
          className="text-muted-foreground"
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      {/* Top-level status badge */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-muted/50">
        <span className="relative flex size-2.5">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
              allOk ? "bg-emerald-500 animate-ping" : "bg-amber-500"
            }`}
          />
          <span
            className={`relative inline-flex size-2.5 rounded-full ${
              allOk ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>
        <span className="text-sm font-medium">
          {allOk ? "All systems operational" : "Some systems need attention"}
        </span>
      </div>

      {/* Detailed status list */}
      <div className="space-y-2">
        {data?.checks?.map((check) => (
          <div
            key={check.service}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <StatusIcon status={check.status} />
              <span className="text-sm">
                {serviceLabels[check.service] || check.service}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted-foreground capitalize">
                {check.status}
              </span>
              {check.latency !== undefined && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {check.latency}ms
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Vector Storage card */}
      <div className="mt-4 pt-4 border-t border-border/20">
        <div className="flex items-center gap-2 mb-2">
          <Database className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium">Vector Storage</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Embeddings stored</span>
          <span>
            {data?.checks?.find((c) => c.service === "vector_store")?.status === "ok"
              ? "Active"
              : "Unavailable"}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              allOk ? "bg-emerald-500" : "bg-amber-500"
            }`}
            style={{ width: allOk ? "72%" : "40%" }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {allOk ? "Vector store healthy — embeddings ready for search" : "Check vector store status"}
        </p>
      </div>

      {data?.timestamp && (
        <p className="mt-3 text-[10px] text-muted-foreground">
          Last checked: {formatTimeSafe(data.timestamp)}
        </p>
      )}
    </div>
  );
}
