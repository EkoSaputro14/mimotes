"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/actions";
import {
  Bot,
  LayoutDashboard,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  BookOpen,
  MessageCircle,
  Target,
  Shield,
} from "lucide-react";
import WorkspaceSwitcher from "@/components/workspace/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

interface AppSidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  /** Called when a nav link is clicked (used by mobile to close sheet) */
  onNavigate?: () => void;
  /** Called to open the command palette */
  onCommandOpen?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

/** 6 core sidebar destinations — all other routes via Cmd+K */
const coreNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Documents", href: "/knowledge/documents", icon: FileText },
  { label: "Knowledge", href: "/knowledge/search", icon: BookOpen },
  { label: "Leads", href: "/leads", icon: Target },
  { label: "Analytics", href: "/analytics/leads", icon: BarChart3 },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageCircle },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function AppSidebar({ user, onNavigate }: AppSidebarProps) {
  const pathname = usePathname();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check super admin status
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.isSuperAdmin) setIsSuperAdmin(true);
      })
      .catch(() => {});
  }, []);

  /** Check if a nav item is active (exact match or child route) */
  function isActive(href: string): boolean {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  /** Get initials for avatar fallback */
  function getInitials(): string {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  }

  const userInitials = getInitials();

  return (
    <div className="flex h-full flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Bot className="size-5" />
        </div>
        <span className="text-base font-semibold text-foreground tracking-tight">
          Mimotes
        </span>
      </div>

      {/* Workspace Switcher */}
      <div className="px-3 py-2">
        <WorkspaceSwitcher />
      </div>

      <Separator />

      {/* + New Chat CTA */}
      <div className="px-3 py-2">
        <Link
          href="/chat"
          onClick={onNavigate}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
        >
          <MessageSquare className="size-4" />
          New Chat
        </Link>
      </div>

      {/* Core Navigation — 6 items, flat list, no sections */}
      <nav className="flex flex-1 flex-col gap-0.5 px-3 py-3">
        {coreNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              {/* Active indicator — left border bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
              )}
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Super Admin Link — only visible to super admins */}
      {isSuperAdmin && (
        <nav>
          <Link
            href="/admin/users"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              isActive("/admin/users")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Shield className="size-4 shrink-0" />
            Kelola Users
          </Link>
        </nav>
      )}

      <Separator className="mx-3" />

      {/* User Profile */}
      <div className="p-3">
        <div className="flex items-center gap-2.5 rounded-md px-2.5 py-2">
          <Avatar size="sm">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.name ?? "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
