import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// Helper: check if user is super admin
async function requireSuperAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isSuperAdmin: true },
  });
  if (!user?.isSuperAdmin) {
    throw new Error("FORBIDDEN");
  }
}

// GET — list all users (super admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    await requireSuperAdmin(userId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || ""; // "active", "suspended", "superadmin"

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status === "suspended") {
      where.suspended = true;
    } else if (status === "superadmin") {
      where.isSuperAdmin = true;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        isSuperAdmin: true,
        suspended: true,
        suspendedAt: true,
        suspendedReason: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If role filter, filter after query (since role is on WorkspaceMember)
    const filtered = role
      ? users.filter((u) =>
          u.memberships.some((m) => m.role === role)
        )
      : users;

    return Response.json({
      users: filtered.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        isSuperAdmin: u.isSuperAdmin,
        suspended: u.suspended,
        suspendedAt: u.suspendedAt?.toISOString() || null,
        suspendedReason: u.suspendedReason,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        workspaces: u.memberships.map((m) => ({
          role: m.role,
          workspace: m.workspace,
        })),
      })),
      total: filtered.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return Response.json({ error: "Super admin access required" }, { status: 403 });
    }
    console.error("List users error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
