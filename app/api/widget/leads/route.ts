import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { getLeads, updateLeadStatus, updateLeadScore } from "@/lib/widget";
import { LeadScore, LeadStatus } from "@/lib/lead-intent";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const perPage = parseInt(searchParams.get("perPage") || "20");

    const result = await getLeads(auth.workspaceId, widgetId, page, perPage);

    // Filter by status and score if provided
    const status = searchParams.get("status");
    const score = searchParams.get("score");

    if (status || score) {
      result.leads = result.leads.filter((lead: any) => {
        if (status && lead.leadStatus !== status) return false;
        if (score && lead.leadScore !== score) return false;
        return true;
      });
    }

    return Response.json(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const body = await request.json();
    const { conversationId, status, score } = body;

    if (!conversationId) {
      return Response.json({ error: { code: "invalid_request", message: "conversationId required" } }, { status: 400 });
    }

    if (status) {
      await updateLeadStatus(conversationId, status as LeadStatus);

      // Trigger notification on conversion
      if (status === "converted") {
        const conv = await prisma.widgetConversation.findUnique({
          where: { id: conversationId },
          select: {
            leadName: true,
            leadEmail: true,
            leadWhatsApp: true,
            leadScore: true,
            leadIntent: true,
            workspaceId: true,
            widget: { select: { name: true } },
            _count: { select: { messages: true } },
          },
        });

        if (conv) {
          const { sendLeadNotification } = await import("@/lib/notifications");
          await sendLeadNotification("converted", {
            conversationId,
            workspaceId: conv.workspaceId,
            leadName: conv.leadName,
            leadEmail: conv.leadEmail,
            leadWhatsApp: conv.leadWhatsApp,
            leadScore: conv.leadScore || "low",
            leadStatus: "converted",
            leadIntent: conv.leadIntent,
            widgetName: conv.widget?.name || "Widget",
            messageCount: conv._count.messages,
          }).catch((err) => console.error("[Notification] Failed:", err));
        }
      }
    }
    if (score) {
      await updateLeadScore(conversationId, score as LeadScore);
    }

    return Response.json({ success: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
