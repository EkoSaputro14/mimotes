import SettingsLayout from "@/components/settings/settings-layout";
import UsageOverview from "@/components/workspace/usage-overview";

export default function WorkspaceUsagePage() {
  return (
    <SettingsLayout>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>
      <div id="main-content" className="space-y-8" tabIndex={-1}>
        <UsageOverview />
      </div>
    </SettingsLayout>
  );
}
