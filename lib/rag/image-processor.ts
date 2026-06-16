/**
 * Image Processing Pipeline for Multimodal RAG
 *
 * Production-grade architecture with 3-tier priority:
 *   Priority 1: Vision Model → OCR + Caption + Summary
 *   Priority 2: PaddleOCR → Text extraction (local, no API key)
 *   Priority 3: REJECT → No chunks, no embeddings, error response
 *
 * CRITICAL: This module NEVER generates content from filenames.
 * If neither Vision nor PaddleOCR can extract text, the image is rejected.
 */

import { readFile } from "fs/promises";
import { getVisionProvider } from "./vision-provider";

// ============================================================
// Types
// ============================================================

export interface ImageProcessingResult {
  ocrText: string;
  caption: string;
  summary: string;
  metadata: ImageMetadata;
}

export interface ImageMetadata {
  extraction_method: "vision" | "paddleocr" | "rejected";
  vision_model: string | null;
  ocr_engine: string | null;
  ocr_confidence: number | null;
  image_width: number | null;
  image_height: number | null;
  text_length: number;
  caption_length: number;
  processing_time_ms: number;
}

export interface ImageChunkData {
  content: string;
  chunk_type: "image_caption" | "image_ocr" | "image_combined";
  ocr_text: string;
  caption: string;
  image_summary: string;
  image_url: string;
  metadata: ImageMetadata;
}

// ============================================================
// PaddleOCR Client (HTTP sidecar)
// ============================================================

interface PaddleOCRResponse {
  success: boolean;
  text: string;
  blocks: Array<{
    text: string;
    confidence: number;
    bbox: number[][];
  }>;
  total_blocks: number;
  total_confidence: number;
  processing_time_ms: number;
  error: string | null;
}

/**
 * Get PaddleOCR service URL from settings or env.
 */
async function getPaddleOCRUrl(): Promise<string> {
  // Dynamic import to avoid circular deps
  const { getSettingWithFallback } = await import("@/lib/settings");
  return getSettingWithFallback(
    "paddleocr_url",
    "PADDLEOCR_URL",
    "http://paddleocr:8090"
  );
}

/**
 * Call PaddleOCR sidecar to extract text from image.
 * Returns extracted text with confidence score.
 */
async function paddleOCR(imagePath: string): Promise<{
  text: string;
  confidence: number;
  blocks: number;
  engine: string;
}> {
  const startTime = Date.now();

  try {
    const baseUrl = await getPaddleOCRUrl();

    // Read image as base64
    const imageBuffer = await readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");

    // Call PaddleOCR sidecar
    const response = await fetch(`${baseUrl}/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_base64: imageBase64,
        language: "latin",
      }),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`PaddleOCR HTTP ${response.status}`);
    }

    const result: PaddleOCRResponse = await response.json();

    if (!result.success) {
      throw new Error(result.error || "PaddleOCR failed");
    }

    const elapsed = Date.now() - startTime;
    console.log(
      `[ImageProcessor] PaddleOCR: ${result.total_blocks} blocks, ` +
        `${result.text.length} chars, confidence=${result.total_confidence.toFixed(2)}, ` +
        `${elapsed}ms`
    );

    return {
      text: result.text,
      confidence: result.total_confidence,
      blocks: result.total_blocks,
      engine: "paddleocr",
    };
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.warn(
      `[ImageProcessor] PaddleOCR failed (${elapsed}ms):`,
      error instanceof Error ? error.message : error
    );
    return { text: "", confidence: 0, blocks: 0, engine: "paddleocr" };
  }
}

// ============================================================
// Image Preprocessing
// ============================================================

async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sharp = require("sharp");
    const buffer = await readFile(imagePath);
    const metadata = await sharp(buffer).metadata();
    return { width: metadata.width || 0, height: metadata.height || 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

async function preprocessImage(imagePath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sharp = require("sharp");
  const buffer = await readFile(imagePath);

  const resized = await sharp(buffer)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  return `data:image/png;base64,${resized.toString("base64")}`;
}

// ============================================================
// Main Processing Pipeline (3-Tier Priority)
// ============================================================

/**
 * Process an image using production-grade 3-tier priority.
 *
 * Pipeline:
 *   1. Vision Model → OCR + Caption + Summary (best quality)
 *   2. PaddleOCR → Text extraction (local fallback)
 *   3. REJECT → No content extracted
 *
 * CRITICAL: Never falls back to filename-based content.
 * If both Vision and PaddleOCR fail, the image is REJECTED.
 */
export async function processImage(
  imagePath: string
): Promise<ImageProcessingResult> {
  const startTime = Date.now();
  const fileName = imagePath.split(/[/\\]/).pop() || "uploaded image";

  // Get image dimensions
  const dimensions = await getImageDimensions(imagePath);

  // ---- Priority 1: Vision Model ----
  let ocrText = "";
  let caption = "";
  let summary = "";
  let visionModel: string | null = null;
  let extractionMethod: "vision" | "paddleocr" | "rejected" = "rejected";
  let ocrConfidence: number | null = null;

  try {
    const dataUrl = await preprocessImage(imagePath);
    const visionProvider = await getVisionProvider();
    const available = await visionProvider.isAvailable();

    if (available) {
      console.log(`[ImageProcessor] Running Vision Model for: ${fileName}`);
      const [ocr, cap, sum] = await Promise.all([
        visionProvider.extractText(dataUrl),
        visionProvider.generateCaption(dataUrl),
        visionProvider.generateSummary(dataUrl),
      ]);

      ocrText = ocr || "";
      caption = cap || "";
      summary = sum || "";
      visionModel = "vision-provider";
      extractionMethod = "vision";
      ocrConfidence = ocrText.length > 10 ? 0.95 : null; // Vision model is high confidence

      console.log(
        `[ImageProcessor] Vision complete: OCR=${ocrText.length} chars, ` +
          `Caption="${caption.substring(0, 50)}..."`
      );
    }
  } catch (error) {
    console.warn(
      `[ImageProcessor] Vision failed:`,
      error instanceof Error ? error.message : error
    );
  }

  // ---- Priority 2: PaddleOCR (if Vision didn't extract text) ----
  if (!ocrText && extractionMethod !== "vision") {
    console.log(`[ImageProcessor] Trying PaddleOCR for: ${fileName}`);
    const paddleResult = await paddleOCR(imagePath);

    if (paddleResult.text.length > 10) {
      ocrText = paddleResult.text;
      ocrConfidence = paddleResult.confidence;
      extractionMethod = "paddleocr";

      // Caption will be auto-filled by generateImageChunks as "Image with extracted text"
      // CRITICAL: Do NOT generate caption from filename — filenames are not knowledge

      console.log(
        `[ImageProcessor] PaddleOCR extracted ${ocrText.length} chars, ` +
          `confidence=${ocrConfidence?.toFixed(2)}`
      );
    }
  }

  // ---- Priority 3: Validation & Rejection ----
  const hasOCR = ocrText.length > 10; // Minimum 10 chars for valid OCR
  const hasCaption = caption.length > 0;

  if (!hasOCR && !hasCaption) {
    // REJECT: Neither Vision nor PaddleOCR produced usable content
    console.warn(
      `[ImageProcessor] REJECTED: No OCR text or caption for ${fileName}. ` +
        `Vision available: false, PaddleOCR: 0 chars. ` +
        `Image will NOT be embedded.`
    );
    extractionMethod = "rejected";
  }

  // Generate summary from available data (only if we have content)
  if (!summary && hasOCR) {
    if (caption) {
      summary = `${caption}\n\nOCR Text:\n${ocrText.substring(0, 500)}`;
    } else {
      summary = `OCR Text:\n${ocrText.substring(0, 500)}`;
    }
  }

  const processingTime = Date.now() - startTime;

  const metadata: ImageMetadata = {
    extraction_method: extractionMethod,
    vision_model: visionModel,
    ocr_engine:
      extractionMethod === "paddleocr" ? "paddleocr" : 
      extractionMethod === "vision" ? visionModel : null,
    ocr_confidence: ocrConfidence,
    image_width: dimensions.width,
    image_height: dimensions.height,
    text_length: ocrText.length,
    caption_length: caption.length,
    processing_time_ms: processingTime,
  };

  return { ocrText, caption, summary, metadata };
}

// ============================================================
// Chunk Generation
// ============================================================

/**
 * Generate image chunks from processing results.
 * Creates appropriate chunk types based on available content.
 *
 * CRITICAL: Only generates chunks if extraction succeeded.
 * Never creates chunks from filenames.
 */
export function generateImageChunks(
  result: ImageProcessingResult,
  imageUrl: string
): ImageChunkData[] {
  const chunks: ImageChunkData[] = [];
  const { ocrText, caption, summary, metadata } = result;

  // Reject if extraction failed
  if (metadata.extraction_method === "rejected") {
    return [];
  }

  const hasOCR = ocrText.length > 10;
  const hasCaption = caption.length > 0;

  // Combined chunk (best quality — has both OCR and caption)
  if (hasOCR && hasCaption) {
    const combinedContent = [
      caption,
      summary ? `\n\nSummary: ${summary}` : "",
      `\n\nOCR Text:\n${ocrText}`,
    ]
      .filter(Boolean)
      .join("");

    chunks.push({
      content: combinedContent,
      chunk_type: "image_combined",
      ocr_text: ocrText,
      caption,
      image_summary: summary,
      image_url: imageUrl,
      metadata,
    });
  }
  // OCR-only chunk (has text but no caption from vision)
  else if (hasOCR) {
    chunks.push({
      content: `OCR Text:\n${ocrText}`,
      chunk_type: "image_ocr",
      ocr_text: ocrText,
      caption: caption || `Image with extracted text`,
      image_summary: summary,
      image_url: imageUrl,
      metadata,
    });
  }
  // Caption-only chunk (has caption from vision but no OCR text)
  else if (hasCaption) {
    chunks.push({
      content: caption,
      chunk_type: "image_caption",
      ocr_text: "",
      caption,
      image_summary: summary,
      image_url: imageUrl,
      metadata,
    });
  }

  return chunks;
}
