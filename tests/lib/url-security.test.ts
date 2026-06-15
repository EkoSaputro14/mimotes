/**
 * Security Regression Tests — Sprint 2: SSRF Protection (lib/url-security.ts)
 *
 * These tests protect against regression of the SSRF protection layer
 * implemented in Sprint 2. Any change to url-security.ts must pass all these tests.
 */
import { describe, it, expect } from "vitest";
import {
  validateUrl,
  sanitizeFilename,
} from "@/lib/url-security";

describe("lib/url-security.ts — Sprint 2 Security Regression", () => {
  // ─── validateUrl — protocol validation ────────────────────────────

  describe("validateUrl — protocol validation", () => {
    it("allows public HTTPS URL", async () => {
      const result = await validateUrl("https://example.com/article");
      expect(result.valid).toBe(true);
    });

    it("allows public HTTP URL", async () => {
      const result = await validateUrl("http://example.com/page");
      expect(result.valid).toBe(true);
    });

    it("blocks file:// protocol", async () => {
      const result = await validateUrl("file:///etc/passwd");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("blocks gopher:// protocol", async () => {
      const result = await validateUrl("gopher://example.com");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("blocks ftp:// protocol", async () => {
      const result = await validateUrl("ftp://files.example.com/doc");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("not allowed");
    });

    it("blocks invalid URL format", async () => {
      const result = await validateUrl("not-a-url");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid URL");
    });

    it("blocks empty string", async () => {
      const result = await validateUrl("");
      expect(result.valid).toBe(false);
    });
  });

  // ─── validateUrl — private IP blocking ────────────────────────────

  describe("validateUrl — private IP blocking", () => {
    it("blocks 127.0.0.1 (loopback)", async () => {
      const result = await validateUrl("http://127.0.0.1:8080/admin");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });

    it("blocks 10.x.x.x (RFC 1918)", async () => {
      const result = await validateUrl("http://10.0.0.1/internal");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });

    it("blocks 192.168.x.x (RFC 1918)", async () => {
      const result = await validateUrl("http://192.168.1.1/router");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });

    it("blocks 172.16-31.x.x (RFC 1918)", async () => {
      const result = await validateUrl("http://172.16.0.1/service");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });

    it("blocks 0.0.0.0", async () => {
      const result = await validateUrl("http://0.0.0.0/");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });

    it("blocks 100.64.x.x (CGNAT)", async () => {
      const result = await validateUrl("http://100.64.0.1/");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("private");
    });
  });

  // ─── validateUrl — cloud metadata blocking ────────────────────────

  describe("validateUrl — cloud metadata blocking", () => {
    it("blocks 169.254.169.254 (AWS/GCP/Azure metadata)", async () => {
      const result = await validateUrl(
        "http://169.254.169.254/latest/meta-data/"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("metadata");
    });

    it("blocks metadata.google.internal", async () => {
      const result = await validateUrl(
        "http://metadata.google.internal/computeMetadata/v1/"
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain("metadata");
    });
  });

  // ─── sanitizeFilename ─────────────────────────────────────────────

  describe("sanitizeFilename", () => {
    it("removes path separators (prevents path traversal)", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
    });

    it("removes null bytes", () => {
      expect(sanitizeFilename("file\x00.txt")).toBe("file.txt");
    });

    it("removes special characters", () => {
      expect(sanitizeFilename('file<>:"|?*.txt')).toBe("file.txt");
    });

    it("collapses double dots", () => {
      expect(sanitizeFilename("file..name..txt")).toBe("file.name.txt");
    });

    it("handles normal filename unchanged", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
    });

    it("limits length to 255 characters", () => {
      const long = "a".repeat(300) + ".txt";
      expect(sanitizeFilename(long).length).toBeLessThanOrEqual(255);
    });

    it("returns empty for all-dangerous input", () => {
      expect(sanitizeFilename("/..<>:|?*")).toBe("");
    });

    it("trims dots and spaces from start/end", () => {
      expect(sanitizeFilename("  .file.  ")).toBe("file");
    });
  });
});
