import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join, extname } from "path";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

/**
 * Serve uploaded files from public/uploads/ directory.
 *
 * WHY: Next.js standalone mode bakes public/ at build time.
 * Runtime uploads go to a Docker volume at /app/public/uploads/,
 * but standalone server doesn't serve those runtime files.
 * This route reads files dynamically from the filesystem.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const fileName = path.join("/");

  // Prevent directory traversal
  if (fileName.includes("..") || fileName.includes("\0")) {
    return Response.json({ error: "Invalid path" }, { status: 400 });
  }

  const uploadDir = join(process.cwd(), "public", "uploads");
  const filePath = join(uploadDir, fileName);

  try {
    const data = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return Response.json({ error: "File not found" }, { status: 404 });
  }
}
