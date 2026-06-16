import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  askQuestionSchema,
  searchDocumentsSchema,
  uploadDocumentSchema,
  listDocumentsSchema,
  deleteDocumentSchema,
  getDocumentDetailSchema,
  handleAskQuestion,
  handleSearchDocuments,
  handleUploadDocument,
  handleListDocuments,
  handleGetDocumentDetail,
  handleDeleteDocument,
  handleGetSystemHealth,
} from "./tools";

/**
 * Create a Mimotes MCP server with user-scoped tool access.
 * All tools are scoped to the authenticated user's documents.
 * @param userId - The authenticated user's ID. Required for all data operations.
 */
export function createMimotesMCPServer(userId: string): McpServer {
  const server = new McpServer({
    name: "mimotes",
    version: "1.0.0",
  });

  server.registerTool(
    "ask_question",
    {
      description: "Tanya jawab berbasis dokumen menggunakan RAG. Hanya bisa menjawab berdasarkan dokumen milik user yang sedang login.",
      inputSchema: {
        question: askQuestionSchema.shape.question,
        topK: askQuestionSchema.shape.topK,
      },
    },
    async (args) => handleAskQuestion(args, userId)
  );

  server.registerTool(
    "search_documents",
    {
      description: "Cari chunk dokumen yang mirip dengan query. Hanya mencari di dokumen milik user yang sedang login.",
      inputSchema: {
        query: searchDocumentsSchema.shape.query,
        topK: searchDocumentsSchema.shape.topK,
        threshold: searchDocumentsSchema.shape.threshold,
        documentId: searchDocumentsSchema.shape.documentId,
      },
    },
    async (args) => handleSearchDocuments(args, userId)
  );

  server.registerTool(
    "upload_document",
    {
      description: "Upload URL website untuk di-scrape dan dijadikan dokumen di knowledge base Mimotes. Dokumen akan dimiliki oleh user yang sedang login.",
      inputSchema: {
        url: uploadDocumentSchema.shape.url,
        title: uploadDocumentSchema.shape.title,
      },
    },
    async (args) => handleUploadDocument(args, userId)
  );

  server.registerTool(
    "list_documents",
    {
      description: "Lihat daftar dokumen yang tersedia di knowledge base. Hanya menampilkan dokumen milik user yang sedang login.",
      inputSchema: {
        page: listDocumentsSchema.shape.page,
        limit: listDocumentsSchema.shape.limit,
        search: listDocumentsSchema.shape.search,
        status: listDocumentsSchema.shape.status,
      },
    },
    async (args) => handleListDocuments(args, userId)
  );

  server.registerTool(
    "get_document_detail",
    {
      description: "Lihat detail dokumen termasuk preview chunk-chunknya. Hanya bisa melihat dokumen milik user yang sedang login.",
      inputSchema: {
        documentId: getDocumentDetailSchema.shape.documentId,
      },
    },
    async (args) => handleGetDocumentDetail(args, userId)
  );

  server.registerTool(
    "delete_document",
    {
      description: "Hapus dokumen dari knowledge base. Hanya bisa menghapus dokumen milik user yang sedang login.",
      inputSchema: {
        documentId: deleteDocumentSchema.shape.documentId,
      },
    },
    async (args) => handleDeleteDocument(args, userId)
  );

  server.registerTool(
    "get_system_health",
    {
      description: "Cek status kesehatan sistem Mimotes termasuk koneksi database, vector store, dan statistik dokumen.",
      inputSchema: {},
    },
    async () => handleGetSystemHealth()
  );

  return server;
}
