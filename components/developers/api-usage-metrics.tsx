"use client";

import { useState, useEffect } from "react";

// ============================================================
// API Usage Metrics Component
// ============================================================

interface UsageSummary {
  totalRequests: number;
  avgLatencyMs: number;
  errorCount: number;
  errorRate: number;
  totalTokens: number;
  topEndpoints: Array<{
    endpoint: string;
    requests: number;
    avgLatencyMs: number;
  }>;
}

export function ApiUsageMetrics() {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Metrics would be fetched from a dedicated endpoint
    // For now, show placeholder
    setLoading(false);
  }, []);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading metrics...</p>;
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Usage Metrics (30 days)</h3>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={summary?.totalRequests ?? "—"} />
        <StatCard label="Avg Latency" value={summary?.avgLatencyMs ? `${summary.avgLatencyMs}ms` : "—"} />
        <StatCard label="Error Rate" value={summary?.errorRate !== undefined ? `${summary.errorRate}%` : "—"} />
        <StatCard label="Total Tokens" value={summary?.totalTokens ?? "—"} />
      </div>

      {/* Top endpoints */}
      {summary?.topEndpoints && summary.topEndpoints.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Top Endpoints</h4>
          <div className="space-y-1">
            {summary.topEndpoints.map((ep) => (
              <div
                key={ep.endpoint}
                className="flex items-center justify-between bg-card/50 rounded px-3 py-2 text-sm"
              >
                <code className="text-foreground font-mono">{ep.endpoint}</code>
                <div className="flex gap-4 text-muted-foreground">
                  <span>{ep.requests} reqs</span>
                  <span>{ep.avgLatencyMs}ms avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!summary && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-lg mb-2">📊 No API usage yet</p>
          <p className="text-sm">Start making API calls to see metrics here.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card/50 border border-border rounded-lg p-4">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="text-white text-xl font-bold">{value}</p>
    </div>
  );
}
