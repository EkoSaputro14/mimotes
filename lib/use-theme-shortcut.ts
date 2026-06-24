"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Keyboard shortcut: Ctrl/Cmd + Shift + L → cycle theme
 * Order: light → dark → system → light
 */
export function useThemeShortcut() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Check for Ctrl/Cmd + Shift + L
      const isModifier = e.ctrlKey || e.metaKey;
      if (isModifier && e.shiftKey && e.key === "L") {
        e.preventDefault();

        const cycle: Record<string, string> = {
          light: "dark",
          dark: "system",
          system: "light",
        };

        const nextTheme = cycle[theme ?? "system"] ?? "light";
        setTheme(nextTheme);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [theme, setTheme]);
}
