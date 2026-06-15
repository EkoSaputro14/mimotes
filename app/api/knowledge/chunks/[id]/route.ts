import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const chunk = await prisma.documentChunk.findFirst({
      where: { id },
      select: {
        id: true,
        content: true,
        chunkIndex: true,
        metadata: true,
        createdAt: true,
        document: {
          select: { id: true, title: true, fileType: true, userId: true },
        },
      },
    });

    if (!chunk || chunk.document.userId !== session.user.id!) {
      return Response.json({ error: "Chunk not found" }, { status: 404 });
    }

    return Response.json(chunk);
  } catch (error) {
    console.error("Chunk detail API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify chunk belongs to user's document
    const chunk = await prisma.documentChunk.findFirst({
      where: { id },
      select: {
        id: true,
        document: { select: { id: true, userId: true, chunkCount: true } },
      },
    });

    if (!chunk || chunk.document.userId !== session.user.id!) {
      return Response.json({ error: "Chunk not found" }, { status: 404 });
    }

    await prisma.documentChunk.delete({ where: { id } });

    // Update document chunk count
    await prisma.document.update({
      where: { id: chunk.document.id },
      data: { chunkCount: chunk.document.chunkCount - 1 },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete chunk API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
