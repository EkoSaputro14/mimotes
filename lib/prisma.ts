import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Request-scoped workspace context via AsyncLocalStorage.
 * Each request gets its own isolated workspace ID — no cross-request leakage.
 */
export const workspaceContextStore = new AsyncLocalStorage<string>();

/**
 * Set the workspace context for Row Level Security (RLS).
 *
 * This MUST be called before any database query in authenticated API routes.
 * RLS policies use `current_setting('app.current_workspace_id')` to filter rows.
 *
 * Usage:
 *   const session = await auth();
 *   const workspaceId = await resolveWorkspaceId(session.user.id);
 *   await setWorkspaceContext(workspaceId);
 *   // All subsequent queries are now workspace-scoped
 *
 * @param workspaceId - The workspace ID for tenant isolation
 */
export async function setWorkspaceContext(workspaceId: string): Promise<void> {
  // Store in AsyncLocalStorage (request-scoped, connection-pool safe)
  workspaceContextStore.enterWith(workspaceId);
  // Also set in DB for RLS policies on the current connection
  await prisma.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
}

/**
 * Get the current workspace context.
 * Returns the workspace_id set by setWorkspaceContext, or null if not set.
 */
export async function getWorkspaceContext(): Promise<string | null> {
  // First try AsyncLocalStorage (fast, connection-pool safe, request-scoped)
  const ctx = workspaceContextStore.getStore();
  if (ctx) return ctx;
  // Fallback to DB (for cases where setWorkspaceContext was called before this module loaded)
  const result = await prisma.$queryRaw<Array<{ setting_value: string | null }>>`
    SELECT current_setting('app.current_workspace_id', true) as setting_value
  `;
  return result[0]?.setting_value ?? null;
}

/**
 * Resolve workspace ID for a user.
 * Returns the user's selected workspace, or their owner workspace, or creates one if missing.
 *
 * Priority:
 * 1. If selectedWorkspaceId is provided, verify membership and return it
 * 2. Fall back to the user's owner workspace
 * 3. Create a default workspace if none exists
 *
 * @param userId - The authenticated user's ID
 * @param selectedWorkspaceId - Optional workspace ID from JWT/session (user's selection)
 * @returns The workspace ID
 */
export async function resolveWorkspaceId(userId: string, selectedWorkspaceId?: string | null): Promise<string> {
  // CRITICAL: Set app.current_user_id BEFORE any RLS-gated queries.
  // The workspaces SELECT policy requires this setting to evaluate membership.
  // Use is_local=false so the setting persists across the connection pool.
  await prisma.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, false)`;

  // If user selected a workspace, verify membership and use it
  if (selectedWorkspaceId) {
    const membership = await prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: selectedWorkspaceId },
      select: { workspaceId: true },
    });

    if (membership) {
      return membership.workspaceId;
    }
    // Selected workspace not found or user not a member — fall through to owner
  }

  // Use SECURITY DEFINER function to query workspace_members.
  // The workspace_members RLS policy requires app.current_workspace_id, which we don't have yet
  // (chicken-and-egg: need workspace ID to set context, need context to query workspace_members).
  // The SECURITY DEFINER function bypasses RLS while maintaining data integrity.
  const memberships = await prisma.$queryRaw<Array<{ workspace_id: string; role: string }>>`
    SELECT workspace_id, role FROM get_user_workspace_ids(${userId})
  `;

  // Find owner workspace
  const ownerMembership = memberships.find((m) => m.role === "owner");
  if (ownerMembership) {
    return ownerMembership.workspace_id;
  }

  // If any membership exists, use the first one
  if (memberships.length > 0) {
    return memberships[0].workspace_id;
  }

  // Create default workspace for user using SECURITY DEFINER function
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const workspaceName = user?.name ? `${user.name}'s Workspace` : "Workspace";
  const slug = `ws-${(user?.name || "user").toLowerCase().replace(/\s+/g, "-")}-${userId.substring(0, 8)}`;

  const workspaceId = await prisma.$queryRaw<Array<{ create_user_workspace: string }>>`
    SELECT create_user_workspace(${userId}, ${workspaceName}, ${slug}) as create_user_workspace
  `;

  return workspaceId[0].create_user_workspace;
}

/**
 * Get all workspaces a user is a member of.
 *
 * @param userId - The user's ID
 * @returns Array of workspace IDs and roles
 */
export async function getUserWorkspaces(userId: string): Promise<Array<{ workspaceId: string; role: string }>> {
  return prisma.workspaceMember.findMany({
    where: { userId },
    select: { workspaceId: true, role: true },
  });
}

/**
 * Get all workspaces a user is a member of, with details for the workspace switcher.
 *
 * @param userId - The user's ID
 * @returns Array of workspace details with role info
 */
export async function getUserWorkspacesWithDetails(userId: string): Promise<Array<{
  id: string;
  name: string;
  slug: string;
  role: string;
  memberCount: number;
}>> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships
    .filter((m) => m.workspace) // Guard against deleted workspaces
    .map((m) => ({
      id: m.workspace.id,
      name: m.workspace.name,
      slug: m.workspace.slug,
      role: m.role,
      memberCount: m.workspace._count.members,
    }));
}

// ============================================================
// Legacy API — deprecated, kept for backward compatibility
// ============================================================

/**
 * @deprecated Use setWorkspaceContext instead. Maps userId to workspace context.
 */
export async function setTenantContext(userId: string): Promise<void> {
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);
}

/**
 * @deprecated Use getWorkspaceContext instead.
 */
export async function getTenantContext(): Promise<string | null> {
  return getWorkspaceContext();
}
