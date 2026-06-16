import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getAIProvider, getAIModel, getProviderType, PROVIDER_PRESETS } from "@/lib/ai-provider";
import { createTextStreamResponse } from "ai";

interface CompareRequest {
  systemPrompt: string;
  userMessage: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  models: Array<{ model: string; provider?: string }>;
}

/** POST /api/ai/playground/compare — Run same prompt on multiple models */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CompareRequest = await request.json();
    const {
      systemPrompt,
      userMessage,
      context,
      temperature = 0.7,
      maxTokens = 1000,
      topP = 1.0,
      models,
    } = body;

    if (!systemPrompt || !userMessage || !models?.length) {
      return Response.json(
        { error: "System prompt, user message, and at least one model are required" },
        { status: 400 }
      );
    }

    const openai = await getAIProvider();
    const currentModel = await getAIModel();
    const providerType = await getProviderType();

    // Build system prompt with context
    const finalSystemPrompt = context
      ? `${systemPrompt}\n\nContext:\n${context}`
      : systemPrompt;

    // Run all models in parallel, collect results
    const results = await Promise.allSettled(
      models.map(async (m) => {
        const targetModel = m.model || currentModel;
        const startTime = Date.now();

        const completion = await openai.chat.completions.create({
          model: targetModel,
          messages: [
            { role: "system", content: finalSystemPrompt },
            { role: "user", content: userMessage },
          ],
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
          stream: false, // Non-streaming for compare mode
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const content =
          completion.choices[0]?.message?.content || "No response";
        const usage = completion.usage;

        return {
          model: targetModel,
          provider: providerType,
          content,
          tokens: usage?.total_tokens ?? content.split(/\s+/).length,
          time: `${elapsed}s`,
        };
      })
    );

    const responses = results.map((r, i) => {
      if (r.status === "fulfilled") {
        return r.value;
      }
      return {
        model: models[i].model,
        provider: providerType,
        content: `Error: ${r.reason?.message || "Failed to generate response"}`,
        tokens: 0,
        time: "0s",
      };
    });

    return Response.json({ responses });
  } catch (error) {
    console.error("POST /api/ai/playground/compare error:", error);
    return Response.json(
      { error: "Failed to run compare" },
      { status: 500 }
    );
  }
}
