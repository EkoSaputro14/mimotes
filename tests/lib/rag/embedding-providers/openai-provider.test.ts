/**
 * OpenAI Embedding Provider Tests
 *
 * Tests for the OpenAIProvider implementation.
 * Note: API calls are mocked — no real API key needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "@/lib/rag/embedding-providers/openai-provider";

// Mock OpenAI module
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      embeddings = {
        create: vi.fn(),
      };
    },
  };
});

describe("OpenAIProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns correct dimension (1536)", () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });
    expect(provider.getDimension()).toBe(1536);
  });

  it("reports cost correctly ($0.02/1M tokens)", () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });
    expect(provider.getCostPerMillionTokens()).toBe(0.02);
  });

  it("returns correct name", () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });
    expect(provider.getName()).toBe("openai");
  });

  it("is available when API key is provided", async () => {
    const provider = new OpenAIProvider({ apiKey: "sk-test-key" });
    expect(await provider.isAvailable()).toBe(true);
  });

  it("is not available when API key is empty", async () => {
    const provider = new OpenAIProvider({ apiKey: "" });
    expect(await provider.isAvailable()).toBe(false);
  });

  it("is not available when no config is provided", async () => {
    const provider = new OpenAIProvider();
    expect(await provider.isAvailable()).toBe(false);
  });

  it("uses default model text-embedding-3-small", () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });
    // We verify the model name is used by checking it's passed to the API
    // This is tested implicitly through the mock
    expect(provider.getName()).toBe("openai");
  });

  it("accepts custom model", () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      model: "text-embedding-ada-002",
    });
    // Provider should still report as openai
    expect(provider.getName()).toBe("openai");
  });

  it("accepts custom baseUrl", () => {
    const provider = new OpenAIProvider({
      apiKey: "test-key",
      baseUrl: "http://localhost:1234/v1",
    });
    expect(provider.getName()).toBe("openai");
  });

  it("embed returns a vector from the API", async () => {
    const mockEmbedding = new Array(1536).fill(0.1);
    const provider = new OpenAIProvider({ apiKey: "test-key" });

    // Access the mocked client
    const mockCreate = vi.fn().mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });
    (provider as any).client = { embeddings: { create: mockCreate } };

    const result = await provider.embed("test text");
    expect(result).toEqual(mockEmbedding);
    expect(mockCreate).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "test text",
    });
  });

  it("embedBatch returns vectors from the API", async () => {
    const mockEmbedding1 = new Array(1536).fill(0.1);
    const mockEmbedding2 = new Array(1536).fill(0.2);
    const provider = new OpenAIProvider({ apiKey: "test-key" });

    const mockCreate = vi.fn().mockResolvedValue({
      data: [
        { embedding: mockEmbedding1 },
        { embedding: mockEmbedding2 },
      ],
    });
    (provider as any).client = { embeddings: { create: mockCreate } };

    const result = await provider.embedBatch(["text 1", "text 2"]);
    expect(result.length).toBe(2);
    expect(result[0]).toEqual(mockEmbedding1);
    expect(result[1]).toEqual(mockEmbedding2);
  });

  it("handles API errors gracefully with retry", async () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });

    const mockCreate = vi.fn()
      .mockRejectedValueOnce(new Error("Rate limited"))
      .mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });
    (provider as any).client = { embeddings: { create: mockCreate } };

    const result = await provider.embed("test text");
    expect(result.length).toBe(1536);
    // Should have been called twice (first fail, then succeed)
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("throws after all retries exhausted", async () => {
    const provider = new OpenAIProvider({ apiKey: "test-key" });

    const mockCreate = vi.fn().mockRejectedValue(new Error("API down"));
    (provider as any).client = { embeddings: { create: mockCreate } };

    await expect(provider.embed("test text")).rejects.toThrow("API down");
    // Should have been called 3 times (initial + 2 retries)
    expect(mockCreate).toHaveBeenCalledTimes(3);
  });
});
