"use client";

import { useState } from "react";
import { FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Source {
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

function getFileTypeLabel(fileType?: string): string {
  if (!fileType) return "";
  return fileType.toUpperCase();
}

function getFileTypeColor(fileType?: string): string {
  switch (fileType) {
    case "pdf":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "docx":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    case "txt":
      return "bg-muted text-muted-foreground";
    case "csv":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "xlsx":
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    case "url":
      return "bg-violet-500/10 text-violet-600 dark:text-violet-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

interface SourcePreviewProps {
  source: Source;
  index: number;
  isHighlighted?: boolean;
}

export default function SourcePreview({
  source,
  index,
  isHighlighted = false,
}: SourcePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const similarityPercent = Math.round(source.similarity * 100);

  const title =
    (source.metadata?.title as string) ||
    (source.metadata?.filename as string) ||
    "Dokumen tidak diketahui";
  const fileType = (source.metadata?.fileType as string) || "";
  const documentId = source.documentId;

  const previewLength = 200;
  const needsTruncation = source.content.length > previewLength;
  const displayContent = expanded
    ? source.content
    : source.content.substring(0, previewLength);

  return (
    <div
      id={`source-preview-${index}`}
      className={cn(
        "rounded-lg border transition-all duration-200",
        isHighlighted
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-3 text-left"
        aria-expanded={expanded}
        aria-controls={`source-content-${index}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] rounded-md bg-primary/10 text-primary text-[11px] font-semibold flex-shrink-0">
            {index}
          </span>
          <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs font-medium text-foreground truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {fileType && (
            <span
              className={cn(
                "text-[10px] font-medium px-1.5 py-0.5 rounded",
                getFileTypeColor(fileType)
              )}
            >
              {getFileTypeLabel(fileType)}
            </span>
          )}
          <span className="text-[11px] font-medium text-primary">
            {similarityPercent}%
          </span>
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Content preview */}
      {expanded && (
        <div id={`source-content-${index}`} className="px-3 pb-3">
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {displayContent}
            {!expanded && needsTruncation ? "..." : ""}
          </p>
          {documentId && (
            <a
              href={`/knowledge/documents/${documentId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Lihat dokumen
            </a>
          )}
        </div>
      )}
    </div>
  );
}
