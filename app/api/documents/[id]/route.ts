import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { deleteDocumentChunks } from "@/lib/rag/vectorstore";
import { unlink } from "fs/promises";
import { join } from "path";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        chunks: {
          orderBy: { chunkIndex: "asc" },
          select: {
            id: true,
            content: true,
            chunkIndex: true,
            metadata: true,
          },
        },
      },
    });

    if (!document) {
      return Response.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    return Response.json(document);
  } catch (error) {
    console.error("Document detail API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat mengambil dokumen" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const document = await prisma.document.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!document) {
      return Response.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    const workspaceId = await resolveWorkspaceId(session.user.id as string);

    // Delete vector embeddings
    await deleteDocumentChunks(id);

    // Delete uploaded file if exists
    if (document.fileUrl) {
      try {
        const filePath = join(process.cwd(), "public", document.fileUrl);
        await unlink(filePath);
      } catch {
        // File may not exist, continue with deletion
      }
    }

    // Delete document and chunks from DB (cascade)
    await prisma.document.delete({
      where: { id },
    });

    // Audit: document deleted
    logAudit({
      workspaceId,
      actorId: session.user.id as string,
      actorType: "user",
      action: AUDIT_ACTIONS.DOCUMENT_DELETE,
      resourceType: "document",
      resourceId: id,
      metadata: { title: document.title, fileType: document.fileType },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete document API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat menghapus dokumen" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const document = await prisma.document.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!document) {
      return Response.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    // Only allow updating description
    const updateData: { description?: string } = {};
    if ("description" in body) {
      updateData.description = body.description || null;
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: "Tidak ada data yang diperbarui" }, { status: 400 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: updateData,
      select: { id: true, description: true, updatedAt: true },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Patch document API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat memperbarui dokumen" },
      { status: 500 }
    );
  }
}
