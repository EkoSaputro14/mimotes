"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  /** Main page title */
  title: string
  /** Optional description below title */
  description?: string
  /** Optional breadcrumb trail above title */
  breadcrumb?: React.ReactNode
  /** Action buttons rendered on the right */
  actions?: React.ReactNode
  /** Override className */
  className?: string
}

function PageHeader({
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      data-slot="page-header"
      className={cn("space-y-1", className)}
    >
      {breadcrumb && (
        <div className="mb-2">{breadcrumb}</div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      <Separator className="mt-3" />
    </div>
  )
}

export { PageHeader, type PageHeaderProps }
