import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";
import { queryAuditLogs, getAuditSummary, exportAuditLogsCsv } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id!;
    const workspaceId = await resolveWorkspaceId(
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).user.selectedWorkspaceId
    );
    await setWorkspaceContext(workspaceId);

    const { searchParams } = new URL(request.url);

    // Summary endpoint
    if (searchParams.get("summary") === "true") {
      const days = parseInt(searchParams.get("days") || "30", 10);
      const summary = await getAuditSummary(workspaceId, days);
      return Response.json(summary);
    }

    // CSV export
    if (searchParams.get("export") === "csv") {
      const csv = await exportAuditLogsCsv({
        workspaceId,
        action: searchParams.get("action") || undefined,
        resourceType: searchParams.get("resourceType") || undefined,
      });
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": "attachment; filename=audit-logs.csv",
        },
      });
    }

    // Regular query
    const result = await queryAuditLogs({
      workspaceId,
      action: searchParams.get("action") || undefined,
      actorId: searchParams.get("actorId") || undefined,
      resourceType: searchParams.get("resourceType") || undefined,
      search: searchParams.get("search") || undefined,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      to: searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined,
      limit: parseInt(searchParams.get("limit") || "50", 10),
      offset: parseInt(searchParams.get("offset") || "0", 10),
    });

    return Response.json(result);
  } catch (error) {
    console.error("Audit API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
