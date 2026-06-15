import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/** GET /api/ai/playground/history — Past playground runs (client-side stored) */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Playground history is stored client-side (localStorage)
    // This endpoint exists for future server-side history support
    return Response.json({ history: [] });
  } catch (error) {
    console.error("GET /api/ai/playground/history error:", error);
    return Response.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
