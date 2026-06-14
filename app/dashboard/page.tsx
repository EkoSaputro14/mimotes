import { Suspense } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import { GreetingBar } from "@/components/dashboard/greeting-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { SystemHealth } from "@/components/dashboard/system-health";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentChats } from "@/components/dashboard/recent-chats";
import { TopDocuments } from "@/components/dashboard/top-documents";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  FileText,
  Layers,
  MessageSquare,
  Users,
  Upload,
  FileCode,
  Puzzle,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "Dashboard — Mimotes",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || null;

  let documentCount = 0;
  try {
    documentCount = await prisma.document.count();
  } catch {
    // Ignore — greeting will show without count
  }

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        {/* E1: Greeting Bar — personalized welcome */}
        <GreetingBar userName={userName} documentCount={documentCount} />

        {/* Stat Cards Row — with aria-live for screen readers */}
        <StatCardsRow />

        {/* E1: 2-Column Grid — Recent Chats (55%) + Top Documents (45%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <RecentChats />
          </div>
          <div className="lg:col-span-2">
            <TopDocuments />
          </div>
        </div>

        {/* E1: Usage Chart — full width */}
        <UsageChart />

        {/* 2-Column Grid: Quick Actions (60%) + Activity/System Health (40%) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* LEFT COLUMN — Quick Actions (60%) */}
          <div className="lg:col-span-3">
            <QuickActions />
          </div>

          {/* RIGHT COLUMN — Activity Feed + System Health (40%) */}
          <div className="space-y-6 lg:col-span-2">
            <ActivityFeed />
            {/* E1: System Health — compact when all ok */}
            <SystemHealth compact />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/**
 * Quick Actions — 3×2 grid of action cards with icons, titles, and subtitle descriptions.
 */
function QuickActions() {
  const actions = [
    {
      label: "New Chat",
      href: "/chat",
      icon: MessageSquare,
      desc: "Start a fresh AI knowledge session",
    },
    {
      label: "Upload File",
      href: "/documents/upload",
      icon: Upload,
      desc: "Support PDF, TXT or Markdown",
    },
    {
      label: "Manage API",
      href: "/developers",
      icon: FileCode,
      desc: "Configure access and keys",
    },
    {
      label: "Optimization",
      href: "/knowledge/chunks",
      icon: Layers,
      desc: "Fine-tune your knowledge chunks",
    },
    {
      label: "Connect Apps",
      href: "/settings/widget",
      icon: Puzzle,
      desc: "Sync with external services",
    },
    {
      label: "Reports",
      href: "/analytics/usage",
      icon: BarChart3,
      desc: "View usage analytics",
    },
  ];

  return (
    <div role="region" aria-label="Aksi cepat" className="bg-card border border-border/20 rounded-lg p-5">
      <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="bg-card border border-border/20 rounded-lg p-4 transition-colors hover:border-primary/30 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Icon className="size-5 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">{action.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Stat cards row — fetches aggregated stats and renders 4 cards.
 * Wrapped in Suspense for streaming SSR.
 */
function StatCardsRow() {
  return (
    <Suspense
      fallback={
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCard
              key={i}
              icon={<FileText className="size-5" />}
              label="—"
              value="—"
              loading
            />
          ))}
        </div>
      }
    >
      <StatCardsRowInner />
    </Suspense>
  );
}

async function StatCardsRowInner() {
  let stats = {
    totalDocuments: 0,
    totalChunks: 0,
    totalSessions: 0,
    totalMessages: 0,
    todaySessions: 0,
    todayMessages: 0,
    documentsByStatus: {} as Record<string, number>,
  };

  try {
    const [
      totalDocuments,
      totalChunks,
      totalSessions,
      totalMessages,
      documentsByStatus,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint as count FROM document_chunks`.catch(() => [{ count: BigInt(0) }]),
      prisma.chatSession.count(),
      prisma.chatMessage.count(),
      prisma.document.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todaySessions, todayMessages] = await Promise.all([
      prisma.chatSession.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.chatMessage.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    stats = {
      totalDocuments,
      totalChunks: Number(totalChunks[0]?.count ?? 0),
      totalSessions,
      totalMessages,
      todaySessions,
      todayMessages,
      documentsByStatus: Object.fromEntries(
        documentsByStatus.map((d: { status: string; _count: { id: number } }) => [d.status, d._count.id])
      ),
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
  }

  const readyDocs = stats.documentsByStatus["ready"] ?? 0;
  const processingDocs = stats.documentsByStatus["processing"] ?? 0;

  return (
    <div role="region" aria-label="Statistik dashboard" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        icon={<FileText className="size-5" />}
        label="Documents"
        value={stats.totalDocuments}
        trend={
          stats.totalDocuments > 0
            ? Math.round((readyDocs / Math.max(stats.totalDocuments, 1)) * 100) - 100
            : undefined
        }
        trendLabel={
          processingDocs > 0 ? `${processingDocs} processing` : undefined
        }
      />
      <StatCard
        icon={<Layers className="size-5" />}
        label="Knowledge Chunks"
        value={stats.totalChunks}
        trend={undefined}
      />
      <StatCard
        icon={<MessageSquare className="size-5" />}
        label="Chat Sessions"
        value={stats.totalSessions}
        trend={
          stats.todaySessions > 0 ? stats.todaySessions : undefined
        }
        trendLabel="today"
      />
      <StatCard
        icon={<Users className="size-5" />}
        label="Total Messages"
        value={stats.totalMessages}
        trend={
          stats.todayMessages > 0 ? stats.todayMessages : undefined
        }
        trendLabel="today"
      />
    </div>
  );
}
