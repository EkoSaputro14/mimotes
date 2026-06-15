import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// ============================================================
// Widget Management
// ============================================================

const PUBLIC_KEY_PREFIX = "pw_pub_";
const SECRET_KEY_PREFIX = "pw_sec_";
const KEY_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 10000;

export interface WidgetTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  logoUrl: string | null;
  avatarUrl: string | null;
  welcomeMessage: string;
  position: string;
  quickReplies?: string[];
}

const DEFAULT_THEME: WidgetTheme = {
  primaryColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  logoUrl: null,
  avatarUrl: null,
  welcomeMessage: "Hi! How can I help you?",
  position: "bottom-right",
  quickReplies: [],
};

/**
 * Generate a widget key pair.
 */
export function generateWidgetKeys(): {
  publicKey: string;
  secretKey: string;
} {
  return {
    publicKey: PUBLIC_KEY_PREFIX + crypto.randomBytes(KEY_LENGTH).toString("base64url"),
    secretKey: SECRET_KEY_PREFIX + crypto.randomBytes(KEY_LENGTH).toString("base64url"),
  };
}

/**
 * Create a new widget.
 */
export async function createWidget(
  workspaceId: string,
  name: string,
  slug: string,
  theme?: Partial<WidgetTheme>
) {
  const { publicKey, secretKey } = generateWidgetKeys();

  return prisma.widget.create({
    data: {
      workspaceId,
      name,
      slug,
      publicKey,
      secretKey,
      ...DEFAULT_THEME,
      ...theme,
    },
  });
}

/**
 * Get widget by public key (for client-side config).
 */
export async function getWidgetByPublicKey(publicKey: string) {
  return prisma.widget.findFirst({
    where: { publicKey, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      publicKey: true,
      primaryColor: true,
      backgroundColor: true,
      textColor: true,
      logoUrl: true,
      avatarUrl: true,
      welcomeMessage: true,
      position: true,
      quickReplies: true,
      allowedDomains: true,
      workspaceId: true,
    },
  });
}

/**
 * Validate widget origin against allowed domains.
 */
export function validateWidgetOrigin(
  origin: string | null,
  allowedDomains: string[]
): boolean {
  if (!origin) return false;
  if (allowedDomains.length === 0) return true;

  try {
    const url = new URL(origin);
    const hostname = url.hostname;

    return allowedDomains.some((domain) => {
      if (domain.startsWith("*.")) {
        // Wildcard: *.example.com matches sub.example.com
        const baseDomain = domain.substring(2);
        return hostname === baseDomain || hostname.endsWith("." + baseDomain);
      }
      return hostname === domain;
    });
  } catch {
    return false;
  }
}

/**
 * Get widget by slug.
 */
export async function getWidgetBySlug(slug: string) {
  return prisma.widget.findUnique({
    where: { slug },
  });
}

/**
 * List widgets for a workspace.
 */
export async function listWidgets(workspaceId: string) {
  return prisma.widget.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      publicKey: true,
      allowedDomains: true,
      isActive: true,
      primaryColor: true,
      backgroundColor: true,
      textColor: true,
      logoUrl: true,
      avatarUrl: true,
      welcomeMessage: true,
      position: true,
      quickReplies: true,
      createdAt: true,
      _count: { select: { conversations: true } },
    },
  });
}

/**
 * Update widget theme.
 */
export async function updateWidget(
  workspaceId: string,
  widgetId: string,
  data: Partial<{
    name: string;
    allowedDomains: string[];
    isActive: boolean;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    logoUrl: string;
    avatarUrl: string;
    welcomeMessage: string;
    position: string;
    quickReplies: string[];
  }>
) {
  return prisma.widget.updateMany({
    where: { id: widgetId, workspaceId },
    data,
  });
}

/**
 * Delete a widget.
 */
export async function deleteWidget(workspaceId: string, widgetId: string) {
  return prisma.widget.deleteMany({
    where: { id: widgetId, workspaceId },
  });
}

/**
 * Validate message length.
 */
export function validateMessageLength(message: string): boolean {
  return message.length <= MAX_MESSAGE_LENGTH;
}

/**
 * Rotate widget keys.
 */
export async function rotateWidgetKeys(workspaceId: string, widgetId: string) {
  const { publicKey, secretKey } = generateWidgetKeys();
  return prisma.widget.updateMany({
    where: { id: widgetId, workspaceId },
    data: { publicKey, secretKey },
  });
}

/**
 * Build CORS headers for widget endpoints.
 * NEVER returns wildcard "*". Returns specific origin only if validated.
 */
export function buildWidgetCorsHeaders(
  origin: string | null,
  allowedDomains: string[]
): Record<string, string> {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };

  if (origin && validateWidgetOrigin(origin, allowedDomains)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  return headers;
}

/**
 * Build a safe JSON response with proper CORS headers for widget endpoints.
 * Replaces manual "Access-Control-Allow-Origin": "*" pattern.
 */
export function widgetResponse(
  body: unknown,
  origin: string | null,
  allowedDomains: string[],
  init?: ResponseInit
): Response {
  const corsHeaders = buildWidgetCorsHeaders(origin, allowedDomains);
  const existingHeaders = init?.headers || {};
  const headers = { ...corsHeaders, ...existingHeaders };

  return Response.json(body, { ...init, headers });
}
