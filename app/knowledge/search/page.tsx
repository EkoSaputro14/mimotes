import DashboardShell from "@/components/layout/dashboard-shell";
import SimilaritySearch from "@/components/knowledge/similarity-search";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;

  return (
    <DashboardShell title="Similarity Search">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Similarity Search</h1>
          <p className="text-sm text-muted-foreground">
            Test and debug RAG retrieval by running custom similarity searches
          </p>
        </div>
        <SimilaritySearch initialQuery={q} />
      </div>
    </DashboardShell>
  );
}
