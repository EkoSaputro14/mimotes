import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import {
  getNotificationConfig,
  upsertNotificationConfig,
} from "@/lib/notifications";

/**
 * GET /api/notifications/settings
 * Get notification config for the workspace.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const config = await getNotificationConfig(auth.workspaceId);

    return Response.json(config || {
      emailEnabled: false,
      emailAddress: null,
      telegramEnabled: false,
      telegramBotToken: null,
      telegramChatId: null,
      discordEnabled: false,
      discordWebhookUrl: null,
      notifyOnHighLead: true,
      notifyOnConverted: true,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

/**
 * PUT /api/notifications/settings
 * Update notification config for the workspace.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const body = await request.json();

    // Validate inputs
    const allowedFields = [
      "emailEnabled",
      "emailAddress",
      "telegramEnabled",
      "telegramBotToken",
      "telegramChatId",
      "discordEnabled",
      "discordWebhookUrl",
      "notifyOnHighLead",
      "notifyOnConverted",
    ];

    const data: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) {
        data[key] = body[key];
      }
    }

    // Validate email format if provided
    if (data.emailAddress && typeof data.emailAddress === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.emailAddress)) {
        return Response.json(
          { error: { code: "invalid_email", message: "Invalid email address" } },
          { status: 400 }
        );
      }
    }

    // Validate Telegram bot token format if provided
    if (data.telegramBotToken && typeof data.telegramBotToken === "string") {
      if (!data.telegramBotToken.includes(":")) {
        return Response.json(
          { error: { code: "invalid_token", message: "Invalid Telegram bot token format" } },
          { status: 400 }
        );
      }
    }

    // Validate Discord webhook URL if provided
    if (data.discordWebhookUrl && typeof data.discordWebhookUrl === "string") {
      if (!data.discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        return Response.json(
          { error: { code: "invalid_webhook", message: "Invalid Discord webhook URL" } },
          { status: 400 }
        );
      }
    }

    const config = await upsertNotificationConfig(auth.workspaceId, data);
    return Response.json(config);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
