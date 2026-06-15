/**
 * Shared test utilities for Mimotes test suite.
 */
import { randomBytes } from "crypto";

/**
 * Generate a valid 64-char hex encryption key for testing.
 */
export function generateTestEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Set ENCRYPTION_KEY env var for a test, restore after.
 * Returns a cleanup function.
 */
export function withEncryptionKey(key: string): () => void {
  const original = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = key;
  return () => {
    if (original === undefined) {
      delete process.env.ENCRYPTION_KEY;
    } else {
      process.env.ENCRYPTION_KEY = original;
    }
  };
}

/**
 * Remove ENCRYPTION_KEY env var for a test, restore after.
 */
export function withoutEncryptionKey(): () => void {
  const original = process.env.ENCRYPTION_KEY;
  delete process.env.ENCRYPTION_KEY;
  return () => {
    if (original !== undefined) {
      process.env.ENCRYPTION_KEY = original;
    }
  };
}
