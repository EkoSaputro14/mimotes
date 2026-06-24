"use client";

import { useState, useRef, useEffect } from "react";
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
  Phone,
  ArrowLeft,
  Globe,
  Menu,
  X,
  FileText,
  Sun,
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
    labelKey: "settings.appearance",
    fallback: "Tampilan",
    href: "/settings/appearance",
    icon: <Sun className="h-4 w-4" />,
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
    labelKey: "settings.baileys",
    fallback: "WhatsApp Baileys",
    href: "/settings/baileys",
    icon: <Phone className="h-4 w-4" />,
  },
  {
    labelKey: "settings.billing",
    fallback: "Billing",
    href: "/settings/billing",
    icon: <CreditCard className="h-4 w-4" />,
  },
  {
    labelKey: "settings.invoices",
    fallback: "Invoice",
    href: "/settings/invoices",
    icon: <FileText className="h-4 w-4" />,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/settings") {
      return pathname === "/settings" || pathname === "/settings/";
    }
    return pathname.startsWith(href);
  };

  // Get current active item label for mobile header
  const activeItem = NAV_ITEMS.find((item) => isActive(item.href));

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [mobileOpen]);

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

      {/* Mobile floating nav */}
      <div className="lg:hidden" ref={menuRef}>
        {/* Floating header bar */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur border-b border-border">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("settings.back")}</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Current page label */}
            {activeItem && (
              <span className="text-sm font-medium text-foreground truncate max-w-[140px]">
                {activeItem.icon}
                <span className="ml-1.5">{t(activeItem.labelKey) || activeItem.fallback}</span>
              </span>
            )}

            {/* Hamburger button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Dropdown menu */}
        {mobileOpen && (
          <div className="absolute inset-x-0 top-[52px] z-50 mx-3 mt-1 rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">Settings</p>
            </div>
            <ul className="p-2 max-h-[60vh] overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary/10 text-primary"
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
          </div>
        )}
      </div>
    </>
  );
}
