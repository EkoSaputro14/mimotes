import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";
import { createWidget } from "@/lib/widget";

/**
 * POST /api/wizard/create
 * Create a widget via the chatbot wizard.
 * 
 * Accepts multipart/form-data:
 * - botName: string
 * - primaryColor: string
 * - welcomeMessage: string
 * - documents: File[]
 */
export async function POST(request: NextRequest) {
  try {
    // Auth required
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: { code: "unauthorized", message: "Login required" } },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const workspaceId = await resolveWorkspaceId(userId);

    // Parse form data
    const formData = await request.formData();
    const botName = formData.get("botName") as string;
    const primaryColor = formData.get("primaryColor") as string;
    const welcomeMessage = formData.get("welcomeMessage") as string;
    const documentFiles = formData.getAll("documents") as File[];

    // Validate
    if (!botName || botName.trim().length < 2) {
      return Response.json(
        { error: { code: "invalid_request", message: "Bot name required (min 2 chars)" } },
        { status: 400 }
      );
    }

    if (!primaryColor) {
      return Response.json(
        { error: { code: "invalid_request", message: "Primary color required" } },
        { status: 400 }
      );
    }

    if (!welcomeMessage) {
      return Response.json(
        { error: { code: "invalid_request", message: "Welcome message required" } },
        { status: 400 }
      );
    }

    // Create widget
    const slug = botName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const widget = await createWidget(workspaceId, botName, slug, {
      primaryColor,
      welcomeMessage,
      leadCaptureEnabled: false,
    });

    // Create document records (processing will happen via existing upload flow)
    const uploadedDocs = [];
    for (const file of documentFiles) {
      try {
        const doc = await prisma.document.create({
          data: {
            userId,
            workspaceId,
            title: file.name,
            fileType: file.name.split(".").pop() || "txt",
            status: "processing",
          },
          });
        uploadedDocs.push(doc);
      } catch (error) {
        console.error(`[Wizard] Document record error:`, error);
      }
    }

    return Response.json({
      success: true,
      widget: {
        id: widget.id,
        name: widget.name,
        slug: widget.slug,
        publicKey: widget.publicKey,
        secretKey: widget.secretKey,
      },
      documents: uploadedDocs.map((d) => ({
        id: d.id,
        title: d.title,
        status: d.status,
      })),
    });
  } catch (error) {
    console.error("[Wizard] Error:", error);
    return Response.json(
      { error: { code: "internal_error", message: "Failed to create chatbot" } },
      { status: 500 }
    );
  }
}
