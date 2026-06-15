import { prisma } from "@/lib/prisma";

// ============================================================
// Audit Log Service
// ============================================================

export type ActorType = "user" | "api_key" | "system" | "widget";

export interface LogActionParams {
  workspaceId: string;
  actorId?: string;
  actorType?: ActorType;
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event.
 * Fire-and-forget — errors are logged but don't block the response.
 */
export async function logAudit(params: LogActionParams): Promise<void> {
  try {
    // Ensure workspace context is set for RLS compliance.
    // The audit_logs table has RLS: workspace_id = current_setting('app.current_workspace_id')
    // If context wasn't set yet, set it now to prevent silent RLS failures.
    const currentCtx = await prisma.$queryRaw<Array<{ v: string | null }>>`
      SELECT current_setting('app.current_workspace_id', true) as v
    `;
    if (!currentCtx[0]?.v) {
      await prisma.$executeRaw`SELECT set_config('app.current_workspace_id', ${params.workspaceId}, false)`;
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: params.workspaceId,
        actorId: params.actorId || null,
        actorType: params.actorType || "user",
        action: params.action,
        resourceType: params.resourceType || null,
        resourceId: params.resourceId || null,
        metadata: (params.metadata || undefined) as any,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    console.error("[Audit] Failed to log:", error);
  }
}

/**
 * Predefined audit actions.
 */
export const AUDIT_ACTIONS = {
  // Auth
  LOGIN: "auth.login",
  LOGOUT: "auth.logout",
  LOGIN_FAILED: "auth.login_failed",
  AUTH_REGISTER: "auth.register",

  // API Keys
  API_KEY_CREATE: "api_key.create",
  API_KEY_REVOKE: "api_key.revoke",
  API_KEY_DELETE: "api_key.delete",

  // Widgets
  WIDGET_CREATE: "widget.create",
  WIDGET_UPDATE: "widget.update",
  WIDGET_DELETE: "widget.delete",

  // Documents
  DOCUMENT_UPLOAD: "document.upload",
  DOCUMENT_DELETE: "document.delete",
  DOCUMENT_PROCESS: "document.process",

  // Billing
  BILLING_CHECKOUT: "billing.checkout",
  BILLING_PLAN_CHANGE: "billing.plan_change",
  BILLING_CANCEL: "billing.cancel",
  BILLING_RESUBSCRIBE: "billing.resubscribe",
  BILLING_PORTAL: "billing.portal_access",

  // Subscription
  SUBSCRIPTION_CREATED: "subscription.created",
  SUBSCRIPTION_UPDATED: "subscription.updated",
  SUBSCRIPTION_CANCELED: "subscription.canceled",
  SUBSCRIPTION_PAYMENT_FAILED: "subscription.payment_failed",

  // Invitations
  INVITATION_CREATED: "invitation.created",
  INVITATION_ACCEPTED: "invitation.accepted",
  INVITATION_REVOKED: "invitation.revoked",
  INVITATION_RESENT: "invitation.resent",

  // Members
  MEMBER_INVITE: "member.invite",
  MEMBER_REMOVE: "member.remove",
  MEMBER_ROLE_CHANGE: "member.role_change",

  // MCP
  MCP_SERVER_ADD: "mcp.server_add",
  MCP_SERVER_REMOVE: "mcp.server_remove",
  MCP_SERVER_UPDATE: "mcp.server_update",
  MCP_CONNECT: "mcp.connect",
  MCP_DISCONNECT: "mcp.disconnect",

  // Workspace
  WORKSPACE_UPDATE: "workspace.update",
  WORKSPACE_SETTINGS: "workspace.settings",
  WORKSPACE_DELETE: "workspace.delete",
  WORKSPACE_TRANSFER: "workspace.transfer_ownership",

  // User
  USER_PROFILE_UPDATE: "user.profile_update",
  USER_PASSWORD_CHANGE: "user.password_change",
} as const;

/**
 * Query audit logs with filtering and pagination.
 */
export async function queryAuditLogs(params: {
  workspaceId: string;
  action?: string;
  actorId?: string;
  resourceType?: string;
  search?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { workspaceId, action, actorId, resourceType, search, from, to } = params;
  const limit = Math.min(params.limit || 50, 200);
  const offset = params.offset || 0;

  const where: any = { workspaceId };

  if (action) where.action = action;
  if (actorId) where.actorId = actorId;
  if (resourceType) where.resourceType = resourceType;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (search) {
    where.OR = [
      { action: { contains: search, mode: "insensitive" } },
      { resourceType: { contains: search, mode: "insensitive" } },
      { resourceId: { contains: search, mode: "insensitive" } },
      { actorId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, limit, offset, hasMore: offset + limit < total };
}

/**
 * Export audit logs as CSV string.
 */
export async function exportAuditLogsCsv(params: {
  workspaceId: string;
  action?: string;
  resourceType?: string;
  from?: Date;
  to?: Date;
}) {
  const { logs } = await queryAuditLogs({
    ...params,
    limit: 10000,
    offset: 0,
  });

  const headers = ["id", "timestamp", "actor_id", "actor_type", "action", "resource_type", "resource_id", "ip_address", "metadata"];
  const rows = logs.map((log) => [
    log.id,
    log.createdAt.toISOString(),
    log.actorId || "",
    log.actorType,
    log.action,
    log.resourceType || "",
    log.resourceId || "",
    log.ipAddress || "",
    JSON.stringify(log.metadata || {}),
  ]);

  function escapeCsv(val: string): string {
    return '"' + val.replace(/"/g, '""') + '"';
  }

  const csvLines = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => escapeCsv(String(c))).join(","))
  ];
  return csvLines.join("\\n");
}

/**
 * Get audit log summary for a workspace.
 */
export async function getAuditSummary(workspaceId: string, days: number = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalEvents, topActions, topActors, dailyCounts] = await Promise.all([
    prisma.auditLog.count({ where: { workspaceId, createdAt: { gte: since } } }),
    prisma.auditLog.groupBy({
      by: ["action"],
      where: { workspaceId, createdAt: { gte: since } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.auditLog.groupBy({
      by: ["actorId"],
      where: { workspaceId, createdAt: { gte: since }, actorId: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at) as date, COUNT(*) as count
       FROM audit_logs
       WHERE workspace_id = ${workspaceId} AND created_at >= ${since}
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    ,
  ]);

  return {
    totalEvents,
    topActions: topActions.map((a) => ({ action: a.action, count: a._count.id })),
    topActors: topActors.map((a) => ({ actorId: a.actorId, count: a._count.id })),
    dailyCounts: dailyCounts.map((d) => ({ date: d.date, count: Number(d.count) })),
  };
}
