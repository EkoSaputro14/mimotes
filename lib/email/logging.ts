import { prisma } from "@/lib/prisma";

/**
 * Log an email send attempt to the database.
 * Sets workspace context for RLS before inserting.
 */
export async function logEmailSend(params: {
  to: string;
  from: string;
  subject: string;
  provider: string;
  status: "sent" | "queued" | "failed" | "retrying";
  error?: string;
  retryCount: number;
  workspaceId?: string;
  actorId?: string;
}): Promise<void> {
  try {
    const wsId = params.workspaceId || "system";

    // Set workspace context for RLS
    if (wsId !== "system") {
      await prisma.$executeRaw`SELECT set_config('app.current_workspace_id', ${wsId}, false)`;
    }

    await prisma.auditLog.create({
      data: {
        workspaceId: wsId,
        actorId: params.actorId || "system",
        actorType: "system",
        action: "email.sent",
        resourceType: "email",
        resourceId: null,
        metadata: {
          to: params.to,
          from: params.from,
          subject: params.subject,
          provider: params.provider,
          status: params.status,
          error: params.error,
          retryCount: params.retryCount,
        },
      },
    });
  } catch (error) {
    // Don't let logging failures break email sending
    console.error("[Email] Failed to log email:", error);
  }
}

/**
 * Get email send history for a workspace.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEmailHistory(workspaceId: string, limit: number = 50): Promise<any[]> {
  return prisma.auditLog.findMany({
    where: {
      workspaceId,
      resourceType: "email",
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
