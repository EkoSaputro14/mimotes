import { prisma, resolveWorkspaceId } from "@/lib/prisma";

// ─── Event Types ──────────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | "chat_message"
  | "document_upload"
  | "document_delete"
  | "search_similarity"
  | "settings_update"
  | "session_create"
  | "image_ingestion"
  | "image_rejection"
  | "image_processing_success";

// ─── Record Event ─────────────────────────────────────────────────────────────

export async function recordAnalyticsEvent(
  eventType: AnalyticsEventType,
  metadata?: Record<string, unknown>,
  userId?: string | null
): Promise<void> {
  try {
    // Resolve workspace — use first available workspace if no userId
    let workspaceId: string;
    if (userId) {
      workspaceId = await resolveWorkspaceId(userId);
    } else {
      // Fallback: use first workspace in system
      const firstWorkspace = await prisma.workspace.findFirst({ select: { id: true } });
      workspaceId = firstWorkspace?.id || "unknown";
    }

    await prisma.analyticsEvent.create({
      data: {
        eventType,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
        userId: userId || null,
        workspaceId,
      },
    });
  } catch (error) {
    // Analytics should never break the main flow
    console.error("[Analytics] Failed to record event:", error);
  }
}

// ─── Date Range Helpers ───────────────────────────────────────────────────────

export type DateRange = "7d" | "30d" | "90d";

export function getDateRangeParams(range: DateRange): {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
} {
  const endDate = new Date();
  const startDate = new Date();
  const previousStartDate = new Date();

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  startDate.setDate(endDate.getDate() - days);
  previousStartDate.setDate(startDate.getDate() - days);

  return { startDate, endDate, previousStartDate };
}

// ─── Common Aggregation Helpers ───────────────────────────────────────────────

export async function getEventCountsByType(
  startDate: Date,
  endDate: Date
): Promise<Record<string, number>> {
  const results = await prisma.analyticsEvent.groupBy({
    by: ["eventType"],
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const row of results) {
    counts[row.eventType] = row._count.id;
  }
  return counts;
}

export async function getDailyEventCounts(
  startDate: Date,
  endDate: Date,
  eventTypes?: AnalyticsEventType[]
): Promise<{ date: string; counts: Record<string, number> }[]> {
  // Use parameterized query for event type filtering (prevents SQL injection)
  let rows: { date: string; event_type: string; count: bigint }[];

  if (eventTypes?.length) {
    rows = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        event_type,
        COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        AND event_type = ANY(${eventTypes}::text[])
      GROUP BY DATE(created_at), event_type
      ORDER BY DATE(created_at)
    `;
  } else {
    rows = await prisma.$queryRaw`
      SELECT
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        event_type,
        COUNT(*) as count
      FROM analytics_events
      WHERE created_at >= ${startDate} AND created_at <= ${endDate}
      GROUP BY DATE(created_at), event_type
      ORDER BY DATE(created_at)
    `;
  }

  // Pivot into { date, counts: { eventType: count } }
  const dateMap = new Map<string, Record<string, number>>();
  for (const row of rows) {
    if (!dateMap.has(row.date)) {
      dateMap.set(row.date, {});
    }
    dateMap.get(row.date)![row.event_type] = Number(row.count);
  }

  return Array.from(dateMap.entries()).map(([date, counts]) => ({
    date,
    counts,
  }));
}

export async function getUniqueActiveUsers(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      userId: { not: null },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  return result.length;
}

// ─── Chat Analytics Helpers ───────────────────────────────────────────────────

export async function getChatAnalytics(startDate: Date, endDate: Date) {
  // Total sessions in range
  const totalSessions = await prisma.chatSession.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });

  // Previous period for trend
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - daysDiff);

  const previousSessions = await prisma.chatSession.count({
    where: { createdAt: { gte: previousStart, lt: startDate } },
  });

  // Today's sessions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todaySessions = await prisma.chatSession.count({
    where: { createdAt: { gte: todayStart } },
  });

  // Total messages in range
  const totalMessages = await prisma.chatMessage.count({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      role: "user",
    },
  });

  // Average messages per session
  const avgMessages = totalSessions > 0 ? totalMessages / totalSessions : 0;

  // Messages with sources (response quality)
  const assistantMessages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      role: "assistant",
    },
    select: { sources: true },
  });

  const withSources = assistantMessages.filter(
    (m) => m.sources && Array.isArray(m.sources) && m.sources.length > 0
  ).length;
  const totalAssistant = assistantMessages.length;
  const sourceRate =
    totalAssistant > 0 ? (withSources / totalAssistant) * 100 : 0;

  // Average sources per message
  const totalSourceCount = assistantMessages.reduce((sum, m) => {
    if (m.sources && Array.isArray(m.sources)) {
      return sum + m.sources.length;
    }
    return sum;
  }, 0);
  const avgSources = totalAssistant > 0 ? totalSourceCount / totalAssistant : 0;

  // Top questions (user messages)
  const userMessages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      role: "user",
    },
    select: { content: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Group similar questions (simple prefix matching)
  const questionCounts = new Map<string, number>();
  for (const msg of userMessages) {
    const normalized = msg.content.toLowerCase().trim().substring(0, 60);
    questionCounts.set(normalized, (questionCounts.get(normalized) || 0) + 1);
  }

  const topQuestions = Array.from(questionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([question, count]) => ({ question, count }));

  // Daily chat volume
  const dailyChats = await prisma.$queryRaw<
    { date: string; count: bigint }[]
  >`
    SELECT
      TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
      COUNT(*) as count
    FROM chat_sessions
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `;

  // Session duration distribution (based on time between first and last message)
  // Using CTE to avoid "aggregate function calls cannot be nested" and
  // "column must appear in GROUP BY" errors
  const sessionDurations = await prisma.$queryRaw<
    { duration_bucket: string; count: bigint }[]
  >`
    WITH session_durations AS (
      SELECT
        cs.id,
        EXTRACT(EPOCH FROM (MAX(cm.created_at) - MIN(cm.created_at))) as duration_seconds
      FROM chat_sessions cs
      JOIN chat_messages cm ON cm.session_id = cs.id
      WHERE cs.created_at >= ${startDate} AND cs.created_at <= ${endDate}
      GROUP BY cs.id
    )
    SELECT
      CASE
        WHEN duration_seconds < 60 THEN '<1min'
        WHEN duration_seconds < 300 THEN '1-5min'
        WHEN duration_seconds < 900 THEN '5-15min'
        ELSE '15min+'
      END as duration_bucket,
      COUNT(*) as count
    FROM session_durations
    GROUP BY 1
    ORDER BY MIN(duration_seconds)
  `;

  // Most referenced documents
  const docReferences = new Map<string, number>();
  for (const msg of assistantMessages) {
    if (msg.sources && Array.isArray(msg.sources)) {
      for (const source of msg.sources as Record<string, unknown>[]) {
        const docId = source.documentId as string;
        if (docId) {
          docReferences.set(docId, (docReferences.get(docId) || 0) + 1);
        }
      }
    }
  }

  const topDocIds = Array.from(docReferences.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const topDocuments = await Promise.all(
    topDocIds.map(async ([docId, refs]) => {
      const doc = await prisma.document.findUnique({
        where: { id: docId },
        select: { id: true, title: true, fileType: true },
      });
      return {
        id: docId,
        title: doc?.title || "Unknown",
        fileType: doc?.fileType || "unknown",
        references: refs,
      };
    })
  );

  return {
    kpis: {
      totalSessions,
      previousSessions,
      todaySessions,
      avgMessages: Math.round(avgMessages * 10) / 10,
      sourceRate: Math.round(sourceRate),
      avgSources: Math.round(avgSources * 10) / 10,
    },
    dailyVolume: dailyChats.map((d) => ({
      date: d.date,
      count: Number(d.count),
    })),
    responseQuality: {
      withSources,
      withoutSources: totalAssistant - withSources,
      total: totalAssistant,
      sourceRate: Math.round(sourceRate),
    },
    topQuestions,
    sessionDuration: sessionDurations.map((d) => ({
      bucket: d.duration_bucket,
      count: Number(d.count),
    })),
    topDocuments,
  };
}

// ─── Usage Analytics Helpers ──────────────────────────────────────────────────

export async function getUsageAnalytics(startDate: Date, endDate: Date) {
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - daysDiff);

  // Current period counts
  const currentCounts = await getEventCountsByType(startDate, endDate);
  const previousCounts = await getEventCountsByType(previousStart, startDate);

  // Unique users
  const activeUsers = await getUniqueActiveUsers(startDate, endDate);
  const previousUsers = await getUniqueActiveUsers(previousStart, startDate);

  // KPIs
  const totalDocuments = await prisma.document.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });
  const previousDocuments = await prisma.document.count({
    where: { createdAt: { gte: previousStart, lt: startDate } },
  });

  const totalChats = await prisma.chatSession.count({
    where: { createdAt: { gte: startDate, lte: endDate } },
  });
  const previousChats = await prisma.chatSession.count({
    where: { createdAt: { gte: previousStart, lt: startDate } },
  });

  // Daily activity by type
  const dailyActivity = await getDailyEventCounts(startDate, endDate);

  // Feature adoption
  const featureAdoption = [
    { feature: "Chat", count: currentCounts["chat_message"] || totalChats },
    { feature: "Documents", count: currentCounts["document_upload"] || totalDocuments },
    { feature: "Search", count: currentCounts["search_similarity"] || 0 },
    { feature: "Sessions", count: currentCounts["session_create"] || 0 },
    { feature: "Settings", count: currentCounts["settings_update"] || 0 },
  ].sort((a, b) => b.count - a.count);

  // Peak usage hours (by day of week and hour)
  const hourlyActivity = await prisma.$queryRaw<
    { dow: number; hour: number; count: bigint }[]
  >`
    SELECT
      EXTRACT(DOW FROM created_at)::int as dow,
      EXTRACT(HOUR FROM created_at)::int as hour,
      COUNT(*) as count
    FROM analytics_events
    WHERE created_at >= ${startDate} AND created_at <= ${endDate}
    GROUP BY dow, hour
    ORDER BY dow, hour
  `;

  // Recent activity log
  const recentEvents = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return {
    kpis: {
      totalDocuments,
      previousDocuments,
      totalChats,
      previousChats,
      activeUsers,
      previousUsers,
      uploads: currentCounts["document_upload"] || totalDocuments,
      previousUploads: previousCounts["document_upload"] || previousDocuments,
      searches: currentCounts["search_similarity"] || 0,
      previousSearches: previousCounts["search_similarity"] || 0,
    },
    dailyActivity,
    featureAdoption,
    hourlyActivity: hourlyActivity.map((h) => ({
      dow: h.dow,
      hour: h.hour,
      count: Number(h.count),
    })),
    recentEvents: recentEvents.map((e: typeof recentEvents[number]) => ({
      id: e.id,
      eventType: e.eventType,
      userName: e.user?.name || e.user?.email || "Anonymous",
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}

// ─── Cost Analytics Helpers ───────────────────────────────────────────────────

// Token pricing per 1M tokens (USD)
const PRICING: Record<string, { input: number; output: number }> = {
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10, output: 30 },
  "gpt-3.5-turbo": { input: 0.5, output: 1.5 },
  "mimo-v2.5-pro": { input: 0.2, output: 0.8 },
  "mimo-v2.5-lite": { input: 0.1, output: 0.4 },
};

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = PRICING[model] || { input: 0.5, output: 1.5 };
  return (
    (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output
  );
}

export async function getCostAnalytics(startDate: Date, endDate: Date) {
  const daysDiff = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const previousStart = new Date(startDate);
  previousStart.setDate(previousStart.getDate() - daysDiff);

  // Get all chat messages in range for token estimation
  const messages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      role: true,
      content: true,
      createdAt: true,
    },
  });

  const previousMessages = await prisma.chatMessage.findMany({
    where: {
      createdAt: { gte: previousStart, lt: startDate },
    },
    select: {
      role: true,
      content: true,
    },
  });

  // Get current provider info
  const providerSetting = await prisma.setting.findUnique({
    where: { key: "ai_model" },
  });
  const currentModel = providerSetting?.value || "mimo-v2.5-pro";

  const providerTypeSetting = await prisma.setting.findUnique({
    where: { key: "ai_provider" },
  });
  const currentProvider = providerTypeSetting?.value || "mimo";

  // Calculate current period tokens
  let inputTokens = 0;
  let outputTokens = 0;
  for (const msg of messages) {
    const tokens = estimateTokens(msg.content);
    if (msg.role === "user") {
      inputTokens += tokens;
    } else {
      outputTokens += tokens;
    }
  }

  // Previous period tokens
  let prevInputTokens = 0;
  let prevOutputTokens = 0;
  for (const msg of previousMessages) {
    const tokens = estimateTokens(msg.content);
    if (msg.role === "user") {
      prevInputTokens += tokens;
    } else {
      prevOutputTokens += tokens;
    }
  }

  const totalTokens = inputTokens + outputTokens;
  const prevTotalTokens = prevInputTokens + prevOutputTokens;
  const estimatedCost = estimateCost(inputTokens, outputTokens, currentModel);
  const prevEstimatedCost = estimateCost(
    prevInputTokens,
    prevOutputTokens,
    currentModel
  );

  const totalQueries = messages.filter((m) => m.role === "user").length;
  const avgCostPerQuery = totalQueries > 0 ? estimatedCost / totalQueries : 0;

  // Daily cost breakdown
  const dailyCosts = new Map<
    string,
    { inputTokens: number; outputTokens: number }
  >();
  for (const msg of messages) {
    const date = msg.createdAt.toISOString().split("T")[0];
    if (!dailyCosts.has(date)) {
      dailyCosts.set(date, { inputTokens: 0, outputTokens: 0 });
    }
    const day = dailyCosts.get(date)!;
    const tokens = estimateTokens(msg.content);
    if (msg.role === "user") {
      day.inputTokens += tokens;
    } else {
      day.outputTokens += tokens;
    }
  }

  const costOverTime = Array.from(dailyCosts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({
      date,
      inputCost: estimateCost(data.inputTokens, 0, currentModel),
      outputCost: estimateCost(0, data.outputTokens, currentModel),
      totalCost: estimateCost(
        data.inputTokens,
        data.outputTokens,
        currentModel
      ),
      inputTokens: data.inputTokens,
      outputTokens: data.outputTokens,
    }));

  // Token breakdown
  const totalMessagesCount = messages.length;
  const chatInputPct =
    totalTokens > 0 ? Math.round((inputTokens / totalTokens) * 100) : 0;
  const chatOutputPct =
    totalTokens > 0 ? Math.round((outputTokens / totalTokens) * 100) : 0;

  return {
    kpis: {
      estimatedCost: Math.round(estimatedCost * 100) / 100,
      previousCost: Math.round(prevEstimatedCost * 100) / 100,
      avgCostPerQuery: Math.round(avgCostPerQuery * 10000) / 10000,
      inputTokens,
      previousInputTokens: prevInputTokens,
      outputTokens,
      previousOutputTokens: prevOutputTokens,
    },
    costOverTime,
    tokenBreakdown: {
      chatInput: inputTokens,
      chatOutput: outputTokens,
      total: totalTokens,
      chatInputPct,
      chatOutputPct,
    },
    costByModel: [
      {
        model: currentModel,
        provider: currentProvider,
        tokens: totalTokens,
        cost: estimatedCost,
      },
    ],
    message: `Costs estimated using character-based token approximation (÷4). Actual costs may vary by provider. Current model: ${currentModel} (${currentProvider}).`,
  };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export async function exportAnalyticsCSV(
  startDate: Date,
  endDate: Date
): Promise<string> {
  const events = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
    },
  });

  const headers = ["Date", "Event Type", "User Email", "Metadata"];
  const rows = events.map((e: typeof events[number]) => [
    e.createdAt.toISOString(),
    e.eventType,
    e.user?.email || "",
    e.metadata ? JSON.stringify(e.metadata) : "",
  ]);

  const csv = [headers.join(","), ...rows.map((r: string[]) => r.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return csv;
}
