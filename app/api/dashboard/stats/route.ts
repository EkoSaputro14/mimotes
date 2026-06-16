import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id! as string;

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);

    // All queries scoped to user's documents and sessions
    const userDocWhere = { userId };
    const userSessionWhere = { userId };
    const userMessageWhere = {
      session: { userId },
    };

    const [
      totalDocuments,
      totalChunks,
      totalSessions,
      totalMessages,
      todaySessions,
      yesterdaySessions,
      todayMessages,
      yesterdayMessages,
      documentsByStatus,
      documentsByType,
    ] = await Promise.all([
      prisma.document.count({ where: userDocWhere }),
      prisma.documentChunk.count({
        where: { document: userDocWhere },
      }),
      prisma.chatSession.count({ where: userSessionWhere }),
      prisma.chatMessage.count({
        where: { ...userMessageWhere, role: "user" },
      }),
      prisma.chatSession.count({
        where: { ...userSessionWhere, createdAt: { gte: todayStart } },
      }),
      prisma.chatSession.count({
        where: { ...userSessionWhere, createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      prisma.chatMessage.count({
        where: { ...userMessageWhere, role: "user", createdAt: { gte: todayStart } },
      }),
      prisma.chatMessage.count({
        where: { ...userMessageWhere, role: "user", createdAt: { gte: yesterdayStart, lt: todayStart } },
      }),
      prisma.document.groupBy({
        by: ["status"],
        where: userDocWhere,
        _count: { id: true },
      }),
      prisma.document.groupBy({
        by: ["fileType"],
        where: userDocWhere,
        _count: { id: true },
      }),
    ]);

    const sessionTrend = yesterdaySessions > 0
      ? Math.round(((todaySessions - yesterdaySessions) / yesterdaySessions) * 100)
      : todaySessions > 0 ? 100 : 0;

    const messageTrend = yesterdayMessages > 0
      ? Math.round(((todayMessages - yesterdayMessages) / yesterdayMessages) * 100)
      : todayMessages > 0 ? 100 : 0;

    return NextResponse.json({
      documents: { total: totalDocuments },
      chunks: { total: totalChunks },
      sessions: {
        total: totalSessions,
        today: todaySessions,
        trend: sessionTrend,
      },
      messages: {
        total: totalMessages,
        today: todayMessages,
        trend: messageTrend,
      },
      documentsByStatus: documentsByStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      documentsByType: documentsByType.map((t) => ({
        type: t.fileType,
        count: t._count.id,
      })),
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
