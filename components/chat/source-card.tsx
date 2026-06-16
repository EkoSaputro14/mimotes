"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

interface Source {
  documentId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

function getFileTypeIcon(fileType?: string) {
  switch (fileType) {
    case "pdf":
      return "📕";
    case "docx":
      return "📘";
    case "txt":
      return "📝";
    case "csv":
      return "📊";
    case "xlsx":
      return "📗";
    case "url":
      return "🔗";
    default:
      return "📄";
  }
}

export default function SourceCard({
  source,
  index,
}: {
  source: Source;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const similarityPercent = Math.round(source.similarity * 100);

  const title =
    (source.metadata?.title as string) ||
    (source.metadata?.filename as string) ||
    "Unknown";
  const fileType = (source.metadata?.fileType as string) || "";
  const documentId = source.documentId;

  const previewLength = 200;
  const needsTruncation = source.content.length > previewLength;
  const displayContent = expanded
    ? source.content
    : source.content.substring(0, previewLength);

  return (
    <Card
      size="sm"
      className="flex-shrink-0 w-64 cursor-pointer border border-border hover:shadow-md transition-shadow"
      onClick={() => setExpanded((prev) => !prev)}
    >
      <CardContent className="p-3">
        {/* Header: doc name + expand toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* File type + similarity */}
        <div className="flex items-center gap-2 mb-2">
          {fileType && (
            <span className="text-xs text-muted-foreground">
              {getFileTypeIcon(fileType)} {fileType.toUpperCase()}
            </span>
          )}
          <span className="text-xs font-medium text-primary">
            {similarityPercent}% cocok
          </span>
        </div>

        {/* Content preview */}
        <p className="text-xs text-muted-foreground leading-relaxed break-words">
          {displayContent}
          {!expanded && needsTruncation ? "..." : ""}
        </p>

        {/* Link to document */}
        {documentId && (
          <a
            href={`/knowledge/documents/${documentId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 mt-2 text-xs text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="h-3 w-3" />
            Lihat dokumen
          </a>
        )}
      </CardContent>
    </Card>
  );
}
