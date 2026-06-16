import DashboardShell from "@/components/layout/dashboard-shell";
import { LeadAnalytics } from "@/components/analytics/lead-analytics";

export default function LeadAnalyticsPage() {
  return (
    <DashboardShell title="Lead Analytics">
      <LeadAnalytics />
    </DashboardShell>
  );
}
