"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ChunkViewer from "@/components/knowledge/chunk-viewer";

interface DocumentData {
  id: string;
  title: string;
  fileType: string;
  fileUrl: string | null;
  status: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  _count: { chunks: number };
}

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📕",
  docx: "📘",
  txt: "📄",
  csv: "📊",
  xlsx: "📗",
  xls: "📗",
  url: "🌐",
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: string }> = {
  ready: { label: "Ready", variant: "default", icon: "\u2705" },
  processing: { label: "Processing", variant: "secondary", icon: "\u23F3" },
  failed: { label: "Failed", variant: "destructive", icon: "\u274C" },
};

export default function DocumentDetailClient({ document }: { document: DocumentData }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${document.title}"? This will remove all ${document._count.chunks} chunks and cannot be undone.`)) return;
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
      <div id="main-content" className="space-y-6" tabIndex={-1}>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/knowledge/documents" className="text-muted-foreground hover:text-foreground">
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-2xl">{FILE_TYPE_ICONS[document.fileType] || "📄"}</span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{document.title}</h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant="outline">{document.fileType.toUpperCase()}</Badge>
              <Badge variant={statusConfig.variant}>{statusConfig.icon} {statusConfig.label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/chat?doc=${document.id}`}>
            <Button size="sm">
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Tanya tentang dokumen ini
            </Button>
          </Link>
          <Link href={`/knowledge/search?q=${encodeURIComponent(document.title)}`}>
            <Button variant="outline" size="sm">
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search This
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <svg className="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete
          </Button>
        </div>
      </div>

      {/* Document Info + Chunks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Info Sidebar */}
        <div className="order-2 lg:order-1 lg:col-span-1">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h3 className="text-sm font-medium">Document Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">{FILE_TYPE_ICONS[document.fileType]} {document.fileType.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
              </div>
              <div>
                <p className="text-muted-foreground">Chunks</p>
                <p className="font-medium">{document.status === "processing" ? "Processing..." : document._count.chunks}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Uploaded</p>
                <p className="font-medium">{formatDate(document.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Updated</p>
                <p className="font-medium">{formatDate(document.updatedAt)}</p>
              </div>
              {document.fileUrl && (
                <div>
                  <p className="text-muted-foreground">Source</p>
                  <p className="truncate font-medium">
                    {document.fileType === "url" ? (
                      <a href={document.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {document.fileUrl}
                      </a>
                    ) : (
                      document.fileUrl
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chunks */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <h2 className="mb-4 text-lg font-semibold">
            Chunks ({document.status === "processing" ? "..." : document._count.chunks})
          </h2>
          {document.status === "processing" ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <svg className="mb-4 size-10 animate-spin text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm text-muted-foreground">Document is being processed...</p>
              <p className="text-xs text-muted-foreground">Chunks will appear here once processing is complete</p>
            </div>
          ) : document.status === "failed" ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/50 py-12 text-center">
              <svg className="mb-4 size-10 text-destructive/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm font-medium text-destructive">Document processing failed</p>
              <p className="text-xs text-muted-foreground">Try uploading the document again</p>
            </div>
          ) : (
            <ChunkViewer documentId={document.id} documentTitle={document.title} />
          )}
        </div>
      </div>
      </div>
    </>
  );
}
