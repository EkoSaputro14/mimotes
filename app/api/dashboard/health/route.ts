import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSettingWithFallback } from "@/lib/settings";
import { getProviderType, PROVIDER_PRESETS } from "@/lib/ai-provider";

interface HealthCheck {
  service: string;
  status: "ok" | "error" | "degraded";
  latency?: number;
  message?: string;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      service: "database",
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "database",
      status: "error",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkVectorStore(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1 FROM document_chunks LIMIT 1`;
    return {
      service: "vector_store",
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "vector_store",
      status: "error",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkAIProvider(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const provider = await getProviderType();
    const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai;

    const baseUrl = await getSettingWithFallback(
      "ai_base_url",
      `${preset.envKeyPrefix}_BASE_URL`,
      preset.defaultBaseURL
    );
    const apiKey = await getSettingWithFallback(
      "ai_api_key",
      `${preset.envKeyPrefix}_API_KEY`,
      provider === "lmstudio" ? "lm-studio" : provider === "ollama" ? "ollama" : ""
    );

    if (!baseUrl || !apiKey) {
      return {
        service: "ai_provider",
        status: "degraded",
        latency: Date.now() - start,
        message: "No AI provider configured",
      };
    }

    // Soft check — just verify credentials are configured
    // Don't hit external APIs from health check (may fail due to CORS/network)
    return {
      service: "ai_provider",
      status: "ok",
      latency: Date.now() - start,
    };
  } catch (error) {
    return {
      service: "ai_provider",
      status: "error",
      latency: Date.now() - start,
      message: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

export async function GET() {
  try {
    const [database, vectorStore, aiProvider] = await Promise.all([
      checkDatabase(),
      checkVectorStore(),
      checkAIProvider(),
    ]);

    const checks = [database, vectorStore, aiProvider];
    const hasError = checks.some((c) => c.status === "error");
    const hasDegraded = checks.some((c) => c.status === "degraded");

    const overall = hasError ? "error" : hasDegraded ? "degraded" : "ok";

    return NextResponse.json({
      status: overall,
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard health error:", error);
    return NextResponse.json(
      { status: "error", error: "Health check failed" },
      { status: 500 }
    );
  }
}
