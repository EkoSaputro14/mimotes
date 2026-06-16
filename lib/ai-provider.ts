import OpenAI from "openai";
import { getSettingWithFallback } from "@/lib/settings";

export type AIProviderType = "openai" | "lmstudio" | "ollama" | "openrouter" | "custom" | "mimo" | "google";

export const PROVIDER_PRESETS: Record<
  AIProviderType,
  {
    label: string;
    defaultBaseURL: string;
    defaultModel: string;
    defaultEmbeddingModel: string;
    supportsEmbeddings: boolean;
    envKeyPrefix: string;
  }
> = {
  mimo: {
    label: "Mimo Pro",
    defaultBaseURL: "https://token-plan-sgp.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro",
    defaultEmbeddingModel: "",
    supportsEmbeddings: false,
    envKeyPrefix: "MIMO",
  },
  openai: {
    label: "OpenAI",
    defaultBaseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
    envKeyPrefix: "OPENAI",
  },
  lmstudio: {
    label: "LM Studio (Local)",
    defaultBaseURL: "http://localhost:1234/v1",
    defaultModel: "local-model",
    defaultEmbeddingModel: "text-embedding-nomic-embed-text-v1.5",
    supportsEmbeddings: true,
    envKeyPrefix: "LMSTUDIO",
  },
  ollama: {
    label: "Ollama (Local)",
    defaultBaseURL: "http://localhost:11434/v1",
    defaultModel: "llama3",
    defaultEmbeddingModel: "nomic-embed-text",
    supportsEmbeddings: true,
    envKeyPrefix: "OLLAMA",
  },
  openrouter: {
    label: "OpenRouter",
    defaultBaseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
    envKeyPrefix: "OPENROUTER",
  },
  custom: {
    label: "Custom (OpenAI-Compatible)",
    defaultBaseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
    envKeyPrefix: "CUSTOM",
  },
  google: {
    label: "Google Gemini",
    defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.0-flash",
    defaultEmbeddingModel: "text-embedding-004",
    supportsEmbeddings: true,
    envKeyPrefix: "GOOGLE",
  },
};

interface AIProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  embeddingModel: string;
}

/**
 * Get provider config from database settings with environment variable fallback.
 * Settings keys: ai_provider, ai_api_key, ai_base_url, ai_model, ai_embedding_model
 */
async function getProviderConfig(): Promise<AIProviderConfig> {
  const provider = (await getSettingWithFallback(
    "ai_provider",
    "AI_PROVIDER",
    "openai"
  )) as AIProviderType;

  const preset = PROVIDER_PRESETS[provider] || PROVIDER_PRESETS.openai;

  // For providers like LM Studio/Ollama that don't need API keys
  const defaultApiKey =
    provider === "lmstudio"
      ? "lm-studio"
      : provider === "ollama"
        ? "ollama"
        : "";

  const apiKey = await getSettingWithFallback(
    "ai_api_key",
    `${preset.envKeyPrefix}_API_KEY`,
    defaultApiKey
  );

  const baseURL = await getSettingWithFallback(
    "ai_base_url",
    `${preset.envKeyPrefix}_BASE_URL`,
    preset.defaultBaseURL
  );

  const model = await getSettingWithFallback(
    "ai_model",
    `${preset.envKeyPrefix}_MODEL`,
    preset.defaultModel
  );

  const embeddingModel = await getSettingWithFallback(
    "ai_embedding_model",
    `${preset.envKeyPrefix}_EMBEDDING_MODEL`,
    preset.defaultEmbeddingModel
  );

  return { apiKey, baseURL, model, embeddingModel };
}

// Synchronous cache for the OpenAI client (refreshed on config change)
let cachedClient: OpenAI | null = null;
let cachedClientKey = "";

export async function getAIProvider(): Promise<OpenAI> {
  const config = await getProviderConfig();
  const key = `${config.apiKey}|${config.baseURL}`;

  if (cachedClient && cachedClientKey === key) {
    return cachedClient;
  }

  cachedClient = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });
  cachedClientKey = key;
  return cachedClient;
}

export async function getAIModel(): Promise<string> {
  const config = await getProviderConfig();
  return config.model;
}

export async function getEmbeddingModel(): Promise<string> {
  const config = await getProviderConfig();
  return config.embeddingModel;
}

export async function getProviderType(): Promise<AIProviderType> {
  return (await getSettingWithFallback(
    "ai_provider",
    "AI_PROVIDER",
    "openai"
  )) as AIProviderType;
}

export function invalidateProviderCache(): void {
  cachedClient = null;
  cachedClientKey = "";
}

// ============================================================
// Vision Provider Config (separate from main AI provider)
// ============================================================

export interface VisionProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

let cachedVisionConfig: VisionProviderConfig | null = null;
let cachedVisionConfigKey = "";

/**
 * Get vision-specific config from database settings with env fallback.
 * Settings keys: vision_api_key, vision_base_url, vision_model
 * Env vars: VISION_API_KEY, VISION_BASE_URL, VISION_MODEL
 */
export async function getVisionProviderConfig(): Promise<VisionProviderConfig> {
  const apiKey = await getSettingWithFallback(
    "vision_api_key",
    "VISION_API_KEY",
    "" // falls back to main provider
  );

  const baseURL = await getSettingWithFallback(
    "vision_base_url",
    "VISION_BASE_URL",
    "" // falls back to main provider
  );

  const model = await getSettingWithFallback(
    "vision_model",
    "VISION_MODEL",
    "gpt-4o-mini"
  );

  const key = `${apiKey}|${baseURL}|${model}`;
  if (cachedVisionConfig && cachedVisionConfigKey === key) {
    return cachedVisionConfig;
  }

  cachedVisionConfig = { apiKey, baseURL, model };
  cachedVisionConfigKey = key;
  return cachedVisionConfig;
}

export function invalidateVisionConfigCache(): void {
  cachedVisionConfig = null;
  cachedVisionConfigKey = "";
}
