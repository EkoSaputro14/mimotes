import DashboardShell from "@/components/layout/dashboard-shell";
import DocumentList from "@/components/documents/document-list";

export default function DocumentsPage() {
  return (
    <DashboardShell title="Documents" maxWidth="4xl">
      <DocumentList />
    </DashboardShell>
  );
}
