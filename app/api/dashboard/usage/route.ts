import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id! as string;

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);
    await requireFeature(workspaceId, "analytics");

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get chat messages scoped to user's sessions
    const messages = await prisma.chatMessage.findMany({
      where: {
        session: { userId },
        createdAt: { gte: startDate },
      },
      select: {
        role: true,
        createdAt: true,
      },
    });

    // Get sessions scoped to user
    const sessions = await prisma.chatSession.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
    });

    // Aggregate by date
    const dailyData: Record<string, { questions: number; sessions: number; responses: number }> = {};

    // Initialize all dates in range
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      dailyData[key] = { questions: 0, sessions: 0, responses: 0 };
    }

    // Count messages by date
    for (const msg of messages) {
      const key = msg.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        if (msg.role === "user") dailyData[key].questions++;
        else dailyData[key].responses++;
      }
    }

    // Count sessions by date
    for (const s of sessions) {
      const key = s.createdAt.toISOString().split("T")[0];
      if (dailyData[key]) {
        dailyData[key].sessions++;
      }
    }

    const data = Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({
        date,
        ...counts,
      }));

    return NextResponse.json({ data, days });
  } catch (error) {
    console.error("Dashboard usage error:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage data" },
      { status: 500 }
    );
  }
}
