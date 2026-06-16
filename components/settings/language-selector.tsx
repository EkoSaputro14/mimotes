"use client";

import { Globe } from "lucide-react";

type LanguageOption = {
  value: string;
  label: string;
  nativeLabel: string;
};

const LANGUAGES: LanguageOption[] = [
  { value: "id", label: "Bahasa Indonesia", nativeLabel: "Bahasa" },
  { value: "en", label: "English", nativeLabel: "English" },
];

export default function LanguageSelector() {
  // E1: localStorage-based. E2 will add i18n framework integration.
  const currentLang =
    typeof window !== "undefined"
      ? localStorage.getItem("mimotes-lang") || "id"
      : "id";

  function handleLanguageChange(lang: string) {
    localStorage.setItem("mimotes-lang", lang);
    // Announce change to screen readers
    const langName = LANGUAGES.find((l) => l.value === lang)?.label || lang;
    const announcement = document.getElementById("lang-announcement");
    if (announcement) {
      announcement.textContent = `Bahasa diubah ke ${langName}`;
    }
  }

  return (
    <div>
      <div className="flex gap-1 p-1 rounded-lg bg-muted" role="radiogroup" aria-label="Pilih bahasa">
        {LANGUAGES.map((lang) => {
          const isActive = currentLang === lang.value;
          return (
            <button
              key={lang.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => handleLanguageChange(lang.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Globe className="h-4 w-4" />
              {lang.nativeLabel}
            </button>
          );
        })}
      </div>
      {/* aria-live announcement region */}
      <div
        id="lang-announcement"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </div>
  );
}
