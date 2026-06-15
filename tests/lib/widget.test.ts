import { describe, it, expect } from "vitest";
import {
  validateWidgetOrigin,
  validateMessageLength,
  generateWidgetKeys,
  buildWidgetCorsHeaders,
} from "@/lib/widget";

// ============================================================
// Widget Origin Validation Tests
// ============================================================

describe("Widget Origin Validation", () => {
  describe("validateWidgetOrigin", () => {
    it("should reject null origin", () => {
      expect(validateWidgetOrigin(null, ["example.com"])).toBe(false);
    });

    it("should reject empty origin", () => {
      expect(validateWidgetOrigin("", ["example.com"])).toBe(false);
    });

    it("should accept exact domain match", () => {
      expect(
        validateWidgetOrigin("https://example.com", ["example.com"])
      ).toBe(true);
    });

    it("should accept subdomain match with wildcard", () => {
      expect(
        validateWidgetOrigin("https://sub.example.com", ["*.example.com"])
      ).toBe(true);
    });

    it("should accept base domain with wildcard", () => {
      expect(
        validateWidgetOrigin("https://example.com", ["*.example.com"])
      ).toBe(true);
    });

    it("should reject non-matching domain", () => {
      expect(
        validateWidgetOrigin("https://evil.com", ["example.com"])
      ).toBe(false);
    });

    it("should reject non-matching subdomain", () => {
      expect(
        validateWidgetOrigin("https://evil.example.com", ["other.com"])
      ).toBe(false);
    });

    it("should reject malformed origin", () => {
      expect(validateWidgetOrigin("not-a-url", ["example.com"])).toBe(false);
    });

    it("should accept when allowedDomains is empty (open widget)", () => {
      expect(validateWidgetOrigin("https://anything.com", [])).toBe(true);
    });

    it("should handle multiple allowed domains", () => {
      const domains = ["example.com", "test.org", "*.demo.io"];
      expect(validateWidgetOrigin("https://example.com", domains)).toBe(true);
      expect(validateWidgetOrigin("https://test.org", domains)).toBe(true);
      expect(validateWidgetOrigin("https://app.demo.io", domains)).toBe(true);
      expect(validateWidgetOrigin("https://evil.com", domains)).toBe(false);
    });

    it("should reject origin with port mismatch", () => {
      // Origin includes port, domain doesn't — should still match hostname
      expect(
        validateWidgetOrigin("https://example.com:3000", ["example.com"])
      ).toBe(true);
    });
  });

  describe("buildWidgetCorsHeaders", () => {
    it("should return specific origin when origin is allowed", () => {
      const headers = buildWidgetCorsHeaders(
        "https://example.com",
        ["example.com"]
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe("https://example.com");
      expect(headers["Access-Control-Allow-Methods"]).toContain("POST");
    });

    it("should return null origin when origin is not allowed", () => {
      const headers = buildWidgetCorsHeaders(
        "https://evil.com",
        ["example.com"]
      );
      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });

    it("should return null origin when no origin header", () => {
      const headers = buildWidgetCorsHeaders(null, ["example.com"]);
      expect(headers["Access-Control-Allow-Origin"]).toBeUndefined();
    });

    it("NEVER return wildcard *", () => {
      const headers = buildWidgetCorsHeaders(
        "https://example.com",
        ["example.com"]
      );
      expect(headers["Access-Control-Allow-Origin"]).not.toBe("*");
    });

    it("should include required CORS headers", () => {
      const headers = buildWidgetCorsHeaders(
        "https://example.com",
        ["example.com"]
      );
      expect(headers["Access-Control-Allow-Methods"]).toBeDefined();
      expect(headers["Access-Control-Allow-Headers"]).toBeDefined();
    });

    it("should work with wildcard domain patterns", () => {
      const headers = buildWidgetCorsHeaders(
        "https://sub.example.com",
        ["*.example.com"]
      );
      expect(headers["Access-Control-Allow-Origin"]).toBe(
        "https://sub.example.com"
      );
    });
  });
});

// ============================================================
// Widget Message Validation Tests
// ============================================================

describe("Widget Message Validation", () => {
  describe("validateMessageLength", () => {
    it("should accept normal message", () => {
      expect(validateMessageLength("Hello, how are you?")).toBe(true);
    });

    it("should accept message at limit", () => {
      expect(validateMessageLength("a".repeat(10000))).toBe(true);
    });

    it("should reject message over limit", () => {
      expect(validateMessageLength("a".repeat(10001))).toBe(false);
    });

    it("should accept empty message", () => {
      expect(validateMessageLength("")).toBe(true);
    });
  });
});

// ============================================================
// Widget Key Generation Tests
// ============================================================

describe("Widget Key Generation", () => {
  it("should generate keys with correct prefixes", () => {
    const { publicKey, secretKey } = generateWidgetKeys();
    expect(publicKey).toMatch(/^pw_pub_/);
    expect(secretKey).toMatch(/^pw_sec_/);
  });

  it("should generate unique keys each time", () => {
    const keys1 = generateWidgetKeys();
    const keys2 = generateWidgetKeys();
    expect(keys1.publicKey).not.toBe(keys2.publicKey);
    expect(keys1.secretKey).not.toBe(keys2.secretKey);
  });

  it("should generate keys of sufficient length", () => {
    const { publicKey, secretKey } = generateWidgetKeys();
    // base64url of 32 bytes = ~43 chars + prefix
    expect(publicKey.length).toBeGreaterThan(40);
    expect(secretKey.length).toBeGreaterThan(40);
  });
});
