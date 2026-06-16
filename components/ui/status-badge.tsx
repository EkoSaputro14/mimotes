"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircleIcon, ClockIcon, XCircleIcon, AlertTriangleIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      status: {
        ready:
          "bg-success/15 text-success",
        processing:
          "bg-info/15 text-info",
        failed:
          "bg-destructive/15 text-destructive",
        pending:
          "bg-warning/15 text-warning",
        inactive:
          "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      status: "inactive",
    },
  }
)

const statusIcons = {
  ready: CheckCircleIcon,
  processing: Loader2Icon,
  failed: XCircleIcon,
  pending: ClockIcon,
  inactive: AlertTriangleIcon,
} as const

function StatusBadge({
  status,
  label,
  showIcon = true,
  pulsing = false,
  className,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants> & {
    label?: string
    showIcon?: boolean
    pulsing?: boolean
  }) {
  const Icon = statusIcons[status ?? "inactive"]

  const defaultLabels: Record<string, string> = {
    ready: "Ready",
    processing: "Processing",
    failed: "Failed",
    pending: "Pending",
    inactive: "Inactive",
  }

  return (
    <span
      data-slot="status-badge"
      className={cn(
        statusBadgeVariants({ status }),
        status === "processing" && pulsing && "animate-pulse",
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className={cn(
            "h-3 w-3 shrink-0",
            status === "processing" && "animate-spin"
          )}
        />
      )}
      {label ?? defaultLabels[status ?? "inactive"]}
    </span>
  )
}

export { StatusBadge, statusBadgeVariants }
