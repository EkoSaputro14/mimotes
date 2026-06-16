import { getAIProvider, getEmbeddingModel, getProviderType } from "@/lib/ai-provider";
import { getEmbeddingProvider } from "@/lib/rag/embedding-providers/factory";

// ============================================================
// Constants
// ============================================================

const EMBEDDING_DIMENSION = 1536;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;
const MAX_BATCH_SIZE = 100;

// ============================================================
// Embedding Quality Tracking
// ============================================================

export interface EmbeddingStats {
  totalRequests: number;
  apiSuccesses: number;
  apiFailures: number;
  localFallbacks: number;
  dimensionMismatches: number;
  retriesAttempted: number;
  lastFallbackReason: string | null;
}

const stats: EmbeddingStats = {
  totalRequests: 0,
  apiSuccesses: 0,
  apiFailures: 0,
  localFallbacks: 0,
  dimensionMismatches: 0,
  retriesAttempted: 0,
  lastFallbackReason: null,
};

/**
 * Get current embedding statistics for monitoring/debugging.
 */
export function getEmbeddingStats(): Readonly<EmbeddingStats> {
  return { ...stats };
}

/**
 * Reset embedding statistics (useful for testing).
 */
export function resetEmbeddingStats(): void {
  stats.totalRequests = 0;
  stats.apiSuccesses = 0;
  stats.apiFailures = 0;
  stats.localFallbacks = 0;
  stats.dimensionMismatches = 0;
  stats.retriesAttempted = 0;
  stats.lastFallbackReason = null;
}

// ============================================================
// Local Embedding (Feature Hashing Fallback)
// ============================================================

/**
 * Simple hash function for feature hashing (hashing trick).
 * Produces a deterministic integer from a string input.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generate a local embedding using feature hashing (hashing trick).
 * This is a fallback when the AI provider doesn't support embeddings (e.g., Mimo Pro).
 * It produces deterministic 1536-dimensional vectors using character trigram hashing.
 *
 * While not as accurate as neural embeddings, this enables the RAG pipeline to work
 * end-to-end for testing and development.
 */
function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSION).fill(0);

  // Normalize text: lowercase, remove extra whitespace
  const normalized = text.toLowerCase().replace(/\s+/g, " ").trim();

  // Use character trigrams for better coverage
  const trigrams: string[] = [];
  for (let i = 0; i <= normalized.length - 3; i++) {
    trigrams.push(normalized.substring(i, i + 3));
  }

  // Also use word tokens for stronger signal
  const words = normalized.split(/\s+/);
  const tokens = [...trigrams, ...words];

  // Feature hashing: map each token to a position in the vector
  for (const token of tokens) {
    const h = hashString(token);
    const index = h % EMBEDDING_DIMENSION;
    // Use a second hash for sign (+1 or -1) to reduce collision bias
    const sign = hashString(token + "_sign") % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  // L2 normalize the vector
  let norm = 0;
  for (const val of vector) {
    norm += val * val;
  }
  norm = Math.sqrt(norm);

  if (norm > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= norm;
    }
  }

  return vector;
}

// ============================================================
// Provider Detection
// ============================================================

/**
 * Check if the current provider supports API-based embeddings.
 * Providers like Mimo Pro don't have an embeddings endpoint.
 */
async function providerSupportsEmbeddings(): Promise<boolean> {
  const provider = await getProviderType();
  // Mimo Pro doesn't support embeddings
  if (provider === "mimo") return false;
  return true;
}

/**
 * Get a human-readable name for the current embedding source.
 */
export async function getEmbeddingSource(): Promise<"api" | "local"> {
  if (await providerSupportsEmbeddings()) {
    return "api";
  }
  return "local";
}

// ============================================================
// Retry Logic
// ============================================================

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call an API function with exponential backoff retry.
 * Returns the result on success, or throws after all retries exhausted.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        stats.retriesAttempted++;
        console.warn(
          `[Embedder] ${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`,
          lastError.message
        );
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

// ============================================================
// Single Embedding
// ============================================================

/**
 * Generate embedding for a single text.
 * Tries API first with retry, falls back to local embedding if the provider doesn't support it.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  stats.totalRequests++;

  if (await providerSupportsEmbeddings()) {
    try {
      const embedding = await withRetry(async () => {
        const openai = await getAIProvider();
        const model = await getEmbeddingModel();

        const response = await openai.embeddings.create({
          model,
          input: text,
        });

        return response.data[0].embedding;
      }, "Single embedding API call");

      // Dimension validation
      if (embedding.length !== EMBEDDING_DIMENSION) {
        stats.dimensionMismatches++;
        stats.localFallbacks++;
        stats.lastFallbackReason = `Dimension mismatch: got ${embedding.length}, expected ${EMBEDDING_DIMENSION}`;
        console.error(
          `[Embedder] API returned ${embedding.length}-dim embedding, expected ${EMBEDDING_DIMENSION}. Falling back to local.`
        );
        return generateLocalEmbedding(text);
      }

      stats.apiSuccesses++;
      return embedding;
    } catch (error) {
      stats.apiFailures++;
      stats.localFallbacks++;
      stats.lastFallbackReason = `API failure after ${MAX_RETRIES + 1} attempts: ${error instanceof Error ? error.message : error}`;
      console.warn(
        "[Embedder] API embedding failed after retries, falling back to local embedding:",
        error instanceof Error ? error.message : error
      );
    }
  } else {
    stats.lastFallbackReason = "Provider does not support embeddings";
  }

  // Fallback: local feature-hashing embedding
  stats.localFallbacks++;
  if (!stats.lastFallbackReason) {
    stats.lastFallbackReason = "Provider does not support embeddings";
  }
  console.warn(
    "[Embedder] Using LOCAL embedding fallback (feature hashing). " +
    "Retrieval quality will be significantly degraded. " +
    "Configure an embedding-capable AI provider (OpenAI, Ollama, etc.) for production use."
  );
  return generateLocalEmbedding(text);
}

// ============================================================
// Batch Embedding
// ============================================================

/**
 * Generate embeddings for multiple texts.
 * Tries API first (batch with size limits), falls back to local embedding if the provider doesn't support it.
 */
export async function generateEmbeddings(
  texts: string[]
): Promise<number[][]> {
  stats.totalRequests += texts.length;

  if (await providerSupportsEmbeddings()) {
    try {
      // Process in batches to avoid API limits
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
        const batch = texts.slice(i, i + MAX_BATCH_SIZE);

        const batchEmbeddings = await withRetry(async () => {
          const openai = await getAIProvider();
          const model = await getEmbeddingModel();

          const response = await openai.embeddings.create({
            model,
            input: batch,
          });

          return response.data.map((item) => item.embedding);
        }, `Batch embedding API call (batch ${Math.floor(i / MAX_BATCH_SIZE) + 1})`);

        // Dimension validation on first embedding of first batch
        if (batchEmbeddings.length > 0 && batchEmbeddings[0].length !== EMBEDDING_DIMENSION) {
          stats.dimensionMismatches += texts.length;
          stats.localFallbacks += texts.length;
          stats.lastFallbackReason = `Dimension mismatch: got ${batchEmbeddings[0].length}, expected ${EMBEDDING_DIMENSION}`;
          console.error(
            `[Embedder] API returned ${batchEmbeddings[0].length}-dim embeddings, expected ${EMBEDDING_DIMENSION}. Falling back to local.`
          );
          return texts.map((text) => generateLocalEmbedding(text));
        }

        allEmbeddings.push(...batchEmbeddings);
      }

      stats.apiSuccesses += texts.length;
      return allEmbeddings;
    } catch (error) {
      stats.apiFailures += texts.length;
      stats.localFallbacks += texts.length;
      stats.lastFallbackReason = `API failure after retries: ${error instanceof Error ? error.message : error}`;
      console.warn(
        "[Embedder] API embedding failed after retries, falling back to local embedding:",
        error instanceof Error ? error.message : error
      );
    }
  } else {
    stats.lastFallbackReason = "Provider does not support embeddings";
  }

  // Fallback: local feature-hashing embedding for each text
  stats.localFallbacks += texts.length;
  if (!stats.lastFallbackReason) {
    stats.lastFallbackReason = "Provider does not support embeddings";
  }
  console.warn(
    "[Embedder] Using LOCAL embedding fallback (feature hashing) for batch of " +
    `${texts.length} text(s). Retrieval quality will be significantly degraded.`
  );
  return texts.map((text) => generateLocalEmbedding(text));
}

// ============================================================
// Provider System Integration (new)
// ============================================================

/**
 * Get the embedding provider for a workspace.
 * This is the new entry point for the provider abstraction layer.
 *
 * Usage:
 *   const provider = await getWorkspaceEmbeddingProvider(workspaceId);
 *   const embedding = await provider.embed("some text");
 */
export async function getWorkspaceEmbeddingProvider(workspaceId: string) {
  return getEmbeddingProvider(workspaceId);
}
