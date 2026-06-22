import { NextRequest } from "next/server";
import { generateRAGResponse } from "@/lib/rag/chain";
import { prisma, setWorkspaceContext, resolveWorkspaceId } from "@/lib/prisma";

/**
 * POST /api/whatsapp/n8n
 * 
 * API endpoint untuk n8n workflow.
 * Menerima pesan dari n8n, proses dengan AI, kirim response balik.
 * 
 * Body: {
 *   message: string,
 *   phone: string,
 *   sessionId?: string,
 *   workspaceId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, phone, sessionId, workspaceId } = body;

    if (!message || !phone || !workspaceId) {
      return Response.json(
        { error: "message, phone, and workspaceId are required" },
        { status: 400 }
      );
    }

    // Set workspace context for RLS
    await setWorkspaceContext(workspaceId);

    // Get or create session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          workspaceId,
          title: `WhatsApp: ${phone}`,
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "user",
        content: message,
      },
    });

    // Generate RAG response
    const response = await generateRAGResponse(message, session.id, workspaceId);

    // Save assistant message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: "assistant",
        content: response,
      },
    });

    return Response.json({
      success: true,
      response,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("[n8n] API error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/whatsapp/n8n
 * Health check endpoint
 */
export async function GET() {
  return Response.json({
    status: "ok",
    service: "mimotes-n8n-bridge",
    timestamp: new Date().toISOString(),
  });
}
