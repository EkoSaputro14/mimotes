import DashboardShell from "@/components/layout/dashboard-shell";
import PromptEditor from "@/components/ai/prompt-editor";

export default function EditPromptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <DashboardShell title="Edit Prompt">
      <PromptEditorWrapper params={params} />
    </DashboardShell>
  );
}

async function PromptEditorWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PromptEditor promptId={id} />;
}
