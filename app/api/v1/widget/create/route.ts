import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/v1/widget/create
 * @deprecated Use /api/widgets/create instead. This endpoint redirects.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.redirect(new URL("/api/widgets/create", "http://localhost"), 308);
}
