import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { base_url, api_key } = await request.json();

    if (!base_url) {
      return Response.json(
        { error: "Base URL is required" },
        { status: 400 }
      );
    }

    // Call the provider's /models endpoint
    const client = new OpenAI({
      apiKey: api_key || "dummy",
      baseURL: base_url,
    });

    const models = await client.models.list();

    // Categorize models
    const chatModels: string[] = [];
    const embeddingModels: string[] = [];

    for (const model of models.data) {
      const id = model.id.toLowerCase();
      if (
        id.includes("embed") ||
        id.includes("embedding") ||
        id.includes("nomic") ||
        id.includes("bge") ||
        id.includes("e5-") ||
        id.includes("gte-") ||
        id.includes("snowflake")
      ) {
        embeddingModels.push(model.id);
      } else {
        chatModels.push(model.id);
      }
    }

    // Sort alphabetically
    chatModels.sort();
    embeddingModels.sort();

    return Response.json({
      chat_models: chatModels,
      embedding_models: embeddingModels,
      total: models.data.length,
    });
  } catch (error) {
    console.error("Model detection error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to detect models";
    return Response.json({ error: message }, { status: 500 });
  }
}
