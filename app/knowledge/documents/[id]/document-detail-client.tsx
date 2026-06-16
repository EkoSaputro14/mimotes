"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DocumentPreview from "@/components/documents/document-preview";
import ChunkViewer from "@/components/knowledge/chunk-viewer";

interface DocumentData {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string | null;
  status: string;
  chunkCount: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "\uD83D\uDCD5",
  docx: "\uD83D\uDCD8",
  txt: "\uD83D\uDCDD",
  csv: "\uD83D\uDCCA",
  xlsx: "\uD83D\uDCD7",
  xls: "\uD83D\uDCD7",
  url: "\uD83C\uDF10",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: string }> = {
  ready: { label: "Ready", variant: "default", icon: "\u2705" },
  processing: { label: "Processing", variant: "secondary", icon: "\u23F3" },
  failed: { label: "Failed", variant: "destructive", icon: "\u274C" },
};

export default function DocumentDetailClient({ document }: { document: DocumentData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [description, setDescription] = useState(document.description || "");
  const [editingDesc, setEditingDesc] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [showChunks, setShowChunks] = useState(false);
  const descInputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Poll processing status
  useEffect(() => {
    if (document.status !== "processing") return;
    const interval = setInterval(() => {
      router.refresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [document.status, router]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const saveDescription = useCallback(async () => {
    setSavingDesc(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error("Failed to save");
      toast.success("Deskripsi tersimpan");
      setEditingDesc(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        toast.error("Gagal menyimpan deskripsi");
      }
    } finally {
      setSavingDesc(false);
    }
  }, [document.id, description]);

  async function handleDelete() {
    if (!confirm(`Hapus "${document.title}"? Semua ${document._count.chunks} chunk akan dihapus dan tidak dapat dikembalikan.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/knowledge/documents");
    } catch (err) {
      console.error("Failed to delete:", err);
      setDeleting(false);
    }
  }

  const statusConfig = STATUS_CONFIG[document.status] || { label: document.status, variant: "outline" as const, icon: "" };

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Lewati ke konten
      </a>
      <div id="main-content" className="space-y-4" tabIndex={-1}>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/knowledge/documents" className="text-muted-foreground hover:text-foreground shrink-0">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-2xl shrink-0">{FILE_TYPE_ICONS[document.fileType] || "\uD83D\uDCC4"}</span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight truncate">{document.title}</h1>
            <div className="mt-0.5 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{document.fileType.toUpperCase()}</Badge>
              <Badge variant={statusConfig.variant} className="text-xs gap-1">{statusConfig.icon} {statusConfig.label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/chat?doc=${document.id}`}>
            <Button size="sm">
              <svg className="mr-1.5 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Tanya tentang ini
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleting}>
            {deleting ? (
              <svg className="mr-1.5 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="mr-1.5 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Hapus
          </Button>
        </div>
      </div>

      {/* Split View: Preview (60%) + Info (40%) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">

        {/* Left: Document Preview (3 cols = 60%) */}
        <div className="order-1 lg:col-span-3">
          <DocumentPreview
            fileUrl={document.fileUrl}
            fileType={document.fileType}
            title={document.title}
            status={document.status}
          />
        </div>

        {/* Right: Info Panel (2 cols = 40%) */}
        <div className="order-2 lg:col-span-2 space-y-4">

          {/* Info Card */}
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">Informasi Dokumen</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe</span>
                <span className="font-medium">{FILE_TYPE_ICONS[document.fileType]} {document.fileType.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={statusConfig.variant} className="text-xs">{statusConfig.icon} {statusConfig.label}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chunks</span>
                <span className="font-medium">{document.status === "processing" ? "..." : document._count.chunks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibuat</span>
                <span className="font-medium text-right">{formatDate(document.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diperbarui</span>
                <span className="font-medium text-right">{formatDate(document.updatedAt)}</span>
              </div>
              {document.fileUrl && document.fileType === "url" && (
                <div>
                  <span className="text-muted-foreground text-xs">Sumber</span>
                  <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="block mt-0.5 text-xs text-primary hover:underline truncate">
                    {document.fileUrl}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Description Card */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-foreground">Deskripsi</h3>
              {!editingDesc && (
                <button
                  onClick={() => { setEditingDesc(true); setTimeout(() => descInputRef.current?.focus(), 0); }}
                  className="text-xs text-primary hover:underline"
                >
                  {description ? "Edit" : "Tambah deskripsi"}
                </button>
              )}
            </div>
            {editingDesc ? (
              <div className="space-y-2">
                <textarea
                  ref={descInputRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambahkan deskripsi untuk dokumen ini..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{description.length}/500</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingDesc(false); setDescription(document.description || ""); }}>
                      Batal
                    </Button>
                    <Button size="sm" onClick={saveDescription} disabled={savingDesc}>
                      {savingDesc ? "Menyimpan..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {description || <span className="italic">Belum ada deskripsi</span>}
              </p>
            )}
          </div>

          {/* Quick Actions Card */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <h3 className="text-sm font-medium text-foreground mb-2">Aksi Cepat</h3>
            <Link href={`/knowledge/search?q=${encodeURIComponent(document.title)}`} className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Cari Chunk Serupa
              </Button>
            </Link>
            <Link href="/knowledge/chunks" className="block">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Lihat Semua Chunk
              </Button>
            </Link>
          </div>

          {/* Chunks Section (collapsible) */}
          <div className="rounded-lg border bg-card">
            <button
              onClick={() => setShowChunks(!showChunks)}
              className="w-full flex items-center justify-between p-4 text-sm font-medium text-foreground"
            >
              <span>Chunk ({document.status === "processing" ? "..." : document._count.chunks})</span>
              <svg className={`size-4 text-muted-foreground transition-transform ${showChunks ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showChunks && (
              <div className="border-t p-4">
                {document.status === "processing" ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Chunk akan muncul setelah selesai diproses</p>
                ) : document.status === "failed" ? (
                  <p className="text-sm text-destructive text-center py-4">Dokumen gagal diproses</p>
                ) : (
                  <ChunkViewer documentId={document.id} documentTitle={document.title} />
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      </div>
    </>
  );
}
