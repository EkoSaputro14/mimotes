import type {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from "./types";

/**
 * Resend email provider.
 * Uses the Resend API (https://resend.com) for email delivery.
 * Requires RESEND_API_KEY environment variable.
 */
export class ResendProvider implements EmailProvider {
  readonly name = "resend";
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    if (!this.isAvailable()) {
      return {
        id: "",
        provider: this.name,
        status: "failed",
        error: "RESEND_API_KEY not configured",
      };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: params.from.name
            ? `${params.from.name} <${params.from.email}>`
            : params.from.email,
          to: params.to.map((t) => t.email),
          subject: params.subject,
          html: params.html,
          text: params.text,
          reply_to: params.replyTo?.email,
          tags: params.tags,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          id: "",
          provider: this.name,
          status: "failed",
          error: data.message || `Resend API error: ${response.status}`,
        };
      }

      return {
        id: data.id,
        provider: this.name,
        status: "sent",
      };
    } catch (error) {
      return {
        id: "",
        provider: this.name,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
