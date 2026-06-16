import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma, resolveWorkspaceId } from "@/lib/prisma";

/** GET /api/ai/prompts — List all prompt templates */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (category && category !== "all") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const prompts = await prisma.promptTemplate.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { versions: true } },
      },
    });

    return Response.json(prompts);
  } catch (error) {
    console.error("GET /api/ai/prompts error:", error);
    return Response.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

/** POST /api/ai/prompts — Create a new prompt template */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id! as string;
    const workspaceId = await resolveWorkspaceId(userId);
    const body = await request.json();
    const { name, content, category = "general" } = body;

    if (!name || !content) {
      return Response.json(
        { error: "Name and content are required" },
        { status: 400 }
      );
    }

    const prompt = await prisma.promptTemplate.create({
      data: {
        name,
        content,
        category,
        workspaceId,
        createdBy: userId,
        version: 1,
        versions: {
          create: {
            version: 1,
            content,
            changeNote: "Initial version",
            createdBy: userId,
          },
        },
      },
      include: {
        _count: { select: { versions: true } },
      },
    });

    return Response.json(prompt, { status: 201 });
  } catch (error) {
    console.error("POST /api/ai/prompts error:", error);
    return Response.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
