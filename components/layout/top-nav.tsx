"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, ChevronRight, Sun, Moon, Monitor, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { logout } from "@/lib/actions";
import { useEffect, useState } from "react";
import { useThemeShortcut } from "@/lib/use-theme-shortcut";

interface TopNavProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  onMenuToggle: () => void;
  onCommandOpen?: () => void;
  title?: string;
}

/** Map pathname segments to human-readable labels */
const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  chat: "Chat",
  documents: "Documents",
  upload: "Upload",
  settings: "Settings",
  knowledge: "Knowledge Base",
  chunks: "Sections",
  search: "Similarity Search",
  sources: "Sources",
  analytics: "Analytics",
  usage: "Usage",
  cost: "Cost",
  ai: "AI",
  playground: "Playground",
  prompts: "Prompts",
  new: "New",
};

function generateBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];

  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    crumbs.push({
      label: segmentLabels[segment] ?? segment,
      href: currentPath,
    });
  }

  return crumbs;
}

export default function TopNav({ user, onMenuToggle, onCommandOpen, title }: TopNavProps) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const breadcrumbs = generateBreadcrumbs(pathname);

  useThemeShortcut();

  useEffect(() => {
    setMounted(true);
  }, []);

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
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden mr-2"
        onClick={onMenuToggle}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm min-w-0 overflow-hidden">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 hidden sm:inline"
        >
          Dashboard
        </Link>
        {breadcrumbs.filter((crumb, i) => !(i === 0 && crumb.label === "Dashboard")).length > 0 &&
          breadcrumbs.filter((crumb, i) => !(i === 0 && crumb.label === "Dashboard")).map((crumb, index, filtered) => {
            const isLast = index === filtered.length - 1;
            // On mobile: only show last item. On desktop: show all
            return (
              <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                <span className="hidden sm:inline">
                  <ChevronRight className="size-3.5 text-muted-foreground/50 shrink-0" />
                </span>
                <span className={index === 0 && !isLast ? "sm:hidden" : ""}>
                  {isLast ? (
                    <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none inline-block">
                      {title ?? crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-muted-foreground hover:text-foreground transition-colors truncate hidden sm:inline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              </span>
            );
          })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Command Palette trigger (replaces static search) */}
      <div className="hidden md:flex items-center mr-3">
        <button
          onClick={() => onCommandOpen?.()}
          className="flex items-center gap-2 h-9 w-64 rounded-lg border border-border/40 bg-muted/50 px-3 text-sm text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left">Search or jump to...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded-md border border-border/40 bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* All systems operational badge — removed per Fix #28 */}

      {/* Theme toggle dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            suppressHydrationWarning
          >
            {mounted && (
              theme === "dark" ? (
                <Moon className="size-5" />
              ) : theme === "light" ? (
                <Sun className="size-5" />
              ) : (
                <Monitor className="size-5" />
              )
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">Tema</p>
            <p className="text-xs text-muted-foreground">Pilih tampilan aplikasi</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light</span>
            {mounted && theme === "light" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark</span>
            {mounted && theme === "dark" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            <span>System</span>
            {mounted && theme === "system" && <Check className="ml-auto h-4 w-4" />}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="rounded-full" />
          }
        >
          <Avatar size="sm">
            {user.image && <AvatarImage src={user.image} alt={user.name ?? ""} />}
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8}>
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            render={<Link href="/settings" />}
          >
            <Settings />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => logout()}
          >
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
