import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/ai/prompts/[id] — Get prompt detail with versions */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const prompt = await prisma.promptTemplate.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { version: "desc" },
        },
        _count: { select: { versions: true } },
      },
    });

    if (!prompt) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    return Response.json(prompt);
  } catch (error) {
    console.error("GET /api/ai/prompts/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch prompt" },
      { status: 500 }
    );
  }
}

/** PUT /api/ai/prompts/[id] — Update prompt (creates new version) */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id!;
    const { id } = await params;
    const body = await request.json();
    const { name, content, category, changeNote } = body;

    // Get current prompt to determine next version
    const current = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!current) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    const newVersion = current.version + 1;

    // Update prompt and create new version in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const prompt = await tx.promptTemplate.update({
        where: { id },
        data: {
          name: name ?? current.name,
          content: content ?? current.content,
          category: category ?? current.category,
          version: newVersion,
        },
      });

      // Only create a new version if content changed
      if (content && content !== current.content) {
        await tx.promptVersion.create({
          data: {
            promptId: id,
            version: newVersion,
            content,
            changeNote: changeNote || `Version ${newVersion}`,
            createdBy: userId,
          },
        });
      }

      return prompt;
    });

    const result = await prisma.promptTemplate.findUnique({
      where: { id: updated.id },
      include: {
        versions: { orderBy: { version: "desc" } },
        _count: { select: { versions: true } },
      },
    });

    return Response.json(result);
  } catch (error) {
    console.error("PUT /api/ai/prompts/[id] error:", error);
    return Response.json(
      { error: "Failed to update prompt" },
      { status: 500 }
    );
  }
}

/** DELETE /api/ai/prompts/[id] — Delete prompt template */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    // Cascade delete will handle versions
    await prisma.promptTemplate.delete({
      where: { id },
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ai/prompts/[id] error:", error);
    return Response.json(
      { error: "Failed to delete prompt" },
      { status: 500 }
    );
  }
}
