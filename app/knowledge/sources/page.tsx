import DashboardShell from "@/components/layout/dashboard-shell";
import SourceViewer from "@/components/knowledge/source-viewer";

export default function SourcesPage() {
  return (
    <DashboardShell title="Sources">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Track which documents are referenced in chat responses and their usage frequency
          </p>
        </div>
        <SourceViewer />
      </div>
    </DashboardShell>
  );
}
