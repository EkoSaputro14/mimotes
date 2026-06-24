"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  function validate(email: string) {
    if (!email.trim()) return "Email wajib diisi";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid";
    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const error = validate(email);
    if (error) {
      setEmailError(error);
      setLoading(false);
      return;
    }
    setEmailError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        toast.error("Gagal mengirim email reset password");
      }
    } catch {
      toast.error("Terjadi kesalahan. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Lupa Password</h1>
        <p className="text-muted-foreground text-center mb-8">
          Masukkan email Anda untuk menerima link reset password
        </p>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Email reset password telah dikirim. Periksa kotak masuk Anda.
            </p>
            <Link
              href="/login"
              className="inline-block text-sm text-primary hover:text-primary/80 font-medium"
            >
              ← Kembali ke login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                  emailError ? "border-destructive focus:ring-destructive/30" : "border-border"
                }`}
                placeholder="admin@example.com"
                onChange={() => emailError && setEmailError("")}
              />
              {emailError && (
                <p className="mt-1.5 text-sm text-destructive">{emailError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </button>
          </form>
        )}

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Ingat password?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-medium">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
