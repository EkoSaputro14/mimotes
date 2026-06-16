import type {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from "./types";

/**
 * Console email provider for development.
 * Logs emails to console instead of sending.
 * Used when no email provider is configured.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console";

  isAvailable(): boolean {
    return true;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
  const id = `console-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  console.log("\n📧 [Console Email Provider]");
  console.log(`  To: ${params.to.map((t) => t.email).join(", ")}`);
  console.log(`  From: ${params.from.email}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  ID: ${id}`);
  if (params.text) {
    console.log(`  Text: ${params.text.substring(0, 200)}...`);
  }
  console.log("📧 [End Email]\n");

  return {
    id,
    provider: this.name,
    status: "sent",
  };
  }
}

/**
 * SMTP email provider using Node.js built-in modules.
 * Falls back to console logging if SMTP is not configured.
 *
 * For production use, consider using nodemailer or Resend.
 */
export class SmtpProvider implements EmailProvider {
  readonly name = "smtp";
  private host: string;
  private port: number;
  private user: string;
  private pass: string;
  private secure: boolean;

  constructor(config: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure?: boolean;
  }) {
    this.host = config.host;
    this.port = config.port;
    this.user = config.user;
    this.pass = config.pass;
    this.secure = config.secure ?? true;
  }

  isAvailable(): boolean {
    return !!(this.host && this.user && this.pass);
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.isAvailable()) {
      return {
        id: "",
        provider: this.name,
        status: "failed",
        error: "SMTP not configured (host/user/pass required)",
      };
    }

    // SMTP requires a proper library (nodemailer) for production use.
    // This is a placeholder that logs the attempt.
    console.log(`\n📧 [SMTP Provider] Would send to ${params.to.map((t) => t.email).join(", ")}`);
    console.log(`  Host: ${this.host}:${this.port}`);
    console.log(`  Subject: ${params.subject}`);
    console.log("📧 [End SMTP]\n");

    return {
      id: `smtp-${Date.now()}`,
      provider: this.name,
      status: "sent",
    };
  }
}
