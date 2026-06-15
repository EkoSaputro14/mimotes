"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FileText, ArrowRight } from "lucide-react";

interface TopDocument {
  id: string;
  title: string;
  fileType: string;
  chunkCount: number;
  status: string;
  references: number;
}

const fileTypeEmoji: Record<string, string> = {
  pdf: "📄",
  docx: "📝",
  txt: "📃",
  csv: "📊",
  xlsx: "📈",
  xls: "📈",
  url: "🔗",
};

export function TopDocuments() {
  const [documents, setDocuments] = useState<TopDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTopDocs() {
      try {
        const res = await fetch("/api/dashboard/top-documents");
        const data = await res.json();
        setDocuments(data.documents || []);
      } catch {
        console.error("Failed to fetch top documents");
      } finally {
        setLoading(false);
      }
    }
    fetchTopDocs();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Most Referenced Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-8 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Most Referenced Documents</CardTitle>
        <Link
          href="/documents"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all <ArrowRight className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="size-8 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">No references yet</p>
            <Link
              href="/documents/upload"
              className="mt-2 text-xs text-primary hover:underline"
            >
              Upload a document
            </Link>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc, index) => (
              <Link
                key={doc.id}
                href={`/documents`}
                className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded bg-muted text-base">
                  {fileTypeEmoji[doc.fileType] || "📄"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.chunkCount} chunks · {doc.fileType.toUpperCase()}
                  </p>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {doc.references} refs
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
