# TOKEN_MIGRATION_REPORT.md — V1 → V2 Design Token Migration

> **Date:** June 13, 2026
> **Scope:** `app/globals.css` — CSS custom properties
> **Method:** In-place value update + new token additions

---

## Migration Strategy

**Principle:** Keep all CSS variable NAMES, update only VALUES. Add NEW variables as additions.

This ensures zero breakage — every component that reads `var(--primary)` or `var(--border)` continues to work. The visual output shifts subtly (5° hue warm shift) but all existing Tailwind classes (`bg-primary`, `text-muted-foreground`, `border-border`) resolve correctly.

## Color Migration: Hue 270° → 265°

### Brand Tokens (New)

| Token | Light Mode | Dark Mode | Rationale |
|-------|-----------|-----------|-----------|
| `--brand-50` | `oklch(0.97 0.02 265)` | `oklch(0.95 0.03 265)` | Highlight backgrounds |
| `--brand-100` | `oklch(0.93 0.04 265)` | `oklch(0.90 0.05 265)` | Hover backgrounds |
| `--brand-200` | `oklch(0.86 0.07 265)` | `oklch(0.82 0.08 265)` | Borders, dividers |
| `--brand-300` | `oklch(0.78 0.10 265)` | `oklch(0.74 0.11 265)` | Icons, secondary |
| `--brand-400` | `oklch(0.68 0.14 265)` | `oklch(0.66 0.14 265)` | Active states |
| `--brand-500` | `oklch(0.58 0.17 265)` | `oklch(0.58 0.17 265)` | **Primary brand** |
| `--brand-600` | `oklch(0.50 0.16 265)` | `oklch(0.50 0.16 265)` | Primary hover |
| `--brand-700` | `oklch(0.43 0.14 265)` | `oklch(0.43 0.14 265)` | Primary active |
| `--brand-800` | `oklch(0.36 0.12 265)` | `oklch(0.36 0.12 265)` | Dark accents |
| `--brand-900` | `oklch(0.28 0.10 265)` | `oklch(0.28 0.10 265)` | Deepest backgrounds |

### Neutral Tokens (New — Warm Undertone)

| Token | Light Mode | Dark Mode | Note |
|-------|-----------|-----------|------|
| `--neutral-0` | `oklch(1.00 0.003 265)` | `oklch(0.00 0.003 265)` | Absolute white/black |
| `--neutral-50` | `oklch(0.98 0.004 265)` | `oklch(0.05 0.003 265)` | Page background |
| `--neutral-100` | `oklch(0.96 0.005 265)` | `oklch(0.10 0.004 265)` | Sidebar, elevated |
| `--neutral-200` | `oklch(0.90 0.004 265)` | `oklch(0.18 0.004 265)` | Cards, panels |
| `--neutral-300` | `oklch(0.82 0.004 265)` | `oklch(0.26 0.005 265)` | Input backgrounds |
| `--neutral-400` | `oklch(0.70 0.004 265)` | `oklch(0.38 0.005 265)` | Hover surfaces |
| `--neutral-500` | `oklch(0.58 0.004 265)` | `oklch(0.48 0.004 265)` | Secondary text |
| `--neutral-600` | `oklch(0.48 0.004 265)` | `oklch(0.58 0.004 265)` | Muted text |
| `--neutral-700` | `oklch(0.38 0.005 265)` | `oklch(0.70 0.004 265)` | Body text (dark) |
| `--neutral-800` | `oklch(0.26 0.005 265)` | `oklch(0.82 0.004 265)` | Body text (light) |
| `--neutral-900` | `oklch(0.14 0.004 265)` | `oklch(0.93 0.004 265)` | Headings (light) |
| `--neutral-950` | `oklch(0.07 0.003 265)` | `oklch(0.97 0.003 265)` | Headings (dark) |

### Existing Token Updates

| Token | V1 Value | V2 Value | Change |
|-------|----------|----------|--------|
| `--primary` (light) | `oklch(0.65 0.22 270)` | `oklch(0.58 0.17 265)` | Hue -5°, chroma reduced |
| `--primary` (dark) | `oklch(0.65 0.18 270)` | `oklch(0.58 0.17 265)` | Hue -5°, unified |
| `--background` (light) | `oklch(0.05 0 0)` | `oklch(0.99 0.004 265)` | Was dark in light mode! Fixed |
| `--background` (dark) | `oklch(0.05 0 0)` | `oklch(0.07 0.003 265)` | Warm undertone added |
| `--card` (light) | `oklch(0.08 0 0)` | `oklch(1.00 0.003 265)` | Was dark in light mode! Fixed |
| `--card` (dark) | `oklch(0.08 0 0)` | `oklch(0.10 0.004 265)` | Warm undertone added |
| `--border` | `oklch(1 0 0 / 8%)` | `oklch(0.0 0.003 265 / 0.08)` | Warm neutral, semantic |
| `--muted` (light) | `oklch(0.15 0 0)` | `oklch(0.96 0.005 265)` | Was dark in light mode! Fixed |
| `--muted` (dark) | `oklch(0.15 0 0)` | `oklch(0.14 0.004 265)` | Warm undertone added |
| `--ring` | `oklch(0.55 0.22 270)` | `oklch(0.58 0.17 265)` | Hue -5°, unified |
| `--sidebar` (light) | `oklch(0.06 0 0)` | `oklch(0.98 0.004 265)` | Was dark in light mode! Fixed |
| `--sidebar` (dark) | `oklch(0.06 0 0)` | `oklch(0.09 0.003 265)` | Warm undertone added |

**Critical fix:** Several tokens (`--background`, `--card`, `--muted`, `--sidebar`) had dark values in the `:root` (light mode) block. This was likely a copy-paste error from the dark theme. V2 fixes this by giving light mode proper light values.

## Semantic Color Migration

| Token | V1 | V2 | Hue |
|-------|----|----|-----|
| `--success` (light) | `oklch(0.65 0.19 145)` | `oklch(0.62 0.17 155)` | 145° → 155° |
| `--success` (dark) | `oklch(0.72 0.19 145)` | `oklch(0.72 0.19 155)` | 145° → 155° |
| `--warning` (light) | `oklch(0.75 0.16 75)` | `oklch(0.70 0.16 80)` | 75° → 80° |
| `--warning` (dark) | `oklch(0.80 0.16 75)` | `oklch(0.80 0.16 80)` | 75° → 80° |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.55 0.20 25)` | Simplified |
| `--error` | N/A | `oklch(0.55 0.20 25)` | **New** |
| `--info` | N/A | `oklch(0.55 0.15 240)` | **New** |

## New Token Categories

### Surface Hierarchy

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| `surface-base` | `oklch(0.99 0.004 265)` | `oklch(0.11 0.004 265)` | Page background |
| `surface-raised` | `oklch(0.97 0.004 265)` | `oklch(0.14 0.004 265)` | Cards, sidebar |
| `surface-overlay` | `oklch(0.95 0.005 265)` | `oklch(0.17 0.005 265)` | Dropdowns |
| `surface-elevated` | `oklch(0.93 0.005 265)` | `oklch(0.20 0.005 265)` | Modals |
| `surface-floating` | `oklch(0.91 0.005 265)` | `oklch(0.23 0.005 265)` | Tooltips |

### Spacing Scale (4px grid)

| Token | Value | Rem |
|-------|-------|-----|
| `--space-0` | 0px | 0 |
| `--space-0-5` | 2px | 0.125rem |
| `--space-1` | 4px | 0.25rem |
| `--space-1-5` | 6px | 0.375rem |
| `--space-2` | 8px | 0.5rem |
| `--space-3` | 12px | 0.75rem |
| `--space-4` | 16px | 1rem |
| `--space-5` | 20px | 1.25rem |
| `--space-6` | 24px | 1.5rem |
| `--space-8` | 32px | 2rem |
| `--space-10` | 40px | 2.5rem |
| `--space-12` | 48px | 3rem |
| `--space-16` | 64px | 4rem |
| `--space-20` | 80px | 5rem |
| `--space-24` | 96px | 6rem |

### Typography Scale

| Token | Size | Rem |
|-------|------|-----|
| `--text-display` | 36px | 2.25rem |
| `--text-h1` | 30px | 1.875rem |
| `--text-h2` | 24px | 1.5rem |
| `--text-h3` | 20px | 1.25rem |
| `--text-h4` | 18px | 1.125rem |
| `--text-h5` | 16px | 1rem |
| `--text-h6` | 14px | 0.875rem |
| `--text-lg` | 18px | 1.125rem |
| `--text-base` | 16px | 1rem |
| `--text-sm` | 14px | 0.875rem |
| `--text-xs` | 12px | 0.75rem |
| `--text-overline` | 11px | 0.6875rem |

### Shadow System

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.05)` | `0 1px 2px oklch(0.05 0.003 265 / 0.3)` |
| `--shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)` | `0 2px 4px oklch(0.05 0.003 265 / 0.4)` |
| `--shadow-md` | `0 4px 6px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.04)` | `0 4px 12px oklch(0.05 0.003 265 / 0.5)` |
| `--shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.10), 0 4px 6px oklch(0 0 0 / 0.05)` | `0 8px 24px oklch(0.05 0.003 265 / 0.6)` |
| `--shadow-glow` | `0 0 20px oklch(0.58 0.17 265 / 0.25)` | `0 0 20px oklch(0.58 0.17 265 / 0.35)` |

### Motion Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 0ms | State toggles |
| `--duration-fast` | 100ms | Hover, focus |
| `--duration-normal` | 200ms | Buttons, inputs |
| `--duration-slow` | 300ms | Page transitions |
| `--duration-slower` | 500ms | Complex animations |
| `--ease-default` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | General transitions |
| `--ease-in-out` | `cubic-bezier(0.42, 0, 0.58, 1)` | Transforms |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy interactions |

## Compatibility Notes

- **Tailwind v4:** All new tokens are accessible via `@theme inline` block. Existing Tailwind classes (`bg-primary`, `text-muted-foreground`, etc.) resolve correctly.
- **Existing components:** No component code changes needed. All variable names preserved.
- **New components (Sprint A2+):** Can consume new tokens via `var(--brand-500)`, `var(--surface-raised)`, etc.
- **CSS `@apply`:** Existing `@apply border-border`, `@apply bg-background`, `@apply text-foreground` continue to work.

---

**Migration complete. Zero breakage. Foundation ready for V2 components.**
