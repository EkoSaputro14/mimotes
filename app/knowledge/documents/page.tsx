"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/layout/dashboard-shell";
import DocumentExplorer from "@/components/knowledge/document-explorer";
import FolderSidebar from "@/components/documents/folder-sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Fetch total document count for sidebar
  useEffect(() => {
    async function fetchTotal() {
      try {
        const res = await fetch("/api/knowledge/documents?limit=1");
        if (res.ok) {
          const data = await res.json();
          setTotalDocuments(data.pagination.total);
        }
      } catch {
        // ignore
      }
    }
    fetchTotal();
  }, [selectedFolderId]);

  return (
    <DashboardShell title="Documents">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Lewati ke konten
      </a>
      <div id="main-content" className="space-y-6" tabIndex={-1}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
            <p className="text-sm text-muted-foreground">
              Manage your knowledge base documents
            </p>
          </div>
          <Link href="/documents/upload">
            <Button>
              <svg className="mr-2 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload
            </Button>
          </Link>
        </div>

        {/* 2-column layout: Folder sidebar + Document explorer */}
        <div className="flex gap-6">
          {/* Left: Folder Sidebar (hidden on mobile) */}
          <div className="hidden w-[240px] shrink-0 md:block">
            <div className="sticky top-20 rounded-lg border bg-card">
              <FolderSidebar
                selectedFolderId={selectedFolderId}
                onSelectFolder={setSelectedFolderId}
                totalDocuments={totalDocuments}
              />
            </div>
          </div>

          {/* Right: Document Explorer */}
          <div className="min-w-0 flex-1">
            <DocumentExplorer folderId={selectedFolderId} />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
