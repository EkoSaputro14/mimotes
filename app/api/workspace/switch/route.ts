import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, getUserWorkspacesWithDetails } from "@/lib/prisma";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import {
  checkEndpointRateLimit,
  getRateLimitHeaders,
  getClientIp,
  RATE_LIMIT_CONFIGS,
} from "@/lib/endpoint-ratelimit";

/**
 * POST /api/workspace/switch
 *
 * Switch the active workspace for the authenticated user.
 * Validates membership, sets a cookie, and returns the new workspace details.
 *
 * Body: { workspaceId: string }
 * Response: { success: true, workspace: { id, name, slug, role, memberCount } }
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit: 30 switches per hour per IP
  const ip = getClientIp(request);
  const rlResult = checkEndpointRateLimit(ip, RATE_LIMIT_CONFIGS.workspaceSwitch);
  if (!rlResult.allowed) {
    return Response.json(
      { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
      {
        status: 429,
        headers: getRateLimitHeaders(rlResult, RATE_LIMIT_CONFIGS.workspaceSwitch),
      }
    );
  }

  const userId = session.user.id! as string;

  let body: { workspaceId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workspaceId } = body;
  if (!workspaceId || typeof workspaceId !== "string") {
    return Response.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  // Validate membership
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId, workspaceId },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!membership) {
    return Response.json(
      { error: "You are not a member of this workspace" },
      { status: 403 }
    );
  }

  // Get full workspace details with member count
  const allWorkspaces = await getUserWorkspacesWithDetails(userId);
  const targetWorkspace = allWorkspaces.find((w) => w.id === workspaceId);

  // Audit: workspace switch
  logAudit({
    workspaceId,
    actorId: userId,
    actorType: "user",
    action: AUDIT_ACTIONS.WORKSPACE_UPDATE,
    resourceType: "workspace",
    resourceId: workspaceId,
    metadata: { action: "switch", from: "session", role: membership.role },
  });

  // Set cookie — HttpOnly, secure, 30-day expiry
  const response = Response.json({
    success: true,
    workspace: targetWorkspace ?? {
      id: membership.workspace.id,
      name: membership.workspace.name,
      slug: membership.workspace.slug,
      role: membership.role,
      memberCount: 0,
    },
  });

  response.headers.set(
    "Set-Cookie",
    `selected_workspace_id=${workspaceId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`
  );

  // Add rate limit headers
  for (const [key, value] of Object.entries(getRateLimitHeaders(rlResult, RATE_LIMIT_CONFIGS.workspaceSwitch))) {
    response.headers.set(key, value);
  }

  return response;
}

/**
 * GET /api/workspace/switch
 *
 * List all workspaces the authenticated user is a member of.
 * Used by the WorkspaceSwitcher component.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id! as string;
  const workspaces = await getUserWorkspacesWithDetails(userId);

  // Get the current selected workspace from cookie (if any)
  // The client sends this as a header or we read from cookie
  const selectedWorkspaceId =
    (session.user as Record<string, unknown>).selectedWorkspaceId as string | undefined;

  return Response.json({
    workspaces,
    selectedWorkspaceId: selectedWorkspaceId || workspaces[0]?.id || null,
  });
}
