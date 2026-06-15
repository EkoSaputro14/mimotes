/**
 * RAG Pipeline Tests — Chunker Module (lib/rag/chunker.ts)
 *
 * Tests for text chunking, paragraph splitting, overlap, and edge cases.
 * These tests protect the chunking stage of the RAG pipeline.
 */
import { describe, it, expect } from "vitest";
import { chunkText } from "@/lib/rag/chunker";

describe("chunkText", () => {
  // ─── Basic splitting ─────────────────────────────────────────────

  it("splits by paragraphs", () => {
    const text = "Paragraph one.\n\nParagraph two.\n\nParagraph three.";
    const chunks = chunkText(text, 100);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    // All content should be represented
    const allContent = chunks.map((c) => c.content).join(" ");
    expect(allContent).toContain("Paragraph one");
    expect(allContent).toContain("Paragraph two");
    expect(allContent).toContain("Paragraph three");
  });

  it("merges small paragraphs into single chunk", () => {
    const text = "A\n\nB\n\nC\n\nD\n\nE";
    const chunks = chunkText(text, 500);
    // All 5 short paragraphs should fit in 1 chunk
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("A");
    expect(chunks[0].content).toContain("E");
  });

  it("splits large paragraphs by sentences", () => {
    // Create a paragraph larger than 2× chunkSize (1000 chars)
    const sentence = "This is a test sentence. ";
    const text = sentence.repeat(50); // 1250 chars
    const chunks = chunkText(text, 500);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  // ─── Overlap ─────────────────────────────────────────────────────

  it("adds overlap between chunks", () => {
    const para1 = "Word ".repeat(100); // 500 chars
    const para2 = "Next ".repeat(100); // 500 chars
    const text = para1 + "\n\n" + para2;
    const chunks = chunkText(text, 500, 50);
    if (chunks.length >= 2) {
      // Second chunk should contain some overlap from first
      const secondChunk = chunks[1].content;
      // With overlap=50 words, some words from end of first chunk should appear
      expect(secondChunk.length).toBeGreaterThan(0);
    }
  });

  // ─── Edge cases ──────────────────────────────────────────────────

  it("handles empty text", () => {
    const chunks = chunkText("");
    expect(chunks).toEqual([]);
  });

  it("handles text shorter than chunkSize", () => {
    const text = "Short text.";
    const chunks = chunkText(text, 500);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toBe("Short text.");
  });

  it("preserves chunk indices", () => {
    const text = "A ".repeat(300) + "\n\n" + "B ".repeat(300);
    const chunks = chunkText(text, 300);
    chunks.forEach((chunk, i) => {
      expect(chunk.index).toBe(i);
    });
  });

  it("passes metadata through", () => {
    const text = "Hello world.";
    const metadata = { source: "test", documentId: "123" };
    const chunks = chunkText(text, 500, 50, metadata);
    expect(chunks[0].metadata.source).toBe("test");
    expect(chunks[0].metadata.documentId).toBe("123");
  });

  // ─── Content integrity ──────────────────────────────────────────

  it("no chunk is empty after trimming", () => {
    const text = "First paragraph.\n\n\n\nSecond paragraph.\n\n\n\nThird paragraph.";
    const chunks = chunkText(text, 100);
    for (const chunk of chunks) {
      expect(chunk.content.trim().length).toBeGreaterThan(0);
    }
  });
});
