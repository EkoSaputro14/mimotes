import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed PlanFeature records for all plans.
 *
 * Run: npx tsx prisma/seed-entitlements.ts
 */

const PLAN_FEATURES: Record<string, string[]> = {
  free: ["analytics"],
  pro: [
    "mcp",
    "public_widget",
    "api_access",
    "analytics",
    "custom_branding",
    "team_members",
    "priority_support",
  ],
  enterprise: [
    "mcp",
    "public_widget",
    "api_access",
    "analytics",
    "custom_branding",
    "team_members",
    "audit_logs",
    "sso",
    "priority_support",
  ],
};

async function main() {
  console.log("🎯 Seeding plan features...\n");

  for (const [planName, features] of Object.entries(PLAN_FEATURES)) {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { name: planName },
    });

    if (!plan) {
      console.log(`  ⚠️  Plan "${planName}" not found — skipping`);
      continue;
    }

    // Upsert each feature
    for (const feature of features) {
      await prisma.planFeature.upsert({
        where: { planId_feature: { planId: plan.id, feature } },
        update: { enabled: true },
        create: { planId: plan.id, feature, enabled: true },
      });
    }

    // Ensure features NOT in this plan are disabled (or don't exist)
    const allFeatures = [
      "mcp",
      "public_widget",
      "api_access",
      "analytics",
      "custom_branding",
      "team_members",
      "audit_logs",
      "sso",
      "priority_support",
    ];

    for (const feature of allFeatures) {
      if (!features.includes(feature)) {
        // Upsert as disabled
        await prisma.planFeature.upsert({
          where: { planId_feature: { planId: plan.id, feature } },
          update: { enabled: false },
          create: { planId: plan.id, feature, enabled: false },
        });
      }
    }

    console.log(`  ✅ ${planName}: ${features.length} enabled, ${allFeatures.length - features.length} disabled`);
  }

  console.log("\n🎉 Plan features seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
