#!/usr/bin/env npx tsx
/**
 * encrypt-existing-keys.ts
 *
 * Migration script: Encrypt existing plaintext secrets in the database.
 *
 * Usage:
 *   npx tsx scripts/encrypt-existing-keys.ts              # Encrypt all secrets
 *   npx tsx scripts/encrypt-existing-keys.ts --dry-run    # Preview without changes
 *
 * This script:
 * 1. Reads all Setting and WorkspaceSetting rows
 * 2. Identifies keys that look like secrets (API keys, tokens, passwords)
 * 3. Encrypts plaintext values in-place
 * 4. Skips values that are already encrypted (idempotent)
 */

import { PrismaClient } from "@prisma/client";
import { encrypt, isEncrypted, isSecretKey } from "../lib/crypto";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("=== Mimotes Secret Encryption Migration ===\n");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE — no changes will be made\n");
  }

  // Ensure encryption key is configured
  if (!process.env.ENCRYPTION_KEY) {
    console.error("❌ ENCRYPTION_KEY environment variable is not set.");
    console.error("   Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    process.exit(1);
  }

  let encryptedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // ── Global Settings ─────────────────────────────────────
  console.log("📋 Checking global settings...");
  const globalSettings = await prisma.setting.findMany();

  for (const setting of globalSettings) {
    if (!isSecretKey(setting.key)) {
      continue; // Not a secret, skip
    }

    if (isEncrypted(setting.value)) {
      console.log(`  ✓ ${setting.key}: already encrypted`);
      skippedCount++;
      continue;
    }

    console.log(`  🔒 ${setting.key}: encrypting...`);
    if (!DRY_RUN) {
      try {
        const encryptedValue = encrypt(setting.value);
        await prisma.setting.update({
          where: { id: setting.id },
          data: { value: encryptedValue },
        });
        encryptedCount++;
      } catch (error) {
        console.error(`  ❌ ${setting.key}: encryption failed —`, error);
        errorCount++;
      }
    } else {
      encryptedCount++;
    }
  }

  // ── Workspace Settings ───────────────────────────────────
  console.log("\n📋 Checking workspace settings...");
  const wsSettings = await prisma.workspaceSetting.findMany();

  for (const setting of wsSettings) {
    if (!isSecretKey(setting.key)) {
      continue; // Not a secret, skip
    }

    if (isEncrypted(setting.value)) {
      console.log(`  ✓ [ws:${setting.workspaceId}] ${setting.key}: already encrypted`);
      skippedCount++;
      continue;
    }

    console.log(`  🔒 [ws:${setting.workspaceId}] ${setting.key}: encrypting...`);
    if (!DRY_RUN) {
      try {
        const encryptedValue = encrypt(setting.value);
        await prisma.workspaceSetting.update({
          where: { id: setting.id },
          data: { value: encryptedValue },
        });
        encryptedCount++;
      } catch (error) {
        console.error(`  ❌ [ws:${setting.workspaceId}] ${setting.key}: encryption failed —`, error);
        errorCount++;
      }
    } else {
      encryptedCount++;
    }
  }

  // ── Summary ──────────────────────────────────────────────
  console.log("\n=== Migration Summary ===");
  console.log(`  Encrypted: ${encryptedCount}`);
  console.log(`  Skipped (already encrypted): ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (DRY_RUN) {
    console.log("\n🔍 This was a dry run. Run without --dry-run to apply changes.");
  } else {
    console.log("\n✅ Migration complete!");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  prisma.$disconnect();
  process.exit(1);
});
