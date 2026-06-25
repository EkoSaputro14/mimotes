"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Banknote,
  Building,
  Clock,
  MessageSquare,
  Calendar,
  ChevronRight,
  User,
  Send,
  Flame,
  TrendingUp,
  CircleDot,
  CheckCircle2,
} from "lucide-react";

export interface LeadDetail {
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

interface LeadDetailDrawerProps {
  lead: LeadDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: (leadId: string, status: string) => void;
  onWhatsApp?: (lead: LeadDetail) => void;
}

const SCORE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  high: { icon: Flame, label: "Hot", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50" },
  medium: { icon: TrendingUp, label: "Warm", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" },
  low: { icon: CircleDot, label: "Cold", color: "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800/50" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new: { label: "Baru", color: "bg-red-500" },
  contacted: { label: "Dihubungi", color: "bg-yellow-500" },
  qualified: { label: "Qualified", color: "bg-blue-500" },
  converted: { label: "Converted", color: "bg-green-500" },
  lost: { label: "Lost", color: "bg-gray-500" },
};

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "-";
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return `${seconds}d lalu`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j lalu`;
  return `${Math.floor(seconds / 86400)}h lalu`;
}

// ─── Pipeline Visualizer ─────────────────────────────────────────
function PipelineVisualizer({
  currentStatus,
  onChange,
}: {
  currentStatus: string;
  onChange: (status: string) => void;
}) {
  const stages = [
    { key: "new", label: "Baru", color: "bg-red-500" },
    { key: "contacted", label: "Dihubungi", color: "bg-yellow-500" },
    { key: "qualified", label: "Qualified", color: "bg-blue-500" },
    { key: "converted", label: "Converted", color: "bg-green-500" },
  ];
  const currentIndex = stages.findIndex((s) => s.key === currentStatus);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1">
        {stages.map((stage, i) => (
          <div key={stage.key} className="flex-1 flex items-center">
            <button
              onClick={() => onChange(stage.key)}
              className={`w-full h-2 rounded-full transition-all ${
                i <= currentIndex ? stage.color : "bg-muted"
              } hover:opacity-80`}
              title={stage.label}
            />
            {i < stages.length - 1 && (
              <ChevronRight className="size-3 text-muted-foreground mx-0.5 shrink-0" />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs">
        {stages.map((stage) => (
          <button
            key={stage.key}
            onClick={() => onChange(stage.key)}
            className={`flex items-center gap-1 transition-colors ${
              stage.key === currentStatus
                ? "font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${stage.color}`} />
            {stage.label}
          </button>
        ))}
      </div>
      {currentStatus !== "lost" && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive text-xs px-0 h-auto"
          onClick={() => onChange("lost")}
        >
          Tandai sebagai Lost
        </Button>
      )}
    </div>
  );
}

// ─── Info Row ────────────────────────────────────────────────────
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium text-foreground">{value}</div>
      </div>
    </div>
  );
}

// ─── Chat History Timeline ───────────────────────────────────────
function ChatHistoryTimeline({ leadId }: { leadId: string }) {
  const [messages, setMessages] = useState<Array<{ id: string; role: string; content: string; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetch(`/api/leads/${leadId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (loading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Memuat riwayat chat...</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Tidak ada riwayat chat
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
          <div
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              msg.role === "user"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground"
            }`}
          >
            <p className="leading-relaxed">{msg.content}</p>
            <p className="text-[10px] opacity-60 mt-1">
              {new Date(msg.createdAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Notes Section ───────────────────────────────────────────────
function NotesSection({ leadId }: { leadId: string }) {
  const [notes, setNotes] = useState<{ id: string; content: string; createdAt: string }[]>([]);
  const [newNote, setNewNote] = useState("");

  // Load notes from localStorage for now
  React.useEffect(() => {
    const stored = localStorage.getItem(`mimotes-lead-notes-${leadId}`);
    if (stored) setNotes(JSON.parse(stored));
  }, [leadId]);

  const saveNotes = (updated: typeof notes) => {
    setNotes(updated);
    localStorage.setItem(`mimotes-lead-notes-${leadId}`, JSON.stringify(updated));
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const note = { id: Date.now().toString(), content: newNote.trim(), createdAt: new Date().toISOString() };
    saveNotes([note, ...notes]);
    setNewNote("");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder="Tambah catatan..."
          className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <Button size="sm" onClick={addNote} disabled={!newNote.trim()}>
          <Send className="size-3.5" />
        </Button>
      </div>

      {notes.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Belum ada catatan
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div key={note.id} className="rounded-lg border bg-card p-3">
              <p className="text-sm text-foreground">{note.content}</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(note.createdAt).toLocaleString("id-ID")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN DRAWER ─────────────────────────────────────────────────
export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
  onStatusChange,
  onWhatsApp,
}: LeadDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("profile");

  if (!lead) return null;

  const phone = lead.whatsapp?.replace(/\D/g, "");
  const scoreKey = lead.score || "low";
  const scoreCfg = SCORE_CONFIG[scoreKey] || SCORE_CONFIG.low;
  const ScoreIcon = scoreCfg.icon;

  const handleStatusChange = (status: string) => {
    if (onStatusChange) {
      onStatusChange(lead.id, status);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] p-0 flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b bg-card">
          <SheetHeader className="space-y-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1 pr-4">
                <SheetTitle className="text-lg font-bold text-foreground truncate">
                  {lead.name || "Anonymous"}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  {lead.email && <span>{lead.email}</span>}
                  {lead.email && lead.whatsapp && <span>·</span>}
                  {lead.whatsapp && <span>{lead.whatsapp}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge className={scoreCfg.color}>
                  <ScoreIcon className="size-3 mr-1" />
                  {scoreCfg.label}
                </Badge>
                {lead.status && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {STATUS_CONFIG[lead.status]?.label || lead.status}
                  </Badge>
                )}
              </div>
            </div>
          </SheetHeader>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white h-9"
              onClick={() => onWhatsApp && onWhatsApp(lead)}
              disabled={!lead.whatsapp}
            >
              <MessageCircle className="size-4 mr-1.5" />
              WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => lead.email && window.open(`mailto:${lead.email}`, "_blank")}
              disabled={!lead.email}
            >
              <Mail className="size-4 mr-1.5" />
              Email
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9"
              onClick={() => lead.whatsapp && window.open(`tel:${lead.whatsapp}`, "_blank")}
              disabled={!lead.whatsapp}
            >
              <Phone className="size-4 mr-1.5" />
              Telepon
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b bg-background px-5 pt-2 justify-start gap-4 h-11">
            <TabsTrigger
              value="profile"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0"
            >
              Profil
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0"
            >
              💬 Chat History
            </TabsTrigger>
            <TabsTrigger
              value="notes"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-0"
            >
              🗒️ Catatan
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Tab: Profile */}
            <TabsContent value="profile" className="mt-0 space-y-5">
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Informasi Lead
                </h3>
                <div className="space-y-2.5">
                  <InfoRow icon={Building} label="Minat Bisnis" value={lead.businessInterest} />
                  <InfoRow icon={Banknote} label="Budget" value={lead.budget} />
                  <InfoRow icon={MapPin} label="Lokasi" value={lead.location} />
                  <InfoRow icon={MessageSquare} label="Jumlah Pesan" value={`${lead.messageCount} pesan`} />
                  <InfoRow icon={Clock} label="Aktivitas Terakhir" value={timeAgo(lead.lastMessageAt)} />
                  <InfoRow icon={Calendar} label="Bergabung" value={new Date(lead.createdAt).toLocaleDateString("id-ID")} />
                  <InfoRow icon={User} label="Widget/Sumber" value={lead.widgetName || lead.source} />
                </div>
              </section>

              <Separator />

              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Status Pipeline
                </h3>
                <PipelineVisualizer
                  currentStatus={lead.status || "new"}
                  onChange={handleStatusChange}
                />
              </section>

              <Separator />

              {/* AI Summary */}
              {lead.leadSummary && (
                <section>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    🧠 Ringkasan AI
                  </h3>
                  <div className="rounded-lg bg-secondary/50 p-3 text-sm text-secondary-foreground leading-relaxed">
                    {lead.leadSummary}
                  </div>
                </section>
              )}
            </TabsContent>

            {/* Tab: Chat History */}
            <TabsContent value="chat" className="mt-0">
              <ChatHistoryTimeline leadId={lead.id} />
            </TabsContent>

            {/* Tab: Notes */}
            <TabsContent value="notes" className="mt-0">
              <NotesSection leadId={lead.id} />
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ─── React import untuk hooks ────────────────────────────────────
import * as React from "react";
