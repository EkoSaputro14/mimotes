import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    const folders = await prisma.folder.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { documents: true } },
      },
    });

    return Response.json({ folders });
  } catch (error) {
    console.error("Folders API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "Nama folder harus diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if folder with same name already exists in workspace
    const existing = await prisma.folder.findFirst({
      where: { name: trimmedName, workspaceId },
    });

    if (existing) {
      return Response.json(
        { error: "Folder dengan nama ini sudah ada" },
        { status: 409 }
      );
    }

    const folder = await prisma.folder.create({
      data: {
        name: trimmedName,
        userId: session.user.id!,
        workspaceId,
      },
    });

    return Response.json({ folder }, { status: 201 });
  } catch (error) {
    console.error("Create folder API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    const body = await request.json();
    const { id, name } = body;

    if (!id || !name || typeof name !== "string" || name.trim().length === 0) {
      return Response.json({ error: "ID dan nama folder harus diisi" }, { status: 400 });
    }

    const trimmedName = name.trim();

    // Check if folder exists and belongs to this workspace
    const existing = await prisma.folder.findFirst({
      where: { id, workspaceId },
    });

    if (!existing) {
      return Response.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    // Check for duplicate name
    const duplicate = await prisma.folder.findFirst({
      where: { name: trimmedName, workspaceId, id: { not: id } },
    });

    if (duplicate) {
      return Response.json(
        { error: "Folder dengan nama ini sudah ada" },
        { status: 409 }
      );
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: { name: trimmedName },
    });

    return Response.json({ folder });
  } catch (error) {
    console.error("Rename folder API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(
      session.user.id!,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "ID folder harus diisi" }, { status: 400 });
    }

    const folder = await prisma.folder.findFirst({
      where: { id, workspaceId },
    });

    if (!folder) {
      return Response.json({ error: "Folder tidak ditemukan" }, { status: 404 });
    }

    // Set all documents in this folder to null folderId before deleting
    await prisma.document.updateMany({
      where: { folderId: id },
      data: { folderId: null },
    });

    await prisma.folder.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete folder API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
