import { prisma } from "@/lib/prisma";
import { withWorkspace } from "@/lib/middleware/tenant";

// GET — recent workspace activity (from audit_logs)
export async function GET() {
  return withWorkspace(async (_userId, workspaceId) => {
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          workspaceId,
          action: {
            in: [
              "invitation.created",
              "invitation.accepted",
              "invitation.revoked",
              "invitation.resent",
              "member.invite",
              "member.remove",
              "member.role_change",
              "workspace.update",
            ],
          },
        },
        include: {
          workspace: {
            select: {
              members: {
                select: { userId: true, user: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      });

      // Build a lookup for actor user info
      const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean))] as string[];
      const actorUsers = actorIds.length > 0
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true, email: true },
          })
        : [];
      const actorMap = new Map(actorUsers.map((u) => [u.id, u]));

      const activity = logs.map((log) => {
        const actor = log.actorId ? actorMap.get(log.actorId) : null;
        const meta = (log.metadata ?? {}) as Record<string, unknown>;
        return {
          id: log.id,
          action: log.action,
          actorName: actor?.name ?? actor?.email ?? "System",
          metadata: meta,
          createdAt: log.createdAt.toISOString(),
        };
      });

      return Response.json({ activity });
    } catch (error) {
      console.error("Activity log error:", error);
      return Response.json({ activity: [] });
    }
  });
}
