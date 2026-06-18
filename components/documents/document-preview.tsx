"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  fileUrl: string | null;
  fileType: string;
  title: string;
  status: string;
}

export default function DocumentPreview({ fileUrl, fileType, title, status }: DocumentPreviewProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState(false);

  // Fetch text content for text-based files
  useEffect(() => {
    if (!fileUrl) return;
    const textTypes = ["txt", "csv", "xlsx", "xls"];
    if (!textTypes.includes(fileType)) return;

    setLoadingText(true);
    fetch(fileUrl)
      .then((res) => res.text())
      .then((text) => setTextContent(text))
      .catch(() => setTextContent(null))
      .finally(() => setLoadingText(false));
  }, [fileUrl, fileType]);

  if (status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-dashed bg-muted/20">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <svg className="size-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">Memproses dokumen...</p>
        <p className="text-xs text-muted-foreground mt-1">Konten akan muncul setelah selesai diproses</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-dashed border-destructive/30 bg-destructive/5">
        <svg className="size-10 text-destructive/40 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm font-medium text-destructive">Gagal memproses dokumen</p>
        <p className="text-xs text-muted-foreground mt-1">File mungkin rusak atau format tidak didukung</p>
      </div>
    );
  }

  if (!fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-dashed bg-muted/20">
        <p className="text-sm text-muted-foreground">Tidak ada preview tersedia</p>
      </div>
    );
  }

  // PDF preview
  if (fileType === "pdf") {
    return (
      <div className="rounded-lg overflow-hidden border bg-background">
        <iframe
          src={fileUrl}
          className="w-full h-[600px]"
          title={`Preview: ${title}`}
          sandbox="allow-same-origin"
        />
      </div>
    );
  }

  // Image preview
  if (["png", "jpg", "jpeg", "webp", "gif", "image"].includes(fileType)) {
    return (
      <div className="rounded-lg overflow-hidden border bg-muted/20 flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fileUrl}
          alt={title}
          className="max-w-full max-h-[600px] object-contain rounded"
        />
      </div>
    );
  }

  // Text/CSV content
  if (["txt", "csv", "xlsx", "xls"].includes(fileType)) {
    if (loadingText) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border bg-muted/20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
    return (
      <div className="rounded-lg border bg-card overflow-auto max-h-[600px]">
        <pre className="p-4 text-sm text-foreground whitespace-pre-wrap break-words font-mono leading-relaxed">
          {textContent || "Tidak dapat memuat konten"}
        </pre>
      </div>
    );
  }

  // DOCX and other types — show file info card
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] rounded-lg border border-dashed bg-muted/20">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <svg className="size-8 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">Format: {fileType.toUpperCase()}</p>
      <a
        href={fileUrl}
        download
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Download File
      </a>
    </div>
  );
}
