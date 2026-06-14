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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface Document {
  id: string;
  title: string;
  fileType: string;
  status: string;
  chunkCount: number;
  fileSize?: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type ViewMode = "table" | "grid";
type SortField = "createdAt" | "title" | "fileType" | "status" | "chunkCount";
type SortOrder = "asc" | "desc";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "ready", label: "Ready" },
  { key: "processing", label: "Processing" },
  { key: "failed", label: "Failed" },
] as const;

const FILE_TYPE_ICONS: Record<string, string> = {
  pdf: "📕",
  docx: "📘",
  txt: "📄",
  csv: "📊",
  xlsx: "📗",
  xls: "📗",
  url: "🌐",
};

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: string }> = {
  ready: { label: "Ready", variant: "default", icon: "\u2705" },
  processing: { label: "Processing", variant: "secondary", icon: "\u23F3" },
  failed: { label: "Failed", variant: "destructive", icon: "\u274C" },
};

export default function DocumentExplorer() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [quickStatusTab, setQuickStatusTab] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [overviewStats, setOverviewStats] = useState({
    totalDocuments: 0,
    totalChunks: 0,
    pdfRatio: 0,
    imageAssets: 0,
  });

  // Fetch overview stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/knowledge/documents/stats");
        if (res.ok) {
          const data = await res.json();
          setOverviewStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch overview stats:", err);
      }
    }
    fetchStats();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchDocuments = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort: sortField,
        order: sortOrder,
      });
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (filterType) params.set("fileType", filterType);
      // Quick status tab takes priority over dropdown filter
      const effectiveStatus = quickStatusTab || filterStatus;
      if (effectiveStatus) params.set("status", effectiveStatus);

      const res = await fetch(`/api/knowledge/documents?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDocuments(data.documents);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterType, filterStatus, quickStatusTab, sortField, sortOrder]);

  useEffect(() => {
    fetchDocuments(1);
  }, [fetchDocuments, quickStatusTab]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This will remove all chunks and cannot be undone.`)) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchDocuments(pagination.page);
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeleting(null);
    }
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <svg className="ml-1 size-3 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === "asc" ? (
      <svg className="ml-1 size-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="ml-1 size-3 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }

  function formatDate(dateStr: string) {
    return formatDateSafe(dateStr);
  }

  const hasActiveFilters = debouncedSearch || filterType || filterStatus || quickStatusTab;

  return (
    <div className="space-y-4">
      {/* Overview Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="bg-card border border-border/20 rounded-lg p-4">
          <div className="text-2xl font-bold">{overviewStats.totalDocuments}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Documents</div>
        </div>
        <div className="bg-card border border-border/20 rounded-lg p-4">
          <div className="text-2xl font-bold">{overviewStats.totalChunks}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Chunks</div>
        </div>
        <div className="bg-card border border-border/20 rounded-lg p-4">
          <div className="text-2xl font-bold">{overviewStats.pdfRatio}%</div>
          <div className="text-xs text-muted-foreground mt-1">PDF Ratio</div>
        </div>
        <div className="bg-card border border-border/20 rounded-lg p-4">
          <div className="text-2xl font-bold">{overviewStats.imageAssets}</div>
          <div className="text-xs text-muted-foreground mt-1">Image Assets</div>
        </div>
      </div>

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setQuickStatusTab(tab.key);
              setFilterStatus("");
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              quickStatusTab === tab.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
            <option value="csv">CSV</option>
            <option value="xlsx">XLSX</option>
            <option value="url">URL</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">All Status</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
          <div className="flex items-center rounded-md border">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-l-md transition-colors",
                viewMode === "table" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Table view"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex size-9 items-center justify-center rounded-r-md transition-colors",
                viewMode === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              title="Grid view"
            >
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {debouncedSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: "{debouncedSearch}"
              <button onClick={() => setSearch("")} className="ml-0.5 hover:text-foreground">
                ✕
              </button>
            </Badge>
          )}
          {filterType && (
            <Badge variant="secondary" className="gap-1">
              Type: {filterType.toUpperCase()}
              <button onClick={() => setFilterType("")} className="ml-0.5 hover:text-foreground">
                ✕
              </button>
            </Badge>
          )}
          {filterStatus && (
            <Badge variant="secondary" className="gap-1">
              Status: {filterStatus}
              <button onClick={() => setFilterStatus("")} className="ml-0.5 hover:text-foreground">
                ✕
              </button>
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setFilterType("");
              setFilterStatus("");
              setQuickStatusTab("");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Document List */}
      {loading ? (
        <DocumentSkeleton viewMode={viewMode} />
      ) : documents.length === 0 ? (
        <EmptyState hasFilters={!!hasActiveFilters} onClearFilters={() => {
          setSearch("");
          setFilterType("");
          setFilterStatus("");
          setQuickStatusTab("");
        }} />
      ) : viewMode === "table" ? (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">
                  <button onClick={() => toggleSort("title")} className="inline-flex items-center font-medium hover:text-foreground">
                    Name <SortIcon field="title" />
                  </button>
                </TableHead>
                <TableHead className="w-[80px]">
                  <button onClick={() => toggleSort("fileType")} className="inline-flex items-center font-medium hover:text-foreground">
                    Type <SortIcon field="fileType" />
                  </button>
                </TableHead>
                <TableHead className="w-[100px]">
                  <button onClick={() => toggleSort("status")} className="inline-flex items-center font-medium hover:text-foreground">
                    Status <SortIcon field="status" />
                  </button>
                </TableHead>
                <TableHead className="w-[80px]">
                  <button onClick={() => toggleSort("chunkCount")} className="inline-flex items-center font-medium hover:text-foreground">
                    Chunks <SortIcon field="chunkCount" />
                  </button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <button onClick={() => toggleSort("createdAt")} className="inline-flex items-center font-medium hover:text-foreground">
                    Uploaded <SortIcon field="createdAt" />
                  </button>
                </TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="group">
                  <TableCell>
                    <Link
                      href={`/knowledge/documents/${doc.id}`}
                      className="inline-flex items-center gap-2 hover:underline"
                    >
                      <span className="text-base">{FILE_TYPE_ICONS[doc.fileType] || "📄"}</span>
                      <span className="truncate font-medium">{doc.title}</span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {doc.fileType.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {doc.status === "processing" ? "—" : doc.chunkCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(doc.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/knowledge/documents/${doc.id}`}>
                        <Button variant="ghost" size="sm" className="size-8 p-0">
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(doc.id, doc.title)}
                        disabled={deleting === doc.id}
                      >
                        {deleting === doc.id ? (
                          <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              href={`/knowledge/documents/${doc.id}`}
              className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between">
                <span className="text-2xl">{FILE_TYPE_ICONS[doc.fileType] || "📄"}</span>
                <StatusBadge status={doc.status} />
              </div>
              <h3 className="mt-2 truncate font-medium group-hover:underline">{doc.title}</h3>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {doc.fileType.toUpperCase()}
                </Badge>
                <span>{doc.status === "processing" ? "—" : `${doc.chunkCount} chunks`}</span>
                <span>{formatDate(doc.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom CTA Panels */}
      {!loading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/settings/widget" className="bg-card border border-border/20 rounded-lg p-6 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <h3 className="font-semibold">Automate Ingestion</h3>
            </div>
            <p className="text-sm text-muted-foreground">Set up automatic file sync from cloud storage</p>
          </Link>
          <Link href="/knowledge/chunks" className="bg-card border border-border/20 rounded-lg p-6 hover:bg-accent/50 transition-colors">
            <div className="flex items-center gap-3 mb-2">
              <svg className="size-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="font-semibold">Smart Chunking</h3>
            </div>
            <p className="text-sm text-muted-foreground">Optimize your knowledge chunks for better retrieval</p>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {!loading && documents.length > 0 && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} documents
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (pagination.page > 1) fetchDocuments(pagination.page - 1);
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
                        fetchDocuments(pageNum);
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
                    if (pagination.page < pagination.totalPages) fetchDocuments(pagination.page + 1);
                  }}
                  className={pagination.page >= pagination.totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
      </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_BADGES[status] || { label: status, variant: "outline" as const, icon: "" };
  return <Badge variant={config.variant} className="gap-1">{config.icon} {config.label}</Badge>;
}

function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <svg className="size-7 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-lg font-medium">Tidak ada dokumen yang cocok</h3>
          <p className="mt-1 text-sm text-muted-foreground">Coba sesuaikan pencarian atau filter Anda</p>
          <Button variant="outline" className="mt-4" onClick={onClearFilters}>
            Hapus filter
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-medium">Belum ada dokumen</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload dokumen untuk mulai membangun knowledge base. AI akan menggunakan dokumen ini untuk menjawab pertanyaan di chat.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Format yang didukung: PDF, DOCX, TXT, CSV, XLSX, URL
          </p>
          <Link href="/documents/upload">
            <Button className="mt-4">
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload Dokumen Pertama
            </Button>
          </Link>
        </>
      )}
    </div>
  );
}

function DocumentSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="flex items-start justify-between">
              <Skeleton className="size-8 rounded" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="mt-2 h-5 w-3/4" />
            <div className="mt-2 flex items-center gap-3">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Name</TableHead>
            <TableHead className="w-[80px]">Type</TableHead>
            <TableHead className="w-[100px]">Status</TableHead>
            <TableHead className="w-[80px]">Chunks</TableHead>
            <TableHead className="w-[120px]">Uploaded</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-4 w-8" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Skeleton className="size-8 rounded" />
                  <Skeleton className="size-8 rounded" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
