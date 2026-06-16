import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Get specific session with messages — verify ownership
      const chatSession = await prisma.chatSession.findFirst({
        where: {
          id: sessionId,
          userId: session.user.id! as string,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession) {
        return Response.json(
          { error: "Sesi chat tidak ditemukan" },
          { status: 404 }
        );
      }

      return Response.json(chatSession);
    }

    // List recent sessions — only user's sessions
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id! as string },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return Response.json(sessions);
  } catch (error) {
    console.error("Chat sessions API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat mengambil sesi chat" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return Response.json(
        { error: "Session ID diperlukan" },
        { status: 400 }
      );
    }

    // Verify ownership before delete
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        id: sessionId,
        userId: session.user.id! as string,
      },
    });

    if (!chatSession) {
      return Response.json(
        { error: "Sesi chat tidak ditemukan" },
        { status: 404 }
      );
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete session error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat menghapus sesi" },
      { status: 500 }
    );
  }
}
