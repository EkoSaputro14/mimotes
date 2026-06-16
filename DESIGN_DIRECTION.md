# DESIGN_DIRECTION.md — Design Philosophy & System

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 2

---

## Design Philosophy

**"Clarity through hierarchy, not decoration."**

Inspired by: Linear (density + keyboard-first), Notion (content-first), Vercel (minimal + precise), Superlist (task-oriented).

### Core Principles

1. **Progressive Disclosure** — Show summary first, details on demand. Dashboard = KPIs → widgets → drill-down.
2. **Content-First** — No chrome for chrome's sake. Every pixel serves the user's task.
3. **Consistent Density** — Compact but not cramped. Information-dense without visual noise.
4. **Action-Oriented** — Every page has a clear primary action. Upload, Search, Chat, Configure.
5. **Dark-Mode Native** — Design for dark first, then adapt to light.

---

## Color System

### Brand Colors (Indigo Tonal Spot)

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `brand-50` | `oklch(0.97 0.02 270)` | — | Backgrounds, highlights |
| `brand-100` | `oklch(0.93 0.04 270)` | — | Hover states |
| `brand-200` | `oklch(0.87 0.08 270)` | — | Borders, dividers |
| `brand-400` | `oklch(0.65 0.18 270)` | — | Icons, secondary |
| `brand-500` | `oklch(0.55 0.22 270)` | `oklch(0.65 0.18 270)` | Primary buttons, links |
| `brand-600` | `oklch(0.48 0.22 270)` | `oklch(0.55 0.22 270)` | Primary hover |
| `brand-700` | `oklch(0.42 0.20 270)` | `oklch(0.48 0.22 270)` | Primary active |

### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `success` | `oklch(0.65 0.19 145)` | `oklch(0.72 0.19 145)` | Success states, ready |
| `warning` | `oklch(0.75 0.16 75)` | `oklch(0.80 0.16 75)` | Warnings, processing |
| `error` | `oklch(0.58 0.24 27)` | `oklch(0.65 0.24 27)` | Errors, failed |
| `info` | `oklch(0.60 0.15 240)` | `oklch(0.68 0.15 240)` | Informational |

### Neutral Palette

| Token | Light | Dark |
|-------|-------|------|
| `bg` | `oklch(1.0 0 0)` | `oklch(0.13 0.005 270)` |
| `surface` | `oklch(0.98 0.002 270)` | `oklch(0.16 0.005 270)` |
| `border` | `oklch(0.90 0.005 270)` | `oklch(0.24 0.005 270)` |
| `muted` | `oklch(0.55 0.01 270)` | `oklch(0.55 0.01 270)` |
| `fg` | `oklch(0.15 0.01 270)` | `oklch(0.93 0.005 270)` |

---

## Typography System

### Type Scale

| Level | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| Display LG | Plus Jakarta Sans | 36px | 700 | 1.1 | -0.02em | Page titles (rare) |
| Display MD | Plus Jakarta Sans | 28px | 700 | 1.2 | -0.02em | Section headers |
| Heading LG | Plus Jakarta Sans | 22px | 600 | 1.3 | -0.01em | Card titles |
| Heading MD | Plus Jakarta Sans | 18px | 600 | 1.4 | — | Sub-sections |
| Heading SM | Plus Jakarta Sans | 16px | 600 | 1.4 | — | Widget titles |
| Body LG | Inter | 16px | 400 | 1.6 | — | Long-form content |
| Body MD | Inter | 14px | 400 | 1.5 | — | Default body text |
| Body SM | Inter | 13px | 400 | 1.5 | — | Captions, metadata |
| Label LG | Inter | 14px | 500 | 1.4 | — | Form labels |
| Label MD | Inter | 13px | 500 | 1.4 | — | Badges, tags |
| Label SM | Inter | 11px | 500 | 1.4 | 0.05em | Uppercase section labels |

---

## Spacing System

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Icon gaps, tight inline |
| `sm` | 8px | Badge padding, list gaps |
| `md` | 16px | Card padding, form gaps |
| `lg` | 24px | Section gaps, page margins |
| `xl` | 32px | Major section separators |
| `2xl` | 48px | Page-level spacing |

---

## Card System

### Card Variants

1. **KPI Card** — Compact stat with icon, value, label, trend indicator
2. **Content Card** — Header + body + optional footer, for charts/tables
3. **Action Card** — Card with primary CTA (upload, create, configure)
4. **Status Card** — Health indicator with color-coded dot

### Card Rules
- Border: 1px solid `border` token
- Radius: `rounded-lg` (10px)
- Padding: `p-5` (20px)
- Shadow: `shadow-sm` (subtle elevation)
- Hover: `shadow-md` + border color shift for interactive cards
- Background: `surface` token (slightly off-white in light, slightly elevated in dark)

---

## Navigation System

### Desktop Sidebar (260px fixed)
```
┌──────────────────────┐
│ 🤖 Mimotes      [v]  │  ← Workspace switcher
├──────────────────────┤
│ 📊 Dashboard         │  ← Primary (always visible)
│ 💬 Chat              │  ← Primary (always visible)
├──────────────────────┤
│ KNOWLEDGE BASE       │  ← Section label (uppercase, 11px)
│ 📄 Documents         │
│ ⬆️ Upload            │  ← Promoted (was nested)
├──────────────────────┤
│ ANALYTICS            │
│ 📈 Overview          │  ← Unified analytics page
├──────────────────────┤
│ INTEGRATIONS         │
│ 🧩 Widgets           │
│ 🔌 API               │
├──────────────────────┤
│ ⚙️ Settings          │  ← Single entry (tabs inside)
├──────────────────────┤
│ 👤 Admin             │  ← User + workspace
└──────────────────────┘
```

### Mobile Bottom Tab Bar (NEW)
```
┌──────┬──────┬──────┬──────┬──────┐
│ 🏠   │ 💬   │ ⬆️   │ 📊   │ ⋯    │
│ Home │ Chat │ Upload│ Stats│ More │
└──────┴──────┴──────┴──────┴──────┘
```

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 2*
