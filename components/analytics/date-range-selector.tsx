"use client";

import { Button } from "@/components/ui/button";

type DateRange = "7d" | "30d" | "90d";

interface DateRangeSelectorProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const options: { label: string; value: DateRange }[] = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
];

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          variant={value === option.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(option.value)}
          className="h-7 px-3 text-xs"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
