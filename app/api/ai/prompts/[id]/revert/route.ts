import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST /api/ai/prompts/[id]/revert — Revert to a specific version */
export async function POST(
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
    const { version } = await request.json();

    if (!version || typeof version !== "number") {
      return Response.json(
        { error: "Version number is required" },
        { status: 400 }
      );
    }

    // Find the target version
    const targetVersion = await prisma.promptVersion.findUnique({
      where: {
        promptId_version: { promptId: id, version },
      },
    });

    if (!targetVersion) {
      return Response.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    // Get current prompt
    const current = await prisma.promptTemplate.findUnique({
      where: { id },
    });

    if (!current) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    const newVersion = current.version + 1;

    // Revert: update prompt content and create a new version marking the revert
    const updated = await prisma.$transaction(async (tx) => {
      const prompt = await tx.promptTemplate.update({
        where: { id },
        data: {
          content: targetVersion.content,
          version: newVersion,
        },
      });

      await tx.promptVersion.create({
        data: {
          promptId: id,
          version: newVersion,
          content: targetVersion.content,
          changeNote: `Reverted to version ${version}`,
          createdBy: userId,
        },
      });

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
    console.error("POST /api/ai/prompts/[id]/revert error:", error);
    return Response.json(
      { error: "Failed to revert prompt" },
      { status: 500 }
    );
  }
}
