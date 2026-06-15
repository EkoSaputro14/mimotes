import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // HSTS — only in production (prevents certificate warnings in dev)
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
  // Content Security Policy — restricts resource loading origins
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.resend.com https://api.stripe.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Allow widget embeds to be framed by allowed origins
      // Widget routes use dynamic CORS validation via buildWidgetCorsHeaders()
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pdf-parse", "mammoth", "csv-parse", "sharp", "tesseract.js"],
  async headers() {
    return [
      // Global security headers for all routes
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      // Widget routes — origin-validated CORS (no wildcard)
      {
        source: "/api/widget/:path*",
        headers: [
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Widget-Origin" },
          // Note: Access-Control-Allow-Origin is set dynamically per-request
          // by buildWidgetCorsHeaders() in lib/widget.ts — never use wildcard here
        ],
      },
      // Health endpoint — no caching
      {
        source: "/api/health",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
