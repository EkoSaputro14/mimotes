"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  RefreshCw,
  MessageCircle,
  Eye,
  Filter,
  Flame,
  TrendingUp,
  CircleDot,
  Users,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { NotificationBar } from "@/components/leads/notification-bar";
import { LeadDetailDrawer } from "@/components/leads/lead-detail-drawer";

interface LeadItem {
  id: string;
  source: "widget" | "whatsapp";
  name: string | null;
  email: string | null;
  whatsapp: string | null;
  score: string | null;
  status: string | null;
  intent: string | null;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  widgetName: string | null;
  leadSummary?: string | null;
  businessInterest?: string | null;
  budget?: string | null;
  location?: string | null;
}

interface LeadsData {
  leads: LeadItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: {
    total: number;
    new: number;
    high: number;
    medium: number;
    low: number;
  };
}

const SCORE_CONFIG: Record<string, { icon: React.ElementType; label: string; badge: string }> = {
  high: { icon: Flame, label: "Hot", badge: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" },
  medium: { icon: TrendingUp, label: "Warm", badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" },
  low: { icon: CircleDot, label: "Cold", badge: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800/50" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${seconds}d`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j`;
  return `${Math.floor(seconds / 86400)}h`;
}

export default function LeadsPage() {
  const [data, setData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterScore, setFilterScore] = useState("all");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterSource !== "all") params.set("source", filterSource);
      if (filterScore !== "all") params.set("score", filterScore);
      params.set("page", "1");
      params.set("perPage", "50");

      const res = await fetch(`/api/leads?${params}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, filterSource, filterScore]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set("format", "csv");
    if (filterSource !== "all") params.set("source", filterSource);
    window.open(`/api/leads?${params}`, "_blank");
  };

  const handleWhatsApp = (lead: LeadItem) => {
    if (!lead.whatsapp) return;
    const phone = lead.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      "Halo, saya menindaklanjuti percakapan Anda dengan chatbot kami."
    );
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  const handleStatusChange = async (leadId: string, status: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        // Optimistic update
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            leads: prev.leads.map((l) =>
              l.id === leadId ? { ...l, status } : l
            ),
          };
        });
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
      {/* ═══════════════════════════════════════════════════════
          HEADER ROW
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="size-6 text-primary" />
            Leads
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {data?.stats.total || 0} leads · {data?.stats.new || 0} baru hari ini
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="size-4 mr-1.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Notification Bar */}
      <NotificationBar />

      {/* ═══════════════════════════════════════════════════════
          KPI SUMMARY
          ═══════════════════════════════════════════════════════ */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <KPICard label="Total" value={data.stats.total} icon={Users} />
          <KPICard label="Baru" value={data.stats.new} icon={Flame} color="text-red-500" />
          <KPICard
            label="Hot"
            value={data.stats.high}
            icon={Flame}
            color="text-red-500"
            active={filterScore === "high"}
            onClick={() => setFilterScore(filterScore === "high" ? "all" : "high")}
          />
          <KPICard
            label="Warm"
            value={data.stats.medium}
            icon={TrendingUp}
            color="text-amber-500"
            active={filterScore === "medium"}
            onClick={() => setFilterScore(filterScore === "medium" ? "all" : "medium")}
          />
          <KPICard
            label="Cold"
            value={data.stats.low}
            icon={CircleDot}
            color="text-slate-400"
            active={filterScore === "low"}
            onClick={() => setFilterScore(filterScore === "low" ? "all" : "low")}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          FILTER BAR
          ═══════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 bg-background"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[130px] h-9">
              <Filter className="size-3.5 mr-1.5" />
              <SelectValue placeholder="Sumber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Sumber</SelectItem>
              <SelectItem value="widget">🌐 Website</SelectItem>
              <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[130px] h-9">
              <Flame className="size-3.5 mr-1.5" />
              <SelectValue placeholder="Skor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Skor</SelectItem>
              <SelectItem value="high">🔥 Hot</SelectItem>
              <SelectItem value="medium">⬆️ Warm</SelectItem>
              <SelectItem value="low">○ Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={[
          filterSource !== "all" && {
            key: "source",
            label: `Sumber: ${filterSource}`,
            onRemove: () => setFilterSource("all"),
          },
          filterScore !== "all" && {
            key: "score",
            label: `Skor: ${SCORE_CONFIG[filterScore]?.label || filterScore}`,
            onRemove: () => setFilterScore("all"),
          },
          search && {
            key: "search",
            label: `Cari: "${search}"`,
            onRemove: () => setSearch(""),
          },
        ].filter(Boolean) as FilterChip[]}
      />

      {/* ═══════════════════════════════════════════════════════
          LEAD LIST — COMPACT CARDS
          ═══════════════════════════════════════════════════════ */}
      {loading ? (
        <LoadingState />
      ) : !data || data.leads.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-1">
          {data.leads.map((lead) => {
            const scoreKey = lead.score || "low";
            const scoreCfg = SCORE_CONFIG[scoreKey] || SCORE_CONFIG.low;
            const ScoreIcon = scoreCfg.icon;

            return (
              <div
                key={`${lead.source}-${lead.id}`}
                className="group flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-card text-card-foreground hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => {
                  setSelectedLead(lead);
                  setDrawerOpen(true);
                }}
              >
                {/* Score — Icon only, smaller */}
                <span
                  className={`shrink-0 flex items-center justify-center size-7 rounded-md border ${scoreCfg.badge}`}
                  title={scoreCfg.label}
                >
                  <ScoreIcon className="size-3.5" />
                </span>

                {/* Avatar / Initials */}
                <div className="shrink-0 size-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(lead.name?.[0] || "A").toUpperCase()}
                </div>

                {/* Info Block */}
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <div className="min-w-[140px] flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm text-foreground truncate">
                        {lead.name || "Anonymous"}
                      </span>
                      {lead.status === "new" && (
                        <span
                          className="shrink-0 w-1.5 h-1.5 rounded-full bg-red-500"
                          title="Lead baru"
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="truncate">
                        {lead.whatsapp || lead.email || "—"}
                      </span>
                      <span className="text-border">|</span>
                      <span>{timeAgo(lead.lastMessageAt)}</span>
                    </div>
                  </div>

                  {/* Intent + Source badges */}
                  <div className="hidden md:flex items-center gap-1.5 shrink-0 w-[120px]">
                    {lead.intent && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground text-[10px] shrink-0">
                        {lead.intent}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] shrink-0 text-muted-foreground">
                      {lead.source === "widget" ? "🌐" : "💬"} {lead.source}
                    </span>
                  </div>

                  {/* Message count */}
                  <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-[50px] justify-end">
                    <MessageSquare className="size-3" />
                    {lead.messageCount}
                  </div>
                </div>

                {/* Hover Actions — Icon only */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWhatsApp(lead);
                    }}
                    disabled={!lead.whatsapp}
                    title={lead.whatsapp ? "Chat via WhatsApp" : "Tidak ada WhatsApp"}
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedLead(lead);
                      setDrawerOpen(true);
                    }}
                    title="Lihat Detail"
                  >
                    <Eye className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
          QUICK DETAIL DRAWER
          ═══════════════════════════════════════════════════════ */}
      <LeadDetailDrawer
        lead={selectedLead}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onWhatsApp={handleWhatsApp}
      />
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────
function KPICard({
  label,
  value,
  icon: Icon,
  color,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all ${
        onClick ? "cursor-pointer hover:bg-accent/5 active:scale-[0.98]" : ""
      } ${active ? "ring-2 ring-primary ring-offset-1" : ""}`}
    >
      <div
        className={`flex size-9 items-center justify-center rounded-md bg-primary/10 ${color || "text-primary"}`}
      >
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold text-foreground leading-tight">{value}</p>
      </div>
    </button>
  );
}

// ─── Filter Chips ────────────────────────────────────────────────
interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

function ActiveFilterChips({ filters }: { filters: FilterChip[] }) {
  if (filters.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <span
          key={f.key}
          className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-xs text-foreground"
        >
          {f.label}
          <button
            onClick={f.onRemove}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

// ─── Loading State ───────────────────────────────────────────────
function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <RefreshCw className="size-5 animate-spin text-muted-foreground" />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="font-medium">Belum ada leads</p>
      <p className="text-sm mt-1">
        Leads muncul saat pengunjung chat dan memberikan kontak
      </p>
    </div>
  );
}
