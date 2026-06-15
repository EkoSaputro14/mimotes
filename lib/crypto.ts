import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

// ============================================================
// AES-256-GCM Encryption Layer
// ============================================================

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag
const ENCRYPTED_PREFIX = "enc:v1:";

/**
 * Get the encryption key from environment variable.
 * Returns null if not configured (graceful degradation).
 */
function getEncryptionKey(): Buffer | null {
  const hexKey = process.env.ENCRYPTION_KEY;
  if (!hexKey) {
    return null;
  }
  const key = Buffer.from(hexKey, "hex");
  if (key.length !== 32) {
    console.error(
      "[crypto] ENCRYPTION_KEY must be 32 bytes (64 hex chars). Got:",
      key.length,
      "bytes."
    );
    return null;
  }
  return key;
}

/**
 * Check if a string is already encrypted (has our prefix).
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 *
 * Format: enc:v1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 *
 * Returns the plaintext unchanged if ENCRYPTION_KEY is not set
 * (backward compatibility during migration).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  const key = getEncryptionKey();
  if (!key) {
    // Graceful degradation: no key configured, return plaintext
    return plaintext;
  }

  // Don't double-encrypt
  if (isEncrypted(plaintext)) {
    return plaintext;
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypt a ciphertext string that was encrypted with `encrypt()`.
 *
 * If the value is not encrypted (no prefix), returns it as-is
 * for backward compatibility with pre-encryption data.
 *
 * If ENCRYPTION_KEY is not set, returns the raw value (which may be
 * encrypted ciphertext — caller should handle this).
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  // Not encrypted — return as-is (backward compatibility)
  if (!isEncrypted(ciphertext)) {
    return ciphertext;
  }

  const key = getEncryptionKey();
  if (!key) {
    console.warn(
      "[crypto] ENCRYPTION_KEY not set but encrypted value found. Returning raw value."
    );
    return ciphertext;
  }

  try {
    // Strip prefix and parse components
    const withoutPrefix = ciphertext.slice(ENCRYPTED_PREFIX.length);
    const parts = withoutPrefix.split(":");
    if (parts.length !== 3) {
      console.error("[crypto] Invalid encrypted format.");
      return ciphertext;
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error(
      "[crypto] Decryption failed — data may be corrupted or key mismatch."
    );
    // Return raw value for graceful degradation
    return ciphertext;
  }
}

/**
 * Mask a sensitive value, showing only the last N characters.
 * Example: maskApiKey("sk-abc123def456") → "********def456"
 */
export function maskApiKey(value: string, visibleChars: number = 4): string {
  if (!value) return "";
  if (value.length <= visibleChars) return value;
  const masked = "*".repeat(value.length - visibleChars);
  return masked + value.slice(-visibleChars);
}

/**
 * Check if a setting key looks like it should be encrypted
 * (contains sensitive patterns like API keys, secrets, tokens).
 */
export function isSecretKey(key: string): boolean {
  const secretPatterns = [
    /api_key/i,
    /apikey/i,
    /secret/i,
    /token/i,
    /password/i,
    /credential/i,
    /private_key/i,
  ];
  return secretPatterns.some((pattern) => pattern.test(key));
}
