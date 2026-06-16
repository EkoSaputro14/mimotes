// ============================================================
// Health Check Endpoint
// ============================================================
// GET /api/health
// Returns application health status including database connectivity,
// environment validation, uptime, and provider status.
// No authentication required (public endpoint for load balancers/monitoring).

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { runStartupValidation, auditConfiguration } from "@/lib/startup";
import { validateEmailConfig, loadEmailConfig } from "@/lib/email";

// ============================================================
// Types
// ============================================================

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: ComponentStatus;
    email: ComponentStatus;
    config: ComponentStatus;
  };
  meta: {
    nodeVersion: string;
    platform: string;
    memoryUsage: {
      rss: number;
      heapUsed: number;
      heapTotal: number;
    };
  };
}

interface ComponentStatus {
  status: "healthy" | "degraded" | "unhealthy";
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

// ============================================================
// Startup time tracking
// ============================================================

const STARTUP_TIME = Date.now();

// ============================================================
// Health Check Logic
// ============================================================

/**
 * Check database health.
 */
async function checkDatabaseHealth(): Promise<ComponentStatus> {
  const start = Date.now();
  try {
    const result = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW() as now`;
    const latencyMs = Date.now() - start;

    return {
      status: latencyMs > 5000 ? "degraded" : "healthy",
      latencyMs,
      message: `Connected (latency: ${latencyMs}ms)`,
      details: {
        serverTime: result[0]?.now,
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      message: `Database unavailable: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Check email provider health.
 */
function checkEmailHealth(): ComponentStatus {
  try {
    const config = loadEmailConfig();
    const validation = validateEmailConfig();

    return {
      status: validation.valid ? "healthy" : "degraded",
      message: validation.valid
        ? `Provider: ${config.provider}`
        : `Issues: ${validation.issues.join(", ")}`,
      details: {
        provider: config.provider,
        configured: validation.valid,
        issues: validation.issues,
      },
    };
  } catch (error) {
    return {
      status: "degraded",
      message: `Email check failed: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

/**
 * Check configuration health.
 */
function checkConfigHealth(): ComponentStatus {
  const audit = auditConfiguration();
  const missing = audit.filter((e) => !e.configured && e.category !== "email" && e.category !== "billing");
  const insecure = audit.filter((e) => !e.secure);

  return {
    status: missing.length > 0 ? "degraded" : "healthy",
    message:
      missing.length > 0
        ? `${missing.length} required config(s) missing`
        : "All required config present",
    details: {
      total: audit.length,
      configured: audit.filter((e) => e.configured).length,
      missing: missing.map((e) => e.key),
      insecure: insecure.map((e) => e.key),
    },
  };
}

// ============================================================
// API Route
// ============================================================

export async function GET() {
  logger.debug("SYSTEM", "Health check requested");

  const [database, email, config] = await Promise.all([
    checkDatabaseHealth(),
    Promise.resolve(checkEmailHealth()),
    Promise.resolve(checkConfigHealth()),
  ]);

  const allStatuses = [database.status, email.status, config.status];
  const overallStatus: HealthStatus["status"] = allStatuses.includes("unhealthy")
    ? "unhealthy"
    : allStatuses.includes("degraded")
      ? "degraded"
      : "healthy";

  const mem = process.memoryUsage();

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - STARTUP_TIME) / 1000),
    version: process.env.npm_package_version || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    checks: {
      database,
      email,
      config,
    },
    meta: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
    },
  };

  const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

  return Response.json(health, {
    status: httpStatus,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Health-Status": overallStatus,
    },
  });
}
