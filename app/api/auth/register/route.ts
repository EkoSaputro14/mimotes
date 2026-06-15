import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logAudit, AUDIT_ACTIONS } from "@/lib/audit";
import {
  checkEndpointRateLimit,
  getRateLimitHeaders,
  getClientIp,
  RATE_LIMIT_CONFIGS,
} from "@/lib/endpoint-ratelimit";

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 registrations per 15 minutes per IP
    const ip = getClientIp(request);
    const rateLimitResult = checkEndpointRateLimit(ip, RATE_LIMIT_CONFIGS.auth);

    if (!rateLimitResult.allowed) {
      return Response.json(
        { error: "Terlalu banyak percobaan. Silakan coba lagi nanti." },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult, RATE_LIMIT_CONFIGS.auth),
        }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { error: "Format request tidak valid. Gunakan form-data." },
        { status: 400 }
      );
    }
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password) {
      return Response.json(
        { error: "Email dan password diperlukan" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { error: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return Response.json(
        { error: "Email sudah terdaftar" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
      },
    });

    // Audit: user registered (no workspace yet — use system)
    logAudit({
      workspaceId: "system",
      actorId: newUser.id,
      actorType: "user",
      action: AUDIT_ACTIONS.AUTH_REGISTER,
      metadata: { email, name: name || null },
    });

    return Response.json({ success: true }, {
      headers: getRateLimitHeaders(rateLimitResult, RATE_LIMIT_CONFIGS.auth),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return Response.json(
      { error: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}
