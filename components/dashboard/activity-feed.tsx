"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateSafe } from "@/lib/date-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MessageSquare, Clock, ArrowRight, Settings } from "lucide-react";

interface ActivityEvent {
  type: "document_upload" | "chat_session" | "settings_change";
  title: string;
  timestamp: string;
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDateSafe(then);
}

const eventConfig: Record<
  ActivityEvent["type"],
  { icon: typeof FileText; label: string; color: string; bgColor: string }
> = {
  document_upload: {
    icon: FileText,
    label: "Document uploaded",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  chat_session: {
    icon: MessageSquare,
    label: "Chat started",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  settings_change: {
    icon: Settings,
    label: "Settings updated",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
};

export function ActivityFeed() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/dashboard/activity");
        if (!res.ok) throw new Error("Failed to fetch activity");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        setError("Could not load activity feed");
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  return (
    <div className="bg-card border border-border/20 rounded-lg">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Clock className="size-4" />
          Recent Activity
        </h3>
        <Link
          href="/analytics/usage"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
        >
          View All
          <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="px-5 pb-5">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {error}
          </p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent activity yet. Upload a document or start a chat to get
            started.
          </p>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => {
              const config = eventConfig[event.type];
              const Icon = config.icon;
              return (
                <div
                  key={`${event.type}-${index}`}
                  className="flex items-start gap-3"
                >
                  <div
                    className={`flex size-8 items-center justify-center rounded-full ${config.bgColor} ${config.color}`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {config.label} · {getRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
