import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { requireFeature } from "@/lib/entitlements";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";

// Approximate pricing per 1K tokens (USD)
const PROVIDER_PRICING: Record<string, { input: number; output: number }> = {
  openai: { input: 0.0015, output: 0.006 },
  openrouter: { input: 0.0015, output: 0.006 },
  mimo: { input: 0.001, output: 0.004 },
  lmstudio: { input: 0, output: 0 },
  ollama: { input: 0, output: 0 },
  custom: { input: 0.0015, output: 0.006 },
};

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English, ~2 for CJK
  return Math.ceil(text.length / 3.5);
}

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

    const settings = await getSettings();
    const provider = settings.ai_provider || "mimo";
    const pricing = PROVIDER_PRICING[provider] || PROVIDER_PRICING.mimo;

    // Get messages scoped to user's sessions
    const messages = await prisma.chatMessage.findMany({
      where: {
        session: { userId },
        createdAt: { gte: startDate },
      },
      select: {
        role: true,
        content: true,
        createdAt: true,
      },
    });

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const dailyCost: Record<string, { inputTokens: number; outputTokens: number; cost: number }> = {};

    for (const msg of messages) {
      const tokens = estimateTokens(msg.content);
      const key = msg.createdAt.toISOString().split("T")[0];

      if (!dailyCost[key]) {
        dailyCost[key] = { inputTokens: 0, outputTokens: 0, cost: 0 };
      }

      if (msg.role === "user") {
        totalInputTokens += tokens;
        dailyCost[key].inputTokens += tokens;
      } else {
        totalOutputTokens += tokens;
        dailyCost[key].outputTokens += tokens;
      }
    }

    // Calculate costs
    const totalCost =
      (totalInputTokens / 1000) * pricing.input +
      (totalOutputTokens / 1000) * pricing.output;

    const avgCostPerQuery = messages.filter((m) => m.role === "user").length > 0
      ? totalCost / messages.filter((m) => m.role === "user").length
      : 0;

    const costData = Object.entries(dailyCost)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        cost: Math.round(
          ((data.inputTokens / 1000) * pricing.input +
            (data.outputTokens / 1000) * pricing.output) *
            100
        ) / 100,
      }));

    return NextResponse.json({
      provider,
      totalInputTokens,
      totalOutputTokens,
      totalCost: Math.round(totalCost * 100) / 100,
      avgCostPerQuery: Math.round(avgCostPerQuery * 1000) / 1000,
      dailyCost: costData,
      days,
    });
  } catch (error) {
    console.error("Dashboard cost error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cost data" },
      { status: 500 }
    );
  }
}
