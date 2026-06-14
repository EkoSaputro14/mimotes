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
        "min-w-[20px] h-[18px] px-1",
        "text-[10px] font-semibold leading-none",
        "rounded-md transition-all duration-150",
        "cursor-pointer select-none",
        "align-super",
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
