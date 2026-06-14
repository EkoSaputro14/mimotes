"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatDateSafe } from "@/lib/date-utils";

interface Document {
  id: string;
  title: string;
  fileType: string;
  status: string;
  chunkCount: number;
  fileSize?: number;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch("/api/documents");
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus dokumen ini?")) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Dokumen berhasil dihapus");
        setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      } else {
        toast.error("Gagal menghapus dokumen");
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Gagal menghapus dokumen");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <svg className="size-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-foreground mb-1">
          Belum ada dokumen
        </h3>
        <p className="text-sm text-muted-foreground mb-2 max-w-sm">
          Upload dokumen untuk mulai menggunakan AI chatbot.
        </p>
        <p className="text-xs text-muted-foreground mb-5">
          PDF, DOCX, TXT, CSV, atau URL website.
        </p>
        <Link
          href="/documents/upload"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Dokumen Pertama
        </Link>
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Lewati ke konten
      </a>
      <div id="main-content" className="space-y-3" tabIndex={-1}>
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-card rounded-lg border border-border/20 p-2.5 flex items-center justify-between hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary text-sm">
              {getFileTypeIcon(doc.fileType)}
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">{doc.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {doc.fileType.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">
                  {doc._count.chunks} chunks
                </span>
                {doc.fileSize !== undefined && (
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(doc.fileSize)}
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                    doc.status === "ready"
                      ? "bg-emerald-500"
                      : doc.status === "processing"
                      ? "bg-amber-500"
                      : "bg-red-500"
                  }`}
                >
                  {doc.status === "ready"
                    ? "\u2705 Siap"
                    : doc.status === "processing"
                    ? "\u23F3 Memproses..."
                    : "\u274C Gagal"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {formatDateSafe(doc.createdAt, "id")}
            </span>
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Hapus dokumen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}
      </div>
    </>
  );
}

function getFileTypeIcon(fileType: string): string {
  switch (fileType) {
    case "pdf":
      return "📕" as string;
    case "docx":
      return "📘" as string;
    case "txt":
      return "📝" as string;
    case "csv":
      return "📊" as string;
    case "url":
      return "🔗" as string;
    default:
      return "📄" as string;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
