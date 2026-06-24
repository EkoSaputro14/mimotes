"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(email: string, password: string) {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) newErrors.email = "Email wajib diisi";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Format email tidak valid";
    if (!password) newErrors.password = "Password wajib diisi";
    else if (password.length < 6) newErrors.password = "Password minimal 6 karakter";
    return newErrors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validationErrors = validate(email, password);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }
    setErrors({});

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Email atau password salah");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Terjadi kesalahan saat login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-card rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Login Admin</h1>
        <p className="text-muted-foreground text-center mb-8">
          Masuk untuk mengelola dokumen
        </p>

        <form onSubmit={handleSubmit} method="post" action="#" className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                errors.email
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border"
              }`}
              placeholder="admin@example.com"
              onChange={() => errors.email && setErrors((prev) => ({ ...prev, email: undefined }))}
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Lupa password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all ${
                errors.password
                  ? "border-destructive focus:ring-destructive/30"
                  : "border-border"
              }`}
              placeholder="••••••••"
              onChange={() => errors.password && setErrors((prev) => ({ ...prev, password: undefined }))}
            />
            {errors.password && (
              <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-medium hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Masuk..." : "Masuk"}
          </button>
        </form>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Belum punya akun?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
