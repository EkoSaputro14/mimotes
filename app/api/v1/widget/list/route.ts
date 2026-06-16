import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/v1/widget/list
 * @deprecated Use /api/widgets/list instead. This endpoint redirects.
 */
export async function GET(_request: NextRequest) {
  return NextResponse.redirect(new URL("/api/widgets/list", "http://localhost"), 308);
}
