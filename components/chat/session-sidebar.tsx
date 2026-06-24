"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Plus, X, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  title: string | null;
  createdAt: string;
  _count?: { messages: number };
}

interface SessionSidebarProps {
  currentSessionId: string | null;
  onSessionSelect: (session: Session) => void;
  onNewChat: () => void;
  isOpen: boolean;
  onToggle: () => void;
  refreshTrigger?: number;
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Ags", "Sep", "Okt", "Nov", "Des",
];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.getDate()} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return "";
  }
}

function getDateGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 1) return "Hari Ini";
  if (diffDays < 2) return "Kemarin";
  if (diffDays < 8) return "7 Hari Terakhir";
  if (diffDays < 31) return "30 Hari Terakhir";
  return "Lebih Lama";
}

const GROUP_ORDER = ["Hari Ini", "Kemarin", "7 Hari Terakhir", "30 Hari Terakhir", "Lebih Lama"];

export default function SessionSidebar({
  currentSessionId,
  onSessionSelect,
  onNewChat,
  isOpen,
  onToggle,
  refreshTrigger = 0,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (refreshTrigger > 0) {
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) =>
      (s.title || "").toLowerCase().includes(q)
    );
  }, [sessions, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, Session[]> = {};
    for (const s of filteredSessions) {
      const g = getDateGroup(s.createdAt);
      if (!groups[g]) groups[g] = [];
      groups[g].push(s);
    }
    return GROUP_ORDER.filter((g) => groups[g]?.length).map((g) => ({
      label: g,
      sessions: groups[g],
    }));
  }, [filteredSessions]);

  async function fetchSessions() {
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, sessionId: string) {
    e.stopPropagation();
    if (!window.confirm("Hapus percakapan ini? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    try {
      const res = await fetch(`/api/chat/sessions?sessionId=${sessionId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Percakapan dihapus");
        if (currentSessionId === sessionId) {
          onNewChat();
        }
      } else {
        toast.error("Gagal menghapus percakapan");
      }
    } catch {
      toast.error("Gagal menghapus percakapan");
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="complementary"
        aria-label="Riwayat percakapan"
        className={cn(
          "fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-72",
          "bg-background border-r border-border/50 flex flex-col",
          "transition-transform duration-200 ease-out",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
          <h2 className="text-sm font-medium text-foreground">Percakapan</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              title="Chat baru"
              aria-label="Chat baru"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={onToggle}
              className="inline-flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors md:hidden"
              aria-label="Tutup sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs bg-muted/30 border-border/40"
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2">
          {loading ? (
            <div className="p-3 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-3.5 bg-muted/50 rounded w-3/4 mb-1.5" />
                  <div className="h-2.5 bg-muted/30 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/60">
                {searchQuery
                  ? "Tidak ada percakapan yang cocok"
                  : "Belum ada percakapan"}
              </p>
            </div>
          ) : (
            <div className="py-1">
              {grouped.map((group) => (
                <div key={group.label} className="mb-3">
                  <div className="px-2 py-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  {group.sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => {
                        onSessionSelect(session);
                        if (typeof window !== "undefined" && window.innerWidth < 768)
                          onToggle();
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg mb-0.5 group transition-colors",
                        currentSessionId === session.id
                          ? "bg-primary/10 text-foreground"
                          : "hover:bg-muted/50 text-foreground/80"
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium truncate">
                          {session.title || "Percakapan tanpa judul"}
                        </span>
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-destructive rounded transition-all shrink-0"
                          aria-label="Hapus percakapan"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[11px] text-muted-foreground/50">
                        {formatDate(session.createdAt)}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
