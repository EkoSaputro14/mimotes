"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Source {
  id: string;
  title: string;
  fileType: string;
  status: string;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
  referenceCount: number;
  lastReferenced: string | null;
}

interface SourceStats {
  totalDocuments: number;
  totalChunks: number;
  totalReferences: number;
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

type SortBy = "references" | "title" | "chunks" | "lastReferenced";

export default function SourceViewer() {
  const [sources, setSources] = useState<Source[]>([]);
  const [stats, setStats] = useState<SourceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortBy>("references");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    async function fetchSources() {
      setLoading(true);
      try {
        const res = await fetch("/api/knowledge/sources");
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setSources(data.sources);
        setStats(data.stats);
      } catch (err) {
        console.error("Failed to fetch sources:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSources();
  }, []);

  const filteredSources = sources
    .filter((s) => !filterType || s.fileType === filterType)
    .sort((a, b) => {
      switch (sortBy) {
        case "references":
          return b.referenceCount - a.referenceCount;
        case "title":
          return a.title.localeCompare(b.title);
        case "chunks":
          return b.chunkCount - a.chunkCount;
        case "lastReferenced": {
          const aDate = a.lastReferenced ? new Date(a.lastReferenced).getTime() : 0;
          const bDate = b.lastReferenced ? new Date(b.lastReferenced).getTime() : 0;
          return bDate - aDate;
        }
        default:
          return 0;
      }
    });

  const maxReferences = Math.max(...sources.map((s) => s.referenceCount), 1);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "Never";
    return formatDateSafe(dateStr);
  }

  if (loading) {
    return <SourceSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalChunks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Chunks</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalReferences}</p>
                <p className="text-xs text-muted-foreground">Total References</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="references">Most Referenced</option>
            <option value="title">Title (A-Z)</option>
            <option value="chunks">Most Chunks</option>
            <option value="lastReferenced">Recently Used</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-muted-foreground">Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="url">URL</option>
          </select>
        </div>
      </div>

      {/* Source List */}
      {filteredSources.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <svg className="mb-4 size-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <h3 className="text-lg font-medium">No sources yet</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Sources appear when the AI references documents in chat responses. Upload documents and start chatting to see source usage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSources.map((source) => (
            <div
              key={source.id}
              className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{FILE_TYPE_ICONS[source.fileType] || "📄"}</span>
                    <Link
                      href={`/knowledge/documents/${source.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {source.title}
                    </Link>
                    <Badge variant="outline" className="text-xs">
                      {source.fileType.toUpperCase()}
                    </Badge>
                    {source.status !== "ready" && (
                      <Badge variant={source.status === "processing" ? "secondary" : "destructive"}>
                        {source.status}
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>{source.chunkCount} chunks</span>
                    <span>
                      {source.referenceCount} reference{source.referenceCount !== 1 ? "s" : ""}
                    </span>
                    <span>Last used: {formatDate(source.lastReferenced)}</span>
                  </div>

                  {/* Reference Bar */}
                  {source.referenceCount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1.5 w-48 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-purple-500 transition-all"
                          style={{ width: `${(source.referenceCount / maxReferences) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {((source.referenceCount / maxReferences) * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Link href={`/knowledge/documents/${source.id}`}>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </Button>
                  </Link>
                  <Link href={`/knowledge/chunks?documentId=${source.id}`}>
                    <Button variant="ghost" size="sm" className="size-8 p-0">
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SourceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-lg" />
              <div>
                <Skeleton className="h-8 w-12" />
                <Skeleton className="mt-1 h-3 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-8 w-32" />
      </div>

      {/* List Skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="size-6 rounded" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-12" />
              </div>
              <div className="flex gap-1">
                <Skeleton className="size-8 rounded" />
                <Skeleton className="size-8 rounded" />
              </div>
            </div>
            <div className="mt-2 flex gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
            <Skeleton className="mt-2 h-1.5 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
