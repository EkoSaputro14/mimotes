import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider, getAIModel } from "@/lib/ai-provider";
import { createTextStreamResponse } from "ai";

/** POST /api/ai/prompts/[id]/test — Test a prompt in the playground (streaming) */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      message,
      temperature = 0.7,
      maxTokens = 1000,
      topP = 1.0,
    } = body;

    if (!message) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const prompt = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!prompt) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    const openai = await getAIProvider();
    const model = await getAIModel();

    // Replace variables in the prompt content
    const systemContent = prompt.content
      .replace(/\{question\}/g, message)
      .replace(/\{language\}/g, "Indonesian");

    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: message },
      ],
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      stream: true,
    });

    // Convert OpenAI stream to ReadableStream<string>
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
        // Append stats as a final metadata chunk
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        controller.enqueue(
          `\n\n<!-- STATS:${JSON.stringify({ tokens: tokenCount, time: `${elapsed}s`, model, provider: "ai" })} -->`
        );
        controller.close();
      },
    });

    return createTextStreamResponse({
      textStream: readableStream,
      headers: {
        "X-Model": model,
        "X-Prompt-Id": id,
      },
    });
  } catch (error) {
    console.error("POST /api/ai/prompts/[id]/test error:", error);
    return Response.json(
      { error: "Failed to test prompt" },
      { status: 500 }
    );
  }
}
