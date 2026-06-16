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
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const search = searchParams.get("search") || "";
    const fileType = searchParams.get("fileType") || searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const folderId = searchParams.get("folderId") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") || "desc";

    const where: Record<string, unknown> = { userId: session.user.id! };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }
    if (fileType) {
      where.fileType = fileType;
    }
    if (status) {
      where.status = status;
    }
    if (folderId) {
      where.folderId = folderId;
    } else if (searchParams.has("folderId") && !folderId) {
      // If folderId param exists but is empty, show only unfiled documents
      where.folderId = null;
    }

    const orderBy: Record<string, string> = {};
    const validSorts = ["createdAt", "title", "fileType", "status", "chunkCount", "updatedAt"];
    if (validSorts.includes(sort)) {
      orderBy[sort] = order === "asc" ? "asc" : "desc";
    } else {
      orderBy.createdAt = "desc";
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { chunks: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return Response.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Knowledge documents API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
