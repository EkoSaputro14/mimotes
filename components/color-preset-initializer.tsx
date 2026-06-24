"use client";

import { useEffect } from "react";
import { useColorPreset } from "@/lib/use-color-preset";

/**
 * Applies the stored color-preset class to <html> as early as possible
 * to prevent any flash of unstyled colors.
 */
export function ColorPresetInitializer() {
  const { colorPreset, mounted } = useColorPreset();

  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.remove("theme-copper", "theme-blue", "theme-sage");
    html.classList.add(`theme-${colorPreset}`);
  }, [colorPreset, mounted]);

  return null;
}
