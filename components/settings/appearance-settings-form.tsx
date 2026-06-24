"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor, Check, Keyboard, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColorPreset } from "@/lib/use-color-preset";

const themes = [
  {
    value: "light" as const,
    label: "Light",
    icon: Sun,
    description: "Tema cerah untuk penggunaan siang hari",
  },
  {
    value: "dark" as const,
    label: "Dark",
    icon: Moon,
    description: "Tema gelap untuk penggunaan malam hari",
  },
  {
    value: "system" as const,
    label: "System",
    icon: Monitor,
    description: "Ikuti pengaturan sistem operasi",
  },
];

type ThemeValue = "light" | "dark" | "system";

export default function AppearanceSettingsForm() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorPreset, setColorPreset } = useColorPreset();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show skeleton while mounting to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-8">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const currentTheme = (theme ?? "system") as ThemeValue;
  const activeResolved = resolvedTheme ?? "light";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tampilan</h1>
        <p className="text-muted-foreground mt-1">
          Sesuaikan tampilan aplikasi sesuai preferensi Anda.
        </p>
      </div>

      {/* Theme Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
          <CardDescription>Pilih tema yang nyaman untuk mata Anda.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {themes.map((t) => {
              const Icon = t.icon;
              const isActive = currentTheme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={cn(
                    "relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:bg-muted/50",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  )}
                >
                  {isActive && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Icon
                    className={cn(
                      "h-8 w-8",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="space-y-1">
                    <p className={cn("font-medium", isActive && "text-primary")}>
                      {t.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current active indicator */}
          <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Sun className="h-4 w-4 dark:hidden" />
            <Moon className="hidden h-4 w-4 dark:block" />
            <span>
              Aktif: <span className="font-medium text-foreground capitalize">{activeResolved}</span>
              {currentTheme === "system" && (
                <span> (mengikuti sistem)</span>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Color Preset Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Palet Warna
          </CardTitle>
          <CardDescription>Pilih warna brand aplikasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                value: "copper" as const,
                label: "Copper",
                desc: "Hangat dan elegan",
                colors: ["#cd8c68", "#5baaad", "#FAF8F5"],
              },
              {
                value: "blue" as const,
                label: "MiMo Blue",
                desc: "Klasik dan profesional",
                colors: ["#4F6BFF", "#8B5CF6", "#FAFBFD"],
              },
              {
                value: "sage" as const,
                label: "Sage",
                desc: "Alami dan menenangkan",
                colors: ["#4A7C59", "#D4A44A", "#F5F7F3"],
              },
            ].map((p) => {
              const isActive = colorPreset === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setColorPreset(p.value)}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-xl border-2 p-5 text-left transition-all hover:bg-muted/50",
                    isActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-border/80"
                  )}
                >
                  {isActive && (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex gap-2">
                    {p.colors.map((c) => (
                      <div
                        key={c}
                        className="h-8 w-8 rounded-full border shadow-sm"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="space-y-0.5">
                    <p className={cn("font-medium", isActive && "text-primary")}>
                      {p.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcut */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Pintasan Keyboard
          </CardTitle>
          <CardDescription>
            Gunakan pintasan untuk mengubah tema dengan cepat.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <span className="text-sm">Ganti tema</span>
            <kbd className="inline-flex items-center gap-1 rounded-md border bg-muted px-2 py-1 text-xs font-medium">
              <span className="text-xs">Ctrl/⌘</span> + <span>Shift</span> + <span>L</span>
            </kbd>
          </div>
        </CardContent>
      </Card>

      {/* Color Palette Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Palet Warna</CardTitle>
          <CardDescription>
            Kombinasi warna yang digunakan pada tema saat ini.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-muted-foreground">Primary</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border shadow-sm"
                  style={{ backgroundColor: "var(--primary)" }}
                />
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {activeResolved === "dark" ? "#cd8c68" : "#cd8c68"}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-muted-foreground">Secondary</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border shadow-sm"
                  style={{ backgroundColor: "var(--secondary)" }}
                />
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {activeResolved === "dark" ? "#1e3a5f" : "#F0EBE4"}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-muted-foreground">Accent</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border shadow-sm"
                  style={{ backgroundColor: "var(--accent)" }}
                />
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {activeResolved === "dark" ? "#7DD3E0" : "#5baaad"}
                </code>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-20 text-sm text-muted-foreground">Background</span>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border shadow-sm"
                  style={{ backgroundColor: "var(--background)" }}
                />
                <code className="rounded bg-muted px-2 py-0.5 text-xs">
                  {activeResolved === "dark" ? "#0F1219" : "#FAF8F5"}
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
