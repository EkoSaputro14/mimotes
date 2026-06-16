"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  UserPlus,
  UserMinus,
  Shield,
  Mail,
  MailCheck,
  MailX,
  MailWarning,
  Settings,
  Loader2,
  Activity,
} from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  actorName: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

function getActionIcon(action: string) {
  switch (action) {
    case "invitation.created":
    case "member.invite":
      return <UserPlus className="size-4" />;
    case "invitation.accepted":
      return <MailCheck className="size-4" />;
    case "invitation.revoked":
      return <MailX className="size-4" />;
    case "invitation.resent":
      return <MailWarning className="size-4" />;
    case "member.remove":
      return <UserMinus className="size-4" />;
    case "member.role_change":
      return <Shield className="size-4" />;
    case "workspace.update":
      return <Settings className="size-4" />;
    default:
      return <Clock className="size-4" />;
  }
}

function getActionIconBg(action: string): string {
  switch (action) {
    case "invitation.created":
    case "member.invite":
      return "bg-primary/10 text-primary";
    case "invitation.accepted":
      return "bg-success/10 text-success";
    case "invitation.revoked":
      return "bg-destructive/10 text-destructive";
    case "invitation.resent":
      return "bg-warning/10 text-warning";
    case "member.remove":
      return "bg-destructive/10 text-destructive";
    case "member.role_change":
      return "bg-primary/10 text-primary";
    case "workspace.update":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatActionDescription(action: string, metadata: Record<string, unknown>): string {
  const actor = "actorName"; // Will be replaced with real name
  switch (action) {
    case "invitation.created":
      return `mengundang ${metadata.email ?? "seseorang"} sebagai ${(metadata.role as string) ?? "viewer"}`;
    case "invitation.accepted":
      return `bergabung ke workspace`;
    case "invitation.revoked":
      return `membatalkan undangan ke ${metadata.email ?? "seseorang"}`;
    case "invitation.resent":
      return `mengirim ulang undangan ke ${metadata.email ?? "seseorang"}`;
    case "member.invite":
      return `menambahkan ${metadata.email ?? "seseorang"} sebagai ${(metadata.role as string) ?? "viewer"}`;
    case "member.remove":
      return `menghapus anggota dari workspace`;
    case "member.role_change": {
      const newRole = metadata.role ?? metadata.newRole;
      return `mengubah role menjadi ${(newRole as string) ?? "viewer"}`;
    }
    case "workspace.update":
      return `memperbarui pengaturan workspace`;
    default:
      return `melakukan aksi: ${action}`;
  }
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return "baru saja";
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays === 1) return "kemarin";
  if (diffDays < 30) return `${diffDays} hari lalu`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/activity");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activity ?? []);
      }
    } catch (err) {
      console.error("Failed to load activity log:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Activity className="size-6 text-muted-foreground/50" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Belum ada aktivitas
        </p>
        <p className="text-xs text-muted-foreground max-w-xs">
          Aktivitas terbaru workspace akan muncul di sini
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-border/20">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Activity className="size-5" />
          Aktivitas Terbaru
          <span className="text-sm font-normal text-muted-foreground">
            ({activities.length})
          </span>
        </h3>
      </div>

      <div className="divide-y divide-border/20">
        {activities.map((item) => (
          <div key={item.id} className="flex items-start gap-3 px-6 py-3">
            <div
              className={`shrink-0 mt-0.5 flex size-8 items-center justify-center rounded-full ${getActionIconBg(item.action)}`}
            >
              {getActionIcon(item.action)}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">
                <span className="font-medium">{item.actorName}</span>{" "}
                {formatActionDescription(item.action, item.metadata)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
