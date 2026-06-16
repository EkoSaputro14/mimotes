"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Mail, Clock, Save, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  updatedAt: string;
}

const TIMEZONES = [
  { value: "Asia/Jakarta", label: "WIB (UTC+7)" },
  { value: "Asia/Makassar", label: "WITA (UTC+8)" },
  { value: "Asia/Jayapura", label: "WIT (UTC+9)" },
  { value: "Asia/Shanghai", label: "CST (UTC+8)" },
  { value: "Asia/Tokyo", label: "JST (UTC+9)" },
  { value: "America/New_York", label: "EST (UTC-5)" },
  { value: "America/Los_Angeles", label: "PST (UTC-8)" },
  { value: "Europe/London", label: "GMT (UTC+0)" },
  { value: "Europe/Berlin", label: "CET (UTC+1)" },
  { value: "Australia/Sydney", label: "AEST (UTC+10)" },
];

export default function AccountSettings() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Asia/Jakarta");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
          setName(data.user.name || "");
          // Load timezone from localStorage
          const savedTz = localStorage.getItem("mimotes-timezone");
          if (savedTz) setTimezone(savedTz);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setHasChanges(name !== (profile.name || ""));
    }
  }, [name, profile]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal update profil");
      }

      const data = await res.json();
      setProfile(data.user);
      setHasChanges(false);

      // Save timezone to localStorage
      localStorage.setItem("mimotes-timezone", timezone);

      toast.success("Profil berhasil diupdate!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal update profil");
    } finally {
      setSaving(false);
    }
  }

  function getInitials(email: string) {
    return email.charAt(0).toUpperCase();
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-7 w-48 rounded-md bg-muted" />
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-5 w-32 rounded bg-muted" />
              <div className="h-4 w-48 rounded bg-muted" />
            </div>
          </div>
          <div className="h-10 w-full rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Akun</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola profil dan informasi akun Anda.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {/* Avatar + Info */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {profile ? getInitials(profile.email) : "?"}
          </div>
          <div>
            <div className="font-medium text-foreground">
              {profile?.name || "Belum ada nama"}
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {profile?.email}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
            Nama
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama Anda"
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Nama ditampilkan di profil dan undangan workspace.
          </p>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={profile?.email || ""}
              readOnly
              className="flex-1 px-4 py-2.5 border border-border rounded-lg bg-muted text-muted-foreground text-sm cursor-not-allowed"
            />
            <span className="text-xs text-success font-medium px-2 py-1 bg-success/10 rounded-md">
              Terverifikasi
            </span>
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-1.5">
            <Clock className="inline h-3.5 w-3.5 mr-1" />
            Zona Waktu
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => {
              setTimezone(e.target.value);
              setHasChanges(true);
            }}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            Digunakan untuk timestamp di dashboard dan analytics.
          </p>
        </div>

        {/* Member since */}
        <div className="text-xs text-muted-foreground">
          Anggota sejak {profile ? new Date(profile.createdAt).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : "-"}
        </div>
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
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Simpan Perubahan
            </>
          )}
        </button>
      </div>

      {/* aria-live region */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {saving ? "Menyimpan perubahan..." : hasChanges ? "Ada perubahan belum disimpan" : "Tidak ada perubahan"}
      </div>
    </div>
  );
}
