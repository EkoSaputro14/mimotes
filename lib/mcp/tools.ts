import { z } from "zod";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { generateRAGResponse } from "@/lib/rag/chain";
import { generateEmbedding } from "@/lib/rag/embedder";
import { searchSimilarChunks } from "@/lib/rag/vectorstore";
import { parseFile } from "@/lib/rag/parser";
import { chunkText } from "@/lib/rag/chunker";
import { storeChunks } from "@/lib/rag/vectorstore";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export const askQuestionSchema = z.object({
  question: z.string().describe("Pertanyaan yang akan dijawab berdasarkan dokumen"),
  topK: z.number().optional().default(5).describe("Jumlah chunk yang digunakan sebagai konteks (1-20)"),
});

export const searchDocumentsSchema = z.object({
  query: z.string().describe("Query untuk similarity search"),
  topK: z.number().optional().default(5).describe("Jumlah hasil yang dikembalikan"),
  threshold: z.number().optional().default(0).describe("Threshold similarity minimum (0-1)"),
  documentId: z.string().optional().describe("Filter berdasarkan dokumen tertentu"),
});

export const uploadDocumentSchema = z.object({
  url: z.string().url().describe("URL website untuk di-scrape dan dijadikan dokumen"),
  title: z.string().optional().describe("Judul dokumen (opsional, menggunakan URL jika kosong)"),
});

export const listDocumentsSchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const deleteDocumentSchema = z.object({
  documentId: z.string().uuid().describe("ID dokumen yang akan dihapus"),
});

export const getDocumentDetailSchema = z.object({
  documentId: z.string().uuid().describe("ID dokumen"),
});

function createTextResult(text: string, isError = false): CallToolResult {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

/**
 * Ask a question using RAG — searches only the authenticated user's documents.
 */
export async function handleAskQuestion(
  args: z.infer<typeof askQuestionSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    const result = await generateRAGResponse(args.question, args.topK, workspaceId);

    const sourcesText = result.sources
      .map(
        (s, i) =>
          `[${i + 1}] Similarity: ${(s.similarity * 100).toFixed(1)}%\n${s.content.substring(0, 200)}...`
      )
      .join("\n\n");

    return createTextResult(
      `Jawaban:\n${result.answer}\n\nSumber Referensi:\n${sourcesText}`
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * Search documents — searches only the authenticated user's chunks.
 */
export async function handleSearchDocuments(
  args: z.infer<typeof searchDocumentsSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const workspaceId = await resolveWorkspaceId(userId);
    const embedding = await generateEmbedding(args.query);
    const { chunks: allChunks } = await searchSimilarChunks(embedding, args.topK, workspaceId, args.threshold > 0 ? args.threshold : 0.30);

    const results = args.documentId
      ? allChunks.filter((r) => r.documentId === args.documentId)
      : allChunks;

    const resultsText = results
      .map(
        (r, i) =>
          `[${i + 1}] Document: ${r.documentId}\nSimilarity: ${(r.similarity * 100).toFixed(1)}%\nContent: ${r.content.substring(0, 300)}...`
      )
      .join("\n\n");

    return createTextResult(
      results.length > 0
        ? `Ditemukan ${results.length} chunk yang relevan:\n\n${resultsText}`
        : "Tidak ditemukan chunk yang relevan dengan query tersebut."
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * Upload a document via URL — creates document under the authenticated user.
 */
export async function handleUploadDocument(
  args: z.infer<typeof uploadDocumentSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const title = args.title || args.url;
    const fileType = "url";

    const parsed = await parseFile(Buffer.from(""), "url", args.url);
    const rawContent = parsed.content;

    const workspaceId = await resolveWorkspaceId(userId);
    const document = await prisma.document.create({
      data: {
        title,
        fileType,
        fileUrl: args.url,
        status: "processing",
        userId,
        workspaceId,
      },
    });

    processDocument(document.id, workspaceId, rawContent).catch((error) => {
      console.error("Document processing error:", error);
      prisma.document
        .update({
          where: { id: document.id },
          data: { status: "failed" },
        })
        .catch(() => {});
    });

    return createTextResult(
      `Dokumen berhasil dibuat!\nID: ${document.id}\nJudul: ${title}\nStatus: processing\n\nDokumen sedang diproses (chunking + embedding). Gunakan tool get_document_detail untuk memeriksa status.`
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * List documents — returns only the authenticated user's documents.
 */
export async function handleListDocuments(
  args: z.infer<typeof listDocumentsSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const where: Record<string, unknown> = { userId };

    if (args.search) {
      where.title = { contains: args.search, mode: "insensitive" };
    }
    if (args.status) {
      where.status = args.status;
    }

    const skip = (args.page - 1) * args.limit;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take: args.limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { chunks: true } } },
      }),
      prisma.document.count({ where }),
    ]);

    const docsText = documents
      .map(
        (d) =>
          `- ${d.title}\n  ID: ${d.id}\n  Type: ${d.fileType}\n  Status: ${d.status}\n  Chunks: ${d._count.chunks}\n  Created: ${d.createdAt.toISOString()}`
      )
      .join("\n\n");

    return createTextResult(
      documents.length > 0
        ? `Daftar Dokumen (${documents.length} dari ${total}):\n\n${docsText}`
        : "Tidak ada dokumen ditemukan."
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * Get document detail — returns only the authenticated user's document.
 */
export async function handleGetDocumentDetail(
  args: z.infer<typeof getDocumentDetailSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const document = await prisma.document.findFirst({
      where: { id: args.documentId, userId },
      include: {
        chunks: {
          select: { id: true, content: true, chunkIndex: true, metadata: true },
          orderBy: { chunkIndex: "asc" },
        },
      },
    });

    if (!document) {
      return createTextResult("Dokumen tidak ditemukan.", true);
    }

    const chunksText = document.chunks
      .slice(0, 10)
      .map(
        (c) =>
          `[Chunk ${c.chunkIndex}] ${c.content.substring(0, 200)}...`
      )
      .join("\n\n");

    return createTextResult(
      `Detail Dokumen:
ID: ${document.id}
Judul: ${document.title}
Tipe: ${document.fileType}
Status: ${document.status}
Jumlah Chunk: ${document.chunks.length}
URL: ${document.fileUrl || "-"}
Dibuat: ${document.createdAt.toISOString()}

Preview Chunks (10 pertama):
${chunksText || "Belum ada chunk"}`
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * Delete document — deletes only the authenticated user's document.
 */
export async function handleDeleteDocument(
  args: z.infer<typeof deleteDocumentSchema>,
  userId: string
): Promise<CallToolResult> {
  try {
    const document = await prisma.document.findFirst({
      where: { id: args.documentId, userId },
    });

    if (!document) {
      return createTextResult("Dokumen tidak ditemukan.", true);
    }

    await prisma.document.delete({ where: { id: args.documentId } });

    return createTextResult(
      `Dokumen "${document.title}" (ID: ${args.documentId}) berhasil dihapus beserta semua chunk-nya.`
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

/**
 * Get system health — read-only, no user filtering needed.
 */
export async function handleGetSystemHealth(): Promise<CallToolResult> {
  try {
    const checks: Array<{ service: string; status: string; message: string }> = [];

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.push({ service: "database", status: "ok", message: "PostgreSQL connected" });
    } catch {
      checks.push({ service: "database", status: "error", message: "PostgreSQL connection failed" });
    }

    try {
      const count = await prisma.documentChunk.count();
      checks.push({
        service: "vectorstore",
        status: "ok",
        message: `${count} chunks in database`,
      });
    } catch {
      checks.push({ service: "vectorstore", status: "error", message: "Vector store query failed" });
    }

    const totalDocs = await prisma.document.count();
    const readyDocs = await prisma.document.count({ where: { status: "ready" } });
    const processingDocs = await prisma.document.count({ where: { status: "processing" } });
    const failedDocs = await prisma.document.count({ where: { status: "failed" } });

    const checksText = checks.map((c) => `- ${c.service}: ${c.status} - ${c.message}`).join("\n");

    return createTextResult(
      `System Health:\n${checksText}\n\nStatistik Dokumen:\n- Total: ${totalDocs}\n- Ready: ${readyDocs}\n- Processing: ${processingDocs}\n- Failed: ${failedDocs}`
    );
  } catch (error) {
    return createTextResult(
      `Error: ${error instanceof Error ? error.message : "Terjadi kesalahan"}`,
      true
    );
  }
}

async function processDocument(documentId: string, workspaceId: string, rawContent: string) {
  const chunks = chunkText(rawContent);
  const embeddings = await Promise.all(
    chunks.map((c) => generateEmbedding(c.content))
  );

  const chunkData = chunks.map((chunk, index) => ({
    content: chunk.content,
    embedding: embeddings[index],
    index: chunk.index,
    metadata: chunk.metadata,
  }));

  await storeChunks(documentId, workspaceId, chunkData);

  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "ready",
      chunkCount: chunks.length,
    },
  });
}
