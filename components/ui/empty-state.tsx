"use client"

import * as React from "react"
import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  /** Lucide icon to display */
  icon?: LucideIcon
  /** Main heading */
  title: string
  /** Supporting description text */
  description?: string
  /** Optional CTA button */
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Optional secondary action */
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  /** Optional illustration or custom content above the text */
  illustration?: React.ReactNode
  /** Override className */
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center px-6 py-16 text-center",
        className
      )}
    >
      {illustration ? (
        <div className="mb-4 text-muted-foreground/40">{illustration}</div>
      ) : Icon ? (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground/60" strokeWidth={1.5} />
        </div>
      ) : null}

      <h3 className="text-base font-medium text-foreground">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon && <action.icon className="mr-1.5 h-4 w-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon && (
                <secondaryAction.icon className="mr-1.5 h-4 w-4" />
              )}
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
