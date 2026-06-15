"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  chunkId: string;
  content: string;
  chunkIndex: number;
  documentId: string;
  documentTitle: string;
  documentFileType: string;
  similarity: number;
}

interface SearchMetrics {
  embedTime: number;
  searchTime: number;
  totalTime: number;
  query: string;
  topK: number;
  threshold: number;
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

const EXAMPLE_QUERIES = [
  "What is the pricing model?",
  "How do I set up the system?",
  "What are the main features?",
];

interface SimilaritySearchProps {
  initialQuery?: string;
}

export default function SimilaritySearch({ initialQuery }: SimilaritySearchProps) {
  const [query, setQuery] = useState(initialQuery || "");
  const [topK, setTopK] = useState(5);
  const [threshold, setThreshold] = useState(0.5);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [documents, setDocuments] = useState<{ id: string; title: string }[]>([]);
  const [filterDoc, setFilterDoc] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load documents for filter dropdown
  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await fetch("/api/knowledge/documents?limit=100");
        if (!res.ok) return;
        const data = await res.json();
        setDocuments(data.documents.map((d: { id: string; title: string }) => ({ id: d.id, title: d.title })));
      } catch {
        // silent
      }
    }
    loadDocs();
  }, []);

  // Auto-search if initialQuery provided
  useEffect(() => {
    if (initialQuery && !hasSearched) {
      handleSearch();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery || query;
    if (!q.trim()) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/knowledge/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          topK,
          threshold,
          documentId: filterDoc || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Search failed");
      }

      const data = await res.json();
      setResults(data.results);
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  }

  function SimilarityBar({ score }: { score: number }) {
    const percentage = Math.round(score * 100);
    const color =
      score >= 0.9 ? "bg-green-500" :
      score >= 0.7 ? "bg-blue-500" :
      score >= 0.5 ? "bg-yellow-500" :
      "bg-red-500";

    return (
      <div className="flex items-center gap-2">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium tabular-nums">{score.toFixed(2)}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        <div className="space-y-4">
          <div className="relative">
            <textarea
              ref={inputRef}
              placeholder="Enter a question or text to find similar chunks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="w-full resize-none rounded-md border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Top-K:</label>
              <select
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                {[3, 5, 10, 15, 20].map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-muted-foreground">Threshold:</label>
              <select
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {documents.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-muted-foreground">Document:</label>
                <select
                  value={filterDoc}
                  onChange={(e) => setFilterDoc(e.target.value)}
                  className="h-8 rounded-md border bg-background px-2 text-sm max-w-[200px]"
                >
                  <option value="">All Documents</option>
                  {documents.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title.length > 30 ? doc.title.substring(0, 30) + "..." : doc.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="ml-auto">
              <Button
                onClick={() => handleSearch()}
                disabled={!query.trim() || loading}
              >
                {loading ? (
                  <>
                    <svg className="mr-2 size-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Searching...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Empty State (before search) */}
      {!hasSearched && !loading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <svg className="mb-4 size-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-medium">Test your knowledge base retrieval</h3>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Enter any question or text to see which chunks the AI would retrieve.
            This helps you understand why the AI answered a certain way and whether your knowledge base covers a topic.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Try these examples:</span>
            {EXAMPLE_QUERIES.map((eq) => (
              <Button
                key={eq}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setQuery(eq);
                  handleSearch(eq);
                }}
              >
                {eq}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-1 h-4 w-5/6" />
              <Skeleton className="mt-1 h-4 w-2/3" />
              <div className="mt-3 flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <div className="space-y-3">
          {/* Results Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">
              Results ({results.length} found)
            </p>
            {metrics && (
              <p className="text-xs text-muted-foreground">
                Time: {metrics.totalTime.toFixed(0)}ms (embed: {metrics.embedTime.toFixed(0)}ms, search: {metrics.searchTime.toFixed(0)}ms)
              </p>
            )}
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
              <svg className="mb-4 size-10 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium">No results found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Try lowering the threshold or using a different query
              </p>
            </div>
          ) : (
            results.map((result, index) => (
              <div
                key={result.chunkId}
                className="rounded-lg border bg-card transition-colors hover:bg-accent/30"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {index + 1}
                      </span>
                      <div>
                        <span className="text-base">{FILE_TYPE_ICONS[result.documentFileType] || "📄"}</span>
                        <span className="ml-1 text-sm font-medium">{result.documentTitle}</span>
                        <span className="ml-1 text-sm text-muted-foreground">
                          Chunk #{result.chunkIndex + 1}
                        </span>
                      </div>
                    </div>
                    <SimilarityBar score={result.similarity} />
                  </div>

                  <p className="mt-3 text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">
                    {result.content}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <Link href={`/knowledge/chunks?highlight=${result.chunkId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        View Chunk
                      </Button>
                    </Link>
                    <Link href={`/knowledge/documents/${result.documentId}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        View Document
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
