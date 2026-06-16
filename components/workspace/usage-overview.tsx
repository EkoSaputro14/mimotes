"use client";

import { useState, useEffect } from "react";
import { Loader2, FileText, HardDrive, MessageSquare, Brain, Link2, Puzzle, BarChart3 } from "lucide-react";
import { formatDateSafe } from "@/lib/date-utils";

interface UsageData {
  period: string;
  documents: { used: number; limit: number; percent: number };
  storage: { used: number; limit: number; percent: number };
  chatMessages: { used: number; limit: number; percent: number };
  chunks: { used: number; limit: number; percent: number };
  aiRequests: { used: number; limit: number; percent: number };
  embeddingRequests: { used: number; limit: number; percent: number };
  mcpExecutions: { used: number; limit: number; percent: number };
}

interface SubscriptionData {
  status: string;
  plan: { name: string; displayName: string; description: string | null };
  trialEndsAt: string | null;
}

interface SubscriptionResponse {
  subscription: SubscriptionData;
  usage: UsageData;
  plans: Array<{
    name: string;
    displayName: string;
    description: string | null;
    maxDocuments: number;
    maxStorageMB: number;
    maxChatMessages: number;
    maxMembers: number;
  }>;
}

function formatLimit(value: number): string {
  return value === -1 ? "∞" : value.toLocaleString();
}

function formatStorage(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function getBarColor(percent: number): string {
  if (percent >= 90) return "bg-destructive";
  if (percent >= 70) return "bg-amber-500";
  return "bg-primary";
}

function UsageBar({
  label,
  icon: Icon,
  used,
  limit,
  percent,
  format,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  used: number;
  limit: number;
  percent: number;
  format?: "storage";
}) {
  const displayUsed = format === "storage" ? formatStorage(used) : used.toLocaleString();
  const displayLimit = limit === -1 ? "∞" : format === "storage" ? formatStorage(limit) : limit.toLocaleString();

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Icon className="size-4 text-muted-foreground" />
          {label}
        </div>
        <span className="text-xs text-muted-foreground">
          {displayUsed} / {displayLimit}
        </span>
      </div>
      {limit !== -1 ? (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${getBarColor(percent)}`}
            style={{ width: `${Math.min(100, percent)}%` }}
          />
        </div>
      ) : (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-blue-500" style={{ width: "5%" }} />
        </div>
      )}
    </div>
  );
}

export default function UsageOverview() {
  const [data, setData] = useState<SubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/workspace/subscription");
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error("Failed to load usage:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const { usage, subscription } = data;

  return (
    <div className="space-y-6">
      {/* Plan Status Card */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Plan Status</h3>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {subscription.plan.displayName}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {subscription.plan.description || "Current plan"}
        </p>
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status: </span>
            <span className="font-medium text-foreground capitalize">
              {subscription.status}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Period: </span>
            <span className="font-medium text-foreground">{usage.period}</span>
          </div>
        </div>
        {subscription.trialEndsAt && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Trial ends: {formatDateSafe(subscription.trialEndsAt)}
            </p>
          </div>
        )}
      </div>

      {/* Usage Overview Card */}
      <div className="bg-card rounded-xl border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">
          Usage Overview — {usage.period}
        </h3>
        <div className="space-y-5">
          <UsageBar
            label="Documents"
            icon={FileText}
            used={usage.documents.used}
            limit={usage.documents.limit}
            percent={usage.documents.percent}
          />
          <UsageBar
            label="Storage"
            icon={HardDrive}
            used={usage.storage.used}
            limit={usage.storage.limit}
            percent={usage.storage.percent}
            format="storage"
          />
          <UsageBar
            label="Chat Messages"
            icon={MessageSquare}
            used={usage.chatMessages.used}
            limit={usage.chatMessages.limit}
            percent={usage.chatMessages.percent}
          />
          <UsageBar
            label="Chunks"
            icon={BarChart3}
            used={usage.chunks.used}
            limit={usage.chunks.limit}
            percent={usage.chunks.percent}
          />
          <UsageBar
            label="AI Requests"
            icon={Brain}
            used={usage.aiRequests.used}
            limit={usage.aiRequests.limit}
            percent={usage.aiRequests.percent}
          />
          <UsageBar
            label="Embedding Requests"
            icon={Link2}
            used={usage.embeddingRequests.used}
            limit={usage.embeddingRequests.limit}
            percent={usage.embeddingRequests.percent}
          />
          <UsageBar
            label="MCP Executions"
            icon={Puzzle}
            used={usage.mcpExecutions.used}
            limit={usage.mcpExecutions.limit}
            percent={usage.mcpExecutions.percent}
          />
        </div>
      </div>
    </div>
  );
}
