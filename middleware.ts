import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/ai",
  "/analytics",
  "/knowledge",
  "/admin",
  "/settings",
];

// API routes that require authentication
const protectedApiRoutes = [
  "/api/dashboard/stats",
  "/api/dashboard/usage",
  "/api/dashboard/cost",
  "/api/dashboard/top-documents",
  "/api/analytics",
  "/api/admin",
  "/api/mcp/servers",
  "/api/mcp/call",
  "/api/mcp/connect",
  "/api/mcp/tools",
  "/api/upload",
  "/api/documents",
  "/api/knowledge",
  "/api/ai",
  "/api/chat/sessions",
  "/api/workspace",
  "/api/workspace/subscription",
  "/api/workspace/billing",
];

// Routes that are always public
const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/chat", // Chat is rate-limited, not auth-gated (public chatbot)
  "/api/dashboard/health",
  // NOTE: /api/mcp was removed from public — it requires auth via route handler
];

function isProtectedPath(pathname: string): boolean {
  // Check if it's a protected API route
  for (const route of protectedApiRoutes) {
    if (pathname.startsWith(route)) return true;
  }

  // Check if it's a protected page route
  for (const route of protectedRoutes) {
    if (pathname === route || pathname.startsWith(route + "/")) return true;
  }

  return false;
}

function isPublicPath(pathname: string): boolean {
  for (const route of publicRoutes) {
    if (pathname === route || pathname.startsWith(route + "/")) return true;
  }
  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and internal Next.js paths
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.\w{2,4}$/)
  ) {
    return NextResponse.next();
  }

  // If the route is explicitly public, allow through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // If the route requires protection, check for session token
  if (isProtectedPath(pathname)) {
    // SECURITY NOTE: This is a UX redirect layer, NOT a security boundary.
    // Edge Runtime cannot do cryptographic JWT verification.
    // Real auth happens in route handlers via auth() from lib/auth.ts.
    // An attacker with a fake cookie will pass this check but be rejected
    // by the route-level auth() which verifies the JWT signature.
    const sessionToken =
      request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value;

    if (!sessionToken) {
      // For API routes, return 401
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // For page routes, redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Content Security Policy — allow inline scripts for Next.js hydration
  // and connect to AI provider APIs
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://token-plan-sgp.xiaomimimo.com https://api.openai.com https://openrouter.ai",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", cspDirectives);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
