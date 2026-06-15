import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { resolveWorkspaceId } from "@/lib/prisma";
import { recordAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await requireFeature(workspaceId, "analytics");
    const { eventType, metadata, userId } = await request.json();

    if (!eventType || typeof eventType !== "string") {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    await recordAnalyticsEvent(
      eventType as AnalyticsEventType,
      metadata,
      userId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Analytics Events API]", error);
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    );
  }
}
