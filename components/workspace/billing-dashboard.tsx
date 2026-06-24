"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  CreditCard,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { formatDateSafe } from "@/lib/date-utils";

interface BillingData {
  plan: { name: string; displayName: string };
  subscription: {
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    canceledAt: string | null;
  };
  usage: {
    period: string;
    documents: { used: number; limit: number; percent: number };
    storage: { used: number; limit: number; percent: number };
    chatMessages: { used: number; limit: number; percent: number };
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    total: number;
    currency: string;
    dueDate: string | null;
    paidAt: string | null;
    periodStart: string;
    periodEnd: string;
  }>;
  totalPaid: number;
  upgradeSuggestions: Array<{
    metric: string;
    currentUsage: number;
    limit: number;
    percent: number;
    recommendedPlan: string;
    reason: string;
  }>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "active":
    case "paid":
      return <CheckCircle2 className="size-4 text-success" />;
    case "trial":
      return <Clock className="size-4 text-primary" />;
    case "past_due":
    case "open":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "canceled":
    case "void":
      return <XCircle className="size-4 text-destructive" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

export default function BillingDashboard() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch("/api/workspace/billing");
        if (res.ok) setData(await res.json());
      } catch (err) {
        console.error("Failed to load billing:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBilling();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Plan & Revenue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <CreditCard className="size-4" />
            Current Plan
          </div>
          <p className="text-2xl font-bold text-foreground">
            {data.plan.displayName}
          </p>
          <div className="flex items-center gap-2 mt-2">
            {getStatusIcon(data.subscription.status)}
            <span className="text-sm capitalize text-muted-foreground">
              {data.subscription.status}
            </span>
          </div>
          {data.plan.name === "free" && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/billing/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ plan: "pro", interval: "month" }),
                  });
                  if (res.ok) {
                    const { url } = await res.json();
                    if (url) window.location.href = url;
                  } else {
                    const err = await res.json();
                    alert(err.error || "Gagal membuat checkout session");
                  }
                } catch {
                  alert("Gagal menghubungi server");
                }
              }}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
            >
              <ArrowUpRight className="size-4" />
              Upgrade to Pro — $29/mo
            </button>
          )}
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <TrendingUp className="size-4" />
            Total Revenue
          </div>
          <p className="text-2xl font-bold text-foreground">
            {formatCents(data.totalPaid)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {data.invoices.length} invoice{data.invoices.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <FileText className="size-4" />
            Usage This Period
          </div>
          <div className="space-y-1 mt-2">
            <p className="text-sm text-muted-foreground">
              Documents: {data.usage.documents.used}/{data.usage.documents.limit === -1 ? "∞" : data.usage.documents.limit}
            </p>
            <p className="text-sm text-muted-foreground">
              Storage: {data.usage.storage.used} MB/{data.usage.storage.limit === -1 ? "∞" : `${data.usage.storage.limit} MB`}
            </p>
            <p className="text-sm text-muted-foreground">
              Messages: {data.usage.chatMessages.used}/{data.usage.chatMessages.limit === -1 ? "∞" : data.usage.chatMessages.limit}
            </p>
          </div>
        </div>
      </div>

      {/* Upgrade Suggestions */}
      {data.upgradeSuggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-3">
            <AlertTriangle className="size-5" />
            Upgrade Recommendations
          </h3>
          <div className="space-y-2">
            {data.upgradeSuggestions.map((s) => (
              <div
                key={s.metric}
                className="flex items-center justify-between p-3 bg-card rounded-lg border border-amber-100"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{s.metric}</p>
                  <p className="text-xs text-muted-foreground">{s.reason}</p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                >
                  Upgrade
                  <ArrowUpRight className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-foreground">Invoices</h3>
        </div>
        {data.invoices.length === 0 ? (
          <div className="px-6 py-8 text-center text-muted-foreground">
            No invoices yet
          </div>
        ) : (
          <div className="divide-y">
            {data.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-3">
                {getStatusIcon(inv.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {inv.invoiceNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateSafe(inv.periodStart)} — {formatDateSafe(inv.periodEnd)}
                  </p>
                </div>
                <span className="text-sm font-medium text-foreground">
                  {formatCents(inv.total)}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
