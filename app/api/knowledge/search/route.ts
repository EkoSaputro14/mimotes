import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { generateEmbedding } from "@/lib/rag/embedder";
import { recordAnalyticsEvent } from "@/lib/analytics";
import {
  isHybridSearchEnabled,
  hybridSearch,
  searchSimilarChunks,
} from "@/lib/rag/vectorstore";
import { isN8nEnabled, searchKnowledge } from "@/lib/n8n-client";
import { getWorkspaceAIConfig } from "@/lib/settings";

// Log retrieval request to retrieval_logs table
async function logRetrieval(params: {
  workspaceId: string;
  query: string;
  searchMode: string;
  vectorResultsCount: number;
  bm25ResultsCount: number;
  rerankedResultsCount: number;
  searchLatencyMs: number;
  embeddingLatencyMs: number;
  rerankerLatencyMs: number;
  totalLatencyMs: number;
  retrievedChunkIds: string[];
  topRrfScore: number | null;
  topSimilarityScore: number | null;
}) {
  try {
    await prisma.$executeRaw`
      INSERT INTO retrieval_logs (
        workspace_id, query, search_mode,
        vector_results_count, bm25_results_count, reranked_results_count,
        search_latency_ms, embedding_latency_ms, reranker_latency_ms, total_latency_ms,
        retrieved_chunk_ids, top_rrf_score, top_similarity_score
      ) VALUES (
        ${params.workspaceId}, ${params.query}, ${params.searchMode},
        ${params.vectorResultsCount}, ${params.bm25ResultsCount}, ${params.rerankedResultsCount},
        ${params.searchLatencyMs}, ${params.embeddingLatencyMs}, ${params.rerankerLatencyMs}, ${params.totalLatencyMs},
        ${JSON.stringify(params.retrievedChunkIds)}::JSONB, ${params.topRrfScore}, ${params.topSimilarityScore}
      )
    `;
  } catch (err) {
    console.error("Failed to log retrieval:", err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, topK = 5, threshold = 0.30, documentId } = body;

    if (!query || typeof query !== "string") {
      return Response.json({ error: "Query is required" }, { status: 400 });
    }

    const k = Math.min(20, Math.max(1, parseInt(String(topK)) || 5));
    const t = Math.max(0, Math.min(1, parseFloat(String(threshold)) || 0.30));

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    const embedStart = performance.now();
    const queryEmbedding = await generateEmbedding(query);
    const embedTime = Math.round(performance.now() - embedStart);

    const useHybrid = await isHybridSearchEnabled();
    const n8nEnabled = isN8nEnabled();

    // Try n8n webhook for search if enabled
    if (n8nEnabled) {
      try {
        const aiConfig = await getWorkspaceAIConfig(workspaceId);
        const n8nResult = await searchKnowledge({
          query,
          topK: k,
          threshold: t,
          workspaceId,
          documentId,
          aiBaseUrl: aiConfig.baseUrl,
          aiApiKey: aiConfig.apiKey,
          embeddingModel: aiConfig.embeddingModel,
        });

        if (n8nResult.success && n8nResult.data) {
          const n8nData = n8nResult.data;
          console.log(`[Search] n8n returned ${n8nData.results?.length || 0} results`);

          // Log retrieval and analytics
          logRetrieval({
            workspaceId,
            query,
            searchMode: "n8n",
            vectorResultsCount: n8nData.results?.length || 0,
            bm25ResultsCount: 0,
            rerankedResultsCount: 0,
            searchLatencyMs: n8nData.metrics?.searchTime || 0,
            embeddingLatencyMs: n8nData.metrics?.embedTime || 0,
            rerankerLatencyMs: 0,
            totalLatencyMs: n8nData.metrics?.totalTime || 0,
            retrievedChunkIds: (n8nData.results || []).map((r: any) => r.id),
            topRrfScore: null,
            topSimilarityScore: n8nData.results?.[0]?.similarity ?? null,
          }).catch(() => {});

          recordAnalyticsEvent("search_similarity", {
            queryLength: query.length,
            topK: k,
            resultCount: n8nData.results?.length || 0,
            searchMode: "n8n",
          }, session.user.id!).catch(() => {});

          return Response.json({
            results: n8nData.results || [],
            metrics: {
              embedTime: n8nData.metrics?.embedTime || 0,
              searchTime: n8nData.metrics?.searchTime || 0,
              totalTime: n8nData.metrics?.totalTime || 0,
              query,
              topK: k,
              threshold: t,
              workspaceId,
              searchMode: "n8n",
              bm25ResultCount: 0,
              avgRRFScore: null,
            },
          });
        }

        console.warn(`[Search] n8n failed, falling back to local search: ${n8nResult.error}`);
      } catch (err) {
        console.warn("[Search] n8n error, falling back to local:", err);
      }
    }

    const searchStart = performance.now();

    let result;

    if (useHybrid && !documentId) {
      result = await hybridSearch({
        queryText: query,
        queryEmbedding,
        workspaceId,
        topK: k,
        minSimilarity: t,
      });
    } else {
      result = await searchSimilarChunks(queryEmbedding, k, workspaceId, t);
    }

    const searchTime = Math.round(performance.now() - searchStart);

    const searchResults = result.chunks.map((chunk) => ({
      id: chunk.id,
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      similarity: chunk.similarity,
      document: { id: chunk.documentId, title: chunk.documentTitle, fileType: "unknown" },
      chunkType: chunk.chunkType || "text",
      ocrText: chunk.ocrText || null,
      caption: chunk.caption || null,
      imageSummary: chunk.imageSummary || null,
      imageUrl: chunk.imageUrl || null,
      bm25Score: chunk.bm25Score || null,
      rrfScore: chunk.rrfScore || null,
    }));

    // Calculate scores
    const topSimilarityScore = searchResults.length > 0 ? searchResults[0].similarity : null;
    const topRrfScore = searchResults.length > 0 ? searchResults[0].rrfScore : null;
    const bm25Count = result.metrics.bm25ResultCount ?? 0;
    const totalLatency = embedTime + searchTime;

    // Log retrieval asynchronously (non-blocking)
    logRetrieval({
      workspaceId,
      query,
      searchMode: result.metrics.searchMode || "vector",
      vectorResultsCount: searchResults.length,
      bm25ResultsCount: bm25Count,
      rerankedResultsCount: 0, // No reranker yet
      searchLatencyMs: searchTime,
      embeddingLatencyMs: embedTime,
      rerankerLatencyMs: 0, // No reranker yet
      totalLatencyMs: totalLatency,
      retrievedChunkIds: searchResults.map((r) => r.id),
      topRrfScore,
      topSimilarityScore,
    }).catch(() => {}); // Fire and forget

    recordAnalyticsEvent("search_similarity", {
      queryLength: query.length,
      topK: k,
      resultCount: searchResults.length,
      searchMode: result.metrics.searchMode || "vector",
    }, session.user.id!).catch(() => {});

    return Response.json({
      results: searchResults,
      metrics: {
        embedTime,
        searchTime,
        totalTime: totalLatency,
        query,
        topK: k,
        threshold: t,
        workspaceId,
        searchMode: result.metrics.searchMode || "vector",
        bm25ResultCount: bm25Count,
        avgRRFScore: result.metrics.avgRRFScore ?? null,
      },
    });
  } catch (error) {
    console.error("Knowledge search API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
