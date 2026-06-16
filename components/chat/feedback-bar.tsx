"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Copy, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FeedbackBarProps {
  content: string;
  isLastMessage?: boolean;
  isStreaming?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
}

export default function FeedbackBar({
  content,
  isLastMessage = false,
  isStreaming = false,
  isLoading = false,
  onRegenerate,
}: FeedbackBarProps) {
  const [feedback, setFeedback] = useState<"helpful" | "not-helpful" | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Jawaban tersalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin");
    }
  }

  function handleFeedback(type: "helpful" | "not-helpful") {
    setFeedback((prev) => (prev === type ? null : type));
    toast.success(
      type === "helpful"
        ? "Terima kasih atas feedback-nya!"
        : "Terima kasih, kami akan perbaiki."
    );
  }

  function handleRegenerate() {
    onRegenerate?.();
  }

  if (isStreaming) return null;

  return (
    <div className="flex items-center gap-0.5 mt-1 ml-1">
      {/* Thumbs Up — 44px touch target */}
      <button
        type="button"
        onClick={() => handleFeedback("helpful")}
        className={cn(
          /* BUG-013/Touch: 44px minimum touch target */
          "inline-flex items-center justify-center w-[44px] h-[44px] rounded-lg",
          "transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          feedback === "helpful" && "text-primary bg-primary/10 hover:bg-primary/15"
        )}
        aria-label="Membantu"
        title="Membantu"
      >
        <ThumbsUp className="h-4 w-4" />
      </button>

      {/* Thumbs Down — 44px touch target */}
      <button
        type="button"
        onClick={() => handleFeedback("not-helpful")}
        className={cn(
          /* BUG-013/Touch: 44px minimum touch target */
          "inline-flex items-center justify-center w-[44px] h-[44px] rounded-lg",
          "transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          feedback === "not-helpful" && "text-destructive bg-destructive/10 hover:bg-destructive/15"
        )}
        aria-label="Tidak membantu"
        title="Tidak membantu"
      >
        <ThumbsDown className="h-4 w-4" />
      </button>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* Copy — 44px touch target */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          /* BUG-013/Touch: 44px minimum touch target */
          "inline-flex items-center justify-center w-[44px] h-[44px] rounded-lg",
          "transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          copied && "text-success"
        )}
        aria-label="Salin jawaban"
        title="Salin jawaban"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>

      {/* Regenerate — 44px touch target, only on last assistant message */}
      {isLastMessage && onRegenerate && (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isLoading}
          className={cn(
            /* BUG-013/Touch: 44px minimum touch target */
            "inline-flex items-center justify-center w-[44px] h-[44px] rounded-lg",
            "transition-all duration-150",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={isLoading ? "Sedang memuat, tunggu sebentar" : "Buat ulang jawaban"}
          aria-disabled={isLoading}
          title={isLoading ? "Sedang memuat" : "Buat ulang jawaban"}
        >
          <RotateCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
