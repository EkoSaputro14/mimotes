/**
 * Feature Hashing Embedding Provider
 *
 * Free, local embedding provider using character trigram + word token feature hashing.
 * This is the default/fallback provider — no API key required.
 *
 * Produces deterministic 1536-dimensional vectors.
 * Quality is significantly lower than neural embeddings but enables
 * the RAG pipeline to work end-to-end for testing and development.
 */

import type { EmbeddingProvider, EmbeddingProviderConfig } from "./types";

const EMBEDDING_DIMENSION = 1536;

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
 * Produces deterministic 1536-dimensional vectors using character trigram hashing.
 *
 * Algorithm MUST be identical to the original in lib/rag/embedder.ts.
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

export class FeatureHashingProvider implements EmbeddingProvider {
  constructor(_config?: EmbeddingProviderConfig) {
    // Config is accepted for interface compatibility but not used
  }

  async embed(text: string): Promise<number[]> {
    return generateLocalEmbedding(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map((text) => generateLocalEmbedding(text));
  }

  getDimension(): number {
    return EMBEDDING_DIMENSION;
  }

  async isAvailable(): Promise<boolean> {
    return true; // Always available — no API key needed
  }

  getName(): string {
    return "feature_hashing";
  }

  getCostPerMillionTokens(): number | null {
    return null; // Free
  }
}
