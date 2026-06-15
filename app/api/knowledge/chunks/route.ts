import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const documentId = searchParams.get("documentId") || "";

    const where: Record<string, unknown> = {};

    // Filter by user's documents only
    if (documentId) {
      // Verify document belongs to user
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: session.user.id! },
        select: { id: true },
      });
      if (!doc) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }
      where.documentId = documentId;
    } else {
      // Only chunks from user's documents
      const userDocs = await prisma.document.findMany({
        where: { userId: session.user.id! },
        select: { id: true },
      });
      where.documentId = { in: userDocs.map((d) => d.id) };
    }

    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    const [chunks, total] = await Promise.all([
      prisma.documentChunk.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          content: true,
          chunkIndex: true,
          metadata: true,
          createdAt: true,
          document: {
            select: { id: true, title: true, fileType: true },
          },
        },
      }),
      prisma.documentChunk.count({ where }),
    ]);

    return Response.json({
      chunks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Knowledge chunks API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
