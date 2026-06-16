import { auth } from "@/lib/auth";
import { withWorkspace } from "@/lib/middleware/tenant";
import { getUsage, getWorkspaceSubscription, getCurrentPeriod } from "@/lib/usage";
import { prisma } from "@/lib/prisma";

// GET — workspace subscription + usage for current period
export async function GET() {
  return withWorkspace(async (userId, workspaceId) => {
    const [subscription, usage] = await Promise.all([
      getWorkspaceSubscription(workspaceId),
      getUsage(workspaceId),
    ]);

    // Get available plans for upgrade display
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { maxDocuments: "asc" },
      select: {
        name: true,
        displayName: true,
        description: true,
        maxDocuments: true,
        maxStorageMB: true,
        maxChatMessages: true,
        maxMembers: true,
      },
    });

    return Response.json({
      subscription: subscription
        ? {
            id: subscription.id,
            status: subscription.status,
            plan: {
              name: subscription.plan.name,
              displayName: subscription.plan.displayName,
              description: subscription.plan.description,
            },
            trialEndsAt: subscription.trialEndsAt,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
          }
        : {
            status: "active",
            plan: { name: "free", displayName: "Free", description: "Basic plan" },
          },
      usage: {
        period: usage.period,
        documents: {
          used: usage.documentsCreated,
          limit: usage.limits.maxDocuments,
          percent: usage.usagePercent.documents,
        },
        storage: {
          used: usage.storageMBUsed,
          limit: usage.limits.maxStorageMB,
          percent: usage.usagePercent.storage,
        },
        chatMessages: {
          used: usage.chatMessages,
          limit: usage.limits.maxChatMessages,
          percent: usage.usagePercent.chatMessages,
        },
        chunks: {
          used: usage.chunksCreated,
          limit: usage.limits.maxChunks,
          percent: usage.usagePercent.chunks,
        },
        aiRequests: {
          used: usage.aiRequests,
          limit: usage.limits.maxAIRequests,
          percent: usage.usagePercent.aiRequests,
        },
        embeddingRequests: {
          used: usage.embeddingRequests,
          limit: usage.limits.maxEmbeddingReqs,
          percent: usage.usagePercent.embeddingRequests,
        },
        mcpExecutions: {
          used: usage.mcpExecutions,
          limit: usage.limits.maxMCPExecutions,
          percent: usage.usagePercent.mcpExecutions,
        },
      },
      plans,
    });
  });
}
