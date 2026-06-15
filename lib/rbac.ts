import { prisma } from "@/lib/prisma";

// ============================================================
// Role Hierarchy & Permissions
// ============================================================

/**
 * Role hierarchy: owner > admin > editor > viewer
 * Higher roles inherit all permissions of lower roles.
 */
const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Permission definitions by role.
 * Each role inherits all permissions from roles below it.
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  viewer: [
    "workspace:read",
    "document:read",
    "chat:read",
    "chat:create",
    "chat:send",
    "analytics:read",
    "prompt:read",
    "mcp:read",
    "mcp:execute",
  ],
  editor: [
    "document:create",
    "document:update",
    "document:delete",
    "prompt:create",
    "prompt:update",
    "prompt:delete",
    "mcp:create",
    "mcp:update",
    "mcp:delete",
  ],
  admin: [
    "member:read",
    "member:invite",
    "member:remove",
    "member:update_role",
    "workspace:update",
    "workspace:settings",
  ],
  owner: [
    "workspace:delete",
    "workspace:transfer",
    "workspace:billing",
  ],
};

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface RoleCheckResult {
  allowed: boolean;
  role: WorkspaceRole | null;
  workspaceId: string;
}

// ============================================================
// Role Resolution
// ============================================================

/**
 * Get a user's role in a workspace.
 * Returns null if the user is not a member.
 */
export async function getUserRole(
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId },
    },
    select: { role: true },
  });

  return (member?.role as WorkspaceRole) ?? null;
}

/**
 * Check if a user has at least the given role in a workspace.
 */
export async function hasRole(
  workspaceId: string,
  userId: string,
  minimumRole: WorkspaceRole
): Promise<boolean> {
  const role = await getUserRole(workspaceId, userId);
  if (!role) return false;
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimumRole] ?? 0);
}

/**
 * Check if a user has a specific permission in a workspace.
 */
export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: string
): Promise<boolean> {
  const role = await getUserRole(workspaceId, userId);
  if (!role) return false;

  // Collect all permissions for this role and below
  const allowedPermissions = new Set<string>();
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if ((ROLE_HIERARCHY[roleName] ?? 0) <= (ROLE_HIERARCHY[role] ?? 0)) {
      for (const perm of perms) {
        allowedPermissions.add(perm);
      }
    }
  }

  return allowedPermissions.has(permission);
}

// ============================================================
// Enforcement Helpers
// ============================================================

/**
 * Require a minimum role in a workspace. Throws if insufficient.
 *
 * Usage in API routes:
 *   const role = await requireRole(workspaceId, userId, "editor");
 */
export async function requireRole(
  workspaceId: string,
  userId: string,
  minimumRole: WorkspaceRole
): Promise<WorkspaceRole> {
  const role = await getUserRole(workspaceId, userId);
  if (!role) {
    throw new PermissionError("Not a member of this workspace");
  }

  if ((ROLE_HIERARCHY[role] ?? 0) < (ROLE_HIERARCHY[minimumRole] ?? 0)) {
    throw new PermissionError(
      `Requires ${minimumRole} role or higher (current: ${role})`
    );
  }

  return role;
}

/**
 * Require a specific permission. Throws if insufficient.
 */
export async function requirePermission(
  workspaceId: string,
  userId: string,
  permission: string
): Promise<void> {
  const allowed = await hasPermission(workspaceId, userId, permission);
  if (!allowed) {
    const role = await getUserRole(workspaceId, userId);
    throw new PermissionError(
      `Missing permission: ${permission} (current role: ${role ?? "none"})`
    );
  }
}

/**
 * Custom error class for permission failures.
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Get all permissions for a user in a workspace.
 * Useful for UI rendering (show/hide buttons).
 */
export async function getUserPermissions(
  workspaceId: string,
  userId: string
): Promise<string[]> {
  const role = await getUserRole(workspaceId, userId);
  if (!role) return [];

  const permissions: string[] = [];
  for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
    if ((ROLE_HIERARCHY[roleName] ?? 0) <= (ROLE_HIERARCHY[role] ?? 0)) {
      permissions.push(...perms);
    }
  }

  return [...new Set(permissions)];
}

/**
 * Check if a role is valid.
 */
export function isValidRole(role: string): role is WorkspaceRole {
  return role in ROLE_HIERARCHY;
}

/**
 * Get role display name.
 */
export function getRoleDisplayName(role: WorkspaceRole): string {
  const names: Record<WorkspaceRole, string> = {
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };
  return names[role];
}

/**
 * Get role badge color class (for UI).
 */
export function getRoleBadgeClass(role: WorkspaceRole): string {
  const classes: Record<WorkspaceRole, string> = {
    owner: "bg-purple-100 text-purple-800",
    admin: "bg-blue-100 text-blue-800",
    editor: "bg-green-100 text-green-800",
    viewer: "bg-gray-100 text-gray-800",
  };
  return classes[role];
}
