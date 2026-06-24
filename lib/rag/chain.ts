import { getAIProvider, getAIModel } from "@/lib/ai-provider";
import { generateEmbedding, getEmbeddingSource } from "./embedder";
import {
  searchSimilarChunks,
  hybridSearch,
  isHybridSearchEnabled,
  buildAttributedContext,
  type SimilarChunk,
  type RetrievalMetrics,
} from "./vectorstore";
import { buildSystemPrompt, type PromptContext } from "@/lib/prompts/templates";

// Re-export PromptContext for consumers
export type { PromptContext } from "@/lib/prompts/templates";

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
 * Thresholds dynamically adjusted for embedding type:
 *   - API embeddings (OpenAI, etc.): range 0.50–0.95
 *   - Local feature-hashing: range 0.10–0.40 (much lower precision)
 */
export function classifyConfidence(maxSimilarity: number, useLocalEmbedding: boolean = false): ConfidenceLevel {
  if (useLocalEmbedding) {
    // Feature-hashing thresholds (lower range)
    if (maxSimilarity >= 0.35) return "high";
    if (maxSimilarity >= 0.25) return "medium";
    if (maxSimilarity >= 0.12) return "low";
    return "refuse";
  }
  // API embedding thresholds (original)
  if (maxSimilarity >= 0.55) return "high";
  if (maxSimilarity >= 0.40) return "medium";
  if (maxSimilarity >= 0.30) return "low";
  return "refuse";
}

/**
 * Decide whether to refuse answering based on retrieval results.
 */
export function shouldRefuse(
  chunks: Array<{ similarity: number }>,
  useLocalEmbedding: boolean = false
): { refuse: boolean; reason?: string; confidence: ConfidenceLevel } {
  if (chunks.length === 0) {
    return { refuse: true, reason: "no_results", confidence: "refuse" };
  }

  const maxSimilarity = Math.max(...chunks.map((c) => c.similarity));
  const confidence = classifyConfidence(maxSimilarity, useLocalEmbedding);

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
 *
 * @param promptContext - Optional. When provided, uses the prompt template system
 *   for mode-aware responses (CS mode, Sales mode, etc).
 *   When omitted, falls back to legacy KB-mode hardcoded prompt (backward compatible).
 */
export async function generateRAGResponse(
  question: string,
  topK: number = 5,
  workspaceId: string,
  minSimilarity?: number,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS,
  promptContext?: PromptContext
): Promise<RAGResponse> {
  // Auto-detect embedding source and adjust threshold
  const embeddingSource = await getEmbeddingSource();
  const useLocal = embeddingSource === "local";
  const effectiveMinSimilarity = minSimilarity ?? (useLocal ? 0.08 : 0.30);

  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, workspaceId, effectiveMinSimilarity
  );

  // Confidence-based refusal check (with local embedding awareness)
  const refusal = shouldRefuse(similarChunks, useLocal);

  // ── CS/Sales mode: never refuse, always give helpful response ──
  const mode = promptContext?.mode || "knowledge_base";
  const isConversational = mode === "customer_service" || mode === "sales_agent";

  if (refusal.refuse && !isConversational) {
    // KB mode: strict refusal (backward compatible)
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

  // Build system prompt
  let systemPrompt: string;
  if (promptContext) {
    // Use template system with full context
    systemPrompt = buildSystemPrompt({
      ...promptContext,
      knowledgeContext: context || "(Tidak ada konteks dokumen yang relevan)",
    });
  } else {
    // Legacy KB mode (backward compatible)
    const prefix = getConfidencePrefix(refusal.confidence);
    systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.

ATURAN KETAT:
1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.
2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."
3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.
4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.
5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.

Konteks dari dokumen:
${context}`;
  }

  // Generate response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  // Build messages array with conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history if available
  if (promptContext?.conversationHistory) {
    const lines = promptContext.conversationHistory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ")) {
        messages.push({ role: "user", content: line.substring(6) });
      } else if (line.startsWith("Assistant: ")) {
        messages.push({ role: "assistant", content: line.substring(11) });
      }
    }
  }

  messages.push({ role: "user", content: question });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
    max_tokens: 1000,
  });

  const rawAnswer =
    completion.choices[0]?.message?.content ||
    "Maaf, terjadi kesalahan saat menghasilkan jawaban.";

  // For KB mode, prepend confidence prefix; for CS/Sales, no prefix
  const answer = !isConversational && refusal.confidence !== "high"
    ? `${getConfidencePrefix(refusal.confidence)}${rawAnswer}`
    : rawAnswer;

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
  minSimilarity?: number,
  maxContextTokens: number = DEFAULT_MAX_CONTEXT_TOKENS,
  promptContext?: PromptContext
) {
  // Auto-detect embedding source and adjust threshold
  const embeddingSource = await getEmbeddingSource();
  const useLocal = embeddingSource === "local";
  const effectiveMinSimilarity = minSimilarity ?? (useLocal ? 0.08 : 0.30);

  const { chunks: similarChunks, metrics } = await retrieveChunks(
    question, topK, workspaceId, effectiveMinSimilarity
  );

  // Confidence-based refusal check (with local embedding awareness)
  const refusal = shouldRefuse(similarChunks, useLocal);
  // ── CS/Sales mode: never refuse, always give helpful response ──
  const mode = promptContext?.mode || "knowledge_base";
  const isConversational = mode === "customer_service" || mode === "sales_agent";

  if (refusal.refuse && !isConversational) {
    // KB mode: strict refusal (backward compatible)
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
  // Build system prompt
  let systemPrompt: string;
  if (promptContext) {
    // Use template system with full context
    systemPrompt = buildSystemPrompt({
      ...promptContext,
      knowledgeContext: context || "(Tidak ada konteks dokumen yang relevan)",
    });
  } else {
    // Legacy KB mode (backward compatible)
    systemPrompt = `Anda adalah asisten AI yang HANYA menjawab berdasarkan konteks dokumen yang diberikan.\n\nATURAN KETAT:\n1. HANYA gunakan informasi yang ada dalam konteks dokumen di bawah ini. JANGAN gunakan pengetahuan umum Anda.\n2. Jika informasi yang diminta TIDAK ADA dalam konteks, jawab: "Informasi tersebut tidak tersedia dalam dokumen yang saya miliki."\n3. JANGAN mengarang, menduga, atau mengisi kekosongan informasi dari pengetahuan umum.\n4. SELALU kutip sumber dengan format [Document: nama_dokumen] untuk setiap fakta yang Anda sebutkan.\n5. Jika hanya sebagian informasi yang tersedia, sampaikan HANYA bagian yang tersedia dan sebutkan keterbatasannya.\n\nKonteks dari dokumen:\n${context}`;
  }

  // Generate streaming response using AI provider
  const openai = await getAIProvider();
  const model = await getAIModel();

  // Build messages array with conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add conversation history if available
  if (promptContext?.conversationHistory) {
    const lines = promptContext.conversationHistory.split("\n").filter(Boolean);
    for (const line of lines) {
      if (line.startsWith("User: ")) {
        messages.push({ role: "user", content: line.substring(6) });
      } else if (line.startsWith("Assistant: ")) {
        messages.push({ role: "assistant", content: line.substring(11) });
      }
    }
  }

  // Add current question
  messages.push({ role: "user", content: question });

  const stream = await openai.chat.completions.create({
    model,
    messages,
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
    confidencePrefix: !isConversational ? prefix : "",
  };
}
