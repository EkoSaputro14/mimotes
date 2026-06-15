import OpenAI from "openai";
import { getSettingWithFallback } from "@/lib/settings";

// ============================================================
// Vision Provider Abstraction
// ============================================================

export interface VisionProvider {
  /**
   * Extract all visible text from an image (OCR).
   */
  extractText(dataUrl: string): Promise<string>;

  /**
   * Generate a concise caption for the image.
   */
  generateCaption(dataUrl: string): Promise<string>;

  /**
   * Generate a detailed summary of the image content.
   */
  generateSummary(dataUrl: string): Promise<string>;

  /**
   * Check if this provider supports image input.
   */
  isAvailable(): Promise<boolean>;
}

// ============================================================
// Vision Config
// ============================================================

interface VisionConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

/**
 * Get vision-specific config.
 * Priority: DB setting > env variable > falls back to main AI provider.
 *
 * Settings:
 *   vision_api_key   / VISION_API_KEY
 *   vision_base_url  / VISION_BASE_URL
 *   vision_model     / VISION_MODEL
 */
async function getVisionConfig(): Promise<VisionConfig> {
  // Vision model config — separate from main AI model
  const apiKey = await getSettingWithFallback(
    "vision_api_key",
    "VISION_API_KEY",
    "" // falls back to main provider key in getOpenAIClient
  );

  const baseURL = await getSettingWithFallback(
    "vision_base_url",
    "VISION_BASE_URL",
    "" // falls back to main provider URL
  );

  const model = await getSettingWithFallback(
    "vision_model",
    "VISION_MODEL",
    "gpt-4o-mini" // default vision model
  );

  return { apiKey, baseURL, model };
}

// ============================================================
// OpenAI Vision Provider
// ============================================================

class OpenAIVisionProvider implements VisionProvider {
  private client: OpenAI | null = null;
  private config: VisionConfig | null = null;

  private async getClient(): Promise<{ client: OpenAI; model: string }> {
    if (this.client && this.config) {
      return { client: this.client, model: this.config.model };
    }

    this.config = await getVisionConfig();

    // If no vision-specific API key, fall back to main AI provider
    if (!this.config.apiKey) {
      const { getAIProvider, getAIModel } = await import("@/lib/ai-provider");
      const mainClient = await getAIProvider();
      const mainModel = await getAIModel();
      // Use main client but with vision model (or main model if no vision model)
      return { client: mainClient, model: this.config.model || mainModel };
    }

    // Create dedicated vision client
    this.client = new OpenAI({
      apiKey: this.config.apiKey,
      baseURL: this.config.baseURL || "https://api.openai.com/v1",
    });

    return { client: this.client, model: this.config.model };
  }

  async isAvailable(): Promise<boolean> {
    try {
      const { client, model } = await this.getClient();
      // Quick probe: send a tiny image and check for 404
      const testResult = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Say 'ok' if you can see this message.",
              },
              {
                type: "image_url",
                image_url: {
                  url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                },
              },
            ],
          },
        ],
        max_tokens: 10,
      });

      const text = testResult.choices[0]?.message?.content || "";
      return text.length > 0 && !text.toLowerCase().includes("no vision");
    } catch {
      return false;
    }
  }

  async extractText(dataUrl: string): Promise<string> {
    try {
      const { client, model } = await this.getClient();
      const result = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract ALL visible text from this image exactly as it appears. Preserve the original layout and formatting. Output ONLY the extracted text, nothing else.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      return result.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.warn(
        "[VisionProvider] OCR extraction failed:",
        error instanceof Error ? error.message : error
      );
      return "";
    }
  }

  async generateCaption(dataUrl: string): Promise<string> {
    try {
      const { client, model } = await this.getClient();
      const result = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate a concise, descriptive caption for this image in one sentence. The caption should capture the main subject and context.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      return result.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.warn(
        "[VisionProvider] Caption generation failed:",
        error instanceof Error ? error.message : error
      );
      return "";
    }
  }

  async generateSummary(dataUrl: string): Promise<string> {
    try {
      const { client, model } = await this.getClient();
      const result = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Provide a detailed summary of this image in 2-3 sentences. Describe the key elements, their relationships, and any notable details.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      return result.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      console.warn(
        "[VisionProvider] Summary generation failed:",
        error instanceof Error ? error.message : error
      );
      return "";
    }
  }
}

// ============================================================
// Factory
// ============================================================

let cachedVisionProvider: VisionProvider | null = null;

/**
 * Get the vision provider instance.
 * Currently only OpenAI-compatible providers are supported.
 */
export async function getVisionProvider(): Promise<VisionProvider> {
  if (!cachedVisionProvider) {
    cachedVisionProvider = new OpenAIVisionProvider();
  }
  return cachedVisionProvider;
}

/**
 * Invalidate the cached vision provider (e.g., after config change).
 */
export function invalidateVisionProviderCache(): void {
  cachedVisionProvider = null;
}
