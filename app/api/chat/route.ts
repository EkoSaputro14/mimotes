import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId } from "@/lib/prisma";
import { streamRAGResponse } from "@/lib/rag/chain";
import { type PromptContext } from "@/lib/rag/chain";
import { buildSystemPrompt } from "@/lib/prompts/templates";
import type { WidgetMode } from "@/lib/prompts/templates";
import { ratelimit } from "@/lib/ratelimit";
import { getClientIP } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { createTextStreamResponse } from "ai";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { trackChatMessage, trackAIRequest, checkLimit } from "@/lib/usage";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return Response.json(
        { error: "Terlalu banyak permintaan. Silakan coba lagi nanti." },
        { status: 429 }
      );
    }

    let body: { message?: string; sessionId?: string; mode?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Format JSON tidak valid" },
        { status: 400 }
      );
    }
    const { message, sessionId, mode } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Pesan tidak valid" },
        { status: 400 }
      );
    }

    // Get authenticated user — chat now requires auth
    const userSession = await auth();
    if (!userSession?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = userSession.user.id as string;

    // Set RLS workspace context — all subsequent queries are workspace-scoped
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Create or get session — verify ownership
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, userId },
      });
    }

    let isNewSession = false;
    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          title: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
          userId,
          workspaceId,
        },
      });
      isNewSession = true;
    }

    // Record session creation event
    if (isNewSession) {
      recordAnalyticsEvent("session_create", { sessionId: session.id }, userId).catch(
        () => {}
      );
    }

    // Save user message — use transaction to ensure RLS context is on the same connection
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
      await tx.chatMessage.create({
        data: {
          sessionId: session.id,
          role: "user",
          content: message,
        },
      });
    });

    // Record chat message event
    recordAnalyticsEvent("chat_message", {
      sessionId: session.id,
      messageLength: message.length,
    }, userId).catch(() => {});

    // Generate RAG response — scoped to workspace's documents only
    const promptContext: PromptContext = {
      mode: (mode || "knowledge_base") as WidgetMode,
      businessName: "",
      businessDescription: "",
      contactInfo: {},
      knowledgeContext: "",
      conversationHistory: "",
    };
    const result = await streamRAGResponse(message, 5, workspaceId, undefined, undefined, promptContext);

    if (result.noContext) {
      // No context found, return a simple response
      const noContextMsg =
        "Maaf, saya tidak menemukan informasi yang relevan dalam dokumen yang tersedia. Silakan upload dokumen terlebih dahulu atau coba pertanyaan lain.";
      const stream = new ReadableStream<string>({
        start(controller) {
          controller.enqueue(noContextMsg);
          controller.close();
        },
      });

      // Save assistant message — use transaction for RLS
      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
        await tx.chatMessage.create({
          data: {
            sessionId: session.id,
            role: "assistant",
            content: noContextMsg,
            sources: [],
          },
        });
      });

      return createTextStreamResponse({
        textStream: stream,
        headers: {
          "X-Session-Id": session.id,
          "X-Sources": encodeURIComponent(JSON.stringify([])),
          "X-Retrieval-Metrics": encodeURIComponent(JSON.stringify(result.metrics)),
        },
      });
    }

    // Create a transform stream to capture the full response
    let fullResponse = "";

    const transformStream = new TransformStream<string, string>({
      transform(chunk, controller) {
        fullResponse += chunk;
        controller.enqueue(chunk);
      },
      async flush() {
        // Save assistant message with sources after streaming is complete — use transaction for RLS
        await prisma.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
          await tx.chatMessage.create({
            data: {
              sessionId: session.id,
              role: "assistant",
              content: fullResponse,
              sources: JSON.parse(JSON.stringify(result.sources)),
            },
          });
        });
      },
    });

    // Convert OpenAI stream to ReadableStream<string>
    const readableStream = new ReadableStream<string>({
      async start(controller) {
        if (result.stream) {
          for await (const chunk of result.stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(content);
            }
          }
        }
        controller.close();
      },
    });

    const processedStream = readableStream.pipeThrough(transformStream);

    // Track usage (fire-and-forget) — with limit enforcement
    try {
      await checkLimit(workspaceId, "maxChatMessages");
      await checkLimit(workspaceId, "maxAIRequests");
    } catch (error) {
      if (error instanceof Error && error.name === "LimitExceededError") {
        return Response.json(
          { error: error.message, limitExceeded: true },
          { status: 429 }
        );
      }
    }
    trackChatMessage(workspaceId).catch(() => {});
    trackAIRequest(workspaceId).catch(() => {});

    return createTextStreamResponse({
      textStream: processedStream,
      headers: {
        "X-Session-Id": session.id,
        "X-Sources": encodeURIComponent(JSON.stringify(result.sources)),
        "X-Retrieval-Metrics": encodeURIComponent(JSON.stringify(result.metrics)),
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat memproses pesan" },
      { status: 500 }
    );
  }
}
