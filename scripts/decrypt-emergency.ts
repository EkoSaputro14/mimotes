#!/usr/bin/env npx tsx
/**
 * decrypt-emergency.ts
 *
 * Emergency rollback script: Decrypt all encrypted secrets back to plaintext.
 *
 * Usage:
 *   npx tsx scripts/decrypt-emergency.ts              # Decrypt all encrypted values
 *   npx tsx scripts/decrypt-emergency.ts --dry-run    # Preview without changes
 *
 * ⚠️  WARNING: This removes encryption from all secrets. Only use for emergency rollback.
 *
 * This script:
 * 1. Reads all Setting and WorkspaceSetting rows
 * 2. Identifies values encrypted with our enc:v1: prefix
 * 3. Decrypts them back to plaintext in-place
 * 4. Skips values that are already plaintext (idempotent)
 */

import { PrismaClient } from "@prisma/client";
import { decrypt, isEncrypted } from "../lib/crypto";

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  console.log("=== Mimotes Emergency Decryption Rollback ===\n");
  console.log("⚠️  WARNING: This removes encryption from all secrets.\n");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE — no changes will be made\n");
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error("❌ ENCRYPTION_KEY environment variable is not set.");
    console.error("   You need the same key that was used for encryption.");
    process.exit(1);
  }

  let decryptedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // ── Global Settings ─────────────────────────────────────
  console.log("📋 Checking global settings...");
  const globalSettings = await prisma.setting.findMany();

  for (const setting of globalSettings) {
    if (!isEncrypted(setting.value)) {
      skippedCount++;
      continue; // Already plaintext
    }

    console.log(`  🔓 ${setting.key}: decrypting...`);
    if (!DRY_RUN) {
      try {
        const decryptedValue = decrypt(setting.value);
        if (isEncrypted(decryptedValue)) {
          // Decryption failed — value still has prefix
          console.error(`  ❌ ${setting.key}: decryption returned encrypted value — wrong key?`);
          errorCount++;
          continue;
        }
        await prisma.setting.update({
          where: { id: setting.id },
          data: { value: decryptedValue },
        });
        decryptedCount++;
      } catch (error) {
        console.error(`  ❌ ${setting.key}: decryption failed —`, error);
        errorCount++;
      }
    } else {
      decryptedCount++;
    }
  }

  // ── Workspace Settings ───────────────────────────────────
  console.log("\n📋 Checking workspace settings...");
  const wsSettings = await prisma.workspaceSetting.findMany();

  for (const setting of wsSettings) {
    if (!isEncrypted(setting.value)) {
      skippedCount++;
      continue; // Already plaintext
    }

    console.log(`  🔓 [ws:${setting.workspaceId}] ${setting.key}: decrypting...`);
    if (!DRY_RUN) {
      try {
        const decryptedValue = decrypt(setting.value);
        if (isEncrypted(decryptedValue)) {
          console.error(`  ❌ [ws:${setting.workspaceId}] ${setting.key}: decryption returned encrypted value — wrong key?`);
          errorCount++;
          continue;
        }
        await prisma.workspaceSetting.update({
          where: { id: setting.id },
          data: { value: decryptedValue },
        });
        decryptedCount++;
      } catch (error) {
        console.error(`  ❌ [ws:${setting.workspaceId}] ${setting.key}: decryption failed —`, error);
        errorCount++;
      }
    } else {
      decryptedCount++;
    }
  }

  // ── Summary ──────────────────────────────────────────────
  console.log("\n=== Rollback Summary ===");
  console.log(`  Decrypted: ${decryptedCount}`);
  console.log(`  Skipped (already plaintext): ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);

  if (DRY_RUN) {
    console.log("\n🔍 This was a dry run. Run without --dry-run to apply changes.");
  } else {
    console.log("\n✅ Rollback complete! All secrets are now in plaintext.");
    console.log("⚠️  Remember to remove ENCRYPTION_KEY from your environment.");
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  prisma.$disconnect();
  process.exit(1);
});
