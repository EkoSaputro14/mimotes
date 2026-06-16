"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Mail, Link2, Loader2, Copy, Check, RefreshCw, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvited?: () => void;
}

const ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Dapat mengelola anggota, pengaturan, dan dokumen",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Dapat membuat, mengedit, dan menghapus dokumen",
  },
  {
    value: "viewer",
    label: "Viewer",
    description: "Dapat melihat dokumen dan chat",
  },
] as const;

function parseEmails(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InviteDialog({
  open,
  onOpenChange,
  onInvited,
}: InviteDialogProps) {
  // Shared state
  const [activeTab, setActiveTab] = useState<"email" | "link">("email");
  const [role, setRole] = useState("viewer");

  // Email tab state
  const [emailText, setEmailText] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailResult, setEmailResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  // Link tab state
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // Parse & validate emails
  const parsedEmails = parseEmails(emailText);
  const validEmails = parsedEmails.filter(isValidEmail);
  const invalidEmails = parsedEmails.filter((e) => !isValidEmail(e));

  const resetAll = useCallback(() => {
    setActiveTab("email");
    setRole("viewer");
    setEmailText("");
    setEmailLoading(false);
    setEmailResult(null);
    setLinkLoading(false);
    setLinkUrl(null);
    setLinkCopied(false);
  }, []);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetAll, 200);
      return () => clearTimeout(timer);
    }
  }, [open, resetAll]);

  // === Email Invite ===
  async function handleBulkInvite() {
    if (validEmails.length === 0) {
      toast.error("Masukkan minimal satu email yang valid");
      return;
    }

    setEmailLoading(true);
    setEmailResult(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const email of validEmails) {
      try {
        const res = await fetch("/api/workspace/invitations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, role }),
        });

        const data = await res.json();
        if (!res.ok) {
          failed++;
          errors.push(`${email}: ${data.error || "Gagal"}`);
        } else {
          success++;
        }
      } catch {
        failed++;
        errors.push(`${email}: Jaringan error`);
      }
    }

    setEmailResult({ success, failed, errors });
    setEmailLoading(false);

    if (success > 0) {
      toast.success(`${success} undangan berhasil dikirim`);
      onInvited?.();
    }
    if (failed > 0 && success === 0) {
      toast.error(`${failed} undangan gagal`);
    } else if (failed > 0) {
      toast.warning(`${failed} undangan gagal, ${success} berhasil`);
    }
  }

  // === Link Invite ===
  async function handleGenerateLink() {
    setLinkLoading(true);
    try {
      const res = await fetch("/api/workspace/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `link-invite-${Date.now()}@mimotes.local`,
          role,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat link undangan");
      }

      const origin = window.location.origin;
      setLinkUrl(`${origin}/invite/${data.rawToken}`);
      toast.success("Link undangan berhasil dibuat");
      onInvited?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat link");
    } finally {
      setLinkLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!linkUrl) return;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setLinkCopied(true);
      toast.success("Link disalin ke clipboard");
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin link");
    }
  }

  function handleRefreshLink() {
    setLinkUrl(null);
    setLinkCopied(false);
    handleGenerateLink();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Undang Anggota
          </DialogTitle>
          <DialogDescription>
            Kirim undangan via email atau buat link undangan untuk dibagikan.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Toggle */}
        <div className="flex bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab("email")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "email"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Mail className="size-4" />
            Email Undangan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("link")}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "link"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Link2 className="size-4" />
            Link Undangan
          </button>
        </div>

        {/* Role Selector (shared) */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Peran
          </label>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <label
                key={r.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  role === r.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80"
                }`}
              >
                <input
                  type="radio"
                  name="invite-role"
                  value={r.value}
                  checked={role === r.value}
                  onChange={(e) => setRole(e.target.value)}
                  className="size-4 text-primary"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "email" ? (
          /* Email Invite Tab */
          <div className="space-y-3">
            {!emailResult ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Email
                  </label>
                  <Textarea
                    value={emailText}
                    onChange={(e) => setEmailText(e.target.value)}
                    placeholder={"email1@example.com\nemail2@example.com\nemail3@example.com"}
                    rows={4}
                    className="text-sm"
                    disabled={emailLoading}
                  />
                </div>

                {/* Email count & validation */}
                {parsedEmails.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      {validEmails.length > 0 && (
                        <span className="text-primary font-medium">
                          {validEmails.length} email akan diundang
                        </span>
                      )}
                      {validEmails.length > 0 && invalidEmails.length > 0 && " · "}
                      {invalidEmails.length > 0 && (
                        <span className="text-destructive">
                          {invalidEmails.length} email tidak valid
                        </span>
                      )}
                    </p>
                    {invalidEmails.length > 0 && (
                      <p className="text-destructive">
                        {invalidEmails.join(", ")}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleBulkInvite}
                    disabled={emailLoading || validEmails.length === 0}
                    className="flex-1 gap-2"
                  >
                    {emailLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                    Kirim Undangan
                  </Button>
                </div>
              </>
            ) : (
              /* Email Result */
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {emailResult.success}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    undangan berhasil dikirim
                  </p>
                  {emailResult.failed > 0 && (
                    <p className="text-sm text-destructive mt-1">
                      {emailResult.failed} undangan gagal
                    </p>
                  )}
                </div>

                {emailResult.errors.length > 0 && (
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium text-destructive mb-1">
                      Detail kesalahan:
                    </p>
                    {emailResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        {err}
                      </p>
                    ))}
                  </div>
                )}

                <Button
                  onClick={() => onOpenChange(false)}
                  className="w-full"
                >
                  Selesai
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Link Invite Tab */
          <div className="space-y-4">
            {!linkUrl ? (
              <>
                <div className="flex items-start gap-2 bg-muted/50 rounded-lg p-3">
                  <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Link ini berlaku selama 7 hari. Siapapun dengan link ini bisa
                    bergabung ke workspace dengan peran yang dipilih.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={handleGenerateLink}
                    disabled={linkLoading}
                    className="flex-1 gap-2"
                  >
                    {linkLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Link2 className="size-4" />
                    )}
                    Buat Link Undangan
                  </Button>
                </div>
              </>
            ) : (
              /* Link Display */
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Link Undangan
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-background border border-border rounded px-3 py-2 break-all text-foreground">
                      {linkUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="shrink-0 p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                      title="Salin link"
                    >
                      {linkCopied ? (
                        <Check className="size-4 text-success" />
                      ) : (
                        <Copy className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Link ini berlaku selama 7 hari dan tidak akan ditampilkan
                  lagi.
                </p>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleRefreshLink}
                    className="flex-1 gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Refresh Link
                  </Button>
                  <Button
                    onClick={() => onOpenChange(false)}
                    className="flex-1"
                  >
                    Selesai
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
