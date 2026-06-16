"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SettingsSkeleton } from "./settings-skeleton";
import ThemeToggle from "./theme-toggle";
import LanguageSelector from "./language-selector";

interface ProviderPreset {
  label: string;
  defaultBaseURL: string;
  defaultModel: string;
  defaultEmbeddingModel: string;
  supportsEmbeddings: boolean;
}

const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  mimo: {
    label: "Mimo Pro",
    defaultBaseURL: "https://token-plan-sgp.xiaomimimo.com/v1",
    defaultModel: "mimo-v2.5-pro",
    defaultEmbeddingModel: "",
    supportsEmbeddings: false,
  },
  openai: {
    label: "OpenAI",
    defaultBaseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
  },
  lmstudio: {
    label: "LM Studio (Local)",
    defaultBaseURL: "http://localhost:1234/v1",
    defaultModel: "local-model",
    defaultEmbeddingModel: "text-embedding-nomic-embed-text-v1.5",
    supportsEmbeddings: true,
  },
  ollama: {
    label: "Ollama (Local)",
    defaultBaseURL: "http://localhost:11434/v1",
    defaultModel: "llama3",
    defaultEmbeddingModel: "nomic-embed-text",
    supportsEmbeddings: true,
  },
  openrouter: {
    label: "OpenRouter",
    defaultBaseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
  },
  custom: {
    label: "Custom (OpenAI-Compatible)",
    defaultBaseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    defaultEmbeddingModel: "text-embedding-3-small",
    supportsEmbeddings: true,
  },
  google: {
    label: "Google Gemini",
    defaultBaseURL:
      "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.0-flash",
    defaultEmbeddingModel: "text-embedding-004",
    supportsEmbeddings: true,
  },
};

export default function AISettingsForm() {
  const [provider, setProvider] = useState("mimo");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");

  const [chatModels, setChatModels] = useState<string[]>([]);
  const [embeddingModels, setEmbeddingModels] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Load current settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setProvider(data.ai_provider || "mimo");
          setApiKey(data.ai_api_key || "");
          setBaseUrl(data.ai_base_url || "");
          setModel(data.ai_model || "");
          setEmbeddingModel(data.ai_embedding_model || "");
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  // Update defaults when provider changes
  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setProvider(newProvider);
      const preset = PROVIDER_PRESETS[newProvider];
      if (preset) {
        if (!baseUrl) {
          setBaseUrl(preset.defaultBaseURL);
        }
        if (!model) {
          setModel(preset.defaultModel);
        }
        if (!embeddingModel && preset.defaultEmbeddingModel) {
          setEmbeddingModel(preset.defaultEmbeddingModel);
        }
      }
      setChatModels([]);
      setEmbeddingModels([]);
    },
    [baseUrl, model, embeddingModel]
  );

  // Auto-detect models
  async function detectModels() {
    if (!baseUrl) {
      toast.error("Masukkan Base URL terlebih dahulu");
      return;
    }

    setDetecting(true);
    setChatModels([]);
    setEmbeddingModels([]);

    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to detect models");
      }

      setChatModels(data.chat_models || []);
      setEmbeddingModels(data.embedding_models || []);

      if (!model && data.chat_models?.length > 0) {
        setModel(data.chat_models[0]);
      }
      if (!embeddingModel && data.embedding_models?.length > 0) {
        setEmbeddingModel(data.embedding_models[0]);
      }

      toast.success(
        `Ditemukan ${data.total} model (${data.chat_models?.length} chat, ${data.embedding_models?.length} embedding)`
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mendeteksi model. Pastikan URL dan API Key benar."
      );
    } finally {
      setDetecting(false);
    }
  }

  // Save settings
  async function handleSave() {
    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_provider: provider,
          ai_api_key: apiKey,
          ai_base_url: baseUrl,
          ai_model: model,
          ai_embedding_model: embeddingModel,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      setSaveStatus("Pengaturan berhasil disimpan!");
      toast.success("Pengaturan berhasil disimpan!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan pengaturan";
      setSaveStatus(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  const preset = PROVIDER_PRESETS[provider];

  if (loading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Skip link target */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:ring-2 focus:ring-primary"
      >
        Lewati ke konten
      </a>

      {/* Title */}
      <div id="main-content" tabIndex={-1}>
        <h2 className="text-2xl font-bold text-foreground">
          Konfigurasi AI Provider
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pilih AI provider, masukkan API key, dan deteksi model yang tersedia.
        </p>
      </div>

      {/* Theme & Language row */}
      <div className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-border bg-card">
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            Tema
          </label>
          <ThemeToggle />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-foreground mb-2">
            Bahasa
          </label>
          <LanguageSelector />
        </div>
      </div>

      {/* Provider Selection */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            AI Provider
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleProviderChange(key)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  provider === key
                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/30 hover:bg-muted"
                }`}
              >
                <div className="font-medium text-sm text-foreground">
                  {p.label}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {p.supportsEmbeddings
                    ? "Chat + Embedding"
                    : "Chat only (local embedding)"}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label
            htmlFor="apiKey"
            className="block text-sm font-medium text-foreground mb-1"
          >
            API Key{" "}
            {provider === "lmstudio" || provider === "ollama"
              ? "(opsional untuk local)"
              : ""}
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={
              provider === "lmstudio"
                ? "lm-studio"
                : provider === "ollama"
                  ? "ollama"
                  : "Masukkan API Key"
            }
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
          />
        </div>

        {/* Base URL */}
        <div>
          <label
            htmlFor="baseUrl"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Base URL
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="baseUrl"
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={preset?.defaultBaseURL || "https://api.example.com/v1"}
              className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setBaseUrl(preset?.defaultBaseURL || "")}
              className="px-3 py-2.5 text-sm text-muted-foreground bg-muted hover:bg-accent rounded-lg transition-colors whitespace-nowrap"
              title="Reset ke default"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Detect Models Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={detectModels}
            disabled={detecting || !baseUrl}
            className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {detecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                Mendeteksi...
              </>
            ) : (
              <>Deteksi Model</>
            )}
          </button>
          <span className="text-xs text-muted-foreground">
            Otomatis mengambil daftar model dari API
          </span>
        </div>
      </div>

      {/* Model Selection */}
      <div className="bg-card rounded-xl border border-border p-6 space-y-6">
        <h3 className="text-lg font-semibold text-foreground">
          Pilih Model
        </h3>

        {/* Chat Model */}
        <div>
          <label
            htmlFor="chatModel"
            className="block text-sm font-medium text-foreground mb-1"
          >
            Chat Model
          </label>
          {chatModels.length > 0 ? (
            <select
              id="chatModel"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
            >
              <option value="">-- Pilih model --</option>
              {chatModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="chatModel"
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={preset?.defaultModel || "model-name"}
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
            />
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {chatModels.length > 0
              ? `${chatModels.length} model terdeteksi. Pilih salah satu.`
              : "Klik 'Deteksi Model' untuk mengisi otomatis, atau ketik manual."}
          </p>
        </div>

        {/* Embedding Model */}
        {preset?.supportsEmbeddings && (
          <div>
            <label
              htmlFor="embeddingModel"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Embedding Model
            </label>
            {embeddingModels.length > 0 ? (
              <select
                id="embeddingModel"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              >
                <option value="">-- Pilih model --</option>
                {embeddingModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="embeddingModel"
                type="text"
                value={embeddingModel}
                onChange={(e) => setEmbeddingModel(e.target.value)}
                placeholder={preset?.defaultEmbeddingModel || "embedding-model"}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {embeddingModels.length > 0
                ? `${embeddingModels.length} embedding model terdeteksi.`
                : "Klik 'Deteksi Model' untuk mengisi otomatis, atau ketik manual."}
            </p>
          </div>
        )}

        {!preset?.supportsEmbeddings && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-sm text-warning-foreground">
              Provider ini tidak mendukung embedding API. Embedding akan
              dihasilkan secara lokal menggunakan feature hashing. Untuk hasil
              RAG yang lebih baik, gunakan provider yang mendukung embedding
              (OpenAI, Ollama, dll).
            </p>
          </div>
        )}
      </div>

      {/* Save Button + aria-live feedback */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              Menyimpan...
            </>
          ) : (
            <>Simpan Pengaturan</>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            const p = PROVIDER_PRESETS[provider];
            if (p) {
              setBaseUrl(p.defaultBaseURL);
              setModel(p.defaultModel);
              setEmbeddingModel(p.defaultEmbeddingModel);
            }
          }}
          className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Reset ke default
        </button>
      </div>

      {/* aria-live region for save feedback */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {saveStatus}
      </div>
    </div>
  );
}
