import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { deleteDocumentChunks } from "@/lib/rag/vectorstore";
import { unlink } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "IDs harus diisi" }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    // Verify all documents belong to this user
    const documents = await prisma.document.findMany({
      where: {
        id: { in: ids },
        userId: session.user.id!,
      },
    });

    if (documents.length === 0) {
      return Response.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    let deletedCount = 0;

    for (const doc of documents) {
      try {
        // Delete vector embeddings
        await deleteDocumentChunks(doc.id);

        // Delete uploaded file if exists
        if (doc.fileUrl) {
          try {
            const filePath = join(process.cwd(), "public", doc.fileUrl);
            await unlink(filePath);
          } catch {
            // File may not exist
          }
        }

        // Delete document from DB (chunks cascade)
        await prisma.document.delete({ where: { id: doc.id } });
        deletedCount++;
      } catch (err) {
        console.error(`Failed to delete document ${doc.id}:`, err);
      }
    }

    return Response.json({
      success: true,
      deletedCount,
      totalCount: ids.length,
    });
  } catch (error) {
    console.error("Bulk delete API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids, folderId } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "IDs harus diisi" }, { status: 400 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    // Verify folder exists if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, workspaceId },
      });
      if (!folder) {
        return Response.json({ error: "Folder tidak ditemukan" }, { status: 404 });
      }
    }

    // Update all documents
    const result = await prisma.document.updateMany({
      where: {
        id: { in: ids },
        userId: session.user.id!,
      },
      data: { folderId: folderId || null },
    });

    return Response.json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Bulk move API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
