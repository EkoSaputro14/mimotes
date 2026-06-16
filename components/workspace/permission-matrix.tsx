"use client";

import { Shield, Check, Minus } from "lucide-react";

// Import ROLE_PERMISSIONS from rbac.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
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

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

const PERMISSION_LABELS: Record<string, string> = {
  "workspace:read": "View workspace",
  "workspace:update": "Update workspace settings",
  "workspace:delete": "Delete workspace",
  "workspace:transfer": "Transfer ownership",
  "workspace:billing": "Manage billing",
  "workspace:settings": "Access workspace settings",
  "member:read": "View members",
  "member:invite": "Invite members",
  "member:remove": "Remove members",
  "member:update_role": "Change member roles",
  "document:read": "View documents",
  "document:create": "Create documents",
  "document:update": "Edit documents",
  "document:delete": "Delete documents",
  "chat:read": "View chat history",
  "chat:create": "Create chat sessions",
  "chat:send": "Send chat messages",
  "analytics:read": "View analytics",
  "prompt:read": "View prompts",
  "prompt:create": "Create prompts",
  "prompt:update": "Edit prompts",
  "prompt:delete": "Delete prompts",
  "mcp:read": "View MCP servers",
  "mcp:create": "Create MCP servers",
  "mcp:update": "Edit MCP servers",
  "mcp:delete": "Delete MCP servers",
  "mcp:execute": "Execute MCP tools",
};

const ROLES = ["owner", "admin", "editor", "viewer"] as const;

/** Collect all permissions for a role (including inherited) */
function getEffectivePermissions(role: string): Set<string> {
  const perms = new Set<string>();
  for (const [roleName, rolePerms] of Object.entries(ROLE_PERMISSIONS)) {
    if ((ROLE_HIERARCHY[roleName] ?? 0) <= (ROLE_HIERARCHY[role] ?? 0)) {
      for (const perm of rolePerms) {
        perms.add(perm);
      }
    }
  }
  return perms;
}

function getRoleBadgeClass(role: string): string {
  const classes: Record<string, string> = {
    owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
    admin: "bg-primary/10 text-primary",
    editor: "bg-success/10 text-success",
    viewer: "bg-muted text-muted-foreground",
  };
  return classes[role] ?? "bg-muted text-muted-foreground";
}

export default function PermissionMatrix() {
  // Collect all unique permissions in a stable order
  const allPermissions: string[] = [];
  const seen = new Set<string>();
  for (const role of ROLES) {
    const effectivePerms = getEffectivePermissions(role);
    for (const perm of effectivePerms) {
      if (!seen.has(perm)) {
        seen.add(perm);
        allPermissions.push(perm);
      }
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border/20 overflow-hidden">
      <div className="px-6 py-4 border-b border-border/20">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Shield className="size-5" />
          Matriks Izin Peran
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan izin untuk setiap peran di workspace.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/20">
              <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                Izin
              </th>
              {ROLES.map((role) => (
                <th key={role} className="text-center px-4 py-3">
                  <span
                    className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getRoleBadgeClass(role)}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map((perm) => (
              <tr key={perm} className="border-b border-border/10 last:border-b-0 hover:bg-muted/30 transition-colors">
                <td className="px-6 py-2.5 text-sm text-foreground">
                  {PERMISSION_LABELS[perm] ?? perm}
                </td>
                {ROLES.map((role) => {
                  const effectivePerms = getEffectivePermissions(role);
                  const hasPerm = effectivePerms.has(perm);
                  return (
                    <td key={role} className="text-center px-4 py-2.5">
                      {hasPerm ? (
                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-success/10">
                          <Check className="size-3 text-success" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-muted">
                          <Minus className="size-3 text-muted-foreground/50" />
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
