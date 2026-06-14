import DashboardShell from "@/components/layout/dashboard-shell";
import WorkspaceSwitcher from "@/components/workspace/workspace-switcher";
import MemberManagement from "@/components/workspace/member-management";

export default function WorkspaceSettingsPage() {
  return (
    <DashboardShell title="Workspace Settings" maxWidth="4xl">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary">
        Lewati ke konten
      </a>
      <div id="main-content" className="space-y-8" tabIndex={-1}>
        {/* Workspace Info */}
        <div className="bg-card rounded-xl border border-border/20 p-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            Workspace
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Kelola workspace, undang anggota, dan atur peran.
          </p>
          <WorkspaceSwitcher />
        </div>

        {/* Member Management */}
        <MemberManagement />
      </div>
    </DashboardShell>
  );
}
