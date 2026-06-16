"use client";

import { cn } from "@/lib/utils";
interface CitationMarkerProps {
  index: number;
  isActive?: boolean;
  onClick?: (index: number) => void;
}

export default function CitationMarker({
  index,
  isActive = false,
  onClick,
}: CitationMarkerProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(index);
      }}
      className={cn(
        "inline-flex items-center justify-center",
        /* BUG-013/Touch: 44px minimum touch target */
        "min-w-[44px] h-[44px] px-2 -mx-2",
        "text-[11px] font-semibold leading-none",
        "rounded-lg transition-all duration-150",
        "cursor-pointer select-none",
        isActive
          ? "bg-primary text-primary-foreground ring-1 ring-primary/30"
          : "bg-primary/10 text-primary hover:bg-primary/20",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      )}
      aria-label={`Sumber ${index}`}
      title={`Lihat sumber ${index}`}
    >
      {index}
    </button>
  );
}
