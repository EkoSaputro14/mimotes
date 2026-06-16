import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";

    // Verify document belongs to user
    const document = await prisma.document.findFirst({
      where: { id, userId: session.user.id! },
      select: { id: true, title: true, fileType: true, status: true, chunkCount: true, createdAt: true },
    });

    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    const where: Record<string, unknown> = { documentId: id };
    if (search) {
      where.content = { contains: search, mode: "insensitive" };
    }

    const [chunks, total] = await Promise.all([
      prisma.documentChunk.findMany({
        where,
        orderBy: { chunkIndex: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          content: true,
          chunkIndex: true,
          metadata: true,
          createdAt: true,
          document: {
            select: {
              id: true,
              title: true,
              fileType: true,
            },
          },
        },
      }),
      prisma.documentChunk.count({ where }),
    ]);

    return Response.json({
      document,
      chunks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Document chunks API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
