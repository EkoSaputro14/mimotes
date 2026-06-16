// ============================================================
// Email Provider Types
// ============================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface SendEmailParams {
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: EmailAddress;
  tags?: Array<{ name: string; value: string }>;
}

export interface SendEmailResult {
  id: string;
  provider: string;
  status: "sent" | "queued" | "failed";
  error?: string;
}

export interface EmailProvider {
  readonly name: string;
  send(params: SendEmailParams): Promise<SendEmailResult>;
  isAvailable(): boolean;
}

export type EmailProviderType = "resend" | "smtp" | "console";

export interface EmailConfig {
  provider: EmailProviderType;
  resendApiKey?: string;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
  fromEmail: string;
  fromName: string;
  baseUrl: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  provider: string;
  status: "sent" | "queued" | "failed" | "retrying";
  error?: string;
  retryCount: number;
  sentAt?: Date;
  createdAt: Date;
}
