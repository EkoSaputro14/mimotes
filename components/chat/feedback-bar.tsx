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
    // Client-side only — no backend API needed for Sprint C3 Lite
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
      {/* Thumbs Up */}
      <button
        type="button"
        onClick={() => handleFeedback("helpful")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          feedback === "helpful" && "text-primary bg-primary/10 hover:bg-primary/15"
        )}
        aria-label="Membantu"
        title="Membantu"
      >
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>

      {/* Thumbs Down */}
      <button
        type="button"
        onClick={() => handleFeedback("not-helpful")}
        className={cn(
          "p-1.5 rounded-md transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          feedback === "not-helpful" && "text-destructive bg-destructive/10 hover:bg-destructive/15"
        )}
        aria-label="Tidak membantu"
        title="Tidak membantu"
      >
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>

      {/* Divider */}
      <div className="w-px h-3.5 bg-border mx-0.5" />

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className={cn(
          "p-1.5 rounded-md transition-all duration-150",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          copied && "text-green-600"
        )}
        aria-label="Salin jawaban"
        title="Salin jawaban"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>

      {/* Regenerate — only on last assistant message */}
      {isLastMessage && onRegenerate && (
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={isLoading}
          className={cn(
            "p-1.5 rounded-md transition-all duration-150",
            "text-muted-foreground hover:text-foreground hover:bg-muted",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label={isLoading ? "Sedang memuat, tunggu sebentar" : "Buat ulang jawaban"}
          aria-disabled={isLoading}
          title={isLoading ? "Sedang memuat" : "Buat ulang jawaban"}
        >
          <RotateCcw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </button>
      )}
    </div>
  );
}
