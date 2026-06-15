import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId, setWorkspaceContext } from "@/lib/prisma";

/**
 * GET /api/knowledge/images
 * Lists all documents where fileType is an image type.
 * Returns image preview URL, OCR text, caption, and embedding status.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    // Set workspace context
    const workspaceId = await resolveWorkspaceId(session.user.id! as string);
    await setWorkspaceContext(workspaceId);

    // Image file types
    const imageTypes = ["png", "jpg", "jpeg", "webp", "image"];

    // Count total image documents
    const total = await prisma.document.count({
      where: {
        workspaceId,
        fileType: { in: imageTypes },
      },
    });

    // Fetch image documents with their first chunk (multimodal data)
    const documents = await prisma.document.findMany({
      where: {
        workspaceId,
        fileType: { in: imageTypes },
      },
      include: {
        chunks: {
          take: 1,
          orderBy: { chunkIndex: "asc" },
          select: {
            ocrText: true,
            caption: true,
            imageSummary: true,
            imageUrl: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const images = documents.map((doc) => {
      const chunk = doc.chunks[0] || null;
      return {
        id: doc.id,
        title: doc.title,
        fileType: doc.fileType,
        fileUrl: doc.fileUrl,
        status: doc.status,
        chunkCount: doc.chunkCount,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        ocrText: chunk?.ocrText || null,
        caption: chunk?.caption || null,
        imageSummary: chunk?.imageSummary || null,
        imageUrl: chunk?.imageUrl || doc.fileUrl,
      };
    });

    return Response.json({
      images,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Knowledge images API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
