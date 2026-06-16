import DashboardShell from "@/components/layout/dashboard-shell";
import CostAnalytics from "@/components/analytics/cost-analytics";

export default function CostAnalyticsPage() {
  return (
    <DashboardShell title="Cost Analytics">
      <CostAnalytics />
    </DashboardShell>
  );
}
