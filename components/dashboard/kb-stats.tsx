"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Database, FileText } from "lucide-react";

interface KBData {
  totalDocuments: number;
  totalChunks: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
}

export function KnowledgeBaseStats() {
  const [data, setData] = useState<KBData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json = await res.json();
        setData({
          totalDocuments: json.documents?.total || 0,
          totalChunks: json.chunks?.total || 0,
          byType: json.documentsByType || [],
          byStatus: json.documentsByStatus || [],
        });
      } catch {
        console.error("Failed to fetch KB stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const fileTypeEmoji: Record<string, string> = {
    pdf: "📄",
    docx: "📝",
    txt: "📃",
    csv: "📊",
    xlsx: "📈",
    xls: "📈",
    url: "🔗",
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Knowledge Base</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{data?.totalDocuments || 0}</p>
              <p className="text-xs text-muted-foreground">Documents</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">
                {data?.totalChunks?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-muted-foreground">Sections</p>
            </div>
          </div>
        </div>
        {data?.byType && data.byType.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              File Types
            </p>
            <div className="flex flex-wrap gap-2">
              {data.byType.map((t) => (
                <span
                  key={t.type}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {fileTypeEmoji[t.type] || "📄"} {t.type.toUpperCase()} · {t.count}
                </span>
              ))}
            </div>
          </div>
        )}
        {data?.byStatus && data.byStatus.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-2">
              {data.byStatus.map((s) => (
                <span
                  key={s.status}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
                >
                  {s.status === "ready" ? "✅" : s.status === "processing" ? "🔄" : "❌"}{" "}
                  {s.status} · {s.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
