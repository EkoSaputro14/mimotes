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
  Star,
  Snowflake,
} from "lucide-react";
import { NotificationBar } from "@/components/leads/notification-bar";

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

const SCORE_ICONS: Record<string, React.ReactNode> = {
  high: <Flame className="size-4" />,
  medium: <Star className="size-4" />,
  low: <Snowflake className="size-4" />,
};

const SCORE_COLORS: Record<string, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-gray-50 text-gray-500 border-gray-200",
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s lalu`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

export default function LeadsPage() {
  const [data, setData] = useState<LeadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterScore, setFilterScore] = useState("all");

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

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-neutral-600">
            {data?.stats.total || 0} leads · {data?.stats.new || 0} baru
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads}>
            <RefreshCw className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Notification Bar */}
      <NotificationBar />

      {/* Quick Stats */}
      {data && (
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="font-medium">{data.stats.high}</span>
            <span className="text-red-500 flex items-center gap-1"><Flame className="size-3.5" /> Hot</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-medium">{data.stats.medium}</span>
            <span className="text-amber-500 flex items-center gap-1"><Star className="size-3.5" /> Warm</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="font-medium">{data.stats.low}</span>
            <span className="text-gray-400 flex items-center gap-1"><Snowflake className="size-3.5" /> Cold</span>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, email, atau WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Sumber</span>
          <Select value={filterSource} onValueChange={setFilterSource}>
            <SelectTrigger className="w-[100px] h-9">
              <Filter className="size-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="widget">Chatbot</SelectItem>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">Skor</span>
          <Select value={filterScore} onValueChange={setFilterScore}>
            <SelectTrigger className="w-[100px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Skor</SelectItem>
              <SelectItem value="high">Hot</SelectItem>
              <SelectItem value="medium">Warm</SelectItem>
              <SelectItem value="low">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lead List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.leads.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="font-medium">Belum ada leads</p>
          <p className="text-sm mt-1">
            Leads muncul saat pengunjung chat dan memberikan kontak
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.leads.map((lead) => (
            <div
              key={`${lead.source}-${lead.id}`}
              className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
            >
              {/* Score Badge */}
              <span
                className={`text-lg ${SCORE_COLORS[lead.score || "low"]} px-2 py-1 rounded-md border`}
              >
                {SCORE_ICONS[lead.score || "low"]}
              </span>

              {/* Lead Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {lead.name || "Anonymous"}
                  </span>
                  {lead.status === "new" && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {lead.intent && <span>{lead.intent}</span>}
                  {lead.budget && <span>💰 {lead.budget}</span>}
                  {lead.location && <span>📍 {lead.location}</span>}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {timeAgo(lead.lastMessageAt)} · {lead.messageCount} pesan
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className={`h-8 px-3 text-white ${
                    lead.whatsapp
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-300 cursor-not-allowed"
                  }`}
                  onClick={() => lead.whatsapp && handleWhatsApp(lead)}
                  disabled={!lead.whatsapp}
                  title={lead.whatsapp ? "Chat via WhatsApp" : "Tidak ada nomor WhatsApp"}
                >
                  <MessageCircle className="size-4 mr-1" />
                  WhatsApp
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  onClick={() =>
                    (window.location.href = `/leads/${lead.id}`)
                  }
                >
                  <Eye className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
