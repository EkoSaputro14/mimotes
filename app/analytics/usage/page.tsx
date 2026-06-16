import DashboardShell from "@/components/layout/dashboard-shell";
import UsageAnalytics from "@/components/analytics/usage-analytics";

export default function UsageAnalyticsPage() {
  return (
    <DashboardShell title="Usage Analytics">
      <UsageAnalytics />
    </DashboardShell>
  );
}
