"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/* ---------------------------------------------------------------
   Skeleton Variants — V2 Component Library
   Pre-built skeleton patterns for common layouts.
   All use the base <Skeleton /> component + V2 design tokens.
   --------------------------------------------------------------- */

/** Simple card skeleton: header + 2-3 content lines */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-card"
      className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}
    >
      <Skeleton className="mb-3 h-5 w-2/5" />
      <Skeleton className="mb-2 h-3 w-full" />
      <Skeleton className="mb-2 h-3 w-4/5" />
      <Skeleton className="h-3 w-3/5" />
    </div>
  )
}

/** List item skeleton: icon + 2 lines + right badge */
function ListItemSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-list-item"
      className={cn(
        "flex items-center gap-3 rounded-lg border px-3 py-3",
        className
      )}
    >
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-2/3" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  )
}

/** Table skeleton: header row + N data rows */
function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div
      data-slot="skeleton-table"
      className={cn("w-full space-y-2", className)}
    >
      {/* Header */}
      <div className="flex gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={`r-${rowIdx}`} className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={`c-${rowIdx}-${colIdx}`}
              className="h-3 flex-1"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Chat message skeleton: avatar + 2-3 bubble lines */
function ChatMessageSkeleton({
  variant = "assistant",
  className,
}: {
  variant?: "user" | "assistant"
  className?: string
}) {
  const isUser = variant === "user"
  return (
    <div
      data-slot="skeleton-chat-message"
      className={cn(
        "flex gap-3",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
      <div
        className={cn(
          "space-y-2 rounded-xl px-4 py-3",
          isUser ? "w-1/3 bg-muted" : "w-1/2"
        )}
      >
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        {!isUser && <Skeleton className="h-3 w-2/3" />}
      </div>
      {isUser && <Skeleton className="h-8 w-8 shrink-0 rounded-full" />}
    </div>
  )
}

/** Dashboard stat card skeleton */
function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      data-slot="skeleton-stat-card"
      className={cn("rounded-xl bg-card p-4 ring-1 ring-foreground/10", className)}
    >
      <Skeleton className="mb-2 h-3 w-1/3" />
      <Skeleton className="mb-1 h-7 w-1/2" />
      <Skeleton className="h-3 w-2/5" />
    </div>
  )
}

export {
  CardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  ChatMessageSkeleton,
  StatCardSkeleton,
}
