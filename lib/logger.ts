// ============================================================
// Centralized Logger
// ============================================================
// Structured logging with error categories, correlation IDs,
// and request context for production observability.

// ============================================================
// Types
// ============================================================

export type LogLevel = "debug" | "info" | "warn" | "error";

export type ErrorCategory =
  | "AUTH"
  | "DATABASE"
  | "EMAIL"
  | "API"
  | "SECURITY"
  | "SYSTEM"
  | "WIDGET"
  | "RAG"
  | "BILLING"
  | "WORKSPACE";

export interface LogContext {
  /** Correlation ID for request tracing */
  correlationId?: string;
  /** Workspace ID for tenant context */
  workspaceId?: string;
  /** User ID */
  userId?: string;
  /** API route path */
  route?: string;
  /** HTTP method */
  method?: string;
  /** Additional metadata */
  meta?: Record<string, unknown>;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: ErrorCategory | "SYSTEM";
  message: string;
  correlationId?: string;
  workspaceId?: string;
  userId?: string;
  route?: string;
  error?: string;
  stack?: string;
  meta?: Record<string, unknown>;
}

// ============================================================
// Correlation ID Generation
// ============================================================

/** Generate a unique correlation ID for request tracing. */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `corr_${timestamp}_${random}`;
}

// ============================================================
// Logger Implementation
// ============================================================

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Minimum log level from environment (default: info in production, debug in dev) */
function getMinLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  if (envLevel && envLevel in LOG_LEVELS) return envLevel;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

const MIN_LEVEL = getMinLogLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LEVEL];
}

function formatLogEntry(entry: LogEntry): string {
  if (process.env.NODE_ENV === "production") {
    // JSON format for production (structured logging)
    return JSON.stringify(entry);
  }
  // Human-readable format for development
  const parts = [
    `[${entry.timestamp}]`,
    `[${entry.level.toUpperCase()}]`,
    `[${entry.category}]`,
    entry.correlationId ? `{${entry.correlationId}}` : "",
    entry.message,
    entry.error ? `— ${entry.error}` : "",
    entry.meta && Object.keys(entry.meta).length > 0
      ? `| ${JSON.stringify(entry.meta)}`
      : "",
  ];
  return parts.filter(Boolean).join(" ");
}

function writeLog(
  level: LogLevel,
  category: ErrorCategory | "SYSTEM",
  message: string,
  context?: LogContext,
  error?: Error | string
): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    correlationId: context?.correlationId,
    workspaceId: context?.workspaceId,
    userId: context?.userId,
    route: context?.route,
    meta: context?.meta,
  };

  if (error) {
    entry.error = error instanceof Error ? error.message : String(error);
    if (error instanceof Error && error.stack) {
      entry.stack = error.stack;
    }
  }

  const formatted = formatLogEntry(entry);

  switch (level) {
    case "error":
      console.error(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "debug":
      console.debug(formatted);
      break;
    default:
      console.log(formatted);
  }
}

// ============================================================
// Logger API
// ============================================================

export const logger = {
  debug(
    category: ErrorCategory | "SYSTEM",
    message: string,
    context?: LogContext
  ) {
    writeLog("debug", category, message, context);
  },

  info(
    category: ErrorCategory | "SYSTEM",
    message: string,
    context?: LogContext
  ) {
    writeLog("info", category, message, context);
  },

  warn(
    category: ErrorCategory | "SYSTEM",
    message: string,
    context?: LogContext
  ) {
    writeLog("warn", category, message, context);
  },

  error(
    category: ErrorCategory | "SYSTEM",
    message: string,
    context?: LogContext,
    error?: Error | string
  ) {
    writeLog("error", category, message, context, error);
  },

  /** Create a child logger with pre-bound context. */
  child(defaultContext: LogContext) {
    return {
      debug(category: ErrorCategory | "SYSTEM", message: string, extra?: LogContext) {
        writeLog("debug", category, message, { ...defaultContext, ...extra });
      },
      info(category: ErrorCategory | "SYSTEM", message: string, extra?: LogContext) {
        writeLog("info", category, message, { ...defaultContext, ...extra });
      },
      warn(category: ErrorCategory | "SYSTEM", message: string, extra?: LogContext) {
        writeLog("warn", category, message, { ...defaultContext, ...extra });
      },
      error(category: ErrorCategory | "SYSTEM", message: string, extra?: LogContext, error?: Error | string) {
        writeLog("error", category, message, { ...defaultContext, ...extra }, error);
      },
    };
  },
};

// ============================================================
// Error Categorization
// ============================================================

/** Categorize an error based on message and type. */
export function categorizeError(error: Error | string): ErrorCategory {
  const msg = typeof error === "string" ? error : error.message.toLowerCase();
  const name = typeof error === "object" ? error.name : "";

  // Check email FIRST (before database, since "smtp" could match "timeout")
  if (msg.includes("email") || msg.includes("smtp") || msg.includes("resend")) {
    return "EMAIL";
  }

  if (name === "PermissionError" || msg.includes("auth") || msg.includes("unauthorized") || msg.includes("forbidden") || msg.includes("permission")) {
    return "AUTH";
  }
  if (msg.includes("database") || msg.includes("prisma") || msg.includes("connection refused") || msg.includes("timeout") || name === "PrismaClientKnownRequestError") {
    return "DATABASE";
  }
  if (msg.includes("rate limit") || msg.includes("429")) {
    return "SECURITY";
  }
  if (msg.includes("widget") || msg.includes("embed")) {
    return "WIDGET";
  }
  if (msg.includes("stripe") || msg.includes("billing") || msg.includes("payment")) {
    return "BILLING";
  }
  return "API";
}

// ============================================================
// Request Context Helper
// ============================================================

/** Extract request metadata for logging context. */
export function getRequestContext(
  request: Request,
  correlationId?: string
): LogContext {
  const url = new URL(request.url);
  return {
    correlationId: correlationId || generateCorrelationId(),
    route: url.pathname,
    method: request.method,
    meta: {
      userAgent: request.headers.get("user-agent")?.substring(0, 100),
      ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    },
  };
}
