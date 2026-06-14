"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type ThemeOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: "system", label: "Sistem", icon: <Monitor className="h-4 w-4" /> },
  { value: "light", label: "Terang", icon: <Sun className="h-4 w-4" /> },
  { value: "dark", label: "Gelap", icon: <Moon className="h-4 w-4" /> },
];

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex gap-1 p-1 rounded-lg bg-muted">
        {THEME_OPTIONS.map((opt) => (
          <div
            key={opt.value}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground"
          >
            {opt.icon}
            {opt.label}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex gap-1 p-1 rounded-lg bg-muted"
      role="radiogroup"
      aria-label="Pilih tema"
    >
      {THEME_OPTIONS.map((opt) => {
        const isActive = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => setTheme(opt.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
