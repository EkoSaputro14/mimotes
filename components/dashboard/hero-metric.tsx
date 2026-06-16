"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, ArrowRight } from "lucide-react";

interface HeroMetricProps {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  loading?: boolean;
}

export function HeroMetric({
  totalDocuments,
  readyDocuments,
  processingDocuments,
  loading,
}: HeroMetricProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-3 flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="size-12 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const readyPercent =
    totalDocuments > 0
      ? Math.round((readyDocuments / totalDocuments) * 100)
      : 0;

  return (
    <Card className="transition-colors hover:bg-accent/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">
                Documents
              </p>
              {processingDocuments > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  {processingDocuments} processing
                </span>
              )}
            </div>
            {/* E2: Hero metric — large number */}
            <p
              aria-live="polite"
              aria-atomic="true"
              className="mt-1 text-3xl font-bold tracking-tight text-foreground"
            >
              {totalDocuments.toLocaleString()}
            </p>

            {/* E2: Progress bar */}
            {totalDocuments > 0 && (
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${readyPercent}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {readyPercent}% ready
                </span>
              </div>
            )}

            {totalDocuments === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">
                Belum ada dokumen. Upload dokumen pertama Anda.
              </p>
            )}
          </div>

          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
            <FileText className="size-6" />
          </div>
        </div>

        {totalDocuments > 0 && (
          <Link
            href="/knowledge/documents"
            className="mt-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua
            <ArrowRight className="size-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
