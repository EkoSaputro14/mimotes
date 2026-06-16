import { getAIProvider, getAIModel } from "@/lib/ai-provider";
import { generateEmbedding } from "./embedder";
import {
  searchSimilarChunks,
  hybridSearch,
  isHybridSearchEnabled,
  buildAttributedContext,
  type SimilarChunk,
  type RetrievalMetrics,
} from "./vectorstore";

// Token estimation: ~4 chars per token (conservative for mixed languages)
const CHARS_PER_TOKEN = 4;
const DEFAULT_MAX_CONTEXT_TOKENS = 3000;

// ============================================================
// Confidence Classification & Refusal
// ============================================================

export type ConfidenceLevel = "high" | "medium" | "low" | "refuse";

/**
 * Classify confidence level based on max similarity score.
 *
 * Thresholds tuned for feature-hashing embeddings (range 0.15–0.50):
 *   - high:   >= 0.55  (strong match — answer confidently)
 *   - medium: 0.40–0.54 (moderate match — answer with caveat)
 *   - low:    0.30–0.39 (weak match — partial answer + disclaimer)
 *   - refuse: < 0.30    (no meaningful match — refuse to answer)
 */
export function classifyConfidence(maxSimilarity: number): ConfidenceLevel {
  if (maxSimilarity >= 0.55) return "high";
  if (maxSimilarity >= 0.40) return "medium";
  if (maxSimilarity >= 0.30) return "low";
  return "refuse";
}

/**
 * Decide whether to refuse answering based on retrieval results.
 */
export function shouldRefuse(
  chunks: Array<{ similarity: number }>
): { refuse: boolean; reason?: string; confidence: ConfidenceLevel } {
  if (chunks.length === 0) {
    return { refuse: true, reason: "no_results", confidence: "refuse" };
  }

  const maxSimilarity = Math.max(...chunks.map((c) => c.similarity));
  const confidence = classifyConfidence(maxSimilarity);

  if (confidence === "refuse") {
    return { refuse: true, reason: "low_confidence", confidence };
  }

  return { refuse: false, confidence };
}

/**
 * Get a response prefix based on confidence level.
 * Empty string for high confidence (no caveat needed).
 */
export function getConfidencePrefix(level: ConfidenceLevel): string {
  switch (level) {
    case "high":
      return "";
    case "medium":
      return "Berdasarkan dokumen yang tersedia, ";
    case "low":
      return "Informasi terbatas ditemukan dalam dokumen. Harap dicatat bahwa jawaban ini mungkin tidak lengkap dan memiliki keterbatasan: ";
    case "refuse":
      return "Maaf, saya tidak menemukan informasi yang cukup relevan dalam dokumen yang tersedia untuk menjawab pertanyaan Anda dengan percaya diri. Silakan coba pertanyaan lain atau upload dokumen yang lebih relevan.";
  }
}

export interface RAGResponse {
  answer: string;
  sources: Array<{
    documentId: string;
    documentTitle: string;
    content: string;
    similarity: number;
    chunkIndex: number;
    metadata: Record<string, unknown>;
  }>;
  metrics: RetrievalMetrics;
  /** Confidence level of the response */
  confidence?: ConfidenceLevel;
  /** Whether the response was refused */
  refused?: boolean;
  /** Reason for refusal */
  refusalReason?: string;
}

/**
 * Unified retrieval: uses hybrid search when enabled, vector-only otherwise.
 */
async function retrieveChunks(
  question: string,
  topK: number,
  workspaceId: string,
  minSimilarity: number
): Promise<{ chunks: SimilarChunk[]; metrics: RetrievalMetrics }> {
  const queryEmbedding = await generateEmbedding(question);
  const useHybrid = await isHybridSearchEnabled();

  if (useHybrid) {
    return hybridSearch({
      queryText: question,
      queryEmbedding,
      workspaceId,
      topK,
      minSimilarity,
    });
  }

  return searchSimilarChunks(queryEmbedding, topK, workspaceId, minSimilarity);
}

/**
 * Generate a RAG response using the AI provider.
 */
export async function generateRAGResponse(
  question: string,
  topK: number = 5,
  workspaceId: string,
  minSimilarity: number = 0.30,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
): Promise<RAGResponse> {
  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, workspaceId, minSimilarity
  );

  // Confidence-based refusal check
  const refusal = shouldRefuse(similarChunks);

  if (refusal.refuse) {
    return {
      answer: getConfidencePrefix(refusal.confidence),
      sources: [],
      metrics,
      confidence: refusal.confidence,
      refused: true,
      refusalReason: refusal.reason,
    };
  }

  // Build attributed context with source citations
  const { context } = buildAttributedContext(similarChunks, maxContextTokens);

  // Get confidence prefix for caveat
  const prefix = getConfidencePrefix(refusal.confidence);

  // Build system prompt — strict grounding to prevent hallucination
  const systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.

ATURAN KETAT:
1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.
2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."
3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.
4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.
5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.

Konteks dari dokumen:
${context}`;

  // Generate response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.3,
    max_tokens: 1000,
  });

  const rawAnswer =
    completion.choices[0]?.message?.content ||
    "Maaf, terjadi kesalahan saat menghasilkan jawaban.";

  // Prepend confidence prefix if not high confidence
  const answer = prefix ? `${prefix}${rawAnswer}` : rawAnswer;

  return {
    answer,
    sources: similarChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
    })),
    metrics,
    confidence: refusal.confidence,
    refused: false,
  };
}

/**
 * Generate a streaming RAG response using the AI provider.
 */
export async function streamRAGResponse(
  question: string,
  topK: number = 5,
  workspaceId: string,
  minSimilarity: number = 0.30,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS
) {
  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, workspaceId, minSimilarity
  );

  // Confidence-based refusal check
  const refusal = shouldRefuse(similarChunks);

  if (refusal.refuse) {
    return {
      stream: null,
      sources: [],
      noContext: true,
      metrics,
      confidence: refusal.confidence,
      refused: true,
      refusalReason: refusal.reason,
      refusalMessage: getConfidencePrefix(refusal.confidence),
    };
  }

  // Build attributed context with source citations
  const { context } = buildAttributedContext(similarChunks, maxContextTokens);

  // Get confidence prefix for caveat
  const prefix = getConfidencePrefix(refusal.confidence);

  // Build system prompt — strict grounding to prevent hallucination
  const systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.

ATURAN KETAT:
1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.
2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."
3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.
4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.
5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.

Konteks dari dokumen:
${context}`;

  // Generate streaming response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question },
    ],
    temperature: 0.3,
    max_tokens: 1000,
    stream: true,
  });

  return {
    stream,
    sources: similarChunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      content: chunk.content,
      similarity: chunk.similarity,
      chunkIndex: chunk.chunkIndex,
      metadata: chunk.metadata,
    })),
    noContext: false,
    metrics,
    confidence: refusal.confidence,
    refused: false,
    confidencePrefix: prefix,
  };
}
