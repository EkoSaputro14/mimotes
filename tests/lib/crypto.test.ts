/**
 * Security Regression Tests — Sprint 1: Secret Encryption (lib/crypto.ts)
 *
 * These tests protect against regression of the AES-256-GCM encryption layer
 * implemented in Sprint 1. Any change to crypto.ts must pass all these tests.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encrypt,
  decrypt,
  isEncrypted,
  maskApiKey,
  isSecretKey,
} from "@/lib/crypto";
import {
  generateTestEncryptionKey,
  withEncryptionKey,
  withoutEncryptionKey,
} from "../test-utils";

describe("lib/crypto.ts — Sprint 1 Security Regression", () => {
  let cleanupKey: () => void;

  beforeEach(() => {
    cleanupKey = withEncryptionKey(generateTestEncryptionKey());
  });

  afterEach(() => {
    cleanupKey();
  });

  // ─── encrypt / decrypt roundtrip ──────────────────────────────────

  describe("encrypt/decrypt roundtrip", () => {
    it("encrypts and decrypts a plaintext string", () => {
      const plaintext = "my-secret-api-key-12345";
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it("produces ciphertext different from plaintext", () => {
      const plaintext = "my-secret-api-key-12345";
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted).toMatch(/^enc:v1:/);
    });

    it("produces different ciphertexts for same plaintext (random IV)", () => {
      const plaintext = "same-secret";
      const enc1 = encrypt(plaintext);
      const enc2 = encrypt(plaintext);
      expect(enc1).not.toBe(enc2);
      // Both should decrypt to the same value
      expect(decrypt(enc1)).toBe(plaintext);
      expect(decrypt(enc2)).toBe(plaintext);
    });

    it("handles empty string", () => {
      expect(encrypt("")).toBe("");
      expect(decrypt("")).toBe("");
    });
  });

  // ─── isEncrypted ──────────────────────────────────────────────────

  describe("isEncrypted", () => {
    it("detects encrypted values", () => {
      const encrypted = encrypt("test-value");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("rejects plaintext values", () => {
      expect(isEncrypted("hello")).toBe(false);
      expect(isEncrypted("sk-abc123")).toBe(false);
      expect(isEncrypted("")).toBe(false);
    });

    it("detects the enc:v1: prefix", () => {
      expect(isEncrypted("enc:v1:abc:def:123")).toBe(true);
    });
  });

  // ─── idempotency (no double encryption) ───────────────────────────

  describe("idempotency", () => {
    it("does not double-encrypt already encrypted values", () => {
      const plaintext = "my-secret";
      const encrypted = encrypt(plaintext);
      const doubleEncrypted = encrypt(encrypted);
      expect(doubleEncrypted).toBe(encrypted);
      expect(decrypt(doubleEncrypted)).toBe(plaintext);
    });
  });

  // ─── backward compatibility (plaintext fallback) ──────────────────

  describe("backward compatibility", () => {
    it("decrypt returns plaintext unchanged when no enc:v1: prefix", () => {
      const plaintext = "existing-plaintext-value";
      expect(decrypt(plaintext)).toBe(plaintext);
    });
  });

  // ─── graceful degradation (missing key) ───────────────────────────

  describe("graceful degradation — missing ENCRYPTION_KEY", () => {
    let noKey: () => void;

    beforeEach(() => {
      noKey = withoutEncryptionKey();
    });

    afterEach(() => {
      noKey();
    });

    it("encrypt returns plaintext when key is missing", () => {
      expect(encrypt("secret")).toBe("secret");
    });

    it("decrypt returns value as-is when key is missing", () => {
      expect(decrypt("enc:v1:xxx")).toBe("enc:v1:xxx");
    });
  });

  // ─── corrupted ciphertext ─────────────────────────────────────────

  describe("corrupted ciphertext", () => {
    it("returns raw value on decryption failure (no exception)", () => {
      const corrupted = "enc:v1:000000000000000000000000:***:corrupted";
      const result = decrypt(corrupted);
      expect(result).toBe(corrupted);
    });
  });

  // ─── maskApiKey ───────────────────────────────────────────────────

  describe("maskApiKey", () => {
    it("masks correctly showing last 4 chars", () => {
      const result = maskApiKey("abcdefghijklmnop");
      expect(result).toBe("************mnop");
    });

    it("handles short values (shorter than visible chars)", () => {
      expect(maskApiKey("abc", 4)).toBe("abc");
    });

    it("handles empty string", () => {
      expect(maskApiKey("")).toBe("");
    });

    it("handles exact length", () => {
      expect(maskApiKey("abcd", 4)).toBe("abcd");
    });
  });

  // ─── isSecretKey ──────────────────────────────────────────────────

  describe("isSecretKey", () => {
    it("detects various secret key patterns", () => {
      const secrets = [
        "ai_api_key",
        "stripe_secret",
        "auth_token",
        "db_password",
        "webhook_credential",
        "signing_private_key",
        "mcp_apikey",
      ];
      for (const key of secrets) {
        expect(isSecretKey(key)).toBe(true);
      }
    });

    it("rejects non-secret keys", () => {
      const nonSecrets = [
        "ai_provider",
        "ai_model",
        "ai_embedding_model",
        "chunk_size",
        "theme_color",
        "max_documents",
      ];
      for (const key of nonSecrets) {
        expect(isSecretKey(key)).toBe(false);
      }
    });
  });
});
