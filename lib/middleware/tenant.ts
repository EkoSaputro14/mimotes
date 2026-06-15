import { auth } from "@/lib/auth";
import { cookies } from "next/headers";
import { setWorkspaceContext, getWorkspaceContext, resolveWorkspaceId, getUserWorkspaces } from "@/lib/prisma";

/**
 * Get the selected workspace ID from cookie (set by POST /api/workspace/switch).
 * Falls back to null if no cookie is set.
 */
async function getSelectedWorkspaceFromCookie(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("selected_workspace_id")?.value ?? null;
  } catch {
    return null;
  }
}

/**
 * Workspace context middleware.
 *
 * Sets the PostgreSQL RLS workspace context before executing the handler.
 * ALL database queries within the handler are automatically scoped to the
 * authenticated user's workspace by RLS policies.
 *
 * This is the PRIMARY defense against cross-workspace data access.
 * Even if a developer forgets `where: { workspaceId }`, RLS blocks it.
 *
 * Usage:
 *   import { withWorkspace } from "@/lib/middleware/tenant";
 *
 *   export async function GET() {
 *     return withWorkspace(async (userId, workspaceId) => {
 *       // ALL queries here are automatically workspace-scoped
 *       const docs = await prisma.document.findMany();
 *       return Response.json(docs);
 *     });
 *   }
 */
export async function withWorkspace<T>(
  handler: (userId: string, workspaceId: string) => Promise<T>
): Promise<T | Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user.id as string;
    // Priority: cookie (set by switch endpoint) > JWT > fallback to owner
    const cookieWorkspaceId = await getSelectedWorkspaceFromCookie();
    const jwtWorkspaceId = (session.user as Record<string, unknown>).selectedWorkspaceId as string | undefined;
    const selectedWorkspaceId = cookieWorkspaceId || jwtWorkspaceId;
    const workspaceId = await resolveWorkspaceId(userId, selectedWorkspaceId);

    // Set RLS context — ALL subsequent queries are workspace-scoped
    await setWorkspaceContext(workspaceId);

    return handler(userId, workspaceId);
  } catch (error) {
    if (error instanceof TenantAuthError) {
      return Response.json({ error: error.message }, { status: 401 });
    }
    throw error;
  }
}

/**
 * Execute a function with workspace context for non-HTTP contexts
 * (e.g., cron jobs, background tasks, MCP tools).
 */
export async function runAsWorkspace<T>(
  workspaceId: string,
  handler: (workspaceId: string) => Promise<T>
): Promise<T> {
  await setWorkspaceContext(workspaceId);
  return handler(workspaceId);
}

/**
 * Verify that workspace context is set.
 * Throws if no workspace context is active.
 */
export async function requireWorkspaceContext(): Promise<string> {
  const workspaceId = await getWorkspaceContext();
  if (!workspaceId) {
    throw new TenantAuthError("Workspace context not set — call withWorkspace() first");
  }
  return workspaceId;
}

/**
 * Get the current workspace ID (returns null if not set).
 */
export async function getCurrentWorkspaceId(): Promise<string | null> {
  return getWorkspaceContext();
}

/**
 * Custom error class for tenant auth failures.
 */
export class TenantAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantAuthError";
  }
}

// ============================================================
// Legacy API — deprecated, kept for backward compatibility
// ============================================================

/**
 * @deprecated Use withWorkspace instead. Maps userId to workspace context.
 */
export async function withTenant<T>(
  handler: (userId: string) => Promise<T>
): Promise<T | Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id as string;
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);

  return handler(userId);
}

/**
 * @deprecated Use runAsWorkspace instead.
 */
export async function runAsTenant<T>(
  userId: string,
  handler: (userId: string) => Promise<T>
): Promise<T> {
  const workspaceId = await resolveWorkspaceId(userId);
  await setWorkspaceContext(workspaceId);
  return handler(userId);
}
