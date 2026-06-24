"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Save, Loader2, Bot, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  google: {
    label: "Google Gemini",
    defaultBaseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.0-flash",
    defaultEmbeddingModel: "text-embedding-004",
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
};

export default function WorkspaceAISettings() {
  const [provider, setProvider] = useState("mimo");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [embeddingModel, setEmbeddingModel] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Load current workspace settings
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

  const handleProviderChange = useCallback(
    (newProvider: string) => {
      setProvider(newProvider);
      const preset = PROVIDER_PRESETS[newProvider];
      if (preset) {
        setBaseUrl(preset.defaultBaseURL);
        setModel(preset.defaultModel);
        setEmbeddingModel(preset.defaultEmbeddingModel);
      }
    },
    []
  );

  // Auto-detect models
  async function detectModels() {
    if (!baseUrl) {
      toast.error("Masukkan Base URL terlebih dahulu");
      return;
    }

    setDetecting(true);
    try {
      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_url: baseUrl, api_key: apiKey }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to detect models");

      if (!model && data.chat_models?.length > 0) {
        setModel(data.chat_models[0]);
      }
      if (!embeddingModel && data.embedding_models?.length > 0) {
        setEmbeddingModel(data.embedding_models[0]);
      }

      toast.success(`Ditemukan ${data.total} model dari provider`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mendeteksi model");
    } finally {
      setDetecting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
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

      toast.success("Pengaturan AI workspace berhasil disimpan!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const preset = PROVIDER_PRESETS[provider];

  if (loading) {
    return (
      <div className="bg-card rounded-xl border border-border/20 p-6">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-4" />
        <div className="h-10 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border/20 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bot className="size-5" />
            AI Provider Workspace
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Konfigurasi AI khusus untuk workspace ini. Kalau kosong, akan pakai setting global.
          </p>
        </div>
        <a
          href="/settings"
          className="text-xs text-primary flex items-center gap-1 hover:underline shrink-0"
        >
          Setting Global <ArrowUpRight className="size-3" />
        </a>
      </div>

      <div className="space-y-5">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Provider
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(PROVIDER_PRESETS).map(([key, p]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleProviderChange(key)}
                className={`p-2.5 rounded-lg border-2 text-left transition-all ${
                  provider === key
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className="font-medium text-sm">{p.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            API Key
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Masukkan API Key"
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Base URL */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Base URL
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder={preset?.defaultBaseURL || "https://api.example.com/v1"}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Chat Model
          </label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={preset?.defaultModel || "model-name"}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Embedding Model */}
        {preset?.supportsEmbeddings && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Embedding Model
            </label>
            <input
              type="text"
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              placeholder={preset?.defaultEmbeddingModel || "embedding-model"}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button onClick={detectModels} disabled={detecting || !baseUrl} variant="outline" size="sm">
            {detecting ? <Loader2 className="size-4 animate-spin" /> : null}
            Deteksi Model
          </Button>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan Pengaturan
          </Button>
        </div>
      </div>
    </div>
  );
}
