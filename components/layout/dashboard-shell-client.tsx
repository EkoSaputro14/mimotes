"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import AppSidebar from "./app-sidebar";
import TopNav from "./top-nav";
import MobileNav from "./mobile-nav";
import CommandPalette from "./command-palette";

interface DashboardShellClientProps {
  children: React.ReactNode;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  title?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "full";
}

const maxWidthClasses: Record<string, string> = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  "2xl": "max-w-screen-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  full: "max-w-full",
};

export default function DashboardShellClient({
  children,
  user,
  title,
  maxWidth = "full",
}: DashboardShellClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* E1: Skip-to-content for keyboard/screen-reader navigation */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten
      </a>

      {/* Command Palette — global Cmd+K */}
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />

      {/* Desktop Sidebar — fixed, hidden on mobile */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-[260px] lg:flex-col lg:border-r lg:bg-sidebar">
        <AppSidebar user={user} onCommandOpen={() => setCommandOpen(true)} />
      </aside>

      {/* Mobile Sidebar — sheet overlay */}
      <MobileNav
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        user={user}
      />

      {/* Main content area — offset by sidebar width on desktop */}
      <div className="lg:pl-[260px]">
        {/* Top navigation bar */}
        <TopNav
          user={user}
          onMenuToggle={() => setSidebarOpen(true)}
          onCommandOpen={() => setCommandOpen(true)}
          title={title}
        />

        {/* Page content */}
        <main id="main-content" className="p-4 sm:p-6 lg:p-8">
          <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
