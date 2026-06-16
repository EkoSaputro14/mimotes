"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  BarChart3,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";

interface SettingsSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SETTINGS_ITEMS = [
  { label: "Akun", href: "/settings/account", icon: User, group: "Akun & Profil" },
  { label: "Keamanan", href: "/settings/security", icon: Lock, group: "Akun & Profil" },
  { label: "Notifikasi", href: "/settings/notifications", icon: Bell, group: "Akun & Profil" },
  { label: "AI Settings", href: "/settings", icon: Brain, group: "Workspace" },
  { label: "Workspace", href: "/settings/workspace", icon: LayoutGrid, group: "Workspace" },
  { label: "API Keys", href: "/settings/api-keys", icon: Key, group: "Workspace" },
  { label: "MCP", href: "/settings/mcp", icon: Puzzle, group: "Advanced" },
  { label: "Widget", href: "/settings/widget", icon: Settings, group: "Advanced" },
  { label: "Billing", href: "/settings/billing", icon: CreditCard, group: "Advanced" },
  { label: "Audit Logs", href: "/settings/audit", icon: Shield, group: "Advanced" },
];

export default function SettingsSearch({ open, onOpenChange }: SettingsSearchProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  function navigate(href: string) {
    onOpenChange(false);
    setInputValue("");
    router.push(href);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        setInputValue("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const groups = SETTINGS_ITEMS.reduce<Record<string, typeof SETTINGS_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Cari pengaturan..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>Tidak ada pengaturan ditemukan.</CommandEmpty>
        {Object.entries(groups).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => navigate(item.href)}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
                <CommandShortcut>⌘K</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
