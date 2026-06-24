"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Upload,
  BookOpen,
  Search,
  Layers,
  Link2,
  BarChart3,
  Activity,
  DollarSign,
  Settings,
  Building2,
  CreditCard,
  Zap,
  Puzzle,
  Play,
  FileCode,
  Users,
  Command,
  User,
  Lock,
  Bell,
  Key,
} from "lucide-react";

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from "@/components/ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CommandPalette({
  open,
  onOpenChange,
}: CommandPaletteProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");

  /** Navigate and close palette */
  function navigate(href: string) {
    onOpenChange(false);
    setInputValue("");
    router.push(href);
  }

  /** Global keyboard shortcut: Cmd+K / Ctrl+K */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      // Escape to close
      if (e.key === "Escape" && open) {
        onOpenChange(false);
        setInputValue("");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={inputValue}
        onValueChange={setInputValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate("/dashboard")}>
            <LayoutDashboard className="size-4" />
            Dashboard
            <CommandShortcut>⌘D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/chat")}>
            <MessageSquare className="size-4" />
            Chat
            <CommandShortcut>⌘C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/knowledge/documents")}>
            <FileText className="size-4" />
            Documents
            <CommandShortcut>⌘E</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analytics/usage")}>
            <BarChart3 className="size-4" />
            Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="size-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Documents & Knowledge */}
        <CommandGroup heading="Documents">
          <CommandItem onSelect={() => navigate("/documents/upload")}>
            <Upload className="size-4" />
            Upload Document
            <CommandShortcut>⌘U</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/knowledge/chunks")}>
            <Layers className="size-4" />
            Sections
          </CommandItem>
          <CommandItem onSelect={() => navigate("/knowledge/search")}>
            <Search className="size-4" />
            Similarity Search
          </CommandItem>
          <CommandItem onSelect={() => navigate("/knowledge/sources")}>
            <Link2 className="size-4" />
            Sources
          </CommandItem>
          <CommandItem onSelect={() => navigate("/knowledge/images")}>
            <FileText className="size-4" />
            Images
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Chat */}
        <CommandGroup heading="Chat">
          <CommandItem onSelect={() => navigate("/chat")}>
            <MessageSquare className="size-4" />
            New Chat
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analytics/chat")}>
            <Activity className="size-4" />
            Chat Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate("/analytics/cost")}>
            <DollarSign className="size-4" />
            Cost Analytics
          </CommandItem>
          <CommandItem onSelect={() => navigate("/ai/playground")}>
            <Play className="size-4" />
            Playground
          </CommandItem>
          <CommandItem onSelect={() => navigate("/ai/prompts")}>
            <FileCode className="size-4" />
            Prompts
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Workspace */}
        <CommandGroup heading="Workspace">
          <CommandItem onSelect={() => navigate("/settings/workspace")}>
            <Building2 className="size-4" />
            Workspace Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/usage")}>
            <BarChart3 className="size-4" />
            Usage
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/billing")}>
            <CreditCard className="size-4" />
            Billing
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/audit")}>
            <Users className="size-4" />
            Audit Log
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Settings & Integrations */}
        <CommandGroup heading="Settings">
          <CommandItem onSelect={() => navigate("/settings/account")}>
            <User className="size-4" />
            Account Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/security")}>
            <Lock className="size-4" />
            Security Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/notifications")}>
            <Bell className="size-4" />
            Notification Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/api-keys")}>
            <Key className="size-4" />
            API Keys
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="size-4" />
            AI Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/widget")}>
            <Puzzle className="size-4" />
            Widget Config
          </CommandItem>
          <CommandItem onSelect={() => navigate("/settings/mcp")}>
            <Zap className="size-4" />
            MCP Settings
          </CommandItem>
          <CommandItem onSelect={() => navigate("/developers")}>
            <Zap className="size-4" />
            API / Developers
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
