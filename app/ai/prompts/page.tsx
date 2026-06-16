import DashboardShell from "@/components/layout/dashboard-shell";
import PromptList from "@/components/ai/prompt-list";

export default function PromptsPage() {
  return (
    <DashboardShell title="Prompt Templates">
      <PromptList />
    </DashboardShell>
  );
}
