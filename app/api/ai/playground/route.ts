import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAIProvider, getAIModel, getProviderType } from "@/lib/ai-provider";
import { generateEmbedding } from "@/lib/rag/embedder";
import { searchSimilarChunks } from "@/lib/rag/vectorstore";
import { resolveWorkspaceId } from "@/lib/prisma";
import { createTextStreamResponse } from "ai";

interface PlaygroundRequest {
  systemPrompt: string;
  userMessage: string;
  context?: string;
  useRAG?: boolean;
  topK?: number;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
}

/** POST /api/ai/playground — Run playground prompt (streaming) */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id! as string;
    const workspaceId = await resolveWorkspaceId(userId);

    const body: PlaygroundRequest = await request.json();
    const {
      systemPrompt,
      userMessage,
      context: manualContext,
      useRAG = false,
      topK = 5,
      temperature = 0.7,
      maxTokens = 1000,
      topP = 1.0,
    } = body;

    if (!systemPrompt || !userMessage) {
      return Response.json(
        { error: "System prompt and user message are required" },
        { status: 400 }
      );
    }

    const openai = await getAIProvider();
    const model = await getAIModel();
    const providerType = await getProviderType();

    // Get context: either from RAG or manual
    let context = manualContext || "";
    const sources: Array<{
      documentId: string;
      content: string;
      similarity: number;
    }> = [];

    if (useRAG) {
      try {
        const queryEmbedding = await generateEmbedding(userMessage);
        const { chunks: similarChunks } = await searchSimilarChunks(queryEmbedding, topK, workspaceId);
        if (similarChunks.length > 0) {
          context = similarChunks
            .map((chunk, i) => `[${i + 1}] ${chunk.content}`)
            .join("\n\n");
          sources.push(
            ...similarChunks.map((c) => ({
              documentId: c.documentId,
              content: c.content,
              similarity: c.similarity,
            }))
          );
        }
      } catch {
        // RAG failed, continue without context
      }
    }

    // Build system prompt with context
    const finalSystemPrompt = context
      ? `${systemPrompt}\n\nContext:\n${context}`
      : systemPrompt;

    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: finalSystemPrompt },
        { role: "user", content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    });

    // Convert OpenAI stream to ReadableStream<string> with token counting
    let tokenCount = 0;
    const startTime = Date.now();

    const readableStream = new ReadableStream<string>({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            tokenCount++;
            controller.enqueue(content);
          }
        }
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        controller.enqueue(
          `\n\n<!-- STATS:${JSON.stringify({ tokens: tokenCount, time: `${elapsed}s`, model, provider: providerType })} -->`
        );
        controller.close();
      },
    });

    return createTextStreamResponse({
      textStream: readableStream,
      headers: {
        "X-Model": model,
        "X-Provider": providerType,
        "X-Sources": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch (error) {
    console.error("POST /api/ai/playground error:", error);
    return Response.json(
      { error: "Failed to run playground" },
      { status: 500 }
    );
  }
}
