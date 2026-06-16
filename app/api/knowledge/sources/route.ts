import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface SourceRef {
  documentId?: string;
  content?: string;
  similarity?: number;
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all user's documents with chunk counts
    const documents = await prisma.document.findMany({
      where: { userId: session.user.id! },
      select: {
        id: true,
        title: true,
        fileType: true,
        status: true,
        chunkCount: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { chunks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count source references from chat messages
    // Parse the `sources` JSON field in chat_messages to find which documents are referenced
    const messages = await prisma.chatMessage.findMany({
      where: {
        role: "assistant",
        session: { userId: session.user.id! },
      },
      select: { sources: true, createdAt: true },
    });

    // Aggregate source references
    const refMap = new Map<string, { count: number; lastReferenced: Date | null }>();

    for (const msg of messages) {
      if (!msg.sources || !Array.isArray(msg.sources)) continue;
      for (const source of msg.sources as SourceRef[]) {
        if (source.documentId) {
          const existing = refMap.get(source.documentId) || { count: 0, lastReferenced: null };
          existing.count++;
          if (!existing.lastReferenced || msg.createdAt > existing.lastReferenced) {
            existing.lastReferenced = msg.createdAt;
          }
          refMap.set(source.documentId, existing);
        }
      }
    }

    // Combine document data with reference data
    const sources = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      fileType: doc.fileType,
      status: doc.status,
      chunkCount: doc._count.chunks,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      referenceCount: refMap.get(doc.id)?.count || 0,
      lastReferenced: refMap.get(doc.id)?.lastReferenced?.toISOString() || null,
    }));

    // Sort by reference count descending
    sources.sort((a, b) => b.referenceCount - a.referenceCount);

    // Calculate totals
    const totalChunks = sources.reduce((sum, s) => sum + s.chunkCount, 0);
    const totalReferences = sources.reduce((sum, s) => sum + s.referenceCount, 0);

    return Response.json({
      sources,
      stats: {
        totalDocuments: sources.length,
        totalChunks,
        totalReferences,
      },
    });
  } catch (error) {
    console.error("Knowledge sources API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
