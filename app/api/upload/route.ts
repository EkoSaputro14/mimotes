import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { setWorkspaceContext, resolveWorkspaceId, prisma } from "@/lib/prisma";
import { recordAnalyticsEvent } from "@/lib/analytics";
import { requireRole } from "@/lib/rbac";
import { checkLimit, checkLimitWithAmount } from "@/lib/usage";
import { trackDocumentUpload, trackChunks, trackEmbeddingRequest } from "@/lib/usage";
import { writeFile, mkdir, readFile } from "fs/promises";
import { join, basename } from "path";
import { parseFile } from "@/lib/rag/parser";
import { processImage, generateImageChunks } from "@/lib/rag/image-processor";
import { sanitizeFilename } from "@/lib/url-security";
import { chunkText } from "@/lib/rag/chunker";
import { generateEmbeddings } from "@/lib/rag/embedder";
import { storeChunks } from "@/lib/rag/vectorstore";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";

// Max file size: 10MB default (configurable via MAX_FILE_SIZE env var)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    if (!file && !url) {
      return Response.json(
        { error: "File atau URL diperlukan" },
        { status: 400 }
      );
    }

    let fileType: string;
    let title: string;
    let fileUrl: string | null = null;
    let rawContent: string;

    if (url) {
      // URL upload — pre-validate URL format before passing to parser
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return Response.json(
            { error: "Hanya URL HTTP dan HTTPS yang didukung" },
            { status: 400 }
          );
        }
      } catch {
        return Response.json(
          { error: "Format URL tidak valid" },
          { status: 400 }
        );
      }

      fileType = "url";
      title = url;
      fileUrl = url;
      const parsed = await parseFile(Buffer.from(""), "url", url);
      rawContent = parsed.content;
    } else if (file) {
      // File upload
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        const maxSizeMB = Math.round(MAX_FILE_SIZE / 1048576);
        return Response.json(
          { error: `Ukuran file terlalu besar. Maksimal ${maxSizeMB}MB.` },
          { status: 413 }
        );
      }

      const rawName = basename(file.name);
      const fileName = sanitizeFilename(rawName);
      if (!fileName) {
        return Response.json(
          { error: "Nama file tidak valid" },
          { status: 400 }
        );
      }
      const ext = fileName.split(".").pop()?.toLowerCase() || "";

      // Determine file type
      const validTypes: Record<string, string> = {
        pdf: "pdf",
        docx: "docx",
        txt: "txt",
        csv: "csv",
        xlsx: "xlsx",
        xls: "xlsx",
        png: "image",
        jpg: "image",
        jpeg: "image",
        webp: "image",
      };

      if (!validTypes[ext]) {
        return Response.json(
          { error: "Tipe file tidak didukung. Gunakan PDF, DOCX, TXT, CSV, atau XLSX" },
          { status: 400 }
        );
      }

      fileType = validTypes[ext];
      title = fileName;

      // Save file to disk
      const uploadDir = join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });

      const uniqueName = `${Date.now()}-${fileName}`;
      const filePath = join(uploadDir, uniqueName);
      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      fileUrl = `/uploads/${uniqueName}`;

      // Parse file content (images handled separately by processImageDocument)
      if (fileType === "image") {
        rawContent = "";
      } else {
        const fileBuffer = await readFile(filePath);
        const parsed = await parseFile(fileBuffer, fileType);
        rawContent = parsed.content;
      }
    } else {
      return Response.json(
        { error: "File atau URL diperlukan" },
        { status: 400 }
      );
    }

    // Create document record
    const userId = session.user.id! as string;

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(userId);
    await setWorkspaceContext(workspaceId);

    // Require editor role to upload documents
    await requireRole(workspaceId, userId, "editor");

    // Check document limit
    await checkLimit(workspaceId, "maxDocuments");

    const document = await prisma.document.create({
      data: {
        userId,
        workspaceId,
        title,
        fileType,
        fileUrl,
        status: "processing",
      },
    });

    // Process in background (don't await to return quickly)
    if (fileType === "image") {
      processImageDocument(document.id, workspaceId, fileUrl!, file?.size ?? 0).catch((error) => {
        console.error("Image processing error:", error);
        prisma.document.update({
          where: { id: document.id },
          data: { status: "failed" },
        });
      });
    } else {
      processDocument(document.id, workspaceId, rawContent, file?.size ?? 0).catch((error) => {
        console.error("Document processing error:", error);
        prisma.document.update({
          where: { id: document.id },
          data: { status: "failed" },
        });
      });
    }

    // Record upload event
    recordAnalyticsEvent("document_upload", {
      documentId: document.id,
      fileType,
      title,
    }, session.user.id!).catch(() => {});

    // Audit: document uploaded
    logAudit({
      workspaceId,
      actorId: session.user.id! as string,
      actorType: "user",
      action: AUDIT_ACTIONS.DOCUMENT_UPLOAD,
      resourceType: "document",
      resourceId: document.id,
      metadata: { title, fileType, url: url || null, size: file?.size ?? 0 },
    });

    return Response.json({
      id: document.id,
      title: document.title,
      status: "processing",
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat mengupload" },
      { status: 500 }
    );
  }
}

async function processDocument(documentId: string, workspaceId: string, rawContent: string, fileSize: number) {
  // Set workspace context for RLS — background task runs in separate context
  await setWorkspaceContext(workspaceId);

  // Skip if empty content (image files have empty content — handled by processImageDocument)
  if (!rawContent.trim()) {
    return;
  }

  // Chunk the content
  const chunks = chunkText(rawContent);

  // Generate embeddings
  const embeddings = await generateEmbeddings(chunks.map((c) => c.content));

  // Store chunks with embeddings — tenant_id written directly to each chunk
  const chunkData = chunks.map((chunk, index) => ({
    content: chunk.content,
    embedding: embeddings[index],
    index: chunk.index,
    metadata: chunk.metadata,
  }));

  await storeChunks(documentId, workspaceId, chunkData);

  // Update document status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "ready",
      chunkCount: chunks.length,
    },
  });

  // Track usage (fire-and-forget)
  // Check limits before tracking
  try {
    await checkLimit(workspaceId, "maxDocuments");
    await checkLimitWithAmount(workspaceId, "maxStorageMB", Math.ceil(fileSize / (1024 * 1024)));
  } catch (error) {
    if (error instanceof Error && error.name === "LimitExceededError") {
      return Response.json(
        { error: error.message, limitExceeded: true },
        { status: 429 }
      );
    }
  }

  trackDocumentUpload(workspaceId, fileSize).catch(() => {});
  trackChunks(workspaceId, chunks.length).catch(() => {});
  trackEmbeddingRequest(workspaceId).catch(() => {});
}

/**
 * Process an image document: run OCR + vision captioning, then store multimodal chunks.
 * Uses the file URL relative to public/ to read from disk.
 *
 * Hardened pipeline:
 *   1. Vision Model → OCR + Caption + Summary
 *   2. Tesseract OCR → Text extraction fallback
 *   3. Validation → Reject if both empty
 *   4. Generate appropriate chunk types
 *   5. Track analytics
 */
async function processImageDocument(
  documentId: string,
  workspaceId: string,
  fileUrl: string,
  fileSize: number
) {
  // Set workspace context for RLS — background task runs in separate context
  await setWorkspaceContext(workspaceId);

  // Convert public/ URL to absolute path for processing
  const imagePath = join(process.cwd(), "public", fileUrl);

  // Run hardened image processing pipeline
  const result = await processImage(imagePath);

  // Track image ingestion analytics
  recordAnalyticsEvent("image_ingestion", {
    documentId,
    extractionMethod: result.metadata.extraction_method,
    visionModel: result.metadata.vision_model,
    ocrEngine: result.metadata.ocr_engine,
    ocrTextLength: result.metadata.text_length,
    captionLength: result.metadata.caption_length,
    processingTimeMs: result.metadata.processing_time_ms,
    imageWidth: result.metadata.image_width,
    imageHeight: result.metadata.image_height,
  }, workspaceId).catch(() => {});

  // If rejected (no content), mark document as failed
  if (result.metadata.extraction_method === "rejected") {
    console.warn(
      `[Upload] Image rejected — no OCR text or caption: ${fileUrl}`
    );
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed" },
    });

    recordAnalyticsEvent("image_rejection", {
      documentId,
      reason: "no_ocr_no_caption",
      fileName: fileUrl,
    }, workspaceId).catch(() => {});

    return;
  }

  // Generate appropriate chunks based on content
  const imageChunks = generateImageChunks(result, fileUrl);

  if (imageChunks.length === 0) {
    console.warn(`[Upload] No chunks generated for image: ${fileUrl}`);
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "failed" },
    });
    return;
  }

  // Generate embeddings for each chunk
  const contents = imageChunks.map((c) => c.content);
  const embeddings = await generateEmbeddings(contents);

  // Store chunks
  for (let i = 0; i < imageChunks.length; i++) {
    const chunk = imageChunks[i];
    const embedding = embeddings[i];

    const chunkMetadata = {
      source: "image",
      chunk_type: chunk.chunk_type,
      extraction_method: chunk.metadata.extraction_method,
      vision_model: chunk.metadata.vision_model,
      ocr_engine: chunk.metadata.ocr_engine,
      image_width: chunk.metadata.image_width,
      image_height: chunk.metadata.image_height,
      text_length: chunk.metadata.text_length,
      caption_length: chunk.metadata.caption_length,
      processing_time_ms: chunk.metadata.processing_time_ms,
    };

    await prisma.$executeRaw`
      INSERT INTO document_chunks (
        id, document_id, workspace_id, tenant_id, content, embedding,
        chunk_index, metadata, chunk_type, ocr_text, caption, image_summary, image_url, created_at
      ) VALUES (
        gen_random_uuid(), ${documentId}, ${workspaceId}, ${workspaceId},
        ${chunk.content},
        ${`[${embedding.join(",")}]`}::vector,
        ${i}, ${JSON.stringify(chunkMetadata)}::jsonb,
        ${chunk.chunk_type}, ${chunk.ocr_text}, ${chunk.caption}, ${chunk.image_summary}, ${chunk.image_url},
        NOW()
      )
    `;
  }

  // Update document status
  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "ready",
      chunkCount: imageChunks.length,
    },
  });

  // Track usage
  trackDocumentUpload(workspaceId, fileSize).catch(() => {});
  trackChunks(workspaceId, imageChunks.length).catch(() => {});
  trackEmbeddingRequest(workspaceId).catch(() => {});

  // Track successful image processing
  recordAnalyticsEvent("image_processing_success", {
    documentId,
    chunkCount: imageChunks.length,
    chunkTypes: imageChunks.map((c) => c.chunk_type),
    extractionMethod: result.metadata.extraction_method,
  }, workspaceId).catch(() => {});
}
