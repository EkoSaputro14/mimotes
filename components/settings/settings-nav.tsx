"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  Palette,
  Brain,
  Puzzle,
  CreditCard,
  FileBarChart,
  Globe,
  Shield,
  LayoutGrid,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "AI Settings",
    href: "/settings",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    label: "Workspace",
    href: "/settings/workspace",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    label: "MCP",
    href: "/settings/mcp",
    icon: <Puzzle className="h-4 w-4" />,
  },
  {
    label: "Widget",
    href: "/settings/widget",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    label: "Billing",
    href: "/settings/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    label: "Audit Logs",
    href: "/settings/audit",
    icon: <Shield className="h-4 w-4" />,
  },
];

export default function SettingsNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings" || pathname === "/settings/";
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card"
        aria-label="Settings navigation"
      >
        <div className="px-4 py-5 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        </div>
        <ul className="flex-1 p-2 space-y-1" role="list">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile tabs */}
      <nav
        className="lg:hidden overflow-x-auto border-b border-border bg-card -mx-4 -mt-4 px-4"
        aria-label="Settings navigation"
      >
        <ul
          className="flex gap-1 py-2 min-w-max"
          role="tablist"
          aria-label="Settings sections"
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href} role="presentation">
                <Link
                  href={item.href}
                  role="tab"
                  aria-selected={active}
                  aria-controls="settings-content"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
