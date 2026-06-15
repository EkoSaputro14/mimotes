import { NextRequest, NextResponse } from "next/server";

/**
 * PUT /api/v1/widget/update
 * @deprecated Use /api/widgets/update instead. This endpoint redirects.
 */
export async function PUT(_request: NextRequest) {
  return NextResponse.redirect(new URL("/api/widgets/update", "http://localhost"), 308);
}
