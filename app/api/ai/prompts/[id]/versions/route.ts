import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/ai/prompts/[id]/versions — Get version history */
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
      select: { id: true, version: true },
    });

    if (!prompt) {
      return Response.json({ error: "Prompt not found" }, { status: 404 });
    }

    const versions = await prisma.promptVersion.findMany({
      where: { promptId: id },
      orderBy: { version: "desc" },
    });

    return Response.json({
      currentVersion: prompt.version,
      versions,
    });
  } catch (error) {
    console.error("GET /api/ai/prompts/[id]/versions error:", error);
    return Response.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}
