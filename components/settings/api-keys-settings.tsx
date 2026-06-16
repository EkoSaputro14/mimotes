"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Loader2,
  AlertTriangle,
  Eye,
  EyeOff,
} from "lucide-react";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyExpiry, setNewKeyExpiry] = useState<string>("never");
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const res = await fetch("/api/workspace/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch (err) {
      console.error("Failed to load API keys:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newKeyName.trim()) {
      toast.error("Masukkan nama API key");
      return;
    }

    setCreating(true);
    try {
      const body: { name: string; expiresInDays?: number } = {
        name: newKeyName.trim(),
      };
      if (newKeyExpiry !== "never") {
        body.expiresInDays = parseInt(newKeyExpiry);
      }

      const res = await fetch("/api/workspace/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat API key");

      setCreatedKey(data.key.rawKey);
      setNewKeyName("");
      setNewKeyExpiry("never");
      loadKeys();
      toast.success("API key berhasil dibuat!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(keyId: string) {
    try {
      const res = await fetch(`/api/workspace/api-keys?id=${keyId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal revoke");
      }
      toast.success("API key berhasil direvoke");
      setDeleteConfirm(null);
      loadKeys();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal revoke API key");
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">API Keys</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola API keys untuk mengakses MimoNotes API.
        </p>
      </div>

      {/* Created key alert */}
      {createdKey && (
        <div className="rounded-xl border border-success/30 bg-success/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">
              API key berhasil dibuat!
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Simpan key ini sekarang — tidak akan ditampilkan lagi.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-foreground break-all">
              {createdKey}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(createdKey, "new")}
              className="px-3 py-2 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              {copiedId === "new" ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setCreatedKey(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Create form */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Buat API Key</h3>
          </div>
          {!showCreate && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Buat Key
            </button>
          )}
        </div>

        {showCreate && (
          <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/50">
            <div>
              <label htmlFor="keyName" className="block text-sm font-medium text-foreground mb-1.5">
                Nama
              </label>
              <input
                id="keyName"
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="My API Key"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
            </div>
            <div>
              <label htmlFor="keyExpiry" className="block text-sm font-medium text-foreground mb-1.5">
                <Clock className="inline h-3.5 w-3.5 mr-1" />
                Masa Berlaku
              </label>
              <select
                id="keyExpiry"
                value={newKeyExpiry}
                onChange={(e) => setNewKeyExpiry(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              >
                <option value="never">Tidak terbatas</option>
                <option value="30">30 hari</option>
                <option value="90">90 hari</option>
                <option value="365">1 tahun</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Buat
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewKeyName(""); setNewKeyExpiry("never"); }}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-accent transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h3 className="text-lg font-semibold text-foreground">API Keys Aktif</h3>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Belum ada API key. Klik &quot;Buat Key&quot; untuk membuat yang baru.
          </p>
        ) : (
          <div className="space-y-2" role="list" aria-label="API Keys">
            {keys.map((key) => (
              <div
                key={key.id}
                role="listitem"
                className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                  key.isActive && !isExpired(key.expiresAt)
                    ? "border-border hover:bg-muted/50"
                    : "border-border/50 bg-muted/30 opacity-60"
                }`}
              >
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Key className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{key.name}</span>
                    {!key.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                        Direvoke
                      </span>
                    )}
                    {isExpired(key.expiresAt) && (
                      <span className="text-xs px-1.5 py-0.5 bg-warning/10 text-warning-foreground rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {key.keyPrefix}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Dibuat {new Date(key.createdAt).toLocaleDateString("id-ID")}
                    {key.lastUsedAt && ` · Terakhir dipakai ${new Date(key.lastUsedAt).toLocaleDateString("id-ID")}`}
                    {key.expiresAt && ` · Expired ${new Date(key.expiresAt).toLocaleDateString("id-ID")}`}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {key.isActive && !isExpired(key.expiresAt) && (
                    <>
                      {deleteConfirm === key.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-destructive font-medium">Revoke?</span>
                          <button
                            onClick={() => handleRevoke(key.id)}
                            className="px-2 py-1 text-xs bg-destructive text-white rounded hover:bg-destructive/90 transition-colors"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-accent transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(key.id)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          aria-label={`Revoke ${key.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {loading ? "Memuat API keys..." : `${keys.length} API keys`}
      </div>
    </div>
  );
}
