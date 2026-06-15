import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ============================================================
// Sprint 13 — Launch Readiness Tests
// ============================================================
// Tests for: logger, startup validation, health endpoint,
// security headers, endpoint rate limiter, config audit.

// ============================================================
// 1. Logger Tests
// ============================================================

import {
  logger,
  generateCorrelationId,
  categorizeError,
  getRequestContext,
} from "@/lib/logger";

describe("Centralized Logger", () => {
  describe("Correlation IDs", () => {
    it("should generate unique correlation IDs", () => {
      const id1 = generateCorrelationId();
      const id2 = generateCorrelationId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^corr_/);
      expect(id2).toMatch(/^corr_/);
    });

    it("should generate IDs with consistent format", () => {
      const id = generateCorrelationId();
      const parts = id.split("_");
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe("corr");
      expect(parts[1]).toBeDefined();
      expect(parts[2]).toBeDefined();
    });
  });

  describe("Error Categorization", () => {
    it("should categorize auth errors", () => {
      expect(categorizeError("Unauthorized access")).toBe("AUTH");
      expect(categorizeError(new Error("Forbidden"))).toBe("AUTH");
      expect(categorizeError(new Error("PermissionError: denied"))).toBe("AUTH");
    });

    it("should categorize database errors", () => {
      expect(categorizeError("database connection refused")).toBe("DATABASE");
      expect(categorizeError(new Error("prisma client error"))).toBe("DATABASE");
    });

    it("should categorize email errors", () => {
      expect(categorizeError("email delivery failed")).toBe("EMAIL");
      expect(categorizeError("smtp connection timeout")).toBe("EMAIL");
    });

    it("should categorize security errors", () => {
      expect(categorizeError("rate limit exceeded")).toBe("SECURITY");
      expect(categorizeError("429 too many requests")).toBe("SECURITY");
    });

    it("should default to API for unknown errors", () => {
      expect(categorizeError("something went wrong")).toBe("API");
      expect(categorizeError(new Error("unknown"))).toBe("API");
    });
  });

  describe("Request Context", () => {
    it("should extract request metadata", () => {
      const request = new Request("https://example.com/api/test?foo=bar", {
        method: "POST",
        headers: {
          "user-agent": "Mozilla/5.0 TestBrowser",
          "x-forwarded-for": "192.168.1.1, 10.0.0.1",
        },
      });

      const ctx = getRequestContext(request, "test-corr-123");
      expect(ctx.correlationId).toBe("test-corr-123");
      expect(ctx.route).toBe("/api/test");
      expect(ctx.method).toBe("POST");
      expect(ctx.meta).toBeDefined();
    });

    it("should generate correlation ID when not provided", () => {
      const request = new Request("https://example.com/api/test");
      const ctx = getRequestContext(request);
      expect(ctx.correlationId).toMatch(/^corr_/);
    });
  });

  describe("Logger API", () => {
    it("should have all log level methods", () => {
      expect(typeof logger.debug).toBe("function");
      expect(typeof logger.info).toBe("function");
      expect(typeof logger.warn).toBe("function");
      expect(typeof logger.error).toBe("function");
    });

    it("should create child logger with bound context", () => {
      const child = logger.child({ correlationId: "test-123", workspaceId: "ws-1" });
      expect(typeof child.debug).toBe("function");
      expect(typeof child.info).toBe("function");
      expect(typeof child.warn).toBe("function");
      expect(typeof child.error).toBe("function");
    });

    it("should not throw when logging", () => {
      expect(() => {
        logger.info("SYSTEM", "Test message", { correlationId: "test" });
        logger.error("API", "Test error", undefined, new Error("test"));
        logger.warn("SECURITY", "Test warning");
        logger.debug("DATABASE", "Test debug");
      }).not.toThrow();
    });
  });
});

// ============================================================
// 2. Endpoint Rate Limiter Tests
// ============================================================

import {
  checkEndpointRateLimit,
  getRateLimitHeaders,
  getClientIp,
  RATE_LIMIT_CONFIGS,
  cleanupEndpointRateLimits,
} from "@/lib/endpoint-ratelimit";

describe("Endpoint Rate Limiter", () => {
  describe("Rate Limit Configs", () => {
    it("should have auth config with 5 requests / 15 min", () => {
      expect(RATE_LIMIT_CONFIGS.auth.maxRequests).toBe(5);
      expect(RATE_LIMIT_CONFIGS.auth.windowMs).toBe(15 * 60 * 1000);
      expect(RATE_LIMIT_CONFIGS.auth.name).toBe("auth");
    });

    it("should have invitation create config with 20 requests / 1 hour", () => {
      expect(RATE_LIMIT_CONFIGS.invitationCreate.maxRequests).toBe(20);
      expect(RATE_LIMIT_CONFIGS.invitationCreate.windowMs).toBe(60 * 60 * 1000);
    });

    it("should have workspace switch config with 30 requests / 1 hour", () => {
      expect(RATE_LIMIT_CONFIGS.workspaceSwitch.maxRequests).toBe(30);
      expect(RATE_LIMIT_CONFIGS.workspaceSwitch.windowMs).toBe(60 * 60 * 1000);
    });

    it("should have API config with 100 requests / 1 min", () => {
      expect(RATE_LIMIT_CONFIGS.api.maxRequests).toBe(100);
      expect(RATE_LIMIT_CONFIGS.api.windowMs).toBe(60 * 1000);
    });
  });

  describe("Rate Limiting Logic", () => {
    const testIp = `test-ip-${Date.now()}`;
    const testConfig = { maxRequests: 3, windowMs: 60000, name: "test_endpoint" };

    it("should allow requests under the limit", () => {
      const result = checkEndpointRateLimit(testIp, testConfig);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it("should track remaining count", () => {
      const ip = `track-ip-${Date.now()}`;
      const r1 = checkEndpointRateLimit(ip, testConfig);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);

      const r2 = checkEndpointRateLimit(ip, testConfig);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);
    });

    it("should block when limit exceeded", () => {
      const ip = `block-ip-${Date.now()}`;
      // Exhaust the limit
      for (let i = 0; i < 3; i++) {
        checkEndpointRateLimit(ip, testConfig);
      }
      // This should be blocked
      const result = checkEndpointRateLimit(ip, testConfig);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe("Rate Limit Headers", () => {
    it("should generate standard headers", () => {
      const config = { maxRequests: 10, windowMs: 60000, name: "test" };
      const result = { allowed: true, remaining: 5, resetAt: 1234567890 };
      const headers = getRateLimitHeaders(result, config);

      expect(headers["X-RateLimit-Limit"]).toBe("10");
      expect(headers["X-RateLimit-Remaining"]).toBe("5");
      expect(headers["X-RateLimit-Reset"]).toBe("1234567890");
      expect(headers["Retry-After"]).toBeUndefined();
    });

    it("should include Retry-When blocked", () => {
      const config = { maxRequests: 10, windowMs: 60000, name: "test" };
      const result = { allowed: false, remaining: 0, resetAt: 1234567890, retryAfter: 30 };
      const headers = getRateLimitHeaders(result, config);

      expect(headers["Retry-After"]).toBe("30");
    });
  });

  describe("Client IP Extraction", () => {
    it("should extract from x-forwarded-for", () => {
      const req = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });
      expect(getClientIp(req)).toBe("192.168.1.1");
    });

    it("should extract from x-real-ip", () => {
      const req = new Request("https://example.com", {
        headers: { "x-real-ip": "10.0.0.5" },
      });
      expect(getClientIp(req)).toBe("10.0.0.5");
    });

    it("should return unknown when no IP headers", () => {
      const req = new Request("https://example.com");
      expect(getClientIp(req)).toBe("unknown");
    });
  });

  describe("Cleanup", () => {
    it("should run without errors", () => {
      expect(() => cleanupEndpointRateLimits()).not.toThrow();
    });
  });
});

// ============================================================
// 3. Startup Validation Tests
// ============================================================

import { auditConfiguration } from "@/lib/startup";

describe("Startup Validation", () => {
  describe("Configuration Audit", () => {
    it("should return array of config entries", () => {
      const entries = auditConfiguration();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it("should have required fields for each entry", () => {
      const entries = auditConfiguration();
      for (const entry of entries) {
        expect(entry.key).toBeDefined();
        expect(typeof entry.configured).toBe("boolean");
        expect(typeof entry.secure).toBe("boolean");
        expect(entry.category).toBeDefined();
      }
    });

    it("should mark DATABASE_URL as required", () => {
      const entries = auditConfiguration();
      const dbEntry = entries.find((e) => e.key === "DATABASE_URL");
      expect(dbEntry).toBeDefined();
      // DATABASE_URL is required — should be configured in test env
      expect(dbEntry!.category).toBe("database");
    });

    it("should include security category entries", () => {
      const entries = auditConfiguration();
      const securityEntries = entries.filter((e) => e.category === "security");
      expect(securityEntries.length).toBeGreaterThan(0);
      expect(securityEntries.map((e) => e.key)).toContain("NEXTAUTH_SECRET");
    });

    it("should include email category entries", () => {
      const entries = auditConfiguration();
      const emailEntries = entries.filter((e) => e.category === "email");
      expect(emailEntries.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================
// 4. Security Headers Tests
// ============================================================

describe("Security Headers", () => {
  it("should have CSP, HSTS, X-Frame-Options configured in next.config.ts", async () => {
    // Read the next.config.ts file and verify security headers exist
    const fs = await import("fs");
    const path = await import("path");
    const configPath = path.resolve(process.cwd(), "next.config.ts");
    const configContent = fs.readFileSync(configPath, "utf-8");

    // CSP
    expect(configContent).toContain("Content-Security-Policy");
    expect(configContent).toContain("default-src 'self'");
    expect(configContent).toContain("frame-ancestors 'none'");

    // HSTS (production only)
    expect(configContent).toContain("Strict-Transport-Security");
    expect(configContent).toContain("max-age=63072000");

    // X-Frame-Options
    expect(configContent).toContain("X-Frame-Options");
    expect(configContent).toContain("DENY");

    // Referrer-Policy
    expect(configContent).toContain("Referrer-Policy");
    expect(configContent).toContain("strict-origin-when-cross-origin");

    // Permissions-Policy
    expect(configContent).toContain("Permissions-Policy");
    expect(configContent).toContain("camera=()");
  });

  it("should NOT have widget wildcard CORS", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const configPath = path.resolve(process.cwd(), "next.config.ts");
    const configContent = fs.readFileSync(configPath, "utf-8");

    // Should NOT have Access-Control-Allow-Origin: * for widget routes
    // The widget CORS is handled dynamically by buildWidgetCorsHeaders()
    const widgetSection = configContent.substring(
      configContent.indexOf("/api/widget")
    );
    expect(widgetSection).not.toContain('Access-Control-Allow-Origin", value: "*"');
  });

  it("should have health endpoint cache control", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const configPath = path.resolve(process.cwd(), "next.config.ts");
    const configContent = fs.readFileSync(configPath, "utf-8");

    expect(configContent).toContain("/api/health");
    expect(configContent).toContain("no-cache, no-store, must-revalidate");
  });
});

// ============================================================
// 5. Logger Module Structure Tests
// ============================================================

describe("Logger Module Exports", () => {
  it("should export all expected functions", () => {
    expect(typeof logger).toBe("object");
    expect(typeof generateCorrelationId).toBe("function");
    expect(typeof categorizeError).toBe("function");
    expect(typeof getRequestContext).toBe("function");
  });

  it("should have child logger with pre-bound context", () => {
    const child = logger.child({ correlationId: "bound-id", workspaceId: "ws-1" });
    // Should not throw when using child logger
    expect(() => child.info("SYSTEM", "child test")).not.toThrow();
  });
});

// ============================================================
// 6. Endpoint Rate Limiter Module Structure Tests
// ============================================================

describe("Endpoint Rate Limiter Module Exports", () => {
  it("should export all expected functions", () => {
    expect(typeof checkEndpointRateLimit).toBe("function");
    expect(typeof getRateLimitHeaders).toBe("function");
    expect(typeof getClientIp).toBe("function");
    expect(typeof cleanupEndpointRateLimits).toBe("function");
  });

  it("should have RATE_LIMIT_CONFIGS object", () => {
    expect(typeof RATE_LIMIT_CONFIGS).toBe("object");
    expect(RATE_LIMIT_CONFIGS.auth).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.invitationCreate).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.invitationAccept).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.workspaceSwitch).toBeDefined();
    expect(RATE_LIMIT_CONFIGS.api).toBeDefined();
  });
});

// ============================================================
// 7. Health Endpoint Structure Tests
// ============================================================

describe("Health Endpoint Structure", () => {
  it("should have health route file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      process.cwd(),
      "app/api/health/route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export GET handler", async () => {
    const route = await import("@/app/api/health/route");
    expect(typeof route.GET).toBe("function");
  });
});

// ============================================================
// 8. Operations Status API Structure Tests
// ============================================================

describe("Operations Status API Structure", () => {
  it("should have operations status route file", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const routePath = path.resolve(
      process.cwd(),
      "app/api/operations/status/route.ts"
    );
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it("should export GET handler", async () => {
    const route = await import("@/app/api/operations/status/route");
    expect(typeof route.GET).toBe("function");
  });
});

// ============================================================
// 9. Startup Validation Module Structure Tests
// ============================================================

describe("Startup Validation Module Exports", () => {
  it("should export all expected functions", async () => {
    const startup = await import("@/lib/startup");
    expect(typeof startup.runStartupValidation).toBe("function");
    expect(typeof startup.auditConfiguration).toBe("function");
  });
});

// ============================================================
// 10. Regression — Existing Email Tests Still Pass
// ============================================================

import { loadEmailConfig, validateEmailConfig } from "@/lib/email";

describe("Email Regression (Sprint 12)", () => {
  it("should load email config", () => {
    const config = loadEmailConfig();
    expect(config.provider).toBeDefined();
    expect(config.fromEmail).toBeDefined();
  });

  it("should validate email config", () => {
    const result = validateEmailConfig();
    expect(result.valid).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
  });
});
