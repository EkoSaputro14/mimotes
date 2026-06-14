"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Clock,
  Copy,
  Check,
  RotateCcw,
  Ban,
  Mail,
  Loader2,
  User,
  Send,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Invitation {
  id: string;
  email: string;
  role: string;
  tokenPrefix: string;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
  invitedBy: { name: string | null; email: string };
  createdAt: string;
}

function getStatusBadge(status: string): string {
  const classes: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300",
    accepted: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    expired: "bg-muted text-muted-foreground",
    revoked: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };
  return classes[status] ?? "bg-muted text-muted-foreground";
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending": return <Clock className="size-3" />;
    case "accepted": return <Check className="size-3" />;
    case "expired": return <Ban className="size-3" />;
    case "revoked": return <Ban className="size-3" />;
    default: return null;
  }
}

function getRoleBadge(role: string): string {
  const classes: Record<string, string> = {
    admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    editor: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    viewer: "bg-muted text-muted-foreground",
  };
  return classes[role] ?? "bg-muted text-muted-foreground";
}

function formatExpiry(expiresAt: string): string {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "Kedaluwarsa";
  if (diffDays === 0) return "Kedaluwarsa hari ini";
  if (diffDays === 1) return "Kedaluwarsa besok";
  return `Kedaluwarsa dalam ${diffDays} hari`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

interface InvitationListProps {
  refreshKey?: number;
}

export default function InvitationList({ refreshKey }: InvitationListProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<{ open: boolean; id: string }>({ open: false, id: "" });

  const fetchInvitations = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/workspace/invitations" : `/api/workspace/invitations?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations ?? []);
      }
    } catch (err) {
      console.error("Failed to load invitations:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations, refreshKey]);

  async function handleRevoke() {
    setActionLoading(confirmRevoke.id);
    try {
      const res = await fetch(`/api/workspace/invitations/${confirmRevoke.id}/revoke`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membatalkan");
      toast.success("Undangan dibatalkan");
      setConfirmRevoke({ open: false, id: "" });
      await fetchInvitations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResend(id: string) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/workspace/invitations/${id}/resend`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim ulang");
      if (data.rawToken) {
        await navigator.clipboard.writeText(data.rawToken);
        toast.success("Token baru disalin ke clipboard");
      } else {
        toast.success("Undangan dikirim ulang");
      }
      await fetchInvitations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          {["all", "pending", "accepted", "expired", "revoked"].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Invitation List */}
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Mail className="size-6 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Belum ada undangan</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              {filter === "all"
                ? "Undang anggota baru untuk mulai berkolaborasi di workspace ini"
                : `Tidak ada undangan dengan status "${filter}"`}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/20 rounded-xl border border-border/20 overflow-hidden">
            {invitations.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-4 py-3 bg-card">
                <div className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                  <User className="size-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{inv.email}</p>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(inv.status)}`}>
                      {getStatusIcon(inv.status)}
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {inv.status === "pending"
                      ? formatExpiry(inv.expiresAt)
                      : inv.status === "accepted"
                        ? `Diterima ${formatDate(inv.acceptedAt ?? inv.createdAt)}`
                        : `${inv.status} ${formatDate(inv.createdAt)}`}
                    {" · "}
                    <span className={`text-[10px] font-medium ${getRoleBadge(inv.role)}`}>{inv.role}</span>
                    {" · "}
                    oleh {inv.invitedBy.name ?? inv.invitedBy.email}
                  </p>
                </div>

                {inv.status === "pending" && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleResend(inv.id)}
                      disabled={actionLoading === inv.id}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Kirim ulang"
                    >
                      {actionLoading === inv.id ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmRevoke({ open: true, id: inv.id })}
                      disabled={actionLoading === inv.id}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Batalkan"
                    >
                      <Ban className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Revoke Dialog */}
      <Dialog open={confirmRevoke.open} onOpenChange={(open) => !open && setConfirmRevoke({ open: false, id: "" })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Batalkan Undangan</DialogTitle>
            <DialogDescription>
              Undangan ini akan dibatalkan dan tidak dapat digunakan lagi. Penerima harus diundang ulang jika ingin bergabung.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end mt-4">
            <button
              type="button"
              onClick={() => setConfirmRevoke({ open: false, id: "" })}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRevoke}
              disabled={actionLoading === confirmRevoke.id}
              className="px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {actionLoading === confirmRevoke.id && <Loader2 className="size-4 animate-spin" />}
              Batalkan Undangan
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
