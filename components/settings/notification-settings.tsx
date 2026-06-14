"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Bell, Mail, Save, Loader2 } from "lucide-react";

interface NotificationPrefs {
  emailChatReplies: boolean;
  emailDocProcessed: boolean;
  emailTeamJoined: boolean;
  emailWeeklyDigest: boolean;
  emailMarketing: boolean;
  inAppNewMessages: boolean;
  inAppMentions: boolean;
  inAppSystemUpdates: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  emailChatReplies: true,
  emailDocProcessed: true,
  emailTeamJoined: true,
  emailWeeklyDigest: false,
  emailMarketing: false,
  inAppNewMessages: true,
  inAppMentions: true,
  inAppSystemUpdates: false,
};

export default function NotificationSettings() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("mimotes-notifications");
    if (saved) {
      try {
        setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(saved) });
      } catch {
        // use defaults
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mimotes-notifications");
    const savedPrefs = saved ? JSON.parse(saved) : DEFAULT_PREFS;
    setHasChanges(JSON.stringify(prefs) !== JSON.stringify(savedPrefs));
  }, [prefs]);

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      localStorage.setItem("mimotes-notifications", JSON.stringify(prefs));
      toast.success("Pengaturan notifikasi disimpan!");
      setHasChanges(false);
    } catch {
      toast.error("Gagal menyimpan pengaturan");
    } finally {
      setSaving(false);
    }
  }

  const emailItems = [
    { key: "emailChatReplies" as const, label: "Balasan chat", desc: "Notifikasi saat AI membalas pertanyaan Anda" },
    { key: "emailDocProcessed" as const, label: "Dokumen selesai diproses", desc: "Notifikasi saat upload dokumen selesai" },
    { key: "emailTeamJoined" as const, label: "Anggota baru bergabung", desc: "Notifikasi saat ada anggota baru di workspace" },
    { key: "emailWeeklyDigest" as const, label: "Ringkasan mingguan", desc: "Ringkasan aktivitas workspace mingguan" },
    { key: "emailMarketing" as const, label: "Email marketing", desc: "Update produk, tips, dan penawaran khusus" },
  ];

  const inAppItems = [
    { key: "inAppNewMessages" as const, label: "Pesan baru", desc: "Notifikasi saat ada pesan baru di chat" },
    { key: "inAppMentions" as const, label: "Sebutan (mentions)", desc: "Notifikasi saat Anda disebut di workspace" },
    { key: "inAppSystemUpdates" as const, label: "Update sistem", desc: "Notifikasi maintenance dan fitur baru" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Notifikasi</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Atur preferensi notifikasi email dan in-app.
        </p>
      </div>

      {/* Email Notifications */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Email</h3>
        </div>
        <div className="space-y-1">
          {emailItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  prefs[item.key] ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={prefs[item.key]}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs[item.key] ? "translate-x-5" : ""
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">In-App</h3>
        </div>
        <div className="space-y-1">
          {inAppItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => toggle(item.key)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div>
                <div className="text-sm font-medium text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  prefs[item.key] ? "bg-primary" : "bg-muted"
                }`}
                role="switch"
                aria-checked={prefs[item.key]}
              >
                <div
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs[item.key] ? "translate-x-5" : ""
                  }`}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Preferensi
        </button>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {saving ? "Menyimpan..." : hasChanges ? "Ada perubahan" : "Tidak ada perubahan"}
      </div>
    </div>
  );
}
