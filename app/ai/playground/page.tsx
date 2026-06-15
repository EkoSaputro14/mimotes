import DashboardShell from "@/components/layout/dashboard-shell";
import PlaygroundEditor from "@/components/ai/playground-editor";

export default function PlaygroundPage() {
  return (
    <DashboardShell title="AI Playground">
      <PlaygroundEditor />
    </DashboardShell>
  );
}
