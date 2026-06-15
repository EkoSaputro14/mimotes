/**
 * Embedding Provider Factory Tests
 *
 * Tests for the provider factory resolution logic.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getEmbeddingProvider,
  invalidateEmbeddingProviderCache,
} from "@/lib/rag/embedding-providers/factory";
import { FeatureHashingProvider } from "@/lib/rag/embedding-providers/feature-hashing-provider";
import { OpenAIProvider } from "@/lib/rag/embedding-providers/openai-provider";

// Mock the settings module
vi.mock("@/lib/settings", () => ({
  getWorkspaceSetting: vi.fn(),
}));

// Mock OpenAI to avoid real API calls
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      embeddings = { create: vi.fn() };
    },
  };
});

import { getWorkspaceSetting } from "@/lib/settings";
const mockGetWorkspaceSetting = vi.mocked(getWorkspaceSetting);

describe("EmbeddingProviderFactory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invalidateEmbeddingProviderCache();
    // Default mock: return empty string for all settings
    mockGetWorkspaceSetting.mockResolvedValue("");
  });

  it("returns FeatureHashingProvider by default", async () => {
    const provider = await getEmbeddingProvider("ws-1");
    expect(provider).toBeInstanceOf(FeatureHashingProvider);
    expect(provider.getName()).toBe("feature_hashing");
  });

  it("returns OpenAIProvider when embedding_provider=openai", async () => {
    mockGetWorkspaceSetting.mockImplementation(
      async (_wsId: string, key: string) => {
        if (key === "embedding_provider") return "openai";
        if (key === "embedding_api_key") return "sk-test-key";
        return "";
      }
    );

    const provider = await getEmbeddingProvider("ws-2");
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.getName()).toBe("openai");
  });

  it("falls back to ai_api_key when embedding_api_key is not set", async () => {
    mockGetWorkspaceSetting.mockImplementation(
      async (_wsId: string, key: string) => {
        if (key === "embedding_provider") return "openai";
        if (key === "ai_api_key") return "sk-from-ai-key";
        return "";
      }
    );

    const provider = await getEmbeddingProvider("ws-3");
    expect(provider).toBeInstanceOf(OpenAIProvider);
    // The provider should be available since ai_api_key was used
    expect(await provider.isAvailable()).toBe(true);
  });

  it("falls back to FeatureHashing on resolution error", async () => {
    mockGetWorkspaceSetting.mockRejectedValue(new Error("DB connection lost"));

    const provider = await getEmbeddingProvider("ws-error");
    expect(provider).toBeInstanceOf(FeatureHashingProvider);
    expect(provider.getName()).toBe("feature_hashing");
  });

  it("caches provider instances per workspace", async () => {
    const provider1 = await getEmbeddingProvider("ws-cached");
    const provider2 = await getEmbeddingProvider("ws-cached");
    expect(provider1).toBe(provider2); // Same reference
  });

  it("different workspaces get different provider instances", async () => {
    const provider1 = await getEmbeddingProvider("ws-a");
    const provider2 = await getEmbeddingProvider("ws-b");
    expect(provider1).not.toBe(provider2); // Different references
  });

  it("invalidateEmbeddingProviderCache clears specific workspace", async () => {
    const provider1 = await getEmbeddingProvider("ws-inval");
    invalidateEmbeddingProviderCache("ws-inval");
    const provider2 = await getEmbeddingProvider("ws-inval");
    expect(provider1).not.toBe(provider2); // New instance after invalidation
  });

  it("invalidateEmbeddingProviderCache clears all when no arg", async () => {
    const provider1 = await getEmbeddingProvider("ws-all-1");
    const provider2 = await getEmbeddingProvider("ws-all-2");
    invalidateEmbeddingProviderCache();
    const provider3 = await getEmbeddingProvider("ws-all-1");
    const provider4 = await getEmbeddingProvider("ws-all-2");
    expect(provider1).not.toBe(provider3);
    expect(provider2).not.toBe(provider4);
  });

  it("unknown provider type falls back to feature_hashing", async () => {
    mockGetWorkspaceSetting.mockImplementation(
      async (_wsId: string, key: string) => {
        if (key === "embedding_provider") return "gemini";
        return "";
      }
    );

    const provider = await getEmbeddingProvider("ws-unknown");
    expect(provider).toBeInstanceOf(FeatureHashingProvider);
  });
});
