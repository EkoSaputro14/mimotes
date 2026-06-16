"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Save,
  Loader2,
  MessageSquare,
  Globe,
  Zap,
  UserCheck,
} from "lucide-react";

interface NotificationConfig {
  emailEnabled: boolean;
  emailAddress: string;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  discordEnabled: boolean;
  discordWebhookUrl: string;
  notifyOnHighLead: boolean;
  notifyOnConverted: boolean;
}

const DEFAULT_CONFIG: NotificationConfig = {
  emailEnabled: false,
  emailAddress: "",
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  discordEnabled: false,
  discordWebhookUrl: "",
  notifyOnHighLead: true,
  notifyOnConverted: true,
};

export default function NotificationSettings() {
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/notifications/settings");
      if (res.ok) {
        const data = await res.json();
        setConfig({
          emailEnabled: data.emailEnabled || false,
          emailAddress: data.emailAddress || "",
          telegramEnabled: data.telegramEnabled || false,
          telegramBotToken: data.telegramBotToken || "",
          telegramChatId: data.telegramChatId || "",
          discordEnabled: data.discordEnabled || false,
          discordWebhookUrl: data.discordWebhookUrl || "",
          notifyOnHighLead: data.notifyOnHighLead ?? true,
          notifyOnConverted: data.notifyOnConverted ?? true,
        });
      }
    } catch (error) {
      console.error("Failed to fetch notification config:", error);
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof NotificationConfig>(
    key: K,
    value: NotificationConfig[K]
  ) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/notifications/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (res.ok) {
        toast.success("Pengaturan notifikasi disimpan!");
        setHasChanges(false);
      } else {
        const err = await res.json();
        toast.error(err.error?.message || "Gagal menyimpan pengaturan");
      }
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notifikasi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur notifikasi lead alerts via Email, Telegram, atau Discord.
        </p>
      </div>

      {/* Trigger Settings */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Trigger Events</h3>
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() =>
              updateField("notifyOnHighLead", !config.notifyOnHighLead)
            }
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                <Zap className="size-4 text-destructive" />
                High-Intent Lead Detected
              </div>
              <div className="text-xs text-muted-foreground">
                Notifikasi saat lead dengan skor tinggi terdeteksi (intent + data
                lengkap)
              </div>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${
                config.notifyOnHighLead ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={config.notifyOnHighLead}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                  config.notifyOnHighLead ? "translate-x-5" : ""
                }`}
              />
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              updateField("notifyOnConverted", !config.notifyOnConverted)
            }
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
          >
            <div>
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                <UserCheck className="size-4 text-success" />
                Lead Converted
              </div>
              <div className="text-xs text-muted-foreground">
                Notifikasi saat status lead berubah menjadi "converted"
              </div>
            </div>
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${
                config.notifyOnConverted ? "bg-primary" : "bg-muted"
              }`}
              role="switch"
              aria-checked={config.notifyOnConverted}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                  config.notifyOnConverted ? "translate-x-5" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Email Channel */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Email</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("emailEnabled", !config.emailEnabled)
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              config.emailEnabled ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={config.emailEnabled}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                config.emailEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {config.emailEnabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={config.emailAddress}
              onChange={(e) => updateField("emailAddress", e.target.value)}
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
            />
          </div>
        )}
      </div>

      {/* Telegram Channel */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Telegram</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("telegramEnabled", !config.telegramEnabled)
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              config.telegramEnabled ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={config.telegramEnabled}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                config.telegramEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {config.telegramEnabled && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Bot Token
              </label>
              <input
                type="password"
                value={config.telegramBotToken}
                onChange={(e) =>
                  updateField("telegramBotToken", e.target.value)
                }
                placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Dapatkan dari @BotFather di Telegram
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Chat ID
              </label>
              <input
                type="text"
                value={config.telegramChatId}
                onChange={(e) =>
                  updateField("telegramChatId", e.target.value)
                }
                placeholder="-1001234567890"
                className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Chat ID grup atau personal chat
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Discord Channel */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Discord</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              updateField("discordEnabled", !config.discordEnabled)
            }
            className={`relative w-10 h-5 rounded-full transition-colors ${
              config.discordEnabled ? "bg-primary" : "bg-muted"
            }`}
            role="switch"
            aria-checked={config.discordEnabled}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-background transition-transform ${
                config.discordEnabled ? "translate-x-5" : ""
              }`}
            />
          </button>
        </div>
        {config.discordEnabled && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Webhook URL
            </label>
            <input
              type="url"
              value={config.discordWebhookUrl}
              onChange={(e) =>
                updateField("discordWebhookUrl", e.target.value)
              }
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-3 py-2 border rounded-lg text-sm bg-background"
            />
            <p className="text-xs text-muted-foreground">
              Server Settings → Integrations → Webhooks → New Webhook
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Simpan Pengaturan
        </button>
      </div>

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {saving ? "Menyimpan..." : hasChanges ? "Ada perubahan" : "Tidak ada perubahan"}
      </div>
    </div>
  );
}
