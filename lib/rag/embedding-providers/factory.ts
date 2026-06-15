/**
 * Embedding Provider Factory
 *
 * Resolves the appropriate embedding provider for a workspace based on settings.
 *
 * Resolution chain:
 *   workspace `embedding_provider` → workspace `ai_*` → global → env → default (feature_hashing)
 *
 * Returns provider wrapped with dimension adapter if needed.
 * Caches provider instances per workspace.
 */

import type { EmbeddingProvider, EmbeddingProviderConfig } from "./types";
import { FeatureHashingProvider } from "./feature-hashing-provider";
import { OpenAIProvider } from "./openai-provider";
import { getWorkspaceSetting } from "@/lib/settings";

type ProviderType = "feature_hashing" | "openai";

const providerCache = new Map<string, EmbeddingProvider>();

/**
 * Parse a provider type string into a known ProviderType.
 * Falls back to "feature_hashing" for unknown types.
 */
function parseProviderType(value: string): ProviderType {
  const normalized = value.toLowerCase().trim();
  if (normalized === "openai") return "openai";
  // Everything else defaults to feature_hashing
  return "feature_hashing";
}

/**
 * Create a provider instance from type and config.
 */
function createProvider(
  type: ProviderType,
  config: EmbeddingProviderConfig
): EmbeddingProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider(config);
    case "feature_hashing":
    default:
      return new FeatureHashingProvider(config);
  }
}

/**
 * Resolve the embedding provider configuration for a workspace.
 *
 * Resolution chain:
 * 1. `embedding_provider` workspace setting → determines provider type
 * 2. `embedding_api_key` workspace setting → API key for the provider
 * 3. `ai_api_key` workspace setting → fallback API key
 * 4. `OPENAI_API_KEY` env variable → env fallback
 * 5. Default: feature_hashing (free, no key needed)
 */
async function resolveProviderConfig(
  workspaceId: string
): Promise<{ type: ProviderType; config: EmbeddingProviderConfig }> {
  // Determine provider type
  const embeddingProvider = await getWorkspaceSetting(
    workspaceId,
    "embedding_provider",
    "EMBEDDING_PROVIDER",
    ""
  );

  const type = embeddingProvider
    ? parseProviderType(embeddingProvider)
    : "feature_hashing";

  // Resolve API key: embedding-specific → ai provider key → env
  let apiKey = await getWorkspaceSetting(
    workspaceId,
    "embedding_api_key",
    "EMBEDDING_API_KEY",
    ""
  );

  if (!apiKey) {
    apiKey = await getWorkspaceSetting(
      workspaceId,
      "ai_api_key",
      "AI_API_KEY",
      ""
    );
  }

  if (!apiKey) {
    apiKey = process.env.OPENAI_API_KEY || "";
  }

  // Resolve base URL
  const baseUrl = await getWorkspaceSetting(
    workspaceId,
    "embedding_base_url",
    "EMBEDDING_BASE_URL",
    ""
  );

  // Resolve model
  const model = await getWorkspaceSetting(
    workspaceId,
    "embedding_model",
    "EMBEDDING_MODEL",
    ""
  );

  // Resolve dimension
  const dimensionStr = await getWorkspaceSetting(
    workspaceId,
    "embedding_dimension",
    "EMBEDDING_DIMENSION",
    ""
  );
  const dimension = dimensionStr ? parseInt(dimensionStr, 10) : undefined;

  return {
    type,
    config: {
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      model: model || undefined,
      dimension,
    },
  };
}

/**
 * Get the embedding provider for a workspace.
 *
 * Caches provider instances per workspace. Call `invalidateProviderCache()`
 * to force re-creation.
 *
 * @param workspaceId - The workspace to resolve the provider for
 * @returns An EmbeddingProvider instance
 */
export async function getEmbeddingProvider(
  workspaceId: string
): Promise<EmbeddingProvider> {
  const cached = providerCache.get(workspaceId);
  if (cached) return cached;

  let provider: EmbeddingProvider;

  try {
    const { type, config } = await resolveProviderConfig(workspaceId);
    provider = createProvider(type, config);
  } catch (error) {
    // On any resolution error, fall back to feature hashing
    console.warn(
      `[EmbeddingProviderFactory] Failed to resolve provider for workspace ${workspaceId}, falling back to feature_hashing:`,
      error instanceof Error ? error.message : error
    );
    provider = new FeatureHashingProvider();
  }

  providerCache.set(workspaceId, provider);
  return provider;
}

/**
 * Invalidate the provider cache for a specific workspace or all workspaces.
 */
export function invalidateEmbeddingProviderCache(workspaceId?: string): void {
  if (workspaceId) {
    providerCache.delete(workspaceId);
  } else {
    providerCache.clear();
  }
}
