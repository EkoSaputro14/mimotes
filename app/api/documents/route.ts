import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return Response.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const documents = await prisma.document.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { chunks: true },
        },
      },
    });

    return Response.json(documents);
  } catch (error) {
    console.error("Documents API error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat mengambil dokumen" },
      { status: 500 }
    );
  }
}
