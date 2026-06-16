import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const topK = Math.min(20, Math.max(1, parseInt(searchParams.get("topK") || "5")));

    // Set workspace context for tenant isolation
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    // Get the source chunk
    const chunk = await prisma.documentChunk.findFirst({
      where: { id },
      select: {
        id: true,
        content: true,
        documentId: true,
        document: { select: { userId: true, workspaceId: true } },
      },
    });

    if (!chunk || chunk.document.workspaceId !== workspaceId) {
      return Response.json({ error: "Chunk not found" }, { status: 404 });
    }

    // Find similar chunks using pgvector cosine distance
    // workspace_id filtering (consistent with chat retrieval)
    const results: Array<{
      id: string;
      content: string;
      document_id: string;
      chunk_index: number;
      similarity: number;
    }> = await prisma.$queryRaw`
      SELECT
        dc.id,
        dc.content,
        dc.document_id,
        dc.chunk_index,
        1 - (dc.embedding <=> (SELECT embedding FROM document_chunks WHERE id = ${id})) as similarity
      FROM document_chunks dc
      WHERE dc.workspace_id = ${workspaceId}
        AND dc.id != ${id}
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> (SELECT embedding FROM document_chunks WHERE id = ${id})
      LIMIT ${topK}
    `;

    // Get document titles for the results
    const docIdSet = new Set(results.map((r) => r.document_id));
    const docIds = Array.from(docIdSet);
    const docs = await prisma.document.findMany({
      where: { id: { in: docIds } },
      select: { id: true, title: true, fileType: true },
    });
    const docMap = new Map(docs.map((d) => [d.id, d]));

    const similarChunks = results.map((r) => ({
      id: r.id,
      content: r.content,
      chunkIndex: r.chunk_index,
      similarity: Number(r.similarity),
      document: docMap.get(r.document_id) || { id: r.document_id, title: "Unknown", fileType: "unknown" },
    }));

    return Response.json({ similarChunks });
  } catch (error) {
    console.error("Similar chunks API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
