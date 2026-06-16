import DashboardShell from "@/components/layout/dashboard-shell";
import PromptEditor from "@/components/ai/prompt-editor";

export default function NewPromptPage() {
  return (
    <DashboardShell title="New Prompt">
      <PromptEditor />
    </DashboardShell>
  );
}
