import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

// GET /api/dashboard/activity
// Returns last 10 recent events (documents + chat sessions) for the workspace
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    // Fetch last 10 documents and chat sessions in parallel
    const [documents, chatSessions] = await Promise.all([
      prisma.document.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      prisma.chatSession.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    // Map to activity events
    const docEvents = documents.map((doc) => ({
      type: "document_upload" as const,
      title: doc.title,
      timestamp: doc.createdAt.toISOString(),
    }));

    const chatEvents = chatSessions.map((session) => ({
      type: "chat_session" as const,
      title: session.title || "Untitled Chat",
      timestamp: session.createdAt.toISOString(),
    }));

    // Merge, sort by timestamp descending, limit to 10
    const events = [...docEvents, ...chatEvents]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    return Response.json(events);
  } catch (error) {
    console.error("Failed to fetch activity feed:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
