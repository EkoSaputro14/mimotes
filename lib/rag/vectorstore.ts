import { prisma } from "@/lib/prisma";
import { getSettingWithFallback } from "@/lib/settings";

// ============================================================
// Feature Flags
// ============================================================

let cachedHybridEnabled: boolean | null = null;
let hybridCacheTimestamp = 0;
const HYBRID_CACHE_TTL = 30_000;

/**
 * Check if hybrid search is enabled via feature flag.
 * Setting key: rag_hybrid_search (DB) / RAG_HYBRID_SEARCH (env)
 */
export async function isHybridSearchEnabled(): Promise<boolean> {
  const now = Date.now();
  if (cachedHybridEnabled !== null && now - hybridCacheTimestamp < HYBRID_CACHE_TTL) {
    return cachedHybridEnabled;
  }
  const val = await getSettingWithFallback("rag_hybrid_search", "RAG_HYBRID_SEARCH", "true");
  cachedHybridEnabled = val === "true" || val === "1";
  hybridCacheTimestamp = now;
  return cachedHybridEnabled;
}

export function invalidateHybridCache(): void {
  cachedHybridEnabled = null;
  hybridCacheTimestamp = 0;
}

// ============================================================
// Types
// ============================================================

export interface SimilarChunk {
  id: string;
  content: string;
  documentId: string;
  documentTitle: string;
  workspaceId: string;
  similarity: number;
  chunkIndex: number;
  metadata: Record<string, unknown>;
  chunkType?: string;
  ocrText?: string;
  caption?: string;
  imageSummary?: string;
  imageUrl?: string;
  /** Hybrid search scores (undefined when hybrid is disabled) */
  bm25Score?: number;
  rrfScore?: number;
}

export interface RetrievalMetrics {
  retrievedCount: number;
  discardedCount: number;
  averageSimilarity: number;
  retrievalLatencyMs: number;
  threshold: number;
  /** Hybrid-specific metrics */
  searchMode?: "vector" | "hybrid";
  bm25ResultCount?: number;
  avgRRFScore?: number;
}

export interface RetrievalResult {
  chunks: SimilarChunk[];
  metrics: RetrievalMetrics;
}

// Default minimum similarity threshold
const DEFAULT_MIN_SIMILARITY = 0.30;

// ============================================================
// Store Chunks
// ============================================================

/**
 * Store chunks with workspace_id for direct RLS enforcement.
 * Each chunk carries its own workspace_id — no JOIN needed at search time.
 */
export async function storeChunks(
  documentId: string,
  workspaceId: string,
  chunks: { content: string; embedding: number[]; index: number; metadata?: Record<string, unknown> }[]
): Promise<void> {
  const batchSize = 50;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    await prisma.$transaction(
      batch.map((chunk) =>
        prisma.$executeRaw`
          INSERT INTO document_chunks (id, document_id, workspace_id, tenant_id, content, embedding, chunk_index, metadata, created_at)
          VALUES (gen_random_uuid(), ${documentId}, ${workspaceId}, ${workspaceId}, ${chunk.content}, ${`[${chunk.embedding.join(",")}]`}::vector, ${chunk.index}, ${JSON.stringify(chunk.metadata || {})}::jsonb, NOW())
        `
      )
    );
  }
}

// ============================================================
// Vector-Only Search (legacy, used as fallback)
// ============================================================

export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK: number = 5,
  workspaceId: string,
  minSimilarity: number = DEFAULT_MIN_SIMILARITY
): Promise<RetrievalResult> {
  const embeddingStr = `[${queryEmbedding.join(",")}]`;
  const start = performance.now();

  const fetchLimit = Math.max(topK * 3, 20);

  const rawResults: Array<{
    id: string;
    content: string;
    document_id: string;
    document_title: string;
    workspace_id: string;
    similarity: number;
    chunk_index: number;
    metadata: Record<string, unknown>;
    chunk_type: string;
    ocr_text: string | null;
    caption: string | null;
    image_summary: string | null;
    image_url: string | null;
  }> = await prisma.$queryRaw`
    SELECT
      dc.id, dc.content, dc.document_id,
      d.title as document_title, dc.workspace_id,
      1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity,
      dc.chunk_index, dc.metadata,
      dc.chunk_type, dc.ocr_text, dc.caption, dc.image_summary, dc.image_url
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE dc.workspace_id = ${workspaceId}
      AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> ${embeddingStr}::vector
    LIMIT ${fetchLimit}
  `;

  const retrievalLatencyMs = Math.round(performance.now() - start);

  const thresholded = rawResults.filter((r) => Number(r.similarity) >= minSimilarity);
  const discardedByThreshold = rawResults.length - thresholded.length;

  const seen = new Map<string, typeof thresholded[0]>();
  for (const chunk of thresholded) {
    const key = chunk.content.toLowerCase().replace(/\s+/g, " ").trim();
    const existing = seen.get(key);
    if (!existing || chunk.similarity > existing.similarity) {
      seen.set(key, chunk);
    }
  }

  const deduplicated = Array.from(seen.values());
  const discardedByDedup = thresholded.length - deduplicated.length;
  const finalChunks = deduplicated.slice(0, topK);

  const averageSimilarity = finalChunks.length > 0
    ? finalChunks.reduce((sum, r) => sum + Number(r.similarity), 0) / finalChunks.length
    : 0;

  return {
    chunks: finalChunks.map((r) => ({
      id: r.id,
      content: r.content,
      documentId: r.document_id,
      documentTitle: r.document_title || "Untitled",
      workspaceId: r.workspace_id,
      similarity: Number(r.similarity),
      chunkIndex: r.chunk_index,
      metadata: r.metadata,
      chunkType: r.chunk_type || "text",
      ocrText: r.ocr_text || undefined,
      caption: r.caption || undefined,
      imageSummary: r.image_summary || undefined,
      imageUrl: r.image_url || undefined,
    })),
    metrics: {
      retrievedCount: finalChunks.length,
      discardedCount: discardedByThreshold + discardedByDedup,
      averageSimilarity: Math.round(averageSimilarity * 1000) / 1000,
      retrievalLatencyMs,
      threshold: minSimilarity,
      searchMode: "vector",
    },
  };
}

// ============================================================
// Hybrid Search (Vector + BM25 + RRF)
// ============================================================

export interface HybridSearchOptions {
  queryText: string;
  queryEmbedding: number[];
  workspaceId: string;
  topK?: number;
  vectorWeight?: number;
  bm25Weight?: number;
  /** Minimum similarity threshold for filtering results */
  minSimilarity?: number;
}

/**
 * Hybrid search using pgvector similarity + PostgreSQL full-text search (BM25)
 * combined via Reciprocal Rank Fusion (RRF).
 *
 * Falls back to vector-only search if hybrid_search function is not available.
 */
export async function hybridSearch(
  options: HybridSearchOptions
): Promise<RetrievalResult> {
  const {
    queryText,
    queryEmbedding,
    workspaceId,
    topK = 20,
    vectorWeight = 0.6,
    bm25Weight = 0.4,
    minSimilarity = 0,
  } = options;

  const embeddingStr = `[${queryEmbedding.join(",")}]`;
  const start = performance.now();

  try {
    const rawResults: Array<{
      id: string;
      content: string;
      document_id: string;
      document_title: string;
      workspace_id: string;
      chunk_type: string;
      similarity: number;
      bm25_score: number;
      rrf_score: number;
      chunk_index: number;
      metadata: Record<string, unknown>;
      ocr_text: string | null;
      caption: string | null;
      image_summary: string | null;
      image_url: string | null;
    }> = await prisma.$queryRaw`
      SELECT
        hs.id, hs.content, hs.document_id,
        d.title as document_title, d.workspace_id,
        hs.chunk_type, hs.similarity, hs.bm25_score, hs.rrf_score,
        dc.chunk_index, dc.metadata,
        hs.ocr_text, hs.caption, hs.image_summary, hs.image_url
      FROM hybrid_search(
        ${queryText}::text,
        ${embeddingStr}::vector(1536),
        ${workspaceId}::text,
        ${Math.max(topK * 4, 50)}::integer,
        ${vectorWeight}::double precision,
        ${bm25Weight}::double precision
      ) hs
      JOIN document_chunks dc ON dc.id = hs.id
      JOIN documents d ON d.id = hs.document_id
      ORDER BY hs.rrf_score DESC
      LIMIT ${topK}
    `;

    const retrievalLatencyMs = Math.round(performance.now() - start);

    // Apply similarity threshold filtering
    const thresholded = minSimilarity > 0
      ? rawResults.filter((r) => Number(r.similarity) >= minSimilarity)
      : rawResults;
    const discardedByThreshold = rawResults.length - thresholded.length;

    const bm25HitCount = thresholded.filter((r) => r.bm25_score > 0).length;
    const avgRRF = thresholded.length > 0
      ? thresholded.reduce((s, r) => s + r.rrf_score, 0) / thresholded.length
      : 0;
    const avgSim = thresholded.length > 0
      ? thresholded.reduce((s, r) => s + r.similarity, 0) / thresholded.length
      : 0;

    return {
      chunks: thresholded.map((r) => ({
        id: r.id,
        content: r.content,
        documentId: r.document_id,
        documentTitle: r.document_title || "Untitled",
        workspaceId: r.workspace_id,
        similarity: Number(r.similarity),
        chunkIndex: r.chunk_index,
        metadata: r.metadata,
        chunkType: r.chunk_type || "text",
        ocrText: r.ocr_text || undefined,
        caption: r.caption || undefined,
        imageSummary: r.image_summary || undefined,
        imageUrl: r.image_url || undefined,
        bm25Score: Number(r.bm25_score),
        rrfScore: Number(r.rrf_score),
      })),
      metrics: {
        retrievedCount: thresholded.length,
        discardedCount: discardedByThreshold,
        averageSimilarity: Math.round(avgSim * 1000) / 1000,
        retrievalLatencyMs,
        threshold: minSimilarity,
        searchMode: "hybrid",
        bm25ResultCount: bm25HitCount,
        avgRRFScore: Math.round(avgRRF * 1_000_000) / 1_000_000,
      },
    };
  } catch (error) {
    // Fallback to vector-only if hybrid_search function is missing
    console.warn(
      "[Vectorstore] Hybrid search failed, falling back to vector-only:",
      error instanceof Error ? error.message : error
    );
    return searchSimilarChunks(queryEmbedding, topK, workspaceId);
  }
}

// ============================================================
// Delete Chunks
// ============================================================

export async function deleteDocumentChunks(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({
    where: { documentId },
  });
}

// ============================================================
// Context Builder
// ============================================================

/**
 * Build context string from multimodal chunks.
 * Formats image chunks with [Image] [OCR] [Caption] tags for the AI model.
 * Falls back to plain text context for non-image chunks.
 */
export function buildMultimodalContext(
  chunks: SimilarChunk[],
  maxTokens: number = 3000
): { context: string; tokensUsed: number; chunksIncluded: number } {
  const CHARS_PER_TOKEN = 4;
  const lines: string[] = [];
  let tokensUsed = 0;
  let chunksIncluded = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let block: string;

    if (chunk.chunkType === "image") {
      const header = `[Document: ${chunk.documentTitle}]\n[Chunk: ${chunk.chunkIndex + 1}] [Similarity: ${Math.round(chunk.similarity * 100)}%] [Type: Image]`;
      const parts: string[] = [header];

      if (chunk.caption) {
        parts.push(`[Caption] ${chunk.caption}`);
      }
      if (chunk.imageSummary) {
        parts.push(`[Summary] ${chunk.imageSummary}`);
      }
      if (chunk.ocrText) {
        parts.push(`[OCR Text] ${chunk.ocrText}`);
      }

      // Add hybrid scores if available
      if (chunk.rrfScore !== undefined) {
        parts.push(`[RRF: ${chunk.rrfScore.toFixed(4)}]`);
      }

      block = parts.join("\n");
    } else {
      const header = `[Document: ${chunk.documentTitle}]\n[Chunk: ${chunk.chunkIndex + 1}] [Similarity: ${Math.round(chunk.similarity * 100)}%]`;
      const extras: string[] = [];
      if (chunk.rrfScore !== undefined) {
        extras.push(`[RRF: ${chunk.rrfScore.toFixed(4)}]`);
      }
      block = `${header}${extras.length ? " " + extras.join(" ") : ""}\n${chunk.content}`;
    }

    const blockTokens = Math.ceil(block.length / CHARS_PER_TOKEN);
    const separator = i > 0 ? "\n\n" : "";

    if (tokensUsed + Math.ceil(separator.length / CHARS_PER_TOKEN) + blockTokens > maxTokens) {
      break;
    }

    lines.push((i > 0 ? separator : "") + block);
    tokensUsed += Math.ceil(separator.length / CHARS_PER_TOKEN) + blockTokens;
    chunksIncluded++;
  }

  return {
    context: lines.join(""),
    tokensUsed,
    chunksIncluded,
  };
}

// ============================================================
// Attributed Context Builder (with source citations)
// ============================================================

export interface Citation {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  similarity: number;
  contentPreview: string;
}

/**
 * Build context with rich source attribution.
 * Returns both formatted context string and structured citations list.
 *
 * Enhancements over buildMultimodalContext:
 * - Confidence indicators per chunk
 * - Structured citations array for API response
 * - Content preview (first 200 chars) for each citation
 */
export function buildAttributedContext(
  chunks: SimilarChunk[],
  maxTokens: number = 3000
): {
  context: string;
  tokensUsed: number;
  chunksIncluded: number;
  citations: Citation[];
} {
  const CHARS_PER_TOKEN = 4;
  const lines: string[] = [];
  const citations: Citation[] = [];
  let tokensUsed = 0;
  let chunksIncluded = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const confidenceLabel =
      chunk.similarity >= 0.55 ? "Tinggi" :
      chunk.similarity >= 0.40 ? "Sedang" :
      chunk.similarity >= 0.30 ? "Rendah" : "Sangat Rendah";

    let block: string;

    if (chunk.chunkType === "image") {
      const header = `[Document: ${chunk.documentTitle}]\n[Chunk ${chunk.chunkIndex + 1}] [Relevansi: ${Math.round(chunk.similarity * 100)}% - ${confidenceLabel}] [Tipe: Gambar]`;
      const parts: string[] = [header];

      if (chunk.caption) parts.push(`[Caption] ${chunk.caption}`);
      if (chunk.imageSummary) parts.push(`[Summary] ${chunk.imageSummary}`);
      if (chunk.ocrText) parts.push(`[OCR Text] ${chunk.ocrText}`);
      if (chunk.rrfScore !== undefined) parts.push(`[RRF: ${chunk.rrfScore.toFixed(4)}]`);

      block = parts.join("\n");
    } else {
      const header = `[Document: ${chunk.documentTitle}]\n[Chunk ${chunk.chunkIndex + 1}] [Relevansi: ${Math.round(chunk.similarity * 100)}% - ${confidenceLabel}]`;
      const extras: string[] = [];
      if (chunk.rrfScore !== undefined) {
        extras.push(`[RRF: ${chunk.rrfScore.toFixed(4)}]`);
      }
      block = `${header}${extras.length ? " " + extras.join(" ") : ""}\n${chunk.content}`;
    }

    const blockTokens = Math.ceil(block.length / CHARS_PER_TOKEN);
    const separator = i > 0 ? "\n\n" : "";

    if (tokensUsed + Math.ceil(separator.length / CHARS_PER_TOKEN) + blockTokens > maxTokens) {
      break;
    }

    lines.push((i > 0 ? separator : "") + block);
    tokensUsed += Math.ceil(separator.length / CHARS_PER_TOKEN) + blockTokens;
    chunksIncluded++;

    // Build citation entry
    citations.push({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      chunkIndex: chunk.chunkIndex,
      similarity: Math.round(chunk.similarity * 1000) / 1000,
      contentPreview: chunk.content.substring(0, 200),
    });
  }

  return {
    context: lines.join(""),
    tokensUsed,
    chunksIncluded,
    citations,
  };
}
