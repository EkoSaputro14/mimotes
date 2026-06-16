import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id!;

    const [totalDocuments, pdfCount, imageCount, allDocs] = await Promise.all([
      prisma.document.count({ where: { userId } }),
      prisma.document.count({ where: { userId, fileType: "pdf" } }),
      prisma.document.count({
        where: {
          userId,
          fileType: { in: ["png", "jpg", "jpeg", "webp", "gif", "image"] },
        },
      }),
      prisma.document.findMany({
        where: { userId },
        select: { chunkCount: true },
      }),
    ]);

    const totalChunks = allDocs.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0);
    const pdfRatio = totalDocuments > 0 ? Math.round((pdfCount / totalDocuments) * 100) : 0;

    return Response.json({
      totalDocuments,
      totalChunks,
      pdfRatio,
      imageAssets: imageCount,
    });
  } catch (error) {
    console.error("Document stats API error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
