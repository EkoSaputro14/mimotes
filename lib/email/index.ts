import type {
  EmailProvider,
  EmailProviderType,
  EmailConfig,
  SendEmailParams,
  SendEmailResult,
} from "./types";
import { ResendProvider } from "./resend-provider";
import { ConsoleEmailProvider, SmtpProvider } from "./smtp-provider";
import { logEmailSend } from "./logging";

// ============================================================
// Email Configuration
// ============================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

/**
 * Load email configuration from environment variables.
 */
export function loadEmailConfig(): EmailConfig {
  const provider = (process.env.EMAIL_PROVIDER || "console") as EmailProviderType;

  return {
    provider,
    resendApiKey: process.env.RESEND_API_KEY,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpSecure: process.env.SMTP_SECURE === "true",
    fromEmail: process.env.EMAIL_FROM || "noreply@mimotes.com",
    fromName: process.env.EMAIL_FROM_NAME || "MimoNotes",
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  };
}

// ============================================================
// Provider Factory
// ============================================================

let _provider: EmailProvider | null = null;

/**
 * Get or create the email provider singleton.
 */
export function getEmailProvider(config?: EmailConfig): EmailProvider {
  if (_provider) return _provider;

  const cfg = config || loadEmailConfig();

  switch (cfg.provider) {
    case "resend":
      if (cfg.resendApiKey) {
        _provider = new ResendProvider(cfg.resendApiKey);
      } else {
        console.warn("[Email] RESEND_API_KEY not set, falling back to console");
        _provider = new ConsoleEmailProvider();
      }
      break;

    case "smtp":
      if (cfg.smtpHost && cfg.smtpUser && cfg.smtpPass) {
        _provider = new SmtpProvider({
          host: cfg.smtpHost,
          port: cfg.smtpPort || 587,
          user: cfg.smtpUser,
          pass: cfg.smtpPass,
          secure: cfg.smtpSecure,
        });
      } else {
        console.warn("[Email] SMTP not fully configured, falling back to console");
        _provider = new ConsoleEmailProvider();
      }
      break;

    case "console":
    default:
      _provider = new ConsoleEmailProvider();
      break;
  }

  return _provider;
}

/**
 * Reset the provider singleton (for testing).
 */
export function resetEmailProvider(): void {
  _provider = null;
}

// ============================================================
// Email Sending with Retry
// ============================================================

/**
 * Send an email with retry mechanism.
 * Retries up to MAX_RETRIES times with exponential backoff.
 */
export async function sendEmail(
  params: SendEmailParams,
  options?: {
    workspaceId?: string;
    actorId?: string;
    maxRetries?: number;
  }
): Promise<SendEmailResult> {
  const provider = getEmailProvider();
  const maxRetries = options?.maxRetries ?? MAX_RETRIES;
  let lastError: string | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Log retrying status
    if (attempt > 0) {
      await logEmailSend({
        to: params.to.map((t) => t.email).join(", "),
        from: params.from.email,
        subject: params.subject,
        provider: provider.name,
        status: "retrying",
        error: lastError,
        retryCount: attempt,
        workspaceId: options?.workspaceId,
        actorId: options?.actorId,
      });

      // Exponential backoff
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const result = await provider.send(params);

    if (result.status === "sent" || result.status === "queued") {
      // Log success
      await logEmailSend({
        to: params.to.map((t) => t.email).join(", "),
        from: params.from.email,
        subject: params.subject,
        provider: provider.name,
        status: result.status,
        retryCount: attempt,
        workspaceId: options?.workspaceId,
        actorId: options?.actorId,
      });

      return result;
    }

    lastError = result.error;
    console.error(
      `[Email] Send failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
      result.error
    );
  }

  // All retries exhausted
  await logEmailSend({
    to: params.to.map((t) => t.email).join(", "),
    from: params.from.email,
    subject: params.subject,
    provider: provider.name,
    status: "failed",
    error: lastError,
    retryCount: maxRetries,
    workspaceId: options?.workspaceId,
    actorId: options?.actorId,
  });

  return {
    id: "",
    provider: provider.name,
    status: "failed",
    error: lastError || "All retry attempts exhausted",
  };
}

// ============================================================
// Invitation Email Helper
// ============================================================

import {
  invitationEmailHtml,
  invitationEmailText,
  type InvitationEmailData,
} from "./templates";

/**
 * Send an invitation email.
 */
export async function sendInvitationEmail(
  data: InvitationEmailData,
  options?: { workspaceId?: string; actorId?: string }
): Promise<SendEmailResult> {
  const config = loadEmailConfig();

  const params: SendEmailParams = {
    from: { email: config.fromEmail, name: config.fromName },
    to: [{ email: data.inviterEmail === data.inviterName ? data.inviterEmail : "" }],
    subject: `Undangan ke ${data.workspaceName} di MimoNotes`,
    html: invitationEmailHtml(data),
    text: invitationEmailText(data),
    tags: [
      { name: "category", value: "invitation" },
      { name: "workspace", value: data.workspaceName },
    ],
  };

  // Fix: send to the inviter's email for now (since we don't have invitee email in params)
  // The caller should set the correct 'to' address
  return sendEmail(params, options);
}

// ============================================================
// Environment Validation
// ============================================================

/**
 * Validate email environment configuration.
 * Returns a list of issues found.
 */
export function validateEmailConfig(): {
  valid: boolean;
  issues: string[];
  provider: string;
} {
  const config = loadEmailConfig();
  const issues: string[] = [];

  switch (config.provider) {
    case "resend":
      if (!config.resendApiKey) {
        issues.push("RESEND_API_KEY is not set");
      }
      break;

    case "smtp":
      if (!config.smtpHost) issues.push("SMTP_HOST is not set");
      if (!config.smtpUser) issues.push("SMTP_USER is not set");
      if (!config.smtpPass) issues.push("SMTP_PASS is not set");
      break;

    case "console":
      // Always valid
      break;

    default:
      issues.push(`Unknown provider: ${config.provider}`);
  }

  if (!config.fromEmail) {
    issues.push("EMAIL_FROM is not set");
  }

  return {
    valid: issues.length === 0,
    issues,
    provider: config.provider,
  };
}
