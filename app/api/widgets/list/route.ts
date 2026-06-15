import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";

/**
 * GET /api/widgets/list
 * List all widgets for the current user's workspace (session auth).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id!);
    await setWorkspaceContext(workspaceId);

    const widgets = await prisma.widget.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { conversations: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Response.json({ widgets });
  } catch (error) {
    console.error("[Widgets] List error:", error);
    return Response.json({ error: "Failed to list widgets" }, { status: 500 });
  }
}
