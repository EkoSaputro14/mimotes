import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

// GET /api/analytics/evaluation
// Returns evaluation metrics for the workspace
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // 1. Latest aggregate metrics
    const latestAggResult = await prisma.$queryRaw<Array<{
      run_id: string;
      precision_at_5: number;
      recall_at_5: number;
      mrr: number;
      created_at: string;
    }>>`
      SELECT run_id, precision_at_5, recall_at_5, mrr, created_at
      FROM eval_results
      WHERE workspace_id = ${workspaceId}
        AND search_mode = 'aggregate'
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const latestMetrics = latestAggResult[0] || null;

    // 2. Benchmark history (all runs)
    const historyResult = await prisma.$queryRaw<Array<{
      run_id: string;
      precision_at_5: number;
      recall_at_5: number;
      mrr: number;
      avg_latency_ms: number;
      query_count: number;
      created_at: string;
    }>>`
      SELECT 
        run_id,
        ROUND(AVG(precision_at_5)::NUMERIC, 4)::FLOAT as precision_at_5,
        ROUND(AVG(recall_at_5)::NUMERIC, 4)::FLOAT as recall_at_5,
        ROUND(AVG(mrr)::NUMERIC, 4)::FLOAT as mrr,
        ROUND(AVG(latency_ms))::INT as avg_latency_ms,
        COUNT(*)::INT as query_count,
        MIN(created_at) as created_at
      FROM eval_results
      WHERE workspace_id = ${workspaceId}
        AND search_mode != 'aggregate'
      GROUP BY run_id
      ORDER BY MIN(created_at) DESC
      LIMIT ${limit}
    `;
    const history = historyResult.map((h) => ({
      runId: h.run_id,
      precisionAt5: Number(h.precision_at_5),
      recallAt5: Number(h.recall_at_5),
      mrr: Number(h.mrr),
      avgLatencyMs: Number(h.avg_latency_ms),
      queryCount: Number(h.query_count),
      createdAt: h.created_at,
    }));

    // 3. Metrics by category
    const categoryResult = await prisma.$queryRaw<Array<{
      category: string;
      avg_precision: number;
      avg_recall: number;
      avg_mrr: number;
      count: bigint;
    }>>`
      SELECT 
        eq.category,
        ROUND(AVG(er.precision_at_5)::NUMERIC, 4)::FLOAT as avg_precision,
        ROUND(AVG(er.recall_at_5)::NUMERIC, 4)::FLOAT as avg_recall,
        ROUND(AVG(er.mrr)::NUMERIC, 4)::FLOAT as avg_mrr,
        COUNT(*) as count
      FROM eval_results er
      JOIN eval_queries eq ON eq.id = er.eval_query_id
      WHERE er.workspace_id = ${workspaceId}
        AND er.search_mode != 'aggregate'
      GROUP BY eq.category
      ORDER BY avg_mrr DESC
    `;
    const byCategory = categoryResult.map((c) => ({
      category: c.category,
      avgPrecision: Number(c.avg_precision),
      avgRecall: Number(c.avg_recall),
      avgMrr: Number(c.avg_mrr),
      count: Number(c.count),
    }));

    // 4. Metrics by difficulty
    const difficultyResult = await prisma.$queryRaw<Array<{
      difficulty: string;
      avg_precision: number;
      avg_recall: number;
      avg_mrr: number;
      count: bigint;
    }>>`
      SELECT 
        eq.difficulty,
        ROUND(AVG(er.precision_at_5)::NUMERIC, 4)::FLOAT as avg_precision,
        ROUND(AVG(er.recall_at_5)::NUMERIC, 4)::FLOAT as avg_recall,
        ROUND(AVG(er.mrr)::NUMERIC, 4)::FLOAT as avg_mrr,
        COUNT(*) as count
      FROM eval_results er
      JOIN eval_queries eq ON eq.id = er.eval_query_id
      WHERE er.workspace_id = ${workspaceId}
        AND er.search_mode != 'aggregate'
      GROUP BY eq.difficulty
      ORDER BY avg_mrr DESC
    `;
    const byDifficulty = difficultyResult.map((d) => ({
      difficulty: d.difficulty,
      avgPrecision: Number(d.avg_precision),
      avgRecall: Number(d.avg_recall),
      avgMrr: Number(d.avg_mrr),
      count: Number(d.count),
    }));

    // 5. Total benchmark queries
    const totalQueriesResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM eval_queries WHERE workspace_id = ${workspaceId}
    `;
    const totalBenchmarkQueries = Number(totalQueriesResult[0]?.count || 0);

    // 6. Total evaluations run
    const totalEvalsResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM eval_results 
      WHERE workspace_id = ${workspaceId} AND search_mode != 'aggregate'
    `;
    const totalEvaluations = Number(totalEvalsResult[0]?.count || 0);

    // 7. Per-query detail (worst performers)
    const worstResult = await prisma.$queryRaw<Array<{
      query: string;
      category: string;
      difficulty: string;
      precision_at_5: number;
      recall_at_5: number;
      mrr: number;
      latency_ms: number;
    }>>`
      SELECT eq.query, eq.category, eq.difficulty,
        er.precision_at_5, er.recall_at_5, er.mrr, er.latency_ms
      FROM eval_results er
      JOIN eval_queries eq ON eq.id = er.eval_query_id
      WHERE er.workspace_id = ${workspaceId}
        AND er.search_mode != 'aggregate'
      ORDER BY er.mrr ASC
      LIMIT 10
    `;
    const worstPerformers = worstResult.map((w) => ({
      query: w.query,
      category: w.category,
      difficulty: w.difficulty,
      precisionAt5: Number(w.precision_at_5),
      recallAt5: Number(w.recall_at_5),
      mrr: Number(w.mrr),
      latencyMs: Number(w.latency_ms),
    }));

    return Response.json({
      latestMetrics: latestMetrics ? {
        runId: latestMetrics.run_id,
        precisionAt5: Number(latestMetrics.precision_at_5),
        recallAt5: Number(latestMetrics.recall_at_5),
        mrr: Number(latestMetrics.mrr),
        createdAt: latestMetrics.created_at,
      } : null,
      history,
      byCategory,
      byDifficulty,
      totalBenchmarkQueries,
      totalEvaluations,
      worstPerformers,
    });
  } catch (error) {
    console.error("Evaluation analytics error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
