import { NextRequest } from "next/server";
import { requireDashboardAuth, apiErrorResponse } from "@/lib/api-auth";
import { exportLeads } from "@/lib/widget";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireDashboardAuth(request);
    const { searchParams } = new URL(request.url);
    const widgetId = searchParams.get("widgetId") || undefined;

    const csv = await exportLeads(auth.workspaceId, widgetId);

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=leads.csv",
      },
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
