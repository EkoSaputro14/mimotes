"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  User,
  Brain,
  LayoutGrid,
  Lock,
  Bell,
  Key,
  Puzzle,
  Settings,
  CreditCard,
  Shield,
  Users,
  MessageCircle,
  ArrowLeft,
  Globe,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface NavItem {
  labelKey: string;
  fallback: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    labelKey: "settings.account",
    fallback: "Akun",
    href: "/settings/account",
    icon: <User className="h-4 w-4" />,
  },
  {
    labelKey: "settings.ai",
    fallback: "AI Settings",
    href: "/settings",
    icon: <Brain className="h-4 w-4" />,
  },
  {
    labelKey: "settings.workspace",
    fallback: "Workspace",
    href: "/settings/workspace",
    icon: <LayoutGrid className="h-4 w-4" />,
  },
  {
    labelKey: "settings.security",
    fallback: "Keamanan",
    href: "/settings/security",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    labelKey: "settings.notifications",
    fallback: "Notifikasi",
    href: "/settings/notifications",
    icon: <Bell className="h-4 w-4" />,
  },
  {
    labelKey: "settings.api_keys",
    fallback: "API Keys",
    href: "/settings/api-keys",
    icon: <Key className="h-4 w-4" />,
  },
  {
    labelKey: "settings.mcp",
    fallback: "MCP",
    href: "/settings/mcp",
    icon: <Puzzle className="h-4 w-4" />,
  },
  {
    labelKey: "settings.widget",
    fallback: "Widget",
    href: "/settings/widget",
    icon: <Settings className="h-4 w-4" />,
  },
  {
    labelKey: "settings.leads",
    fallback: "Leads",
    href: "/settings/leads",
    icon: <Users className="h-4 w-4" />,
  },
  {
    labelKey: "settings.whatsapp",
    fallback: "WhatsApp",
    href: "/settings/whatsapp",
    icon: <MessageCircle className="h-4 w-4" />,
  },
  {
    labelKey: "settings.billing",
    fallback: "Billing",
    href: "/settings/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    labelKey: "settings.language",
    fallback: "Bahasa",
    href: "/settings/language",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    labelKey: "settings.audit",
    fallback: "Audit Logs",
    href: "/settings/audit",
    icon: <Shield className="h-4 w-4" />,
  },
];

export default function SettingsNav() {
  const pathname = usePathname();
  const { t } = useI18n();

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
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("settings.back")}
          </Link>
          <h2 className="text-lg font-semibold text-foreground">{t("settings.title")}</h2>
        </div>
        <ul className="flex-1 p-2 space-y-1 overflow-y-auto" role="list">
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
                  {t(item.labelKey) || item.fallback}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile tabs */}
      <nav
        className="lg:hidden overflow-x-auto border-b border-border bg-card px-4"
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
                  {t(item.labelKey) || item.fallback}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
