import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, getWorkspaceContext, resolveWorkspaceId } from "@/lib/prisma";
import { ratelimit } from "@/lib/ratelimit";
import { getClientIP } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { createTextStreamResponse } from "ai";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { trackChatMessage, trackAIRequest, checkLimit } from "@/lib/usage";
import { chatWithRAG, streamChatResponse } from "@/lib/n8n-client";
import type { WidgetMode } from "@/lib/prompts/templates";

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
    console.log(`[Chat] workspaceId=${workspaceId}, context=${await getWorkspaceContext()}`);

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

    // Fetch conversation history (last 10 messages) — must be inside transaction for RLS
    const historyMessages = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
      return tx.$queryRaw<Array<{ role: string; content: string }>>`
        SELECT role, content FROM chat_messages
        WHERE session_id = ${session.id}
        ORDER BY created_at ASC
        LIMIT 20
      `;
    });

    // Debug: log history count
    console.log(`[Chat] History loaded: ${historyMessages.length} messages for session ${session.id}`);

    // Build conversation history string (keep last 10, summarize if too long)
    const MAX_HISTORY_CHARS = 3000;
    let conversationHistory = "";
    const recentMessages = historyMessages.slice(-10); // last 10 messages
    for (const msg of recentMessages) {
      const prefix = msg.role === "user" ? "User" : "Assistant";
      const entry = `${prefix}: ${msg.content}\n`;
      if (conversationHistory.length + entry.length > MAX_HISTORY_CHARS) {
        // Summarize remaining older messages
        const olderMessages = historyMessages.slice(0, historyMessages.length - 10);
        if (olderMessages.length > 0) {
          const summary = olderMessages.map(m => m.content).join(" ").substring(0, 500);
          conversationHistory = `[Ringkasan percakapan sebelumnya]: ${summary}\n\n${conversationHistory}`;
        }
        break;
      }
      conversationHistory += entry;
    }

    // Call n8n webhook for RAG processing
    const n8nResponse = await chatWithRAG({
      message,
      sessionId: session.id,
      mode: mode || "knowledge_base",
      workspaceId,
      userId,
    });

    if (!n8nResponse.success) {
      // Fallback to local processing if n8n fails
      console.warn("n8n webhook failed, falling back to local processing:", n8nResponse.error);
      
      // Import local RAG chain as fallback
      const { streamRAGResponse } = await import("@/lib/rag/chain");
      const { buildSystemPrompt } = await import("@/lib/prompts/templates");
      
      const promptContext: PromptContext = {
        mode: (mode || "knowledge_base") as WidgetMode,
        businessName: "",
        businessDescription: "",
        contactInfo: {},
        knowledgeContext: "",
        conversationHistory,
      };
      
      const result = await streamRAGResponse(message, 5, workspaceId, undefined, undefined, promptContext);

      if (result.noContext) {
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
              const content = chunk.choices?.[0]?.delta?.content;
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
    }

    // n8n webhook succeeded — handle streaming response
    const transformStream = new TransformStream<string, string>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
    });

    // Stream from n8n response
    const n8nStream = new ReadableStream<string>({
      async start(controller) {
        // Parse n8n response and stream to client
        const data = n8nResponse.data;
        if (data && data.response) {
          controller.enqueue(data.response);
        }
        controller.close();
      },
    });

    const processedStream = n8nStream.pipeThrough(transformStream);

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
        "X-Sources": encodeURIComponent(JSON.stringify(n8nResponse.data?.sources || [])),
      },
    });
  } catch (error: unknown) {
    console.error("Chat API error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = JSON.stringify(error);

    // Detect AI provider quota/rate limit errors
    if (
      errorMessage.includes("429") ||
      errorMessage.includes("quota exhausted") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("limitation") ||
      errorString.includes('"code":"429"') ||
      errorString.includes('"status":429')
    ) {
      return Response.json(
        { error: "Kuota AI telah habis. Silakan coba lagi nanti atau hubungi administrator." },
        { status: 429 }
      );
    }

    return Response.json(
      { error: "Terjadi kesalahan saat memproses pesan" },
      { status: 500 }
    );
  }
}
