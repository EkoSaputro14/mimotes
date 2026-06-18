import DashboardShell from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import DocumentDetailClient from "./document-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const workspaceId = await resolveWorkspaceId(session.user.id!);
  await setWorkspaceContext(workspaceId);

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      fileType: true,
      fileUrl: true,
      status: true,
      chunkCount: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { chunks: true } },
    },
  });

  if (!document) notFound();

  return (
    <DashboardShell title={document.title}>
      <DocumentDetailClient
        document={{
          ...document,
          description: document.description ?? null,
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        }}
      />
    </DashboardShell>
  );
}
