import DashboardShell from "@/components/layout/dashboard-shell";
import ChatAnalytics from "@/components/analytics/chat-analytics";

export default function ChatAnalyticsPage() {
  return (
    <DashboardShell title="Chat Analytics">
      <ChatAnalytics />
    </DashboardShell>
  );
}
