"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditLog {
  id: string;
  actorId: string | null;
  actorType: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AuditSummary {
  totalEvents: number;
  topActions: Array<{ action: string; count: number }>;
  topActors: Array<{ actorId: string; count: number }>;
  dailyCounts: Array<{ date: string; count: number }>;
}

const ACTION_COLORS: Record<string, string> = {
  auth: "bg-primary",
  api_key: "bg-purple-600",
  widget: "bg-success",
  document: "bg-warning",
  billing: "bg-destructive",
  subscription: "bg-orange-600",
  member: "bg-cyan-600",
  mcp: "bg-pink-600",
  workspace: "bg-muted",
};

function getActionColor(action: string) {
  const prefix = action.split(".")[0];
  return ACTION_COLORS[prefix] || "bg-muted";
}

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [summary, setSummary] = useState<AuditSummary | null>(null);

  const fetchLogs = useCallback(async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * 50;
    const params = new URLSearchParams({
      limit: "50",
      offset: String(offset),
    });
    if (search) params.set("search", search);
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resourceType", resourceFilter);

    try {
      const res = await fetch(`/api/audit?${params}`);
      const data = await res.json();
      if (reset) {
        setLogs(data.logs || []);
        setPage(0);
      } else {
        setLogs((prev) => [...prev, ...(data.logs || [])]);
      }
      setTotal(data.total || 0);
      setHasMore(data.hasMore || false);
    } catch {
      // Feature not available
    } finally {
      setLoading(false);
    }
  }, [page, search, actionFilter, resourceFilter]);

  const fetchSummary = async () => {
    try {
      const res = await fetch("/api/audit?summary=true");
      const data = await res.json();
      setSummary(data);
    } catch {
      // Feature not available
    }
  };

  useEffect(() => {
    fetchLogs(true);
    fetchSummary();
  }, [actionFilter, resourceFilter]);

  function handleSearch() {
    fetchLogs(true);
  }

  function handleExport() {
    const params = new URLSearchParams({ format: "csv" });
    if (actionFilter) params.set("action", actionFilter);
    if (resourceFilter) params.set("resourceType", resourceFilter);
    window.open(`/api/audit?${params}`, "_blank");
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs mb-1">Total Events (30d)</p>
            <p className="text-foreground text-2xl font-bold">{summary.totalEvents.toLocaleString()}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs mb-1">Top Action</p>
            <p className="text-foreground text-sm font-mono">{summary.topActions[0]?.action || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs mb-1">Most Active Actor</p>
            <p className="text-foreground text-sm font-mono truncate">{summary.topActors[0]?.actorId || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-muted-foreground text-xs mb-1">Unique Actions</p>
            <p className="text-foreground text-2xl font-bold">{summary.topActions.length}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search logs..."
            className="w-full bg-background border border-border rounded-lg px-4 py-2 text-foreground text-sm"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
        >
          <option value="">All Actions</option>
          <option value="auth.">Auth</option>
          <option value="api_key.">API Keys</option>
          <option value="widget.">Widgets</option>
          <option value="document.">Documents</option>
          <option value="billing.">Billing</option>
          <option value="subscription.">Subscriptions</option>
          <option value="member.">Members</option>
          <option value="mcp.">MCP</option>
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
          className="bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
        >
          <option value="">All Resources</option>
          <option value="api_key">API Keys</option>
          <option value="widget">Widgets</option>
          <option value="document">Documents</option>
          <option value="member">Members</option>
          <option value="mcp_server">MCP Servers</option>
        </select>
        <button onClick={handleSearch} className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm">
          🔍 Search
        </button>
        <button onClick={handleExport} className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-lg text-sm">
          📥 Export CSV
        </button>
      </div>

      {/* Results count */}
      <p className="text-muted-foreground text-sm">
        {total.toLocaleString()} events found
      </p>

      {/* Log entries */}
      {loading && logs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">Loading...</p>
      ) : logs.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">No audit logs found.</p>
      ) : (
        <div className="space-y-1">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-3 bg-muted/30 border border-border/50 rounded-lg px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              {/* Action badge */}
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-mono text-primary-foreground flex-shrink-0 ${getActionColor(log.action)}`}>
                {log.action}
              </span>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm">
                  {log.resourceType && (
                    <span className="text-muted-foreground">
                      {log.resourceType}
                      {log.resourceId && <span className="text-muted-foreground/70 ml-1">({log.resourceId.substring(0, 8)}...)</span>}
                    </span>
                  )}
                </div>
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <p className="text-muted-foreground text-xs mt-1 font-mono truncate">
                    {JSON.stringify(log.metadata)}
                  </p>
                )}
              </div>

              {/* Actor + Time */}
              <div className="text-right flex-shrink-0">
                <p className="text-muted-foreground text-xs font-mono">{log.actorId?.substring(0, 12) || "system"}</p>
                <p className="text-muted-foreground/70 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => { setPage((p) => p + 1); fetchLogs(false); }}
          disabled={loading}
          className="w-full bg-muted hover:bg-muted/80 text-foreground py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {loading ? "Loading..." : "Load More"}
        </button>
      )}
    </div>
  );
}
