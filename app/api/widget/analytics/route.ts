import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth, apiErrorResponse } from "@/lib/api-auth";

/**
 * GET /api/widget/analytics?widgetId=xxx&days=30
 * Get widget analytics (requires API auth).
 *
 * Returns:
 * - totalConversations: Total conversations in period
 * - activeConversations: Currently active conversations
 * - totalMessages: Total messages in period
 * - topQuestions: Top 10 most asked questions
 * - refusedAnswers: Count of refused/empty answers
 * - dailyStats: Daily conversation + message counts
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAuth(request);
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId");
    const days = parseInt(searchParams.get("days") || "30", 10);

    const where: Record<string, unknown> = { workspaceId: auth.workspaceId };
    if (widgetId) where.widgetId = widgetId;

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      totalConversations,
      activeConversations,
      totalMessages,
      topQuestions,
      refusedAnswers,
      dailyStats,
    ] = await Promise.all([
      // Total conversations in period
      prisma.widgetConversation.count({
        where: { ...where, startedAt: { gte: since } },
      }),

      // Active conversations
      prisma.widgetConversation.count({
        where: { ...where, status: "active" },
      }),

      // Total messages in period
      prisma.widgetMessage.count({
        where: { ...where, createdAt: { gte: since } },
      }),

      // Top 10 most asked questions (user messages)
      prisma.$queryRaw<Array<{ question: string; count: bigint }>>`
        SELECT content as question, COUNT(*) as count
        FROM widget_messages m
        JOIN widget_conversations c ON c.id = m.conversation_id
        WHERE c.workspace_id = ${auth.workspaceId}
          AND m.role = 'user'
          AND m.created_at >= ${since}
          ${widgetId ? prisma.$queryRaw`AND c.widget_id = ${widgetId}` : prisma.$queryRaw``}
        GROUP BY content
        ORDER BY count DESC
        LIMIT 10
      `,

      // Refused answers: assistant messages containing refusal keywords
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count
        FROM widget_messages m
        JOIN widget_conversations c ON c.id = m.conversation_id
        WHERE c.workspace_id = ${auth.workspaceId}
          AND m.role = 'assistant'
          AND m.created_at >= ${since}
          AND (m.content LIKE '%tidak menemukan%'
            OR m.content LIKE '%tidak tersedia%'
            OR m.content LIKE '%Informasi tersebut tidak%')
          ${widgetId ? prisma.$queryRaw`AND c.widget_id = ${widgetId}` : prisma.$queryRaw``}
      `,

      // Daily stats
      prisma.$queryRaw<
        Array<{ date: string; conversations: bigint; messages: bigint }>
      >`
        SELECT DATE(c.started_at) as date,
                COUNT(DISTINCT c.id) as conversations,
                COUNT(m.id) as messages
         FROM widget_conversations c
         LEFT JOIN widget_messages m ON m.conversation_id = c.id
         WHERE c.workspace_id = ${auth.workspaceId} AND c.started_at >= ${since}
         ${widgetId ? prisma.$queryRaw`AND c.widget_id = ${widgetId}` : prisma.$queryRaw``}
         GROUP BY DATE(c.started_at)
         ORDER BY date DESC
      `,
    ]);

    return Response.json({
      totalConversations,
      activeConversations,
      totalMessages,
      refusedAnswers: Number(refusedAnswers[0]?.count || 0),
      topQuestions: topQuestions.map((q) => ({
        question: q.question,
        count: Number(q.count),
      })),
      dailyStats: dailyStats.map((d) => ({
        date: d.date,
        conversations: Number(d.conversations),
        messages: Number(d.messages),
      })),
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
