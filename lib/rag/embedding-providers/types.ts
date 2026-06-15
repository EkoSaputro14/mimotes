/**
 * Embedding Provider Abstraction Layer — Type Definitions
 *
 * Defines the interface contract for all embedding providers.
 */

export interface EmbeddingProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  dimension?: number;
}

export interface EmbeddingProvider {
  /** Generate embedding for a single text */
  embed(text: string): Promise<number[]>;
  /** Generate embeddings for multiple texts */
  embedBatch(texts: string[]): Promise<number[][]>;
  /** Get the native dimension of this provider's embeddings */
  getDimension(): number;
  /** Check if the provider is available (e.g., API key present) */
  isAvailable(): Promise<boolean>;
  /** Human-readable provider name */
  getName(): string;
  /** Cost per million tokens, or null if free */
  getCostPerMillionTokens(): number | null;
}
