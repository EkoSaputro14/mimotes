"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

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
  /** BUG-018: Increment to force refetch — only when new session created */
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

  // Fetch on mount
  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // BUG-018: Only refetch when refreshTrigger changes (new session created),
  // NOT when currentSessionId changes (session switch)
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
      {/* Mobile overlay — z-40 for overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — z-50 for sidebar (above overlay) */}
      <aside
        role="complementary"
        aria-label="Riwayat percakapan"
        className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-72 bg-background border-r border-border flex flex-col transition-transform duration-200 ${
          isOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-card flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Percakapan</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onNewChat}
              className="inline-flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title="Chat baru"
              aria-label="Chat baru"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              onClick={onToggle}
              className="inline-flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors md:hidden"
              aria-label="Tutup sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Cari percakapan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              {searchQuery
                ? "Tidak ada percakapan yang cocok"
                : "Belum ada percakapan"}
            </div>
          ) : (
            <div className="p-2">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => {
                    onSessionSelect(session);
                    if (typeof window !== "undefined" && window.innerWidth < 768) onToggle();
                  }}
                  className={`w-full text-left p-3 rounded-lg mb-1 group transition-colors ${
                    currentSessionId === session.id
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate pr-2">
                      {session.title || "Percakapan tanpa judul"}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, session.id)}
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-[44px] h-[44px] text-muted-foreground hover:text-destructive rounded-lg transition-all"
                      aria-label="Hapus percakapan"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(session.createdAt)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
