"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Loader2, Settings, Image } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatarUrl: string | null;
}

export default function WorkspaceSettings() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Dirty tracking
  const [nameDirty, setNameDirty] = useState(false);
  const [descDirty, setDescDirty] = useState(false);
  const [avatarDirty, setAvatarDirty] = useState(false);

  // Saving states
  const [savingName, setSavingName] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const fetchWorkspace = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace");
      if (res.ok) {
        const data = await res.json();
        const ws = data.workspace;
        setWorkspace(ws);
        setName(ws.name || "");
        setDescription(ws.description || "");
        setAvatarUrl(ws.avatarUrl || "");
        setNameDirty(false);
        setDescDirty(false);
        setAvatarDirty(false);
      }
    } catch (err) {
      console.error("Failed to load workspace:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspace();
  }, [fetchWorkspace]);

  async function handleSaveName() {
    if (!name.trim()) {
      toast.error("Nama workspace tidak boleh kosong");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Nama workspace berhasil diperbarui");
      setNameDirty(false);
      if (data.workspace) setWorkspace(data.workspace);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSavingName(false);
    }
  }

  async function handleSaveDescription() {
    setSavingDesc(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Deskripsi workspace berhasil diperbarui");
      setDescDirty(false);
      if (data.workspace) setWorkspace(data.workspace);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSavingDesc(false);
    }
  }

  async function handleSaveAvatar() {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: avatarUrl.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan");
      toast.success("Avatar workspace berhasil diperbarui");
      setAvatarDirty(false);
      if (data.workspace) setWorkspace(data.workspace);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSavingAvatar(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/20 p-6">
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="h-4 w-60 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-20 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!workspace) return null;

  return (
    <div className="bg-card rounded-xl border border-border/20 p-6">
      <h3 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
        <Settings className="size-5" />
        Pengaturan Workspace
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Kelola nama, deskripsi, dan avatar workspace.
      </p>

      <div className="space-y-5">
        {/* Workspace Name */}
        <div>
          <label htmlFor="ws-name" className="block text-sm font-medium text-foreground mb-1.5">
            Nama Workspace
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="ws-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameDirty(e.target.value !== workspace.name);
              }}
              maxLength={200}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
            <Button
              size="sm"
              disabled={!nameDirty || savingName}
              onClick={handleSaveName}
              className="shrink-0"
            >
              {savingName ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{name.length}/200</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="ws-desc" className="block text-sm font-medium text-foreground mb-1.5">
            Deskripsi
          </label>
          <textarea
            id="ws-desc"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setDescDirty(e.target.value !== (workspace.description || ""));
            }}
            maxLength={500}
            rows={3}
            placeholder="Deskripsi singkat tentang workspace ini..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-1">
            <p className="text-xs text-muted-foreground">{description.length}/500</p>
            <Button
              size="sm"
              disabled={!descDirty || savingDesc}
              onClick={handleSaveDescription}
            >
              {savingDesc ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Simpan
            </Button>
          </div>
        </div>

        {/* Avatar */}
        <div>
          <label htmlFor="ws-avatar" className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
            <Image className="size-4" />
            Avatar
          </label>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Avatar Preview */}
            <div className="size-12 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
              {avatarUrl ? (
                avatarUrl.startsWith("http") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">{avatarUrl}</span>
                )
              ) : (
                <span className="text-lg text-muted-foreground">
                  {workspace.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full">
              <input
                id="ws-avatar"
                type="text"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  setAvatarDirty(e.target.value !== (workspace.avatarUrl || ""));
                }}
                placeholder="Emoji atau URL gambar..."
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
              <Button
                size="sm"
                disabled={!avatarDirty || savingAvatar}
                onClick={handleSaveAvatar}
                className="shrink-0"
              >
                {savingAvatar ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
