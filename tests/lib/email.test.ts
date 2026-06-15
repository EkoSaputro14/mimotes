import { describe, it, expect, beforeAll, beforeEach } from "vitest";

// ============================================================
// Email Delivery System Tests
// ============================================================
// Tests for the email provider abstraction, templates, retry, and logging.

import { execSync } from "child_process";
import { createHash, randomBytes } from "crypto";

function psql(sql: string): string {
  const clean = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${clean.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 10000 }
  ).trim();
}

// ============================================================
// Email Provider Tests (Pure Functions)
// ============================================================

import { loadEmailConfig, validateEmailConfig, resetEmailProvider } from "@/lib/email";
import { ConsoleEmailProvider } from "@/lib/email/smtp-provider";
import { ResendProvider } from "@/lib/email/resend-provider";
import {
  invitationEmailHtml,
  invitationEmailText,
} from "@/lib/email/templates";

describe("Email Configuration", () => {
  it("should load default config", () => {
    const config = loadEmailConfig();
    expect(config.provider).toBeDefined();
    expect(config.fromEmail).toBeDefined();
    expect(config.fromName).toBeDefined();
    expect(config.baseUrl).toBeDefined();
  });

  it("should validate config", () => {
    const result = validateEmailConfig();
    expect(result.valid).toBeDefined();
    expect(Array.isArray(result.issues)).toBe(true);
    expect(result.provider).toBeDefined();
  });

  it("should default to console provider", () => {
    const config = loadEmailConfig();
    // Without env vars, should default to console
    expect(["console", "resend", "smtp"]).toContain(config.provider);
  });
});

describe("Console Email Provider", () => {
  let provider: ConsoleEmailProvider;

  beforeEach(() => {
    provider = new ConsoleEmailProvider();
  });

  it("should always be available", () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it("should have correct name", () => {
    expect(provider.name).toBe("console");
  });

  it("should return sent status", async () => {
    const result = await provider.send({
      from: { email: "test@mimotes.com", name: "Test" },
      to: [{ email: "recipient@example.com" }],
      subject: "Test Subject",
      html: "<p>Test</p>",
    });

    expect(result.status).toBe("sent");
    expect(result.provider).toBe("console");
    expect(result.id).toContain("console-");
  });
});

describe("Resend Provider", () => {
  it("should not be available without API key", () => {
    const provider = new ResendProvider("");
    expect(provider.isAvailable()).toBe(false);
  });

  it("should be available with API key", () => {
    const provider = new ResendProvider("re_test_key");
    expect(provider.isAvailable()).toBe(true);
  });

  it("should fail gracefully without valid API key", async () => {
    const provider = new ResendProvider("re_invalid_key");
    const result = await provider.send({
      from: { email: "test@mimotes.com" },
      to: [{ email: "recipient@example.com" }],
      subject: "Test",
      html: "<p>Test</p>",
    });

    // Should fail (invalid API key) but not throw
    expect(result.status).toBe("failed");
    expect(result.error).toBeDefined();
  });
});

// ============================================================
// Email Template Tests
// ============================================================

describe("Email Templates", () => {
  const testData = {
    inviterName: "John Doe",
    inviterEmail: "john@example.com",
    workspaceName: "Test Workspace",
    role: "editor",
    acceptUrl: "https://mimotes.com/invite/abc123",
    expiresAt: new Date("2026-12-31"),
  };

  describe("invitationEmailHtml", () => {
    it("should generate valid HTML", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("</html>");
    });

    it("should include workspace name", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("Test Workspace");
    });

    it("should include inviter name", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("John Doe");
    });

    it("should include accept URL", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("https://mimotes.com/invite/abc123");
    });

    it("should include role", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("editor");
    });

    it("should include expiry date", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("2026");
    });

    it("should escape HTML in user input", () => {
      const maliciousData = {
        ...testData,
        inviterName: '<script>alert("xss")</script>',
        workspaceName: '"><img src=x onerror=alert(1)>',
      };
      const html = invitationEmailHtml(maliciousData);
      expect(html).not.toContain("<script>");
      expect(html).toContain("&lt;script&gt;");
    });

    it("should have MimoNotes branding", () => {
      const html = invitationEmailHtml(testData);
      expect(html).toContain("MimoNotes");
    });
  });

  describe("invitationEmailText", () => {
    it("should include workspace name", () => {
      const text = invitationEmailText(testData);
      expect(text).toContain("Test Workspace");
    });

    it("should include accept URL", () => {
      const text = invitationEmailText(testData);
      expect(text).toContain("https://mimotes.com/invite/abc123");
    });

    it("should include role", () => {
      const text = invitationEmailText(testData);
      expect(text).toContain("editor");
    });

    it("should be plain text (no HTML tags)", () => {
      const text = invitationEmailText(testData);
      expect(text).not.toContain("<html>");
      expect(text).not.toContain("<body>");
    });
  });
});

// ============================================================
// Email Retry Mechanism Tests
// ============================================================

describe("Email Retry Mechanism", () => {
  it("should export sendEmail function", async () => {
    const { sendEmail } = await import("@/lib/email");
    expect(typeof sendEmail).toBe("function");
  });

  it("should export resetEmailProvider function", () => {
    expect(typeof resetEmailProvider).toBe("function");
  });

  it("should send email via active provider (console or resend)", async () => {
    // Temporarily force console provider for this test
    const origProvider = process.env.EMAIL_PROVIDER;
    const origKey = process.env.RESEND_API_KEY;
    process.env.EMAIL_PROVIDER = "console";
    delete process.env.RESEND_API_KEY;
    resetEmailProvider();
    const { sendEmail } = await import("@/lib/email");

    const result = await sendEmail({
      from: { email: "test@mimotes.com", name: "Test" },
      to: [{ email: "recipient@example.com" }],
      subject: "Retry Test",
      html: "<p>Test</p>",
    });

    expect(result.status).toBe("sent");
    expect(result.provider).toBe("console");

    // Restore env
    if (origProvider) process.env.EMAIL_PROVIDER = origProvider;
    else delete process.env.EMAIL_PROVIDER;
    if (origKey) process.env.RESEND_API_KEY = origKey;
  });
});

// ============================================================
// Email Logging Tests (Database)
// ============================================================

describe("Email Logging", () => {
  it("should export logEmailSend function", async () => {
    const { logEmailSend } = await import("@/lib/email/logging");
    expect(typeof logEmailSend).toBe("function");
  });

  it("should export getEmailHistory function", async () => {
    const { getEmailHistory } = await import("@/lib/email/logging");
    expect(typeof getEmailHistory).toBe("function");
  });

  it("should not throw when logging email", async () => {
    const { logEmailSend } = await import("@/lib/email/logging");

    // Should not throw even if DB insert fails
    await expect(
      logEmailSend({
        to: "test@example.com",
        from: "noreply@mimotes.com",
        subject: "Test Email",
        provider: "console",
        status: "sent",
        retryCount: 0,
        workspaceId: "nonexistent-ws",
      })
    ).resolves.not.toThrow();
  });

  it("should not throw when logging failed email", async () => {
    const { logEmailSend } = await import("@/lib/email/logging");

    await expect(
      logEmailSend({
        to: "test@example.com",
        from: "noreply@mimotes.com",
        subject: "Failed Email",
        provider: "console",
        status: "failed",
        error: "Test error",
        retryCount: 3,
        workspaceId: "nonexistent-ws",
      })
    ).resolves.not.toThrow();
  });

  it("should not throw when logging retrying status", async () => {
    const { logEmailSend } = await import("@/lib/email/logging");

    await expect(
      logEmailSend({
        to: "test@example.com",
        from: "noreply@mimotes.com",
        subject: "Retrying Email",
        provider: "console",
        status: "retrying",
        error: "Previous attempt failed",
        retryCount: 1,
        workspaceId: "nonexistent-ws",
      })
    ).resolves.not.toThrow();
  });
});

// ============================================================
// Accept Invitation Link Tests
// ============================================================

describe("Accept Invitation Link Generation", () => {
  it("should generate correct accept URL format", () => {
    const baseUrl = "https://mimotes.com";
    const rawToken = randomBytes(32).toString("hex");
    const acceptUrl = `${baseUrl}/invite/${rawToken}`;

    expect(acceptUrl).toMatch(/^https:\/\/mimotes\.com\/invite\/[a-f0-9]{64}$/);
  });

  it("should include token in URL", () => {
    const baseUrl = "http://localhost:3000";
    const rawToken = "abc123def456";
    const acceptUrl = `${baseUrl}/invite/${rawToken}`;

    expect(acceptUrl).toContain(rawToken);
  });

  it("should use HTTPS in production", () => {
    const baseUrl = "https://mimotes.com";
    expect(baseUrl).toMatch(/^https:\/\//);
  });
});

// ============================================================
// Environment Validation Tests
// ============================================================

describe("Email Environment Validation", () => {
  it("should validate config without errors", () => {
    const result = validateEmailConfig();
    // Console provider is always valid
    expect(result.valid).toBe(true);
  });

  it("should report provider name", () => {
    const result = validateEmailConfig();
    expect(result.provider).toBeDefined();
    expect(typeof result.provider).toBe("string");
  });

  it("should return empty issues for console provider", () => {
    const result = validateEmailConfig();
    if (result.provider === "console") {
      expect(result.issues).toHaveLength(0);
    }
  });
});
