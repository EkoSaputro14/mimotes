"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface SessionEvent {
  id: string;
  action: string;
  createdAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: "Unknown", browser: "Unknown" };

  let device = "Desktop";
  if (/mobile|android|iphone|ipad/i.test(ua)) device = "Mobile";
  else if (/windows|mac|linux/i.test(ua)) device = "Desktop";

  let browser = "Browser";
  if (/chrome/i.test(ua) && !/edge/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";

  return { device, browser };
}

function formatAction(action: string): string {
  switch (action) {
    case "auth.login": return "Login berhasil";
    case "auth.logout": return "Logout";
    case "auth.login_failed": return "Login gagal";
    case "user.password_change": return "Password diubah";
    default: return action;
  }
}

export default function SecuritySettings() {
  const [sessions, setSessions] = useState<SessionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    try {
      const res = await fetch("/api/user/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword) {
      toast.error("Isi semua field password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password baru minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mengubah password");
      }

      toast.success(data.message || "Password berhasil diubah");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      loadSessions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah password");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Keamanan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola password dan riwayat sesi akun Anda.
        </p>
      </div>

      {/* Change Password */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Ubah Password</h3>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-foreground mb-1.5">
              Password Saat Ini
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showCurrent ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-foreground mb-1.5">
              Password Baru
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru (min. 6 karakter)"
                className="w-full px-4 py-2.5 pr-10 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNew ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
              Konfirmasi Password Baru
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengubah...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Ubah Password
              </>
            )}
          </button>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Mengubah password akan menginvalidate semua sesi aktif. Anda harus login kembali di semua perangkat.
          </p>
        </div>
      </div>

      {/* Session History */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">Riwayat Sesi</h3>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Belum ada riwayat sesi.</p>
        ) : (
          <div className="space-y-2" role="list" aria-label="Riwayat sesi">
            {sessions.map((event) => {
              const { device, browser } = parseUserAgent(event.userAgent);
              const isLogin = event.action === "auth.login";
              const isPasswordChange = event.action === "user.password_change";

              return (
                <div
                  key={event.id}
                  role="listitem"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isPasswordChange
                      ? "bg-warning/10 text-warning"
                      : isLogin
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {device === "Mobile" ? (
                      <Smartphone className="h-4 w-4" />
                    ) : isPasswordChange ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">
                      {formatAction(event.action)}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>{browser}</span>
                      {event.ipAddress && (
                        <>
                          <span>·</span>
                          <Globe className="h-3 w-3" />
                          <span>{event.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.createdAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
