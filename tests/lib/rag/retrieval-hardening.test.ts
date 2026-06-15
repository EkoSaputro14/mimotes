import { describe, it, expect } from "vitest";
import {
  classifyConfidence,
  shouldRefuse,
  getConfidencePrefix,
} from "@/lib/rag/chain";
import { buildAttributedContext } from "@/lib/rag/vectorstore";

// ============================================================
// Tests for confidence-based refusal mechanism
// ============================================================

describe("RAG Confidence & Refusal", () => {
  describe("ConfidenceLevel classification", () => {
    it("should return 'high' for similarity >= 0.55", () => {
      expect(classifyConfidence(0.55)).toBe("high");
      expect(classifyConfidence(0.70)).toBe("high");
      expect(classifyConfidence(0.95)).toBe("high");
    });

    it("should return 'medium' for similarity 0.40-0.54", () => {
      expect(classifyConfidence(0.40)).toBe("medium");
      expect(classifyConfidence(0.45)).toBe("medium");
      expect(classifyConfidence(0.54)).toBe("medium");
    });

    it("should return 'low' for similarity 0.30-0.39", () => {
      expect(classifyConfidence(0.30)).toBe("low");
      expect(classifyConfidence(0.35)).toBe("low");
      expect(classifyConfidence(0.39)).toBe("low");
    });

    it("should return 'refuse' for similarity < 0.30", () => {
      expect(classifyConfidence(0.29)).toBe("refuse");
      expect(classifyConfidence(0.10)).toBe("refuse");
      expect(classifyConfidence(0)).toBe("refuse");
    });
  });

  describe("Refusal decision", () => {
    it("should refuse when no chunks returned", () => {
      const result = shouldRefuse([]);
      expect(result.refuse).toBe(true);
      expect(result.reason).toBe("no_results");
    });

    it("should refuse when max similarity < 0.30", () => {
      const result = shouldRefuse([
        { similarity: 0.25 },
        { similarity: 0.20 },
      ]);
      expect(result.refuse).toBe(true);
      expect(result.reason).toBe("low_confidence");
    });

    it("should NOT refuse when max similarity >= 0.30", () => {
      const result = shouldRefuse([
        { similarity: 0.35 },
        { similarity: 0.20 },
      ]);
      expect(result.refuse).toBe(false);
    });

    it("should use max similarity from all chunks", () => {
      const result = shouldRefuse([
        { similarity: 0.10 },
        { similarity: 0.45 },
        { similarity: 0.20 },
      ]);
      expect(result.refuse).toBe(false);
      expect(result.confidence).toBe("medium");
    });
  });

  describe("Response prefix based on confidence", () => {
    it("should return empty string for high confidence", () => {
      expect(getConfidencePrefix("high")).toBe("");
    });

    it("should return caveat for medium confidence", () => {
      const prefix = getConfidencePrefix("medium");
      expect(prefix).toContain("dokumen yang tersedia");
    });

    it("should return disclaimer for low confidence", () => {
      const prefix = getConfidencePrefix("low");
      expect(prefix).toContain("keterbatasan");
    });

    it("should return refusal message for refuse", () => {
      const prefix = getConfidencePrefix("refuse");
      expect(prefix).toContain("tidak menemukan");
    });
  });
});

// ============================================================
// Tests for source attribution in context builder
// ============================================================

describe("Source Attribution in Context Builder", () => {
  const sampleChunks = [
    {
      id: "chunk-1",
      content: "PostgreSQL is a relational database.",
      documentId: "doc-1",
      documentTitle: "Database Guide",
      workspaceId: "ws-1",
      similarity: 0.85,
      chunkIndex: 2,
      metadata: {},
    },
    {
      id: "chunk-2",
      content: "pgvector enables vector similarity search.",
      documentId: "doc-2",
      documentTitle: "Vector Search Manual",
      workspaceId: "ws-1",
      similarity: 0.72,
      chunkIndex: 0,
      metadata: {},
    },
  ];

  it("should include document title in context", () => {
    const result = buildAttributedContext(sampleChunks, 3000);
    expect(result.context).toContain("Database Guide");
    expect(result.context).toContain("Vector Search Manual");
  });

  it("should include chunk position", () => {
    const result = buildAttributedContext(sampleChunks, 3000);
    expect(result.context).toContain("Chunk 3"); // chunkIndex 2 → display 3
    expect(result.context).toContain("Chunk 1"); // chunkIndex 0 → display 1
  });

  it("should include similarity percentage", () => {
    const result = buildAttributedContext(sampleChunks, 3000);
    expect(result.context).toContain("85%");
    expect(result.context).toContain("72%");
  });

  it("should include confidence indicator", () => {
    const result = buildAttributedContext(sampleChunks, 3000);
    // High confidence chunks should have a confidence marker
    expect(result.context).toContain("[Relevansi:");
  });

  it("should format source citations list", () => {
    const result = buildAttributedContext(sampleChunks, 3000);
    expect(result.citations).toBeDefined();
    expect(result.citations).toHaveLength(2);
    expect(result.citations[0]).toMatchObject({
      documentTitle: "Database Guide",
      chunkIndex: 2,
      similarity: 0.85,
    });
  });

  it("should respect token budget", () => {
    const result = buildAttributedContext(sampleChunks, 50); // very small budget
    expect(result.chunksIncluded).toBeLessThan(2);
  });

  it("should handle empty chunks", () => {
    const result = buildAttributedContext([], 3000);
    expect(result.context).toBe("");
    expect(result.citations).toHaveLength(0);
    expect(result.chunksIncluded).toBe(0);
  });
});
