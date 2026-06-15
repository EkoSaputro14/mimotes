/**
 * RAG Benchmark Dataset Validation
 *
 * Validates the benchmark dataset structure and completeness.
 */
import { describe, it, expect } from "vitest";
import benchmarkData from "../../fixtures/rag-benchmark.json";

describe("RAG benchmark dataset", () => {
  it("has at least 20 queries", () => {
    expect(benchmarkData.queries.length).toBeGreaterThanOrEqual(20);
  });

  it("has valid category distribution", () => {
    const categories = benchmarkData.queries.map((q) => q.category);
    expect(categories).toContain("factual");
    expect(categories).toContain("conceptual");
    expect(categories).toContain("negative");
  });

  it("has valid difficulty distribution", () => {
    const difficulties = benchmarkData.queries.map((q) => q.difficulty);
    expect(difficulties).toContain("easy");
    expect(difficulties).toContain("medium");
    expect(difficulties).toContain("hard");
  });

  it("has negative queries for false positive testing", () => {
    const negatives = benchmarkData.queries.filter((q) => !q.shouldRetrieve);
    expect(negatives.length).toBeGreaterThanOrEqual(3);
  });

  it("has unique query IDs", () => {
    const ids = benchmarkData.queries.map((q) => q.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("has non-empty queries", () => {
    for (const q of benchmarkData.queries) {
      expect(q.query.trim().length).toBeGreaterThan(0);
    }
  });

  it("has required fields for each query", () => {
    for (const q of benchmarkData.queries) {
      expect(q.id).toBeDefined();
      expect(q.query).toBeDefined();
      expect(q.category).toBeDefined();
      expect(q.difficulty).toBeDefined();
      expect(q.shouldRetrieve).toBeDefined();
      expect(typeof q.shouldRetrieve).toBe("boolean");
    }
  });

  it("has both positive and negative queries", () => {
    const positive = benchmarkData.queries.filter((q) => q.shouldRetrieve);
    const negative = benchmarkData.queries.filter((q) => !q.shouldRetrieve);
    expect(positive.length).toBeGreaterThan(0);
    expect(negative.length).toBeGreaterThan(0);
  });
});
