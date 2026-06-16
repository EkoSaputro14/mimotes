"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDateSafe } from "@/lib/date-utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Chunk {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  document: {
    id: string;
    title: string;
    fileType: string;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ChunkViewerProps {
  documentId?: string;
  documentTitle?: string;
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

export default function ChunkViewer({ documentId, documentTitle }: ChunkViewerProps) {
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedChunk, setSelectedChunk] = useState<Chunk | null>(null);
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(new Set());
  const [similarChunks, setSimilarChunks] = useState<Record<string, Chunk[]>>({});
  const [loadingSimilar, setLoadingSimilar] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchChunks = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const baseUrl = documentId
        ? `/api/knowledge/documents/${documentId}/chunks`
        : "/api/knowledge/chunks";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`${baseUrl}?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setChunks(data.chunks);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch chunks:", err);
    } finally {
      setLoading(false);
    }
  }, [documentId, debouncedSearch]);

  useEffect(() => {
    fetchChunks(1);
  }, [fetchChunks]);

  function toggleExpand(chunkId: string) {
    setExpandedChunks((prev) => {
      const next = new Set(prev);
      if (next.has(chunkId)) {
        next.delete(chunkId);
      } else {
        next.add(chunkId);
      }
      return next;
    });
  }

  async function handleFindSimilar(chunkId: string) {
    if (similarChunks[chunkId]) {
      // Toggle off
      setSimilarChunks((prev) => {
        const next = { ...prev };
        delete next[chunkId];
        return next;
      });
      return;
    }

    setLoadingSimilar(chunkId);
    try {
      const res = await fetch(`/api/knowledge/chunks/${chunkId}/similar?limit=5`);
      if (!res.ok) throw new Error("Failed to find similar");
      const data = await res.json();
      setSimilarChunks((prev) => ({ ...prev, [chunkId]: data.chunks }));
    } catch (err) {
      console.error("Failed to find similar chunks:", err);
    } finally {
      setLoadingSimilar(null);
    }
  }

  async function handleDelete(chunkId: string) {
    if (!confirm("Delete this chunk? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/knowledge/chunks/${chunkId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchChunks(pagination.page);
    } catch (err) {
      console.error("Failed to delete chunk:", err);
    }
  }

  function formatDate(dateStr: string) {
    return formatDateSafe(dateStr);
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search chunks by content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {debouncedSearch && (
          <Button variant="ghost" size="sm" onClick={() => setSearch("")}>
            Clear
          </Button>
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <p className="text-sm text-muted-foreground">
          {documentTitle
            ? `${pagination.total} chunks in "${documentTitle}"`
            : `Total: ${pagination.total} chunks`}
        </p>
      )}

      {/* Chunk List */}
      {loading ? (
        <ChunkSkeleton />
      ) : chunks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <svg className="mb-4 size-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-medium">
            {debouncedSearch ? "No chunks match your search" : "No chunks found"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {debouncedSearch
              ? "Try a different search term"
              : "Upload documents to generate chunks"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {chunks.map((chunk) => {
            const isExpanded = expandedChunks.has(chunk.id);
            const similar = similarChunks[chunk.id];

            return (
              <div
                key={chunk.id}
                className="rounded-lg border bg-card transition-colors"
              >
                {/* Chunk Header */}
                <div className="flex items-center justify-between border-b px-4 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">
                      Chunk #{chunk.chunkIndex + 1}
                    </span>
                    {!documentId && (
                      <>
                        <span className="text-muted-foreground">—</span>
                        <Link
                          href={`/knowledge/documents/${chunk.document.id}`}
                          className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
                        >
                          <span>{FILE_TYPE_ICONS[chunk.document.fileType] || "📄"}</span>
                          <span className="truncate max-w-[200px]">{chunk.document.title}</span>
                        </Link>
                      </>
                    )}
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">{chunk.content.length} chars</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleExpand(chunk.id)}
                    >
                      {isExpanded ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                </div>

                {/* Chunk Content */}
                <div className="px-4 py-3">
                  <p className={cn(
                    "text-sm text-muted-foreground whitespace-pre-wrap break-words",
                    !isExpanded && "line-clamp-3"
                  )}>
                    {chunk.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 border-t px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setSelectedChunk(chunk)}
                  >
                    <svg className="mr-1 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Detail
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => handleFindSimilar(chunk.id)}
                    disabled={loadingSimilar === chunk.id}
                  >
                    {loadingSimilar === chunk.id ? (
                      <svg className="mr-1 size-3 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="mr-1 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                    Find Similar
                  </Button>
                  {!documentId && (
                    <Link href={`/knowledge/documents/${chunk.document.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                        <svg className="mr-1 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Document
                      </Button>
                    </Link>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => handleDelete(chunk.id)}
                  >
                    <svg className="mr-1 size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </Button>
                </div>

                {/* Similar Chunks */}
                {similar && similar.length > 0 && (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Similar Chunks</p>
                    <div className="space-y-2">
                      {similar.map((sc) => (
                        <div
                          key={sc.id}
                          className="flex items-start gap-2 rounded-md bg-background p-2 text-xs"
                        >
                          <Badge variant="outline" className="shrink-0">
                            {"similarity" in sc ? `${((sc as Chunk & { similarity: number }).similarity * 100).toFixed(0)}%` : ""}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{sc.document.title}</span>
                            <span className="text-muted-foreground"> — Chunk #{sc.chunkIndex + 1}</span>
                            <p className="mt-0.5 line-clamp-2 text-muted-foreground">{sc.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && chunks.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page > 1) fetchChunks(pagination.page - 1);
                  }}
                  className={pagination.page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum: number;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      isActive={pageNum === pagination.page}
                      onClick={(e) => {
                        e.preventDefault();
                        fetchChunks(pageNum);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page < pagination.totalPages) fetchChunks(pagination.page + 1);
                  }}
                  className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Chunk Detail Dialog */}
      <Dialog open={!!selectedChunk} onOpenChange={(open) => !open && setSelectedChunk(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedChunk && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Chunk #{selectedChunk.chunkIndex + 1} — {selectedChunk.document.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedChunk.content.length} characters • Created {formatDate(selectedChunk.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="mb-2 text-sm font-medium">Content</h4>
                  <div className="rounded-md bg-muted/50 p-4">
                    <p className="whitespace-pre-wrap break-words text-sm">{selectedChunk.content}</p>
                  </div>
                </div>
                {selectedChunk.metadata && Object.keys(selectedChunk.metadata).length > 0 && (
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Metadata</h4>
                    <div className="rounded-md bg-muted/50 p-4">
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(selectedChunk.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Link href={`/knowledge/documents/${selectedChunk.document.id}`}>
                    <Button variant="outline" size="sm">View Document</Button>
                  </Link>
                  <Link href={`/knowledge/search?q=${encodeURIComponent(selectedChunk.content.substring(0, 100))}`}>
                    <Button variant="outline" size="sm">Find Similar</Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChunkSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card">
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
          <div className="px-4 py-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-5/6" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </div>
          <div className="flex items-center gap-1 border-t px-4 py-2">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
