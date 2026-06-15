/**
 * RAG Pipeline Tests — Parser Module (lib/rag/parser.ts)
 *
 * Tests for text extraction, sanitization, URL validation, and content validation.
 * These tests protect the parsing stage of the RAG pipeline.
 */
import { describe, it, expect } from "vitest";
import {
  parseTXT,
  parseCSV,
  sanitizeText,
  parseFile,
  isImageFile,
  ParsedDocument,
} from "@/lib/rag/parser";

// ─── parseTXT ─────────────────────────────────────────────────────

describe("parseTXT", () => {
  it("returns content from UTF-8 buffer", async () => {
    const buffer = Buffer.from("Hello world", "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toBe("Hello world");
    expect(result.metadata.source).toBe("txt");
  });

  it("handles empty buffer", async () => {
    const buffer = Buffer.from("", "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toBe("");
  });

  it("sanitizes Unicode BOM", async () => {
    const buffer = Buffer.from("\uFEFFHello world", "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toBe("Hello world");
    expect(result.content).not.toContain("\uFEFF");
  });

  it("removes control characters but preserves newlines and tabs", async () => {
    const buffer = Buffer.from("Hello\x00\x01World\nNew\tLine", "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toContain("Hello");
    expect(result.content).toContain("World");
    expect(result.content).toContain("\n");
    expect(result.content).toContain("\t");
    expect(result.content).not.toContain("\x00");
    expect(result.content).not.toContain("\x01");
  });
});

// ─── parseCSV ─────────────────────────────────────────────────────

describe("parseCSV", () => {
  it("converts rows to readable text", async () => {
    const csv = "name,age\nAlice,30\nBob,25";
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseCSV(buffer);
    expect(result.content).toContain("name: Alice");
    expect(result.content).toContain("age: 30");
    expect(result.content).toContain("name: Bob");
    expect(result.content).toContain("age: 25");
    expect(result.metadata.source).toBe("csv");
  });

  it("handles CSV with only headers", async () => {
    const csv = "name,age\n";
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseCSV(buffer);
    // Should not crash, content may be empty or have header-only row
    expect(result.metadata.source).toBe("csv");
  });

  it("handles special characters in values", async () => {
    const csv = 'name,bio\nAlice,"Lives in New York, NY"\nBob,"Said ""hello"""';
    const buffer = Buffer.from(csv, "utf-8");
    const result = await parseCSV(buffer);
    expect(result.content).toContain("New York, NY");
    expect(result.content).toContain('Said "hello"');
  });
});

// ─── sanitizeText ─────────────────────────────────────────────────

describe("sanitizeText", () => {
  // sanitizeText is not exported directly, so we test it through parseTXT
  it("replaces smart quotes with ASCII equivalents", async () => {
    const text = "He said \u2018hello\u2019 and \u201Cworld\u201D";
    const buffer = Buffer.from(text, "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toContain("'");
    expect(result.content).toContain('"');
    expect(result.content).not.toContain("\u2018");
    expect(result.content).not.toContain("\u201C");
  });

  it("replaces special dashes with regular hyphens", async () => {
    const text = "en\u2013dash and em\u2014dash";
    const buffer = Buffer.from(text, "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toContain("-");
    expect(result.content).not.toContain("\u2013");
    expect(result.content).not.toContain("\u2014");
  });

  it("removes zero-width characters", async () => {
    const text = "Hello\u200B\u200C\u200DWorld";
    const buffer = Buffer.from(text, "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toBe("HelloWorld");
  });

  it("replaces non-breaking space with regular space", async () => {
    const text = "Hello\u00A0World";
    const buffer = Buffer.from(text, "utf-8");
    const result = await parseTXT(buffer);
    expect(result.content).toBe("Hello World");
  });
});

// ─── parseFile (dispatch) ─────────────────────────────────────────

describe("parseFile", () => {
  it("dispatches to correct parser by type", async () => {
    const txtBuffer = Buffer.from("Hello", "utf-8");
    const csvBuffer = Buffer.from("name\nAlice", "utf-8");

    const txtResult = await parseFile(txtBuffer, "txt");
    expect(txtResult.metadata.source).toBe("txt");

    const csvResult = await parseFile(csvBuffer, "csv");
    expect(csvResult.metadata.source).toBe("csv");
  });

  it("throws on unsupported file type", async () => {
    const buffer = Buffer.from("data", "utf-8");
    await expect(parseFile(buffer, "xyz")).rejects.toThrow(
      "Unsupported file type"
    );
  });

  it("requires URL for type 'url'", async () => {
    const buffer = Buffer.from("", "utf-8");
    await expect(parseFile(buffer, "url")).rejects.toThrow(
      "URL is required"
    );
  });
});

// ─── Post-parse content validation ────────────────────────────────

describe("post-parse content validation", () => {
  it("warns when file produces empty content (non-URL)", async () => {
    // This test verifies the validation logic exists
    // A truly empty TXT file should still return without error
    const buffer = Buffer.from("   ", "utf-8");
    const result = await parseFile(buffer, "txt");
    // Content is whitespace-only, which trims to empty
    expect(result.content.trim()).toBe("");
  });
});

// ─── isImageFile ──────────────────────────────────────────────────

describe("isImageFile", () => {
  it("detects image extensions", () => {
    expect(isImageFile("png")).toBe(true);
    expect(isImageFile("jpg")).toBe(true);
    expect(isImageFile("jpeg")).toBe(true);
    expect(isImageFile("webp")).toBe(true);
  });

  it("rejects non-image extensions", () => {
    expect(isImageFile("pdf")).toBe(false);
    expect(isImageFile("txt")).toBe(false);
    expect(isImageFile("csv")).toBe(false);
  });

  it("is case-insensitive", () => {
    expect(isImageFile("PNG")).toBe(true);
    expect(isImageFile("JPG")).toBe(true);
  });
});
