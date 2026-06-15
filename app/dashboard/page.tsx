import { Suspense } from "react";
import Link from "next/link";
import DashboardShell from "@/components/layout/dashboard-shell";
import { GreetingBar } from "@/components/dashboard/greeting-bar";
import { HeroMetric } from "@/components/dashboard/hero-metric";
import { StatCard } from "@/components/dashboard/stat-card";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { SystemHealth } from "@/components/dashboard/system-health";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentChats } from "@/components/dashboard/recent-chats";
import { TopDocuments } from "@/components/dashboard/top-documents";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  MessageSquare,
  Layers,
  Users,
  Upload,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";

export const metadata = {
  title: "Dashboard — Mimotes",
};

export default async function DashboardPage() {
  const session = await auth();
  const userName = session?.user?.name || null;

  let documentCount = 0;
  let totalChunks = 0;
  let totalSessions = 0;
  let totalMessages = 0;
  let todaySessions = 0;
  let todayMessages = 0;
  let documentsByStatus = {} as Record<string, number>;

  try {
    const userId = session?.user?.id as string;
    const userDocWhere = userId ? { userId } : {};

    const [
      docs,
      chunks,
      sessions,
      messages,
      statusGroups,
    ] = await Promise.all([
      prisma.document.count({ where: userDocWhere }),
      prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*)::bigint as count FROM document_chunks dc JOIN documents d ON dc.document_id = d.id WHERE d.user_id = ${userId}`.catch(() => [{ count: BigInt(0) }]),
      prisma.chatSession.count({ where: userDocWhere }),
      prisma.chatMessage.count({ where: { session: { userId } } }),
      prisma.document.groupBy({ by: ["status"], where: userDocWhere, _count: { id: true } }),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [tSessions, tMessages] = await Promise.all([
      prisma.chatSession.count({ where: { userId, createdAt: { gte: today } } }),
      prisma.chatMessage.count({ where: { session: { userId }, createdAt: { gte: today } } }),
    ]);

    documentCount = docs;
    totalChunks = Number(chunks[0]?.count ?? 0);
    totalSessions = sessions;
    totalMessages = messages;
    todaySessions = tSessions;
    todayMessages = tMessages;
    documentsByStatus = Object.fromEntries(
      statusGroups.map((d: { status: string; _count: { id: number } }) => [d.status, d._count.id])
    );
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
  }

  const readyDocs = documentsByStatus["ready"] ?? 0;
  const processingDocs = documentsByStatus["processing"] ?? 0;
  const hasDocuments = documentCount > 0;
  const hasChats = totalSessions > 0;
  const isNewUser = !hasDocuments && !hasChats;

  return (
    <DashboardShell title="Dashboard">
      <div className="space-y-6">
        {/* E2: Greeting Bar — personalized with workspace context */}
        <GreetingBar
          userName={userName}
          documentCount={documentCount}
          workspaceName="Personal"
        />

        {/* E2: Hero Metric — primary document count with progress bar */}
        <HeroMetric
          totalDocuments={documentCount}
          readyDocuments={readyDocs}
          processingDocuments={processingDocs}
        />

        {/* E2: Onboarding Checklist — only for new users */}
        {isNewUser && (
          <OnboardingChecklist hasDocuments={hasDocuments} hasChats={hasChats} />
        )}

        {/* E2: Stat Row V2 — 3 secondary metrics (not Documents) */}
        <div role="region" aria-label="Statistik dashboard" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            icon={<MessageSquare className="size-5" />}
            label="Chat Sessions"
            value={totalSessions}
            trend={todaySessions > 0 ? todaySessions : undefined}
            trendLabel="today"
          />
          <StatCard
            icon={<Layers className="size-5" />}
            label="Knowledge Chunks"
            value={totalChunks}
          />
          <StatCard
            icon={<Users className="size-5" />}
            label="Total Messages"
            value={totalMessages}
            trend={todayMessages > 0 ? todayMessages : undefined}
            trendLabel="today"
          />
        </div>

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
            <QuickActions hasDocuments={hasDocuments} hasChats={hasChats} />
          </div>

          {/* RIGHT COLUMN — Activity Feed + System Health (40%) */}
          <div className="space-y-6 lg:col-span-2">
            <ActivityFeed />
            <SystemHealth compact />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

/**
 * E2: Quick Actions — contextual, user-centric labels.
 * Adapts based on user state (new vs. power user).
 */
function QuickActions({
  hasDocuments,
  hasChats,
}: {
  hasDocuments: boolean;
  hasChats: boolean;
}) {
  // E2: Contextual actions based on user state
  const actions = [
    ...(hasChats
      ? [
          {
            label: "Lanjutkan Chat",
            href: "/chat",
            icon: MessageSquare,
            primary: true,
          },
        ]
      : [
          {
            label: "Chat Baru",
            href: "/chat",
            icon: MessageSquare,
            primary: true,
          },
        ]),
    {
      label: hasDocuments ? "Upload Lagi" : "Upload Dokumen",
      href: "/documents/upload",
      icon: Upload,
      primary: false,
    },
    {
      label: "Pengaturan",
      href: "/settings",
      icon: Settings,
      primary: false,
    },
    {
      label: "Analitik",
      href: "/analytics/usage",
      icon: BarChart3,
      primary: false,
    },
  ];

  return (
    <div role="region" aria-label="Aksi cepat" className="bg-card border border-border/20 rounded-lg p-5">
      <h3 className="text-base font-semibold mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                action.primary
                  ? "bg-primary/10 text-primary hover:bg-primary/15 border border-primary/20"
                  : "bg-card border border-border/20 hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
