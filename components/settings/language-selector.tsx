"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";

type LanguageOption = {
  value: "id" | "en";
  label: string;
  nativeLabel: string;
  description: string;
};

const LANGUAGES: LanguageOption[] = [
  { value: "id", label: "Bahasa Indonesia", nativeLabel: "Bahasa Indonesia", description: "Gunakan Bahasa Indonesia" },
  { value: "en", label: "English", nativeLabel: "English", description: "Use English language" },
];

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Globe className="h-4 w-4" />
        <span>Pilih bahasa / Select language</span>
      </div>
      <div className="grid gap-3">
        {LANGUAGES.map((option) => {
          const isActive = lang === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setLang(option.value)}
              className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                isActive
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/30 hover:bg-accent/50"
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                <Globe className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className={`font-medium ${isActive ? "text-primary" : "text-foreground"}`}>
                  {option.nativeLabel}
                </p>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              {isActive && (
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                  <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
