import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id! as string;

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Get assistant messages from user's sessions only
    const messages = await prisma.chatMessage.findMany({
      where: {
        role: "assistant",
        session: { userId },
      },
      select: {
        sources: true,
      },
    });

    // Count references per document
    const refCounts: Record<string, number> = {};

    for (const msg of messages) {
      if (!msg.sources || !Array.isArray(msg.sources)) continue;
      for (const source of msg.sources as Array<{ documentId?: string }>) {
        if (source.documentId) {
          refCounts[source.documentId] = (refCounts[source.documentId] || 0) + 1;
        }
      }
    }

    // Get top 10 document IDs by reference count
    const topDocIds = Object.entries(refCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([id, count]) => ({ id, count }));

    if (topDocIds.length === 0) {
      return NextResponse.json({ documents: [] });
    }

    // Fetch document details — scoped to user's documents
    const documents = await prisma.document.findMany({
      where: {
        id: { in: topDocIds.map((d) => d.id) },
        userId,
      },
      select: {
        id: true,
        title: true,
        fileType: true,
        chunkCount: true,
        status: true,
      },
    });

    // Merge reference counts with document details
    const result = topDocIds
      .map((td) => {
        const doc = documents.find((d) => d.id === td.id);
        if (!doc) return null;
        return {
          ...doc,
          references: td.count,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ documents: result });
  } catch (error) {
    console.error("Dashboard top-documents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch top documents" },
      { status: 500 }
    );
  }
}
