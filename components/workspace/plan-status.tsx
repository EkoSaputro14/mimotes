import { Check, Lock, Crown, Zap, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { getWorkspaceFeatures, getWorkspacePlan } from "@/lib/entitlements";
import { getFeatureDisplayName } from "@/lib/entitlements";
import type { FeatureName } from "@/lib/entitlements";

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free: <Zap className="size-4" />,
  pro: <Crown className="size-4" />,
  enterprise: <Building2 className="size-4" />,
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  enterprise: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

interface PlanStatusProps {
  workspaceId: string;
}

/**
 * PlanStatus — shows current plan, enabled features, and locked features
 * on the dashboard.
 */
export async function PlanStatus({ workspaceId }: PlanStatusProps) {
  const planName = await getWorkspacePlan(workspaceId);
  const { enabled, disabled } = await getWorkspaceFeatures(workspaceId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Plan & Features</CardTitle>
          <Badge className={PLAN_COLORS[planName] || PLAN_COLORS.free}>
            {PLAN_ICONS[planName]}
            <span className="ml-1 capitalize">{planName}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Enabled Features */}
        {enabled.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              ENABLED FEATURES
            </p>
            <div className="flex flex-wrap gap-1.5">
              {enabled.map((feature: FeatureName) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/50 dark:text-green-400"
                >
                  <Check className="size-3" />
                  {getFeatureDisplayName(feature)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Locked Features */}
        {disabled.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              LOCKED FEATURES
            </p>
            <div className="flex flex-wrap gap-1.5">
              {disabled.map((feature: FeatureName) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                >
                  <Lock className="size-3" />
                  {getFeatureDisplayName(feature)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upgrade CTA */}
        {disabled.length > 0 && planName !== "enterprise" && (
          <Link href="/settings/billing" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Crown className="size-4" />
            Upgrade Plan
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
