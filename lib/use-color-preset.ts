"use client";

import { useCallback, useEffect, useState } from "react";

export type ColorPreset = "copper" | "blue" | "sage";

const STORAGE_KEY = "mimotes-color-preset";

function getStoredPreset(): ColorPreset {
  if (typeof window === "undefined") return "copper";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ["copper", "blue", "sage"].includes(stored)) {
      return stored as ColorPreset;
    }
  } catch {
    // localStorage not available
  }
  return "copper";
}

export function useColorPreset() {
  const [colorPreset, setPreset] = useState<ColorPreset>("copper");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setPreset(getStoredPreset());
    setMounted(true);
  }, []);

  const setColorPreset = useCallback((preset: ColorPreset) => {
    setPreset(preset);
    try {
      localStorage.setItem(STORAGE_KEY, preset);
    } catch {
      // localStorage not available
    }

    // Apply class to html element
    const html = document.documentElement;
    html.classList.remove("theme-copper", "theme-blue", "theme-sage");
    html.classList.add(`theme-${preset}`);
  }, []);

  return { colorPreset, setColorPreset, mounted };
}
