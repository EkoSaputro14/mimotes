import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/analytics/leads
 * Returns comprehensive lead analytics for the workspace.
 * 
 * Metrics:
 * - Total leads
 * - Conversion rate
 * - Leads by status
 * - Leads by score
 * - Top intents
 * - Knowledge gaps (unanswered queries)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const workspaceId = auth.workspaceId;

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // ── Total Leads ──
    const totalLeads = await prisma.widgetConversation.count({
      where: {
        workspaceId,
        leadEmail: { not: null },
        startedAt: { gte: startDate },
      },
    });

    // ── Leads by Status ──
    const leadsByStatus = await prisma.widgetConversation.groupBy({
      by: ["leadStatus"],
      where: {
        workspaceId,
        leadEmail: { not: null },
        startedAt: { gte: startDate },
      },
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const row of leadsByStatus) {
      statusCounts[row.leadStatus || "new"] = row._count.id;
    }

    // ── Leads by Score ──
    const leadsByScore = await prisma.widgetConversation.groupBy({
      by: ["leadScore"],
      where: {
        workspaceId,
        leadEmail: { not: null },
        startedAt: { gte: startDate },
      },
      _count: { id: true },
    });

    const scoreCounts: Record<string, number> = {};
    for (const row of leadsByScore) {
      scoreCounts[row.leadScore || "low"] = row._count.id;
    }

    // ── Conversion Rate ──
    const convertedCount = statusCounts["converted"] || 0;
    const conversionRate = totalLeads > 0
      ? Math.round((convertedCount / totalLeads) * 100 * 10) / 10
      : 0;

    // ── Top Intents ──
    const leadsByIntent = await prisma.widgetConversation.groupBy({
      by: ["leadIntent"],
      where: {
        workspaceId,
        leadEmail: { not: null },
        leadIntent: { not: null },
        startedAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const topIntents = leadsByIntent.map((row) => ({
      intent: row.leadIntent,
      count: row._count.id,
    }));

    // ── Knowledge Gaps (messages with no good RAG match) ──
    // We track this by looking at widget messages where sources are empty or low-confidence
    const totalWidgetMessages = await prisma.widgetMessage.count({
      where: {
        workspaceId,
        role: "assistant",
        createdAt: { gte: startDate },
      },
    });

    // Messages without sources = potential knowledge gaps
    const messagesWithoutSources = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint as count 
      FROM widget_messages 
      WHERE workspace_id = ${workspaceId}
        AND role = 'assistant'
        AND (sources IS NULL OR sources = 'null' OR sources = '[]')
        AND created_at >= ${startDate}
    `.catch(() => [{ count: BigInt(0) }]);

    const gapCount = Number(messagesWithoutSources[0]?.count ?? 0);
    const knowledgeGapRate = totalWidgetMessages > 0
      ? Math.round((gapCount / totalWidgetMessages) * 100 * 10) / 10
      : 0;

    // ── Daily Lead Trend ──
    const dailyLeads = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT 
        TO_CHAR(started_at::date, 'YYYY-MM-DD') as date,
        COUNT(*)::bigint as count
      FROM widget_conversations
      WHERE workspace_id = ${workspaceId}
        AND lead_email IS NOT NULL
        AND started_at >= ${startDate}
      GROUP BY started_at::date
      ORDER BY date ASC
    `.catch(() => []);

    // ── Recent High Leads ──
    const recentHighLeads = await prisma.widgetConversation.findMany({
      where: {
        workspaceId,
        leadEmail: { not: null },
        leadScore: "high",
        startedAt: { gte: startDate },
      },
      orderBy: { startedAt: "desc" },
      take: 5,
      select: {
        id: true,
        leadName: true,
        leadEmail: true,
        leadScore: true,
        leadStatus: true,
        leadIntent: true,
        startedAt: true,
        widget: { select: { name: true } },
      },
    });

    return Response.json({
      totalLeads,
      conversionRate,
      leadsByStatus: statusCounts,
      leadsByScore: scoreCounts,
      topIntents,
      knowledgeGaps: {
        totalMessages: totalWidgetMessages,
        gapCount,
        gapRate: knowledgeGapRate,
      },
      dailyTrend: dailyLeads.map((d) => ({
        date: d.date,
        count: Number(d.count),
      })),
      recentHighLeads,
      period: { days, startDate: startDate.toISOString() },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
