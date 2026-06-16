import DashboardShell from "@/components/layout/dashboard-shell";
import UploadForm from "@/components/documents/upload-form";

export default function UploadPage() {
  return (
    <DashboardShell title="Upload" maxWidth="4xl">
      <UploadForm />
    </DashboardShell>
  );
}
