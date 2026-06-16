"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface UpgradeBannerProps {
  feature: string;
  currentPlan: string;
  /** Custom message override */
  message?: string;
}

/**
 * UpgradeBanner — shown when a feature is locked by the current plan.
 * Displays a lock icon, feature name, and "Upgrade to Pro" CTA.
 */
export function UpgradeBanner({
  feature,
  currentPlan,
  message,
}: UpgradeBannerProps) {
  const displayMessage =
    message ||
    `Upgrade to Pro to unlock ${feature.replace(/_/g, " ")} and more features.`;

  return (
    <div className="flex items-center gap-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
        <Lock className="size-5 text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          {feature.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}{" "}
          — {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} Plan
        </p>
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {displayMessage}
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="inline-flex shrink-0 items-center justify-center rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
      >
        Upgrade to Pro
      </Link>
    </div>
  );
}
