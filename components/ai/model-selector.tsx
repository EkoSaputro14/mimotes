"use client";

import { useState, useEffect } from "react";

interface ModelSelectorProps {
  value: string;
  onChange: (model: string) => void;
  className?: string;
}

export default function ModelSelector({
  value,
  onChange,
  className,
}: ModelSelectorProps) {
  const [model, setModel] = useState(value);
  const [detectedModels, setDetectedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load current model from settings
    async function loadModel() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          const currentModel = data.ai_model || value;
          setModel(currentModel);
          if (!value) onChange(currentModel);
        }
      } catch {
        // ignore
      }
    }
    loadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function detectModels() {
    setLoading(true);
    try {
      const settingsRes = await fetch("/api/admin/settings");
      const settings = settingsRes.ok ? await settingsRes.json() : {};

      const res = await fetch("/api/admin/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_url: settings.ai_base_url,
          api_key: settings.ai_api_key,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDetectedModels(data.chat_models || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  const models = detectedModels.length > 0 ? detectedModels : [model].filter(Boolean);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <select
          value={model}
          onChange={(e) => {
            setModel(e.target.value);
            onChange(e.target.value);
          }}
          className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
          {detectedModels.length === 0 && model && (
            <option value={model}>{model}</option>
          )}
        </select>
        <button
          type="button"
          onClick={detectModels}
          disabled={loading}
          className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading ? "..." : "Detect"}
        </button>
      </div>
    </div>
  );
}
