"use client";

import { useState, useEffect } from "react";
import { formatDateSafe } from "@/lib/date-utils";

// ============================================================
// API Keys Management
// ============================================================

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    try {
      const res = await fetch("/api/v1/keys", {
        headers: { Authorization: `Bearer ${getApiKey()}` },
      });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      // Keys not available
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.key) {
        setNewKey(data.key);
        setNewKeyName("");
        fetchKeys();
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    if (!confirm("Revoke this API key?")) return;
    await fetch(`/api/v1/keys?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getApiKey()}` },
    });
    fetchKeys();
  }

  function getApiKey() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("api_key") || "";
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">API Keys</h3>

        {newKey && (
          <div className="bg-success/10 border border-success/30 rounded-lg p-4 mb-4">
            <p className="text-success text-sm font-medium mb-2">🔑 Your new API key (save it now — won't be shown again):</p>
            <code className="block bg-black/40 rounded p-3 text-success text-sm font-mono break-all">
              {newKey}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(newKey)}
              className="mt-2 text-xs text-success hover:text-success/80"
            >
              📋 Copy to clipboard
            </button>
          </div>
        )}

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, Development)"
            className="flex-1 bg-card border border-border rounded-lg px-4 py-2 text-white text-sm"
          />
          <button
            onClick={createKey}
            disabled={creating || !newKeyName.trim()}
            className="bg-primary hover:bg-primary/90 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {creating ? "Creating..." : "Create Key"}
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Loading keys...</p>
        ) : keys.length === 0 ? (
          <p className="text-muted-foreground text-sm">No API keys yet. Create one above.</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between bg-card/50 border border-border rounded-lg p-3"
              >
                <div>
                  <span className="text-white font-medium">{key.name}</span>
                  <span className="text-muted-foreground text-sm ml-2">{key.keyPrefix}</span>
                  {!key.isActive && (
                    <span className="text-destructive text-xs ml-2">(revoked)</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {key.lastUsedAt && <span>Last used: {formatDateSafe(key.lastUsedAt)}</span>}
                  {key.expiresAt && <span>Expires: {formatDateSafe(key.expiresAt)}</span>}
                  {key.isActive && (
                    <button
                      onClick={() => revokeKey(key.id)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
