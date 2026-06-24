"use client";

import {
  ArrowUp,
  BookOpen,
  Headphones,
  ShoppingBag,
  Check,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";

interface UseAutoResizeTextareaProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({
  minHeight,
  maxHeight,
}: UseAutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`;

      const newHeight = Math.max(
        minHeight,
        Math.min(
          textarea.scrollHeight,
          maxHeight ?? Number.POSITIVE_INFINITY
        )
      );

      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = `${minHeight}px`;
    }
  }, [minHeight]);

  useEffect(() => {
    const handleResize = () => adjustHeight();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [adjustHeight]);

  return { textareaRef, adjustHeight };
}

type ChatMode = "knowledge_base" | "customer_service" | "sales_agent";

const CHAT_MODES: Record<ChatMode, { label: string; icon: React.ReactNode }> = {
  knowledge_base: {
    label: "Knowledge Base",
    icon: <BookOpen className="w-3.5 h-3.5" />,
  },
  customer_service: {
    label: "Customer Service",
    icon: <Headphones className="w-3.5 h-3.5" />,
  },
  sales_agent: {
    label: "Sales Agent",
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
  },
};

interface AnimatedAIInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function AnimatedAIInput({
  value,
  onChange,
  onSubmit,
  chatMode,
  onModeChange,
  isLoading = false,
  disabled = false,
}: AnimatedAIInputProps) {
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 44,
    maxHeight: 200,
  });

  const currentMode = CHAT_MODES[chatMode];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && value.trim()) {
      e.preventDefault();
      onSubmit();
      adjustHeight(true);
    }
  };

  const canSubmit = value.trim() && !isLoading;

  return (
    <div className="relative">
      {/* Input container — elevated card style */}
      <div
        className={cn(
          "relative rounded-2xl border transition-all duration-200",
          "bg-card border-border/60",
          "focus-within:border-primary/40 focus-within:shadow-[0_0_0_1px_rgba(var(--primary-rgb,59,130,246),0.1)]"
        )}
      >
        {/* Textarea */}
        <div className="px-4 pt-3.5 pb-2">
          <Textarea
            value={value}
            placeholder="Ketik pertanyaan Anda..."
            className={cn(
              "w-full bg-transparent border-none text-sm text-foreground",
              "placeholder:text-muted-foreground/60",
              "resize-none focus-visible:ring-0 focus-visible:ring-offset-0",
              "min-h-[44px] leading-relaxed"
            )}
            ref={textareaRef}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              onChange(e.target.value);
              adjustHeight();
            }}
            disabled={isLoading || disabled}
          />
        </div>

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-0.5">
          {/* Mode selector */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "flex items-center gap-1.5 h-7 px-2 text-xs rounded-md",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors duration-150",
                "focus-visible:ring-1 focus-visible:ring-offset-0 focus-visible:ring-primary/50",
                "outline-none cursor-pointer"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={chatMode}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-center gap-1.5"
                >
                  {currentMode.icon}
                  <span className="font-medium">{currentMode.label}</span>
                  <ChevronDown className="w-3 h-3 opacity-40" />
                </motion.div>
              </AnimatePresence>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn(
                "min-w-[12rem] p-1",
                "border-border/60 bg-card shadow-lg"
              )}
            >
              {(Object.keys(CHAT_MODES) as ChatMode[]).map((mode) => (
                <DropdownMenuItem
                  key={mode}
                  onClick={() => onModeChange(mode)}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2.5 py-2 rounded-md cursor-pointer",
                    chatMode === mode && "bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {CHAT_MODES[mode].icon}
                    <span className="text-sm">{CHAT_MODES[mode].label}</span>
                  </div>
                  {chatMode === mode && (
                    <Check className="w-3.5 h-3.5 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Send button */}
          <button
            type="button"
            className={cn(
              "rounded-xl w-8 h-8 flex items-center justify-center transition-all duration-200",
              canSubmit
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground/40 cursor-not-allowed"
            )}
            aria-label="Kirim pesan"
            disabled={!canSubmit}
            onClick={() => {
              if (!canSubmit) return;
              onSubmit();
              adjustHeight(true);
            }}
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
