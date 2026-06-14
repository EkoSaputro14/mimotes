import DashboardShell from "@/components/layout/dashboard-shell";
import DocumentExplorer from "@/components/knowledge/document-explorer";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DocumentsPage() {
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
        <DocumentExplorer />
      </div>
    </DashboardShell>
  );
}
