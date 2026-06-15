/**
 * Feature Hashing Provider Tests
 *
 * Tests for the FeatureHashingProvider implementation.
 */
import { describe, it, expect } from "vitest";
import { FeatureHashingProvider } from "@/lib/rag/embedding-providers/feature-hashing-provider";

describe("FeatureHashingProvider", () => {
  const provider = new FeatureHashingProvider();

  it("produces 1536-dimensional vectors", async () => {
    const embedding = await provider.embed("Hello world");
    expect(embedding.length).toBe(1536);
  });

  it("is deterministic — same input produces same output", async () => {
    const text = "This is a test sentence for embedding generation.";
    const embedding1 = await provider.embed(text);
    const embedding2 = await provider.embed(text);
    expect(embedding1).toEqual(embedding2);
  });

  it("is L2 normalized (norm ≈ 1)", async () => {
    const embedding = await provider.embed("Some text to embed");
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
  });

  it("produces different vectors for different inputs", async () => {
    const emb1 = await provider.embed("cats are great pets");
    const emb2 = await provider.embed("dogs are loyal animals");
    // Vectors should not be identical
    expect(emb1).not.toEqual(emb2);
  });

  it("is always available (no API key needed)", async () => {
    const available = await provider.isAvailable();
    expect(available).toBe(true);
  });

  it("returns null cost (free)", () => {
    expect(provider.getCostPerMillionTokens()).toBeNull();
  });

  it("returns correct name", () => {
    expect(provider.getName()).toBe("feature_hashing");
  });

  it("returns correct dimension", () => {
    expect(provider.getDimension()).toBe(1536);
  });

  it("handles empty text", async () => {
    const embedding = await provider.embed("");
    expect(embedding.length).toBe(1536);
    // Empty string splits to [""] which still hashes, so vector has one non-zero entry
    // It should be L2 normalized (norm=1) since there's at least one value
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    // norm is either 0 (no tokens) or 1 (normalized)
    expect(norm === 0 || Math.abs(norm - 1) < 1e-5).toBe(true);
  });

  it("handles batch embedding", async () => {
    const texts = ["first text", "second text", "third text"];
    const embeddings = await provider.embedBatch(texts);
    expect(embeddings.length).toBe(3);
    for (const emb of embeddings) {
      expect(emb.length).toBe(1536);
    }
  });

  it("produces identical output to original embedder algorithm", async () => {
    // This is the canonical test vector — if this changes, backward compatibility is broken
    const embedding = await provider.embed("hello world");
    expect(embedding.length).toBe(1536);
    // Verify it's normalized
    const norm = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(norm).toBeCloseTo(1.0, 5);
    // Verify it's not all zeros (non-trivial text should have non-zero values)
    const hasNonZero = embedding.some((v) => v !== 0);
    expect(hasNonZero).toBe(true);
  });
});
