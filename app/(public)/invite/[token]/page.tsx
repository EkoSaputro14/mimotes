"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function AcceptInvitationPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [status, setStatus] = useState<
    "loading" | "ready" | "accepting" | "success" | "error" | "login-required"
  >("loading");
  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    async function checkToken() {
      // Try to get current session
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (!session?.user) {
          setStatus("login-required");
          return;
        }

        // Token is valid if we can reach this page
        setStatus("ready");
      } catch {
        setStatus("login-required");
      }
    }

    if (token) {
      checkToken();
    }
  }, [token]);

  async function handleAccept() {
    setStatus("accepting");
    try {
      const res = await fetch(`/api/workspace/invitations/${token}/accept`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menerima undangan");
      }

      setWorkspaceName(data.workspace?.name ?? "Workspace");
      setStatus("success");
      toast.success(`Berhasil bergabung ke ${data.workspace?.name ?? "workspace"}`);

      // Redirect to workspace after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Gagal");
      setStatus("error");
    }
  }

  function handleLogin() {
    router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
            <Mail className="size-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MimoNotes</h1>
          <p className="text-muted-foreground mt-1">Undangan Workspace</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl shadow-sm border p-6">
          {status === "loading" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="size-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Memverifikasi undangan...</p>
            </div>
          )}

          {status === "login-required" && (
            <div className="text-center py-4">
              <Shield className="size-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Login Diperlukan
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Anda perlu login atau membuat akun terlebih dahulu untuk
                menerima undangan ini.
              </p>
              <button
                type="button"
                onClick={handleLogin}
                className="w-full px-4 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Login / Daftar
                <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {status === "ready" && (
            <div className="text-center py-4">
              <CheckCircle className="size-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Undangan Ditemukan
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Klik tombol di bawah untuk bergabung ke workspace.
              </p>
              <button
                type="button"
                onClick={handleAccept}
                className="w-full px-4 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="size-4" />
                Terima Undangan
              </button>
            </div>
          )}

          {status === "accepting" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="size-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Memproses...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-4">
              <CheckCircle className="size-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Berhasil!
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Anda telah bergabung ke{" "}
                <span className="font-medium text-foreground">
                  {workspaceName}
                </span>
              </p>
              <p className="text-xs text-muted-foreground/60">
                Mengalihkan ke dashboard...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-4">
              <XCircle className="size-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Gagal
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setStatus("ready")}
                className="w-full px-4 py-3 border border-border text-foreground text-sm font-medium rounded-xl hover:bg-muted transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          Undangan berlaku selama 7 hari
        </p>
      </div>
    </div>
  );
}
