// ============================================================
// Startup Validation
// ============================================================
// Validates required environment variables, provider configurations,
// and database connectivity on application startup.

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { validateEmailConfig } from "@/lib/email";

// ============================================================
// Types
// ============================================================

export type ValidationSeverity = "error" | "warn" | "info";

export interface ValidationCheck {
  name: string;
  category: string;
  status: "pass" | "fail" | "warn";
  message: string;
  severity: ValidationSeverity;
}

export interface StartupValidationResult {
  timestamp: string;
  ready: boolean;
  checks: ValidationCheck[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

// ============================================================
// Validation Checks
// ============================================================

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const RECOMMENDED_ENV_VARS = [
  "ENCRYPTION_KEY",
  "EMAIL_PROVIDER",
] as const;

/**
 * Validate required environment variables.
 */
function checkEnvironmentVariables(): ValidationCheck[] {
  const checks: ValidationCheck[] = [];

  // Required vars
  for (const varName of REQUIRED_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      checks.push({
        name: `env_${varName.toLowerCase()}`,
        category: "environment",
        status: "fail",
        message: `${varName} is required but not set`,
        severity: "error",
      });
    } else {
      checks.push({
        name: `env_${varName.toLowerCase()}`,
        category: "environment",
        status: "pass",
        message: `${varName} is configured`,
        severity: "info",
      });
    }
  }

  // Recommended vars
  for (const varName of RECOMMENDED_ENV_VARS) {
    const value = process.env[varName];
    if (!value) {
      checks.push({
        name: `env_${varName.toLowerCase()}`,
        category: "environment",
        status: "warn",
        message: `${varName} is recommended but not set`,
        severity: "warn",
      });
    } else {
      checks.push({
        name: `env_${varName.toLowerCase()}`,
        category: "environment",
        status: "pass",
        message: `${varName} is configured`,
        severity: "info",
      });
    }
  }

  return checks;
}

/**
 * Validate database connectivity.
 */
async function checkDatabaseConnectivity(): Promise<ValidationCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      name: "database_connectivity",
      category: "database",
      status: "pass",
      message: "Database connection successful",
      severity: "info",
    };
  } catch (error) {
    return {
      name: "database_connectivity",
      category: "database",
      status: "fail",
      message: `Database connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      severity: "error",
    };
  }
}

/**
 * Validate RLS enforcement (critical security check).
 */
async function checkRLSEnforcement(): Promise<ValidationCheck> {
  try {
    // Check if mimotes_app has BYPASSRLS
    const result = await prisma.$queryRaw<Array<{ bypassrls: boolean }>>`
      SELECT rolbypassrls as bypassrls
      FROM pg_roles
      WHERE rolname = 'mimotes_app'
    `;

    if (result.length > 0 && result[0].bypassrls) {
      return {
        name: "rls_enforcement",
        category: "security",
        status: "fail",
        message: "RLS bypass is enabled — security risk!",
        severity: "error",
      };
    }

    return {
      name: "rls_enforcement",
      category: "security",
      status: "pass",
      message: "RLS enforcement is active",
      severity: "info",
    };
  } catch {
    return {
      name: "rls_enforcement",
      category: "security",
      status: "warn",
      message: "Could not verify RLS enforcement",
      severity: "warn",
    };
  }
}

/**
 * Validate email provider configuration.
 */
function checkEmailProvider(): ValidationCheck[] {
  const result = validateEmailConfig();
  return result.issues.length === 0
    ? [
        {
          name: "email_provider",
          category: "email",
          status: "pass" as const,
          message: `Email provider "${result.provider}" is properly configured`,
          severity: "info" as const,
        },
      ]
    : [
        ...result.issues.map(
          (issue) =>
            ({
              name: "email_provider",
              category: "email",
              status: "warn" as const,
              message: issue,
              severity: "warn" as const,
            }) satisfies ValidationCheck
        ),
      ];
}

/**
 * Validate encryption key.
 */
function checkEncryptionKey(): ValidationCheck {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    return {
      name: "encryption_key",
      category: "security",
      status: "warn",
      message: "ENCRYPTION_KEY not set — API keys stored in plaintext",
      severity: "warn",
    };
  }
  if (key.length < 32) {
    return {
      name: "encryption_key",
      category: "security",
      status: "warn",
      message: "ENCRYPTION_KEY is too short (minimum 32 characters)",
      severity: "warn",
    };
  }
  return {
    name: "encryption_key",
    category: "security",
    status: "pass",
    message: "ENCRYPTION_KEY is configured",
    severity: "info",
  };
}

/**
 * Validate NEXTAUTH_SECRET strength.
 */
function checkNextAuthSecret(): ValidationCheck {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return {
      name: "nextauth_secret",
      category: "security",
      status: "fail",
      message: "NEXTAUTH_SECRET is required for session security",
      severity: "error",
    };
  }
  if (secret.length < 32) {
    return {
      name: "nextauth_secret",
      category: "security",
      status: "warn",
      message: "NEXTAUTH_SECRET is short (recommend 32+ characters)",
      severity: "warn",
    };
  }
  if (secret === "super-secret-key" || secret === "change-me") {
    return {
      name: "nextauth_secret",
      category: "security",
      status: "fail",
      message: "NEXTAUTH_SECRET is using a default/weak value",
      severity: "error",
    };
  }
  return {
    name: "nextauth_secret",
    category: "security",
    status: "pass",
    message: "NEXTAUTH_SECRET is configured and strong",
    severity: "info",
  };
}

// ============================================================
// Main Validation Runner
// ============================================================

/**
 * Run all startup validation checks.
 */
export async function runStartupValidation(): Promise<StartupValidationResult> {
  logger.info("SYSTEM", "Running startup validation checks...");

  const checks: ValidationCheck[] = [];

  // Environment variables (sync)
  checks.push(...checkEnvironmentVariables());

  // Security checks (sync)
  checks.push(checkEncryptionKey());
  checks.push(checkNextAuthSecret());

  // Email provider (sync)
  checks.push(...checkEmailProvider());

  // Database connectivity (async)
  checks.push(await checkDatabaseConnectivity());

  // RLS enforcement (async)
  checks.push(await checkRLSEnforcement());

  // Calculate summary
  const passed = checks.filter((c) => c.status === "pass").length;
  const failed = checks.filter((c) => c.status === "fail").length;
  const warnings = checks.filter((c) => c.status === "warn").length;

  const result: StartupValidationResult = {
    timestamp: new Date().toISOString(),
    ready: failed === 0,
    checks,
    summary: {
      total: checks.length,
      passed,
      failed,
      warnings,
    },
  };

  // Log results
  if (failed > 0) {
    logger.error(
      "SYSTEM",
      `Startup validation: ${failed} critical failures, ${warnings} warnings`,
      undefined,
      undefined
    );
    for (const check of checks.filter((c) => c.status === "fail")) {
      logger.error("SYSTEM", `  ✗ ${check.name}: ${check.message}`);
    }
  } else if (warnings > 0) {
    logger.warn(
      "SYSTEM",
      `Startup validation: ${passed} passed, ${warnings} warnings`
    );
  } else {
    logger.info(
      "SYSTEM",
      `Startup validation: all ${passed} checks passed`
    );
  }

  return result;
}

// ============================================================
// Configuration Audit
// ============================================================

export interface ConfigAuditEntry {
  key: string;
  configured: boolean;
  secure: boolean;
  category: string;
}

/**
 * Audit all configuration entries (non-sensitive info only).
 * Returns what's configured and what's missing.
 */
export function auditConfiguration(): ConfigAuditEntry[] {
  const entries: ConfigAuditEntry[] = [];

  const configMap: Array<{ key: string; category: string; required: boolean; minLength?: number }> = [
    { key: "DATABASE_URL", category: "database", required: true },
    { key: "NEXTAUTH_SECRET", category: "security", required: true, minLength: 32 },
    { key: "NEXT_PUBLIC_APP_URL", category: "networking", required: true },
    { key: "ENCRYPTION_KEY", category: "security", required: false, minLength: 32 },
    { key: "EMAIL_PROVIDER", category: "email", required: false },
    { key: "RESEND_API_KEY", category: "email", required: false },
    { key: "EMAIL_FROM", category: "email", required: false },
    { key: "STRIPE_SECRET_KEY", category: "billing", required: false },
    { key: "STRIPE_WEBHOOK_SECRET", category: "billing", required: false },
  ];

  for (const { key, category, required, minLength } of configMap) {
    const value = process.env[key];
    const configured = !!value;
    const secure = !minLength || (value ? value.length >= minLength : false);

    entries.push({
      key,
      configured,
      secure: configured ? secure : !required,
      category,
    });
  }

  return entries;
}
