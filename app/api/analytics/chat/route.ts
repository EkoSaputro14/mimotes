import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { resolveWorkspaceId } from "@/lib/prisma";
import { getChatAnalytics, getDateRangeParams } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const range = (request.nextUrl.searchParams.get("range") as "7d" | "30d" | "90d") || "30d";
    const { startDate, endDate } = getDateRangeParams(range);

    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "analytics");

    const data = await getChatAnalytics(startDate, endDate);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[Analytics Chat API]", error);
    return NextResponse.json(
      { error: "Failed to fetch chat analytics" },
      { status: 500 }
    );
  }
}
