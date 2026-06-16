"use client";

import * as React from "react";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
}: SliderProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const currentValue = value[0] ?? 0;
  const percentage = ((currentValue - min) / (max - min)) * 100;

  const updateValue = React.useCallback(
    (clientX: number) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const raw = min + pct * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.max(min, Math.min(max, stepped));
      onValueChange([parseFloat(clamped.toFixed(10))]);
    },
    [min, max, step, onValueChange]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateValue(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    updateValue(e.clientX);
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  return (
    <div
      ref={trackRef}
      className={`relative flex h-5 w-full touch-none select-none items-center ${className ?? ""}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div className="relative h-1.5 w-full rounded-full bg-secondary">
        <div
          className="absolute h-full rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className="absolute h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        style={{ left: `calc(${percentage}% - 8px)` }}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={currentValue}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            onValueChange([Math.min(max, currentValue + step)]);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            onValueChange([Math.max(min, currentValue - step)]);
          }
        }}
      />
    </div>
  );
}

export { Slider };
