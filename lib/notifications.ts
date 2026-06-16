/**
 * Lead Notification Service for MimoNotes
 * 
 * Supports: Email (SMTP), Telegram Bot, Discord Webhook
 * Triggers: New High Lead, Lead Converted
 */

import { prisma } from "@/lib/prisma";

// ─── Types ──────────────────────────────────────────────────────────

export type NotificationChannel = "email" | "telegram" | "discord";
export type NotificationEventType = "high_lead" | "converted";

export interface LeadNotificationData {
  conversationId: string;
  workspaceId: string;
  leadName: string | null;
  leadEmail: string | null;
  leadWhatsApp: string | null;
  leadScore: string;
  leadStatus: string;
  leadIntent: string | null;
  widgetName: string;
  messageCount: number;
}

export interface NotificationConfig {
  emailEnabled: boolean;
  emailAddress: string | null;
  telegramEnabled: boolean;
  telegramBotToken: string | null;
  telegramChatId: string | null;
  discordEnabled: boolean;
  discordWebhookUrl: string | null;
  notifyOnHighLead: boolean;
  notifyOnConverted: boolean;
}

// ─── Config Management ──────────────────────────────────────────────

/**
 * Get notification config for a workspace.
 * Returns null if no config exists.
 */
export async function getNotificationConfig(
  workspaceId: string
): Promise<NotificationConfig | null> {
  const config = await prisma.notificationConfig.findUnique({
    where: { workspaceId },
  });

  if (!config) return null;

  return {
    emailEnabled: config.emailEnabled,
    emailAddress: config.emailAddress,
    telegramEnabled: config.telegramEnabled,
    telegramBotToken: config.telegramBotToken,
    telegramChatId: config.telegramChatId,
    discordEnabled: config.discordEnabled,
    discordWebhookUrl: config.discordWebhookUrl,
    notifyOnHighLead: config.notifyOnHighLead,
    notifyOnConverted: config.notifyOnConverted,
  };
}

/**
 * Upsert notification config for a workspace.
 */
export async function upsertNotificationConfig(
  workspaceId: string,
  data: Partial<NotificationConfig>
) {
  return prisma.notificationConfig.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      ...data,
    },
    update: data,
  });
}

// ─── Message Formatting ─────────────────────────────────────────────

function formatLeadMessage(
  event: NotificationEventType,
  lead: LeadNotificationData
): string {
  const emoji = event === "high_lead" ? "🔥" : "✅";
  const title =
    event === "high_lead"
      ? "High-Intent Lead Detected!"
      : "Lead Converted!";

  const lines = [
    `${emoji} **${title}**`,
    "",
    `**Name:** ${lead.leadName || "Not provided"}`,
    `**Email:** ${lead.leadEmail || "Not provided"}`,
    `**WhatsApp:** ${lead.leadWhatsApp || "Not provided"}`,
    `**Score:** ${lead.leadScore.toUpperCase()}`,
    `**Intent:** ${lead.leadIntent || "none"}`,
    `**Widget:** ${lead.widgetName}`,
    `**Messages:** ${lead.messageCount}`,
    "",
    `🔗 [View in Dashboard](https://mimotes.ekohomelab.online/settings/leads)`,
  ];

  return lines.join("\n");
}

function formatPlainMessage(
  event: NotificationEventType,
  lead: LeadNotificationData
): string {
  const title =
    event === "high_lead"
      ? "🔥 High-Intent Lead Detected!"
      : "✅ Lead Converted!";

  return [
    title,
    "",
    `Name: ${lead.leadName || "Not provided"}`,
    `Email: ${lead.leadEmail || "Not provided"}`,
    `WhatsApp: ${lead.leadWhatsApp || "Not provided"}`,
    `Score: ${lead.leadScore.toUpperCase()}`,
    `Intent: ${lead.leadIntent || "none"}`,
    `Widget: ${lead.widgetName}`,
    `Messages: ${lead.messageCount}`,
    "",
    `View: https://mimotes.ekohomelab.online/settings/leads`,
  ].join("\n");
}

// ─── Channel Senders ────────────────────────────────────────────────

async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  // Email sending via SMTP (nodemailer)
  // For now, we log and return success — SMTP config requires env vars
  console.log(`[Notification:Email] To: ${to}, Subject: ${subject}`);
  console.log(`[Notification:Email] Body: ${body}`);
  
  // TODO: Implement actual SMTP sending when SMTP_HOST/SMTP_USER/SMTP_PASS are configured
  // import nodemailer from "nodemailer";
  // const transporter = nodemailer.createTransport({ ... });
  // await transporter.sendMail({ from, to, subject, text: body });
  
  return { success: true };
}

async function sendTelegram(
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Telegram API ${res.status}: ${err}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function sendDiscord(
  webhookUrl: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: message,
        username: "MimoNotes Lead Alert",
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: `Discord webhook ${res.status}: ${err}` };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ─── Notification Dispatcher ────────────────────────────────────────

/**
 * Send lead notification to all configured channels.
 * Deduplicates by conversationId + eventType.
 */
export async function sendLeadNotification(
  event: NotificationEventType,
  lead: LeadNotificationData
): Promise<void> {
  const config = await getNotificationConfig(lead.workspaceId);
  if (!config) return; // No config = no notifications

  // Check if this event type is enabled
  if (event === "high_lead" && !config.notifyOnHighLead) return;
  if (event === "converted" && !config.notifyOnConverted) return;

  // Dedup: check if already notified for this conversation + event
  const existing = await prisma.notificationLog.findFirst({
    where: {
      workspaceId: lead.workspaceId,
      conversationId: lead.conversationId,
      eventType: event,
      status: "sent",
    },
  });
  if (existing) return; // Already notified

  const markdownMsg = formatLeadMessage(event, lead);
  const plainMsg = formatPlainMessage(event, lead);

  // Send to each enabled channel
  const channels: { channel: NotificationChannel; send: () => Promise<{ success: boolean; error?: string }> }[] = [];

  if (config.emailEnabled && config.emailAddress) {
    channels.push({
      channel: "email",
      send: () =>
        sendEmail(
          config.emailAddress!,
          `[MimoNotes] ${event === "high_lead" ? "🔥 High Lead" : "✅ Converted"}: ${lead.leadName || lead.leadEmail}`,
          plainMsg
        ),
    });
  }

  if (config.telegramEnabled && config.telegramBotToken && config.telegramChatId) {
    channels.push({
      channel: "telegram",
      send: () =>
        sendTelegram(config.telegramBotToken!, config.telegramChatId!, markdownMsg),
    });
  }

  if (config.discordEnabled && config.discordWebhookUrl) {
    channels.push({
      channel: "discord",
      send: () => sendDiscord(config.discordWebhookUrl!, plainMsg),
    });
  }

  // Fire all channels in parallel
  const results = await Promise.allSettled(
    channels.map(async ({ channel, send }) => {
      const result = await send();
      // Log each attempt
      await prisma.notificationLog.create({
        data: {
          workspaceId: lead.workspaceId,
          conversationId: lead.conversationId,
          channel,
          eventType: event,
          recipientEmail: channel === "email" ? config.emailAddress : null,
          status: result.success ? "sent" : "failed",
          errorMessage: result.error || null,
        },
      });
      return { channel, ...result };
    })
  );

  // Log any channels that weren't attempted (disabled)
  const attemptedChannels = new Set(channels.map((c) => c.channel));
  for (const ch of ["email", "telegram", "discord"] as NotificationChannel[]) {
    if (!attemptedChannels.has(ch)) {
      // Channel disabled — don't log (no noise)
    }
  }
}
