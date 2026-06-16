import { lookup } from "dns/promises";
import { isIPv4, isIPv6 } from "net";

// ============================================================
// URL Security — SSRF Protection Layer
// ============================================================

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const BLOCKED_PORTS = new Set([22, 25, 135, 137, 138, 139, 445, 593, 993, 995, 1433, 1434, 3306, 3389, 5432, 5900, 6379, 8443, 9090]);
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5MB
const FETCH_TIMEOUT_MS = 10_000; // 10 seconds

// Cloud metadata IP ranges
const METADATA_IPS = new Set([
  "169.254.169.254", // AWS/GCP/Azure metadata
  "fd00:ec2::254",   // AWS IPv6 metadata
]);

/**
 * Check if an IPv4 address is in a private/reserved range.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4) return false;

  const [a, b] = parts;

  // 127.0.0.0/8 (loopback)
  if (a === 127) return true;
  // 10.0.0.0/8 (private)
  if (a === 10) return true;
  // 172.16.0.0/12 (private)
  if (a === 172 && b >= 16 && b <= 31) return true;
  // 192.168.0.0/16 (private)
  if (a === 192 && b === 168) return true;
  // 169.254.0.0/16 (link-local / cloud metadata)
  if (a === 169 && b === 254) return true;
  // 0.0.0.0/8 (current network)
  if (a === 0) return true;
  // 100.64.0.0/10 (CGNAT)
  if (a === 100 && b >= 64 && b <= 127) return true;
  // 192.0.0.0/24 (IETF protocol assignments)
  if (a === 192 && b === 0 && parts[2] === 0) return true;
  // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 0 && parts[2] === 2) return true;
  // 198.51.100.0/24 (TEST-NET-2)
  if (a === 198 && b === 51 && parts[2] === 100) return true;
  // 203.0.113.0/24 (TEST-NET-3)
  if (a === 203 && b === 0 && parts[2] === 113) return true;
  // 224.0.0.0/4 (multicast)
  if (a >= 224 && a <= 239) return true;
  // 240.0.0.0/4 (reserved)
  if (a >= 240) return true;

  return false;
}

/**
 * Check if an IPv6 address is in a private/reserved range.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback ::1
  if (normalized === "::1") return true;
  // Link-local fe80::/10
  if (normalized.startsWith("fe80:")) return true;
  // Unique local fc00::/7
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  // IPv4-mapped ::ffff:0:0/96
  if (normalized.startsWith("::ffff:")) {
    // Extract the IPv4 part
    const ipv4Part = normalized.slice(7);
    if (isIPv4(ipv4Part)) return isPrivateIPv4(ipv4Part);
    return true;
  }
  // Cloud metadata
  if (METADATA_IPS.has(normalized)) return true;
  // Unspecified ::
  if (normalized === "::") return true;

  return false;
}

/**
 * Check if an IP address (v4 or v6) is private/reserved.
 */
function isPrivateIP(ip: string): boolean {
  if (isIPv4(ip)) return isPrivateIPv4(ip);
  if (isIPv6(ip)) return isPrivateIPv6(ip);
  return true; // Unknown format = block
}

export interface UrlValidationResult {
  valid: boolean;
  error?: string;
  resolvedUrl?: URL;
}

/**
 * Validate a URL for safe fetching (SSRF protection).
 *
 * Checks:
 * 1. URL format
 * 2. Protocol (http/https only)
 * 3. Port (blocks dangerous ports)
 * 4. DNS resolution
 * 5. Private/reserved IP blocking
 * 6. Cloud metadata endpoint blocking
 */
export async function validateUrl(urlString: string): Promise<UrlValidationResult> {
  // 1. Parse URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  // 2. Protocol check
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return {
      valid: false,
      error: `Protocol '${url.protocol}' not allowed. Only http and https are supported.`,
    };
  }

  // 3. Port check (only block known-dangerous ports, allow common web ports)
  if (url.port && BLOCKED_PORTS.has(parseInt(url.port, 10))) {
    return {
      valid: false,
      error: `Port ${url.port} is blocked for security reasons.`,
    };
  }

  // 4. Block cloud metadata hostnames directly
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "169.254.169.254" ||
    hostname === "fd00:ec2::254" ||
    hostname === "metadata.google.internal" ||
    hostname === "metadata.google.com"
  ) {
    return {
      valid: false,
      error: "Cloud metadata endpoints are blocked.",
    };
  }

  // 5. DNS resolution — resolve hostname to IP and validate
  try {
    const { address } = await lookup(url.hostname, { family: 0 });

    if (isPrivateIP(address)) {
      return {
        valid: false,
        error: `Resolved IP '${address}' is in a private/reserved range. Internal URLs are not allowed.`,
      };
    }

    // Block resolved metadata IPs
    if (METADATA_IPS.has(address)) {
      return {
        valid: false,
        error: "Resolved IP is a cloud metadata endpoint.",
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: `DNS resolution failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  }

  return { valid: true, resolvedUrl: url };
}

/**
 * Safely fetch a URL with size limits, timeout, and redirect validation.
 * Must call validateUrl() before using this function.
 */
export async function safeFetch(
  url: string,
  options?: { maxBytes?: number; timeoutMs?: number }
): Promise<{ ok: boolean; status: number; body: string; error?: string }> {
  const maxBytes = options?.maxBytes ?? MAX_RESPONSE_BYTES;
  const timeoutMs = options?.timeoutMs ?? FETCH_TIMEOUT_MS;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "manual", // Don't follow redirects automatically
      headers: {
        "User-Agent": "Mimotes/1.0 (document-ingestion)",
      },
    });

    // Handle redirects manually — validate the redirect URL
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        // Validate redirect URL
        const redirectValidation = await validateUrl(location);
        if (!redirectValidation.valid) {
          return {
            ok: false,
            status: response.status,
            body: "",
            error: `Redirect blocked: ${redirectValidation.error}`,
          };
        }
        // Recursively fetch with validated redirect (limit to 3 redirects)
        return safeFetch(location, { maxBytes, timeoutMs });
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        body: "",
        error: `HTTP ${response.status}`,
      };
    }

    // Read response with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return { ok: true, status: response.status, body: "" };
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > maxBytes) {
        reader.cancel();
        return {
          ok: false,
          status: response.status,
          body: "",
          error: `Response body exceeds ${Math.round(maxBytes / 1024 / 1024)}MB limit.`,
        };
      }

      chunks.push(value);
    }

    // Combine chunks and decode
    const allBytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      allBytes.set(chunk, offset);
      offset += chunk.length;
    }

    const body = new TextDecoder("utf-8").decode(allBytes);

    return { ok: true, status: response.status, body };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        body: "",
        error: `Request timed out after ${timeoutMs / 1000}s.`,
      };
    }
    return {
      ok: false,
      status: 0,
      body: "",
      error: `Fetch failed: ${error instanceof Error ? error.message : "unknown error"}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Sanitize a filename for safe storage.
 * Removes path separators, null bytes, and special characters.
 */
export function sanitizeFilename(filename: string): string {
  return (
    filename
      // Remove null bytes
      .replace(/\0/g, "")
      // Remove path separators
      .replace(/[/\\]/g, "")
      // Remove control characters
      // eslint-disable-next-line no-control-regex
      .replace(/[\x00-\x1f\x7f]/g, "")
      // Remove dangerous characters
      .replace(/[<>:"|?*]/g, "")
      // Collapse multiple dots (prevent double extension attacks)
      .replace(/\.{2,}/g, ".")
      // Trim dots and spaces from start/end
      .replace(/^[\s.]+|[\s.]+$/g, "")
      // Limit length
      .slice(0, 255)
  );
}
