"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface Folder {
  id: string;
  name: string;
  _count: { documents: number };
}

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  totalDocuments: number;
}

export default function FolderSidebar({
  selectedFolderId,
  onSelectFolder,
  totalDocuments,
}: FolderSidebarProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (creating && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creating]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  async function fetchFolders() {
    try {
      const res = await fetch("/api/folders");
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders);
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateFolder() {
    const name = newFolderName.trim();
    if (!name) {
      setCreating(false);
      return;
    }

    try {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setNewFolderName("");
        setCreating(false);
        fetchFolders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal membuat folder");
      }
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  }

  async function handleRenameFolder(id: string) {
    const name = editingName.trim();
    if (!name) {
      setEditingId(null);
      return;
    }

    try {
      const res = await fetch("/api/folders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchFolders();
      } else {
        const data = await res.json();
        alert(data.error || "Gagal mengubah nama folder");
      }
    } catch (err) {
      console.error("Failed to rename folder:", err);
    }
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Hapus folder ini? Dokumen di dalam folder tidak akan dihapus.")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/folders?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedFolderId === id) {
          onSelectFolder(null);
        }
        fetchFolders();
      }
    } catch (err) {
      console.error("Failed to delete folder:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-3 py-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Folder</h2>
        <Button
          variant="ghost"
          size="sm"
          className="size-7 p-0"
          onClick={() => setCreating(true)}
          aria-label="Buat folder baru"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2" aria-label="Daftar folder">
        {/* Semua Dokumen */}
        <button
          onClick={() => onSelectFolder(null)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
            selectedFolderId === null
              ? "bg-primary/10 text-primary font-medium"
              : "text-foreground hover:bg-muted"
          )}
        >
          <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="flex-1 text-left truncate">Semua Dokumen</span>
          <span className="text-xs text-muted-foreground">{totalDocuments}</span>
        </button>

        {loading ? (
          <div className="space-y-1 px-2 py-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-4" />
              </div>
            ))}
          </div>
        ) : (
          folders.map((folder) => (
            <div key={folder.id} className="group">
              {editingId === folder.id ? (
                <div className="flex items-center gap-1 px-1">
                  <svg className="size-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <Input
                    ref={editInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleRenameFolder(folder.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameFolder(folder.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="h-6 text-xs"
                  />
                </div>
              ) : (
                <button
                  onClick={() => onSelectFolder(folder.id)}
                  onDoubleClick={() => {
                    setEditingId(folder.id);
                    setEditingName(folder.name);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                    selectedFolderId === folder.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span className="text-xs text-muted-foreground">{folder._count.documents}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    disabled={deletingId === folder.id}
                    className="ml-1 hidden size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive group-hover:inline-flex"
                    aria-label={`Hapus folder ${folder.name}`}
                  >
                    {deletingId === folder.id ? (
                      <svg className="size-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>
                </button>
              )}
            </div>
          ))
        )}

        {/* Create folder inline input */}
        {creating && (
          <div className="flex items-center gap-1 px-1">
            <svg className="size-4 shrink-0 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <Input
              ref={newFolderInputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => {
                handleCreateFolder();
                setCreating(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Nama folder..."
              className="h-6 text-xs"
            />
          </div>
        )}
      </nav>
    </div>
  );
}
