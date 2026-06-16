# COMPONENT_LIBRARY_REPORT.md — MimoNotes V2 UI Components

> **Date:** June 14, 2026
> **Scope:** V2 component library inventory (all UI primitives)
> **Sprint:** A2 — Core Component Library

---

## Component Inventory

### Pre-existing Components (17 — from shadcn/ui)

| # | Component | File | Purpose |
|---|-----------|------|---------|
| 1 | Avatar | `components/ui/avatar.tsx` | User/agent avatar with fallback |
| 2 | Badge | `components/ui/badge.tsx` | Inline labels (CVA: default/secondary/destructive/outline/ghost/link) |
| 3 | Button | `components/ui/button.tsx` | Actions (CVA: default/outline/secondary/ghost/destructive/link × 8 sizes) |
| 4 | Card | `components/ui/card.tsx` | Content containers (Card/Header/Title/Description/Action/Content/Footer) |
| 5 | Dialog | `components/ui/dialog.tsx` | Modal dialogs (Overlay/Content/Header/Footer/Title/Description) |
| 6 | DropdownMenu | `components/ui/dropdown-menu.tsx` | Context menus & dropdowns |
| 7 | Input | `components/ui/input.tsx` | Text input fields |
| 8 | Pagination | `components/ui/pagination.tsx` | Page navigation |
| 9 | Separator | `components/ui/separator.tsx` | Visual dividers |
| 10 | Sheet | `components/ui/sheet.tsx` | Slide-out panels |
| 11 | Skeleton | `components/ui/skeleton.tsx` | Base loading skeleton |
| 12 | Slider | `components/ui/slider.tsx` | Range sliders |
| 13 | Switch | `components/ui/switch.tsx` | Toggle switches |
| 14 | Table | `components/ui/table.tsx` | Data tables |
| 15 | Tabs | `components/ui/tabs.tsx` | Tab panels |
| 16 | Textarea | `components/ui/textarea.tsx` | Multi-line text input |
| 17 | Tooltip | `components/ui/tooltip.tsx` | Hover tooltips |

### New Components (6 — Sprint A2)

| # | Component | File | Purpose |
|---|-----------|------|---------|
| 18 | **Command** | `components/ui/command.tsx` | Command palette (Cmd+K) — wraps `cmdk` |
| 19 | **EmptyState** | `components/ui/empty-state.tsx` | Empty states with icon + title + CTA |
| 20 | **Skeleton Variants** | `components/ui/skeleton-variants.tsx` | 5 skeleton patterns (Card, List, Table, Chat, Stat) |
| 21 | **StatusBadge** | `components/ui/status-badge.tsx` | Document/entity status (ready/processing/failed/pending/inactive) |
| 22 | **PageHeader** | `components/ui/page-header.tsx` | Page header with title + description + actions |
| 23 | **Breadcrumb** | `components/ui/breadcrumb.tsx` | Breadcrumb navigation |

**Total UI Components:** 23

---

## Design System Conventions

### Token Usage Pattern

All components reference CSS custom properties from `globals.css`:

```css
/* Background tokens */
bg-background, bg-foreground, bg-card, bg-popover
bg-muted, bg-accent, bg-primary, bg-secondary, bg-destructive

/* Text tokens */
text-foreground, text-muted-foreground, text-card-foreground
text-primary-foreground, text-accent-foreground

/* Border tokens */
border-border, ring-foreground, ring-ring

/* Semantic tokens */
bg-success, bg-warning, bg-error, bg-info
text-success, text-warning, text-error, text-info

/* V2 brand tokens */
bg-brand-50..900, bg-neutral-0..950
bg-surface-base/raised/overlay/elevated/floating
shadow-xs/sm/md/lg/glow
```

### Component Architecture

- **Primitives:** `@base-ui/react` for headless UI (Button, Dialog, Separator)
- **Styling:** Tailwind CSS v4 + `cn()` utility (clsx + tailwind-merge)
- **Variants:** `class-variance-authority` (CVA) for type-safe variant props
- **Rendering:** `useRender` + `mergeProps` from base-ui for polymorphic rendering
- **Data slots:** `data-slot="component-name"` for CSS targeting

### Naming Conventions

- File: `kebab-case.tsx` (e.g., `empty-state.tsx`)
- Component: `PascalCase` (e.g., `EmptyState`)
- Slot: `data-slot="kebab-case"` (e.g., `data-slot="empty-state"`)
- Export: Named exports, no default exports

---

## Component Usage Guide

### Command Palette

```tsx
import { CommandDialog, CommandInput, CommandList, CommandGroup, CommandItem, CommandShortcut } from "@/components/ui/command"

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandGroup heading="Navigation">
      <CommandItem onSelect={() => router.push("/dashboard")}>
        Dashboard <CommandShortcut>⌘D</CommandShortcut>
      </CommandItem>
      <CommandItem onSelect={() => router.push("/chat")}>
        Chat <CommandShortcut>⌘C</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### Empty State

```tsx
import { EmptyState } from "@/components/ui/empty-state"
import { FileTextIcon, UploadIcon } from "lucide-react"

<EmptyState
  icon={FileTextIcon}
  title="No documents yet"
  description="Upload your first document to start chatting with your knowledge base."
  action={{ label: "Upload Document", onClick: handleUpload, icon: UploadIcon }}
  secondaryAction={{ label: "Learn more", onClick: handleLearn }}
/>
```

### Skeleton Variants

```tsx
import { CardSkeleton, ListItemSkeleton, TableSkeleton, ChatMessageSkeleton, StatCardSkeleton } from "@/components/ui/skeleton-variants"

// Dashboard loading
<div className="grid grid-cols-4 gap-4">
  <StatCardSkeleton /> <StatCardSkeleton /> <StatCardSkeleton /> <StatCardSkeleton />
</div>

// Document list loading
<ListItemSkeleton /> <ListItemSkeleton /> <ListItemSkeleton />

// Chat loading
<ChatMessageSkeleton variant="assistant" />
<ChatMessageSkeleton variant="user" />
```

### Status Badge

```tsx
import { StatusBadge } from "@/components/ui/status-badge"

<StatusBadge status="ready" />
<StatusBadge status="processing" label="Embedding..." pulsing />
<StatusBadge status="failed" label="Parse error" />
```

### Page Header

```tsx
import { PageHeader } from "@/components/ui/page-header"
import { Breadcrumb } from "@/components/ui/breadcrumb"

<PageHeader
  title="Documents"
  description="Manage your uploaded documents"
  breadcrumb={
    <Breadcrumb items={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Documents" },
    ]} />
  }
  actions={<Button>Upload</Button>}
/>
```

---

## Token-to-Component Mapping

| Token | Components Using It |
|-------|-------------------|
| `bg-popover` | Command, Dialog |
| `bg-card` | Card, Skeleton variants |
| `bg-accent` | Command (selected state) |
| `bg-muted` | EmptyState (icon bg), StatusBadge, ListItemSkeleton, TableSkeleton |
| `text-muted-foreground` | EmptyState (description), Breadcrumb, Command (placeholder), StatusBadge |
| `text-foreground` | PageHeader (title), Breadcrumb (active), Command (item text) |
| `ring-foreground/10` | Command (border ring), Card |
| `bg-success/15` | StatusBadge (ready) |
| `bg-info/15` | StatusBadge (processing) |
| `bg-warning/15` | StatusBadge (pending) |
| `bg-destructive/15` | StatusBadge (failed) |

---

## Dependency Graph

```
cmdk (npm)
  └── components/ui/command.tsx

@base-ui/react (existing)
  ├── components/ui/button.tsx
  ├── components/ui/dialog.tsx
  └── components/ui/separator.tsx

components/ui/skeleton.tsx (existing)
  └── components/ui/skeleton-variants.tsx

components/ui/button.tsx (existing)
  └── components/ui/empty-state.tsx

components/ui/separator.tsx (existing)
  └── components/ui/page-header.tsx

next/link (existing)
  └── components/ui/breadcrumb.tsx
```

---

## File Sizes

| File | Bytes | Lines |
|------|-------|-------|
| `command.tsx` | 4,128 | 155 |
| `empty-state.tsx` | 2,347 | 100 |
| `skeleton-variants.tsx` | 3,797 | 140 |
| `status-badge.tsx` | 1,978 | 80 |
| `page-header.tsx` | 1,392 | 55 |
| `breadcrumb.tsx` | 1,850 | 75 |
| **Total** | **15,492** | **605** |

---

*Report generated: 2026-06-14*
*Hermes Agent — Sprint A2 component library complete*
