"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Trash2, ArrowRightLeft, Loader2, AlertTriangle } from "lucide-react";

interface WorkspaceData {
  workspace: { id: string; name: string };
  members: Array<{ id: string; userId: string; role: string; user: { name: string | null; email: string } }>;
  currentUserId: string;
  currentUserRole: string;
}

export default function WorkspaceDanger() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [transferTarget, setTransferTarget] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [transferring, setTransferring] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/workspace");
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error("Failed to load workspace:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const isOwner = data?.currentUserRole === "owner";
  const otherMembers = data?.members.filter((m) => m.userId !== data.currentUserId) || [];

  async function handleDelete() {
    if (!data || deleteInput !== data.workspace.name) {
      toast.error("Nama workspace tidak cocok");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/workspace/delete", { method: "POST" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal menghapus workspace");
      toast.success("Workspace berhasil dihapus");
      window.location.href = "/dashboard";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus workspace");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteInput("");
    }
  }

  async function handleTransfer() {
    if (!transferTarget) {
      toast.error("Pilih anggota target");
      return;
    }

    setTransferring(true);
    try {
      const res = await fetch("/api/workspace/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: transferTarget }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal transfer kepemilikan");
      toast.success("Kepemilikan berhasil ditransfer");
      setShowTransferConfirm(false);
      setTransferTarget("");
      // Reload to reflect new roles
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal transfer kepemilikan");
    } finally {
      setTransferring(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-5 w-48 rounded bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
    );
  }

  if (!data || !isOwner) return null;

  return (
    <div className="space-y-6">
      {/* Transfer Ownership */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Transfer Kepemilikan</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Transfer kepemilikan workspace ke anggota lain. Anda akan menjadi admin setelah transfer.
        </p>

        {!showTransferConfirm ? (
          <button
            type="button"
            onClick={() => setShowTransferConfirm(true)}
            disabled={otherMembers.length === 0}
            className="px-4 py-2 bg-muted text-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer Kepemilikan
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/50">
            <div>
              <label htmlFor="transferTarget" className="block text-sm font-medium text-foreground mb-1.5">
                Pilih anggota baru sebagai pemilik
              </label>
              <select
                id="transferTarget"
                value={transferTarget}
                onChange={(e) => setTransferTarget(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              >
                <option value="">-- Pilih anggota --</option>
                {otherMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.user.name || m.user.email} ({m.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTransfer}
                disabled={transferring || !transferTarget}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {transferring ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Konfirmasi Transfer
              </button>
              <button
                type="button"
                onClick={() => { setShowTransferConfirm(false); setTransferTarget(""); }}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Workspace */}
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Hapus Workspace</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Menghapus workspace akan menghapus semua data secara permanen: dokumen, chat, chunks, undangan, dan pengaturan. Tindakan ini tidak dapat dibatalkan.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-lg hover:bg-destructive/20 transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Workspace
          </button>
        ) : (
          <div className="space-y-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive font-medium">
                Ketik <span className="font-mono bg-destructive/10 px-1 rounded">&quot;{data.workspace.name}&quot;</span> untuk konfirmasi penghapusan permanen.
              </p>
            </div>
            <input
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder={`Ketik "${data.workspace.name}"`}
              className="w-full px-4 py-2.5 border border-destructive/30 rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-destructive/20 focus:border-destructive text-sm transition-colors"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteInput !== data.workspace.name}
                className="px-4 py-2 bg-destructive text-white text-sm font-medium rounded-lg hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Hapus Secara Permanen
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
