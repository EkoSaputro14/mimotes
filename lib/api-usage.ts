import { prisma } from "@/lib/prisma";

// ============================================================
// API Usage Tracking
// ============================================================

export interface TrackUsageParams {
  workspaceId: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  tokensUsed?: number;
  ipAddress?: string;
}

/**
 * Track an API usage event.
 * Fire-and-forget — errors are logged but don't block the response.
 */
export async function trackApiUsage(params: TrackUsageParams): Promise<void> {
  try {
    await prisma.apiUsageLog.create({
      data: {
        workspaceId: params.workspaceId,
        apiKeyId: params.apiKeyId || null,
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
        latencyMs: params.latencyMs,
        tokensUsed: params.tokensUsed || 0,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (error) {
    console.error("[API Usage] Failed to track:", error);
  }
}

/**
 * Get API usage summary for a workspace.
 */
export async function getApiUsageSummary(
  workspaceId: string,
  days: number = 30
) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [totalRequests, avgLatency, errorCount, totalTokens] = await Promise.all([
    prisma.apiUsageLog.count({
      where: { workspaceId, createdAt: { gte: since } },
    }),
    prisma.apiUsageLog.aggregate({
      where: { workspaceId, createdAt: { gte: since } },
      _avg: { latencyMs: true },
    }),
    prisma.apiUsageLog.count({
      where: {
        workspaceId,
        createdAt: { gte: since },
        statusCode: { gte: 400 },
      },
    }),
    prisma.apiUsageLog.aggregate({
      where: { workspaceId, createdAt: { gte: since } },
      _sum: { tokensUsed: true },
    }),
  ]);

  // Top endpoints
  const topEndpoints = await prisma.apiUsageLog.groupBy({
    by: ["endpoint"],
    where: { workspaceId, createdAt: { gte: since } },
    _count: { id: true },
    _avg: { latencyMs: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  // Daily request counts
  const dailyRequests = await prisma.$queryRaw<
    Array<{ date: string; count: bigint }>
  >`
    SELECT DATE(created_at) as date, COUNT(*) as count
    FROM api_usage_logs
    WHERE workspace_id = ${workspaceId} AND created_at >= ${since}
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `;

  return {
    totalRequests,
    avgLatencyMs: Math.round(avgLatency._avg.latencyMs || 0),
    errorCount,
    errorRate: totalRequests > 0 ? Math.round((errorCount / totalRequests) * 100) : 0,
    totalTokens: Number(totalTokens._sum.tokensUsed || 0),
    topEndpoints: topEndpoints.map((e) => ({
      endpoint: e.endpoint,
      requests: e._count.id,
      avgLatencyMs: Math.round(e._avg.latencyMs || 0),
    })),
    dailyRequests: dailyRequests.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
  };
}

/**
 * Get recent API usage logs for a workspace.
 */
export async function getRecentApiLogs(
  workspaceId: string,
  limit: number = 50
) {
  return prisma.apiUsageLog.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      endpoint: true,
      method: true,
      statusCode: true,
      latencyMs: true,
      tokensUsed: true,
      createdAt: true,
    },
  });
}
