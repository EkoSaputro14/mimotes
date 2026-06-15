import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

// GET /api/analytics/retrieval
// Returns retrieval analytics for the workspace
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "7");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 1. Retrieval volume (total searches)
    const volumeResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    const totalSearches = Number(volumeResult[0]?.count || 0);

    // 2. Average latency
    const latencyResult = await prisma.$queryRaw<[{ avg_total: number; avg_embedding: number; avg_search: number; avg_reranker: number }]>`
      SELECT
        ROUND(AVG(total_latency_ms)) as avg_total,
        ROUND(AVG(embedding_latency_ms)) as avg_embedding,
        ROUND(AVG(search_latency_ms)) as avg_search,
        ROUND(AVG(reranker_latency_ms)) as avg_reranker
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    const avgLatency = {
      total: Number(latencyResult[0]?.avg_total || 0),
      embedding: Number(latencyResult[0]?.avg_embedding || 0),
      search: Number(latencyResult[0]?.avg_search || 0),
      reranker: Number(latencyResult[0]?.avg_reranker || 0),
    };

    // 3. Hybrid usage %
    const hybridResult = await prisma.$queryRaw<[{ hybrid_count: bigint; total_count: bigint }]>`
      SELECT
        COUNT(*) FILTER (WHERE search_mode = 'hybrid') as hybrid_count,
        COUNT(*) as total_count
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    const hybridUsage = {
      hybridCount: Number(hybridResult[0]?.hybrid_count || 0),
      totalCount: Number(hybridResult[0]?.total_count || 0),
      percentage: Number(hybridResult[0]?.total_count) > 0
        ? Math.round((Number(hybridResult[0]?.hybrid_count) / Number(hybridResult[0]?.total_count)) * 100)
        : 0,
    };

    // 4. Top queries
    const topQueriesResult = await prisma.$queryRaw<Array<{ query: string; count: bigint; avg_latency: number }>>`
      SELECT
        query,
        COUNT(*) as count,
        ROUND(AVG(total_latency_ms)) as avg_latency
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY query
      ORDER BY count DESC
      LIMIT ${limit}
    `;
    const topQueries = topQueriesResult.map((q) => ({
      query: q.query,
      count: Number(q.count),
      avgLatency: Number(q.avg_latency),
    }));

    // 5. Retrieval success rate (results > 0)
    const successResult = await prisma.$queryRaw<[{ success: bigint; total: bigint }]>`
      SELECT
        COUNT(*) FILTER (WHERE vector_results_count > 0) as success,
        COUNT(*) as total
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
    `;
    const successRate = {
      successCount: Number(successResult[0]?.success || 0),
      totalCount: Number(successResult[0]?.total || 0),
      percentage: Number(successResult[0]?.total) > 0
        ? Math.round((Number(successResult[0]?.success) / Number(successResult[0]?.total)) * 100)
        : 0,
    };

    // 6. Daily volume trend
    const dailyTrendResult = await prisma.$queryRaw<Array<{ date: string; count: bigint; avg_latency: number }>>`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        ROUND(AVG(total_latency_ms)) as avg_latency
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
    const dailyTrend = dailyTrendResult.map((d) => ({
      date: d.date,
      count: Number(d.count),
      avgLatency: Number(d.avg_latency),
    }));

    // 7. Search mode distribution
    const modeResult = await prisma.$queryRaw<Array<{ search_mode: string; count: bigint }>>`
      SELECT
        search_mode,
        COUNT(*) as count
      FROM retrieval_logs
      WHERE workspace_id = ${workspaceId}
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY search_mode
      ORDER BY count DESC
    `;
    const modeDistribution = modeResult.map((m) => ({
      mode: m.search_mode,
      count: Number(m.count),
    }));

    return Response.json({
      period: `${days}d`,
      totalSearches,
      avgLatency,
      hybridUsage,
      topQueries,
      successRate,
      dailyTrend,
      modeDistribution,
    });
  } catch (error) {
    console.error("Retrieval analytics error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
