"use client";

import { Search } from "lucide-react";

interface GreetingBarProps {
  userName?: string | null;
  documentCount?: number;
  onSearchOpen?: () => void;
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Selamat pagi";
  if (hour < 17) return "Selamat siang";
  if (hour < 21) return "Selamat sore";
  return "Selamat malam";
}

export function GreetingBar({
  userName,
  documentCount,
  onSearchOpen,
}: GreetingBarProps) {
  const greeting = getTimeBasedGreeting();
  const displayName = userName?.split(" ")[0] || "User";

  return (
    <div
      role="region"
      aria-label="Sambutan"
      className="bg-card border border-border/20 rounded-lg p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {greeting}, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {documentCount !== undefined
              ? `${documentCount} dokumen tersedia`
              : "Selamat datang di Mimotes"}
          </p>
        </div>
        {onSearchOpen && (
          <button
            onClick={onSearchOpen}
            className="inline-flex items-center gap-2 px-4 h-[44px] text-sm text-muted-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label="Buka pencarian"
          >
            <Search className="size-4" />
            <span className="hidden sm:inline">Cari...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-background border border-border rounded">
              ⌘K
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
