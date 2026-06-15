/**
 * Embedding Provider Abstraction Layer
 *
 * Re-exports all provider types, implementations, and factory.
 */

export type { EmbeddingProvider, EmbeddingProviderConfig } from "./types";
export { FeatureHashingProvider } from "./feature-hashing-provider";
export { OpenAIProvider } from "./openai-provider";
export { adaptDimension } from "./dimension-adapter";
export {
  getEmbeddingProvider,
  invalidateEmbeddingProviderCache,
} from "./factory";
