import DashboardShell from "@/components/layout/dashboard-shell";
import ChunkViewer from "@/components/knowledge/chunk-viewer";

export default function ChunksPage() {
  return (
    <DashboardShell title="Chunks">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chunks</h1>
          <p className="text-sm text-muted-foreground">
            Browse, search, and manage all document chunks across your knowledge base
          </p>
        </div>
        <ChunkViewer />
      </div>
    </DashboardShell>
  );
}
