/**
 * OpenAI Embedding Provider
 *
 * Uses OpenAI's embeddings API (text-embedding-3-small by default).
 * Produces 1536-dimensional vectors natively.
 * Requires an API key.
 */

import OpenAI from "openai";
import type { EmbeddingProvider, EmbeddingProviderConfig } from "./types";

const EMBEDDING_DIMENSION = 1536;
const MAX_BATCH_SIZE = 100;
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;
const DEFAULT_MODEL = "text-embedding-3-small";
const COST_PER_MILLION_TOKENS = 0.02;

/**
 * Sleep for a specified number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OpenAIProvider implements EmbeddingProvider {
  private client: OpenAI;
  private model: string;
  private apiKey: string;

  constructor(config: EmbeddingProviderConfig = {}) {
    this.apiKey = config.apiKey || "";
    this.model = config.model || DEFAULT_MODEL;
    this.client = new OpenAI({
      apiKey: this.apiKey,
      baseURL: config.baseUrl || "https://api.openai.com/v1",
    });
  }

  async embed(text: string): Promise<number[]> {
    return this.withRetry(async () => {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      });
      return response.data[0].embedding;
    }, "Single embedding API call");
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);

      const batchEmbeddings = await this.withRetry(async () => {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
        });
        return response.data.map((item) => item.embedding);
      }, `Batch embedding API call (batch ${Math.floor(i / MAX_BATCH_SIZE) + 1})`);

      allEmbeddings.push(...batchEmbeddings);
    }

    return allEmbeddings;
  }

  getDimension(): number {
    return EMBEDDING_DIMENSION;
  }

  async isAvailable(): Promise<boolean> {
    return this.apiKey.length > 0;
  }

  getName(): string {
    return "openai";
  }

  getCostPerMillionTokens(): number | null {
    return COST_PER_MILLION_TOKENS;
  }

  /**
   * Call an API function with exponential backoff retry.
   */
  private async withRetry<T>(
    fn: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < MAX_RETRIES) {
          const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
          console.warn(
            `[OpenAIProvider] ${context} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms:`,
            lastError.message
          );
          await sleep(delay);
        }
      }
    }

    throw lastError;
  }
}
