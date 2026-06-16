import SettingsLayout from "@/components/settings/settings-layout";
import AuditLogViewer from "@/components/audit/audit-log-viewer";

export default function AuditSettingsPage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>
      <div id="main-content" tabIndex={-1}>
        <AuditLogViewer />
      </div>
    </SettingsLayout>
  );
}
