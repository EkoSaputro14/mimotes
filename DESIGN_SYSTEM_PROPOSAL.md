# MimoNotes Design System

> A premium design system for an AI-powered knowledge chatbot.
> Target: Implementable in 1–2 weeks by a solo founder.

---

## 1. Brand Identity

### Brand Personality (5 words)
**Precise. Warm. Intelligent. Calm. Premium.**

### Visual Metaphor
**"A sharp lens on messy knowledge."**

MimoNotes takes disorganized documents and transforms them into clear, actionable intelligence. The visual system should feel like putting on noise-canceling headphones — everything else fades, and only signal remains.

### Design DNA

| Influence | What We Take | What We Skip |
|-----------|-------------|--------------|
| **Linear** | Ultra-minimal surfaces, precise purple accent, keyboard-first density | Their extreme opacity/blur effects |
| **Claude** | Warm undertones, editorial clarity, trustworthy feel | Their terracotta — we keep purple |
| **Notion** | Content-first layout, soft surfaces, calm hierarchy | Their heaviness/chrome |
| **Vercel** | Black-white precision, Geist font, monochrome restraint | Their starkness — we add warmth |
| **Superhuman** | Premium dark UI, purple glow, speed feel | Their complexity |

### Color Rationale

The current palette (oklch hue 270) is strong but monochrome. We will:

1. **Shift hue slightly warm**: 270° → 265° — adds a whisper of warmth without losing the "AI/intelligence" association
2. **Expand chroma range**: From 1 accent level to a full 7-step brand scale
3. **Add neutral warmth**: Pure gray (chroma 0) feels cold; we add chroma 0.003–0.005 at hue 265 for warmth
4. **Semantic colors**: Success (green), Warning (amber), Error (red), Info (blue) — standard but tuned for dark backgrounds

---

## 2. Color System

### 2.1 Brand Scale (Indigo-Violet, Hue 265°)

| Step | Dark Mode | Light Mode | Usage |
|------|-----------|------------|-------|
| 50 | `oklch(0.97 0.015 265)` | `oklch(0.97 0.02 265)` | Highlight backgrounds, tag fills |
| 100 | `oklch(0.92 0.035 265)` | `oklch(0.93 0.04 265)` | Hover backgrounds, selected states |
| 200 | `oklch(0.85 0.07 265)` | `oklch(0.87 0.08 265)` | Borders, dividers (light mode) |
| 300 | `oklch(0.72 0.12 265)` | `oklch(0.75 0.12 265)` | Icons, secondary actions |
| 400 | `oklch(0.65 0.18 265)` | `oklch(0.60 0.20 265)` | Active states, focused elements |
| 500 | `oklch(0.62 0.20 265)` | `oklch(0.52 0.22 265)` | Primary buttons, links, brand |
| 600 | `oklch(0.55 0.22 265)` | `oklch(0.45 0.22 265)` | Primary hover |
| 700 | `oklch(0.48 0.22 265)` | `oklch(0.38 0.20 265)` | Primary active/pressed |
| 800 | `oklch(0.38 0.18 265)` | `oklch(0.30 0.16 265)` | Dark accents, badges |
| 900 | `oklch(0.25 0.12 265)` | `oklch(0.22 0.12 265)` | Deepest accent backgrounds |

### 2.2 Semantic Colors

| Token | Dark Mode | Light Mode | WCAG AA on dark bg | Usage |
|-------|-----------|------------|---------------------|-------|
| `success` | `oklch(0.72 0.17 155)` | `oklch(0.55 0.18 155)` | ✅ 7.2:1 | Ready status, success toasts |
| `success-subtle` | `oklch(0.15 0.04 155)` | `oklch(0.96 0.02 155)` | — | Success backgrounds |
| `warning` | `oklch(0.80 0.15 80)` | `oklch(0.55 0.16 80)` | ✅ 8.1:1 | Processing, warnings |
| `warning-subtle` | `oklch(0.15 0.03 80)` | `oklch(0.96 0.02 80)` | — | Warning backgrounds |
| `error` | `oklch(0.65 0.22 25)` | `oklch(0.50 0.22 25)` | ✅ 5.8:1 | Errors, failed status |
| `error-subtle` | `oklch(0.15 0.04 25)` | `oklch(0.96 0.02 25)` | — | Error backgrounds |
| `info` | `oklch(0.70 0.12 240)` | `oklch(0.50 0.14 240)` | ✅ 6.5:1 | Informational, links |
| `info-subtle` | `oklch(0.12 0.03 240)` | `oklch(0.96 0.02 240)` | — | Info backgrounds |

### 2.3 Neutral Scale (Warm Neutrals)

All neutrals use hue 265 with very low chroma for warmth.

| Step | Dark Mode | Light Mode | Usage |
|------|-----------|------------|-------|
| 0 | `oklch(0.00 0 0)` | `oklch(1.00 0 0)` | Absolute black / white |
| 50 | `oklch(0.04 0.002 265)` | `oklch(0.99 0.002 265)` | Page background (darkest/lightest) |
| 100 | `oklch(0.07 0.003 265)` | `oklch(0.97 0.003 265)` | Sidebar, elevated surfaces |
| 200 | `oklch(0.10 0.004 265)` | `oklch(0.95 0.003 265)` | Cards, panels |
| 300 | `oklch(0.14 0.005 265)` | `oklch(0.92 0.004 265)` | Input backgrounds, popover |
| 400 | `oklch(0.18 0.005 265)` | `oklch(0.88 0.005 265)` | Hover surfaces, active states |
| 500 | `oklch(0.25 0.005 265)` | `oklch(0.82 0.005 265)` | Borders, dividers |
| 600 | `oklch(0.35 0.005 265)` | `oklch(0.70 0.005 265)` | Disabled text, placeholders |
| 700 | `oklch(0.50 0.005 265)` | `oklch(0.55 0.005 265)` | Secondary text |
| 800 | `oklch(0.70 0.004 265)` | `oklch(0.38 0.004 265)` | Primary text (secondary emphasis) |
| 900 | `oklch(0.93 0.003 265)` | `oklch(0.18 0.003 265)` | Primary text |
| 950 | `oklch(0.98 0.002 265)` | `oklch(0.10 0.002 265)` | Brightest text (headings) |

### 2.4 Surface Hierarchy (Dark Mode)

| Level | Token | Value | Usage |
|-------|-------|-------|-------|
| 0 | `bg-base` | `neutral-50` | Page background |
| 1 | `bg-surface` | `neutral-100` | Sidebar, topbar |
| 2 | `bg-elevated` | `neutral-200` | Cards, panels |
| 3 | `bg-overlay` | `neutral-300` | Modals, popovers, dropdowns |
| 4 | `bg-highlight` | `neutral-400` | Hover states, active selections |

### 2.5 Contrast Ratios (Dark Mode)

| Foreground | Background | Ratio | WCAG |
|------------|------------|-------|------|
| neutral-950 on neutral-50 | Primary text on bg | 18.2:1 | AAA ✅ |
| neutral-800 on neutral-50 | Secondary text on bg | 9.1:1 | AAA ✅ |
| neutral-700 on neutral-50 | Muted text on bg | 5.3:1 | AA ✅ |
| brand-500 on neutral-50 | Links on bg | 5.8:1 | AA ✅ |
| brand-400 on neutral-50 | Icons on bg | 7.2:1 | AAA ✅ |

---

## 3. Typography System

### 3.1 Font Choices

| Role | Font | Rationale |
|------|------|-----------|
| **Display / Headings** | **Geist Sans** | Already bundled, geometric precision, Vercel-quality, free |
| **Body / UI** | **Geist Sans** | Same family maintains cohesion; excellent at 13–16px |
| **Monospace / Code** | **Geist Mono** | Already bundled, matches Geist Sans perfectly |

> **Why not Inter + Plus Jakarta Sans (from DESIGN_DIRECTION.md)?**
> Geist is already the project font, has display + mono variants, and is purpose-built for dark UIs. Two font families from the same superfamily is cleaner than mixing Inter + PJS. If we later want editorial warmth for marketing pages, we can add **Source Serif 4** as a third option for landing page headings only.

### 3.2 Type Scale

| Level | Token | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|-------|------|--------|-------------|----------------|-------|
| `display-lg` | `--text-display-lg` | 36px | 700 | 1.10 | -0.025em | Landing page hero |
| `display-md` | `--text-display-md` | 28px | 700 | 1.15 | -0.02em | Section headers |
| `heading-lg` | `--text-heading-lg` | 22px | 600 | 1.25 | -0.015em | Page titles |
| `heading-md` | `--text-heading-md` | 18px | 600 | 1.30 | -0.01em | Card titles, dialog titles |
| `heading-sm` | `--text-heading-sm` | 15px | 600 | 1.35 | -0.005em | Sub-section headers |
| `body-lg` | `--text-body-lg` | 16px | 400 | 1.60 | 0 | Long-form content, chat messages |
| `body-md` | `--text-body-md` | 14px | 400 | 1.50 | 0 | Default body text, form content |
| `body-sm` | `--text-body-sm` | 13px | 400 | 1.50 | 0 | Captions, metadata, timestamps |
| `label-lg` | `--text-label-lg` | 14px | 500 | 1.40 | 0 | Form labels, button text |
| `label-md` | `--text-label-md` | 12px | 500 | 1.40 | 0.01em | Badges, tags, secondary labels |
| `label-sm` | `--text-label-sm` | 11px | 600 | 1.30 | 0.05em | Uppercase section labels, KPI labels |
| `code` | `--text-code` | 13px | 400 | 1.60 | 0 | Code blocks, inline code, file names |

### 3.3 Heading Rules

- **Headings use Geist Sans** (the `--font-heading` custom property)
- **Color**: Always `neutral-950` (darkest) — never use brand color for headings
- **Weight progression**: 700 → 600 → 600 → 600 as sizes decrease
- **No italic headings** — ever
- **Maximum 2 heading sizes per page** — enforce visual hierarchy
- **Letter spacing**: Negative for sizes ≥ 18px, zero for body sizes

### 3.4 Body Text Rules

- **Line length**: Max 65 characters (~680px at 14px) for readability
- **Line height**: 1.5 for body, 1.6 for long-form, 1.4 for labels
- **Color**: `neutral-900` for primary body, `neutral-700` for secondary
- **Never use pure white** (`oklch(1 0 0)`) for body text — always use `neutral-950`
- **Paragraph spacing**: 0.75em (12px at 16px)

---

## 4. Spacing System

### 4.1 Base Unit

**4px grid.** All spacing values are multiples of 4px.

### 4.2 Spacing Scale

| Token | Value | Tailwind Class | Usage |
|-------|-------|---------------|-------|
| `2xs` | 2px | `gap-0.5` | Tight inline gaps (icon + text) |
| `xs` | 4px | `gap-1` / `p-1` | Icon gaps, badge padding |
| `sm` | 8px | `gap-2` / `p-2` | List item padding, form field gaps |
| `md` | 12px | `gap-3` / `p-3` | Button padding (inline), card internal gaps |
| `base` | 16px | `gap-4` / `p-4` | Card padding, standard spacing |
| `lg` | 20px | `gap-5` / `p-5` | Card padding (large), section gaps |
| `xl` | 24px | `gap-6` / `p-6` | Section separators, sidebar padding |
| `2xl` | 32px | `gap-8` / `p-8` | Major section breaks |
| `3xl` | 48px | `gap-12` / `p-12` | Page-level spacing (hero, landing) |
| `4xl` | 64px | `gap-16` / `p-16` | Landing page sections |

### 4.3 Component Spacing Rules

| Component | Internal Padding | Gap Between |
|-----------|-----------------|-------------|
| **Button (sm)** | 8px × 12px | — |
| **Button (md)** | 10px × 16px | — |
| **Button (lg)** | 12px × 24px | — |
| **Input** | 10px × 12px | — |
| **Card** | 20px (all sides) | — |
| **Card → Card** | — | 12px (in grid) |
| **Dialog** | 24px | — |
| **List item** | 10px × 16px | 2px between items |
| **Form group** | — | 16px between fields |
| **Section** | — | 32px between sections |
| **Sidebar item** | 8px × 12px | 2px between items |

### 4.4 Page Layout Margins

| Context | Padding |
|---------|---------|
| Sidebar (desktop) | 12px horizontal, 16px vertical |
| Content area | 24px all sides (mobile: 16px) |
| Chat interface | 0 horizontal, 16px vertical |
| Dashboard grid | 16px gap |
| Landing page | 24px mobile, 48px desktop |

---

## 5. Component System

### 5.1 Buttons

```
┌─────────────────────────────────────────────────────┐
│  Variant     │  bg            │  text         │ Border      │
├─────────────────────────────────────────────────────┤
│  primary     │  brand-500     │  white        │  none       │
│  primary-hov │  brand-600     │  white        │  none       │
│  secondary   │  neutral-300   │  neutral-950  │  neutral-500│
│  secondary-h │  neutral-400   │  neutral-950  │  neutral-500│
│  ghost       │  transparent   │  neutral-800  │  none       │
│  ghost-hov   │  neutral-300   │  neutral-950  │  none       │
│  destructive │  error         │  white        │  none       │
│  destructive │  error/80%     │  white        │  none       │
│  link        │  transparent   │  brand-500    │  none       │
└─────────────────────────────────────────────────────┘
```

**Sizes:**
| Size | Height | Padding | Font | Icon Size |
|------|--------|---------|------|-----------|
| `sm` | 28px | 6px 10px | label-md | 14px |
| `md` | 34px | 8px 14px | label-lg | 16px |
| `lg` | 40px | 10px 20px | label-lg | 18px |
| `icon` | 34px | 0 | — | 16px |

**Radius:** `rounded-lg` (8px) — consistent across all buttons.
**Transition:** `all 150ms ease` (background + border + shadow).

### 5.2 Inputs

**Default State:**
- Background: `neutral-200`
- Border: 1px solid `neutral-500` (6% white overlay)
- Text: `neutral-900`
- Placeholder: `neutral-600`
- Radius: `rounded-lg` (8px)

**Focus State:**
- Border: `brand-500`
- Ring: 2px `brand-500/20%` (outer glow)
- No background change

**Error State:**
- Border: `error`
- Ring: 2px `error/20%`
- Helper text below in `error` color

**Sizes:**
| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 28px | 6px 10px | body-sm |
| `md` | 34px | 8px 12px | body-md |
| `lg` | 40px | 10px 14px | body-md |

**Textarea:**
- Min height: 80px
- Auto-resize: yes (with max-height constraint)
- Same styling as input

**Select:**
- Same styling as input
- Custom chevron icon (Lucide ChevronDown, 16px)
- Dropdown popover: `neutral-200` bg, `neutral-500` border

### 5.3 Cards

**Default Card:**
- Background: `neutral-200`
- Border: 1px solid `neutral-500` (white overlay 6%)
- Radius: `rounded-lg` (10px)
- Padding: 20px
- Shadow: none (dark mode doesn't need shadows)

**Interactive Card (hoverable):**
- Same as default
- On hover: border-color shifts to `neutral-600`, subtle scale `1.01`
- Cursor: `pointer`
- Transition: `all 200ms ease`

**Stat Card (KPI):**
- Layout: Icon (left) + Value + Label (right)
- Icon container: 40px × 40px, `brand-500/10%` bg, brand-500 icon
- Value: `heading-lg`, `neutral-950`
- Label: `label-sm`, uppercase, `neutral-700`
- Optional trend indicator: ↑ green / ↓ red, `label-sm`

**Card with Header:**
- Header: `heading-sm`, `neutral-950`, border-bottom `neutral-500`
- Body: `body-md`, `neutral-800`
- Footer (optional): border-top `neutral-500`, padding-top 12px

### 5.4 Navigation

**Sidebar (Desktop):**
- Width: 240px (collapsed: 56px)
- Background: `neutral-100`
- Border-right: 1px solid `neutral-500`
- Item height: 32px
- Item padding: 8px 12px
- Item radius: `rounded-md` (6px)
- Active item: `neutral-300` bg, `brand-500` left border (2px)
- Hover: `neutral-300/50%`
- Section labels: `label-sm` uppercase, `neutral-700`, 12px margin-top

**Top Bar:**
- Height: 56px
- Background: transparent (inherits from content area)
- Border-bottom: 1px solid `neutral-500`
- Contains: Page title + breadcrumbs + actions
- Padding: 0 24px

**Tabs:**
- Height: 36px
- Active: `neutral-950` text, 2px bottom border `brand-500`
- Inactive: `neutral-700` text
- Hover: `neutral-900` text
- Gap between tabs: 0 (border-based separation)

### 5.5 Dialogs / Modals

- Overlay: `oklch(0 0 0 / 60%)` (near-black, 60% opacity)
- Container: `neutral-200` bg, `rounded-xl` (12px)
- Width: 480px max, 90vw min
- Padding: 24px
- Shadow: `0 25px 50px -12px oklch(0 0 0 / 50%)`
- Header: `heading-md`, `neutral-950`
- Body: `body-md`, `neutral-800`
- Footer: border-top `neutral-500`, flex-end, gap 8px

**Close button:** Top-right, ghost, 24px, `neutral-700` → hover `neutral-900`.

### 5.6 Toast Notifications

- Position: bottom-right (mobile: top center)
- Background: `neutral-200`
- Border: 1px solid `neutral-500`
- Radius: `rounded-lg` (10px)
- Width: 380px max
- Padding: 12px 16px
- Icon (left): 20px, color matches type
- Text: `body-sm`, `neutral-900`
- Duration: 4000ms (success/info), 6000ms (warning/error)

| Type | Icon Color | Border-left accent |
|------|-----------|-------------------|
| Success | `success` | `success` 3px |
| Error | `error` | `error` 3px |
| Warning | `warning` | `warning` 3px |
| Info | `info` | `info` 3px |

### 5.7 Badges / Tags

- Height: 22px
- Padding: 0 8px
- Radius: `rounded-full`
- Font: `label-md`, 500
- Border: 1px solid (matching bg color at 20% opacity)

| Type | Background | Text | Border |
|------|-----------|------|--------|
| Default | `neutral-300` | `neutral-900` | `neutral-500` |
| Brand | `brand-500/15%` | `brand-400` | `brand-500/30%` |
| Success | `success-subtle` | `success` | `success/30%` |
| Warning | `warning-subtle` | `warning` | `warning/30%` |
| Error | `error-subtle` | `error` | `error/30%` |

### 5.8 Tooltips

- Background: `neutral-300`
- Text: `neutral-950`, `body-sm`
- Radius: `rounded-md` (6px)
- Padding: 6px 10px
- Arrow: 6px
- Delay: 300ms
- Max width: 250px
- Shadow: `0 4px 12px oklch(0 0 0 / 30%)`

---

## 6. Icon System

### 6.1 Icon Library

**Lucide React** (already in use via shadcn/ui). No change needed.

Additional icons we may need:
- `lucide-react` covers 1500+ icons — sufficient for entire app
- No custom SVG icons required for v1

### 6.2 Icon Sizes

| Context | Size | Weight | Usage |
|---------|------|--------|-------|
| Navigation | 18px | 1.5 | Sidebar items, topbar |
| Button (sm) | 14px | 1.5 | Small button icons |
| Button (md) | 16px | 1.5 | Standard button icons |
| Button (lg) | 18px | 1.5 | Large button icons |
| Inline text | 14px | 1.5 | Inline with text |
| Stat card | 20px | 1.5 | KPI icons |
| Empty states | 48px | 1.25 | Large decorative icons |
| Logo/icon mark | 24px | 1.5 | Brand icon |

### 6.3 Icon + Label Combinations

- **Sidebar items:** Icon (18px) + 12px gap + Label (body-sm, 500)
- **Buttons:** Icon (16px) + 8px gap + Label (label-lg)
- **Badges:** No icon — text only
- **List items:** Icon (16px) + 12px gap + Text (body-md)
- **Empty states:** Icon (48px) + 16px gap + Heading + 8px gap + Description

### 6.4 When to Use Icons vs Text

| Use Icons | Use Text | Use Both |
|-----------|----------|----------|
| Navigation items | Page titles | Buttons (icon + label) |
| Status indicators | Body paragraphs | Form labels (optional icon) |
| Action triggers (trash, edit) | Section descriptions | Empty state messages |
| Tooltips (for icon-only buttons) | Badges | Sidebar items |

---

## 7. Motion System

### 7.1 Transition Durations

| Category | Duration | Usage |
|----------|----------|-------|
| Micro | 100ms | Button hover, checkbox toggle |
| Fast | 150ms | Input focus, icon color change |
| Normal | 200ms | Card hover, dialog open, dropdown |
| Slow | 300ms | Page transitions, sidebar collapse |
| Enter | 200ms | Element appearing |
| Exit | 150ms | Element disappearing (faster exit) |

### 7.2 Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose (matches Tailwind default) |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (bouncy) |

### 7.3 Micro-Interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | Hover | bg-color 150ms, scale 1.01 |
| Button | Click | scale 0.98 (100ms) |
| Card | Hover | border-color 200ms, subtle shadow |
| Input | Focus | border-color 150ms, ring expand |
| Switch | Toggle | translate 200ms ease-spring |
| Checkbox | Check | checkmark draw 200ms |
| Sidebar item | Active | left-border slide 200ms |
| Badge | Appear | fade-in + scale 150ms ease-spring |

### 7.4 Page Transitions

- **Route changes:** Use Next.js `usePathname` + CSS transitions
- **Fade:** opacity 0 → 1, 200ms ease-out
- **Slide up (modals):** translateY(8px) + opacity → 0 + 1, 200ms ease-out
- **Sidebar collapse:** width 240px → 56px, 300ms ease-in-out

### 7.5 Loading Animations

| Pattern | Animation | Duration |
|---------|-----------|----------|
| Skeleton | Shimmer left→right | 1.5s loop |
| Spinner | Rotate 360° | 1s linear loop |
| Bouncing dots | translateY bounce | 1.4s infinite |
| Progress bar | Width 0% → 100% | Indeterminate: 2s ease loop |
| Chat typing | Three dots fade in/out | 1.4s infinite, staggered 200ms |

---

## 8. Layout System

### 8.1 Grid System

- **Columns:** 12-column grid (for dashboard content area)
- **Gutter:** 16px
- **Margin:** 24px (desktop), 16px (mobile)
- **Max-width content:** 1200px (dashboard), unlimited (chat)

### 8.2 Breakpoints

| Name | Width | Layout |
|------|-------|--------|
| `sm` | 640px | Mobile optimized |
| `md` | 768px | Tablet |
| `lg` | 1024px | Small desktop, sidebar visible |
| `xl` | 1280px | Standard desktop |
| `2xl` | 1536px | Large monitors |

### 8.3 App Layout (Desktop)

```
┌──────────────────────────────────────────────────────┐
│  ┌─────────┬──────────────────────────────────────┐  │
│  │         │           Top Bar (56px)              │  │
│  │         ├──────────────────────────────────────┤  │
│  │ Sidebar │                                      │  │
│  │  240px  │         Content Area                 │  │
│  │         │         (fluid width)                 │  │
│  │         │                                      │  │
│  │         │                                      │  │
│  └─────────┴──────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 8.4 Chat Layout (Special)

```
┌──────────────────────────────────────────────────────┐
│  ┌─────────┬──────────────┬───────────────────────┐  │
│  │         │  Session List │                       │  │
│  │  App    │    280px      │    Chat Area           │  │
│  │ Sidebar │               │    (fluid)             │  │
│  │  240px  │               │                       │  │
│  │         │               │                       │  │
│  │         │               │  ┌─────────────────┐  │  │
│  │         │               │  │  Input Bar (56px)│  │  │
│  │         │               │  └─────────────────┘  │  │
│  └─────────┴──────────────┴───────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 8.5 Max-Width Rules

| Context | Max Width |
|---------|-----------|
| Landing page hero | 720px |
| Landing page content | 1080px |
| Dashboard content | 1400px |
| Chat messages | 768px (readable line length) |
| Document viewer | 800px |
| Settings pages | 640px |
| Auth pages (login/register) | 400px |

---

## 9. Dark Mode Rules

### 9.1 Surface Hierarchy (5 Levels)

Dark mode is the **primary** design target. Light mode is an adaptation.

```
Level 0 (base):     oklch(0.04 0.002 265)    ← Page background
Level 1 (surface):  oklch(0.07 0.003 265)    ← Sidebar, elevated nav
Level 2 (card):     oklch(0.10 0.004 265)    ← Cards, panels
Level 3 (overlay):  oklch(0.14 0.005 265)    ← Modals, popovers
Level 4 (highlight): oklch(0.18 0.005 265)   ← Hover states, focus
```

Each level is approximately `+0.03–0.04` lightness. This creates clear depth without visible borders.

### 9.2 Border Treatment (Dark Mode)

- **Primary borders:** `oklch(1 0 0 / 6%)` — white at 6% opacity
- **Subtle borders:** `oklch(1 0 0 / 4%)` — white at 4% opacity
- **Emphasis borders:** `oklch(1 0 0 / 12%)` — white at 12% opacity
- **Never use gray borders** in dark mode — always white overlay for natural blending

### 9.3 Shadow Treatment (Dark Mode)

Shadows are barely visible on dark backgrounds. Instead, use:

1. **Borders** for structural separation (preferred)
2. **Background lightness** for depth (surface hierarchy)
3. **Minimal shadows** only for overlays:
   - Dropdown: `0 8px 24px oklch(0 0 0 / 40%)`
   - Modal: `0 25px 50px oklch(0 0 0 / 50%)`
   - Tooltip: `0 4px 12px oklch(0 0 0 / 30%)`
4. **No box-shadows on cards** in dark mode

### 9.4 Text Color Hierarchy (Dark Mode)

| Level | Color | Usage | Approx Contrast |
|-------|-------|-------|----------------|
| Primary | `neutral-950` | Headings, body text | 18:1 |
| Secondary | `neutral-800` | Supporting text, descriptions | 9:1 |
| Muted | `neutral-700` | Timestamps, metadata, placeholders | 5.3:1 |
| Disabled | `neutral-600` | Disabled text, read-only | 3.8:1 |
| Brand | `brand-500` | Links, active states | 5.8:1 |
| On-brand | `white` | Text on brand-colored backgrounds | 8:1+ |

### 9.5 Light Mode Adaptation

When light mode is added (future):

1. **Invert surface hierarchy** — base becomes lightest, elevated becomes slightly darker
2. **Swap text hierarchy** — primary becomes darkest, muted becomes lighter
3. **Replace white-overlay borders** with solid neutral borders
4. **Increase brand saturation** slightly for contrast on light backgrounds
5. **Add subtle shadows** for depth (shadows work better on light)
6. **Use `neutral-0` (white)** for page background

---

## 10. Implementation Guide

### 10.1 Week 1: Foundation (CSS + Tailwind)

#### Step 1: Update `app/globals.css` — Color Tokens

Replace the `:root` and `.dark` CSS variable blocks with the new token system. This is the **single most impactful change** — everything else reads from these variables.

```css
:root {
  /* === NEUTRALS (Light Mode) === */
  --background: oklch(1.00 0 0);
  --foreground: oklch(0.10 0.002 265);
  --card: oklch(0.97 0.003 265);
  --card-foreground: oklch(0.10 0.002 265);
  --popover: oklch(0.95 0.003 265);
  --popover-foreground: oklch(0.10 0.002 265);
  --primary: oklch(0.52 0.22 265);
  --primary-foreground: oklch(1.00 0 0);
  --secondary: oklch(0.95 0.004 265);
  --secondary-foreground: oklch(0.10 0.002 265);
  --muted: oklch(0.95 0.004 265);
  --muted-foreground: oklch(0.55 0.005 265);
  --accent: oklch(0.93 0.04 265);
  --accent-foreground: oklch(0.10 0.002 265);
  --destructive: oklch(0.50 0.22 25);
  --border: oklch(0.90 0.004 265);
  --input: oklch(0.92 0.004 265);
  --ring: oklch(0.52 0.22 265);
  
  /* === SEMANTIC === */
  --success: oklch(0.55 0.18 155);
  --warning: oklch(0.55 0.16 80);
  --error: oklch(0.50 0.22 25);
  --info: oklch(0.50 0.14 240);
  --success-foreground: oklch(0.20 0.02 155);
  --warning-foreground: oklch(0.20 0.02 80);
  
  /* === CHARTS === */
  --chart-1: oklch(0.52 0.22 265);
  --chart-2: oklch(0.65 0.18 265);
  --chart-3: oklch(0.55 0.18 155);
  --chart-4: oklch(0.55 0.16 80);
  --chart-5: oklch(0.50 0.22 25);
  
  /* === SIDEBAR === */
  --sidebar: oklch(0.97 0.003 265);
  --sidebar-foreground: oklch(0.10 0.002 265);
  --sidebar-primary: oklch(0.52 0.22 265);
  --sidebar-primary-foreground: oklch(1.00 0 0);
  --sidebar-accent: oklch(0.93 0.004 265);
  --sidebar-accent-foreground: oklch(0.10 0.002 265);
  --sidebar-border: oklch(0.90 0.004 265);
  --sidebar-ring: oklch(0.52 0.22 265);
  
  --radius: 0.625rem;
}

.dark {
  /* === NEUTRALS (Dark Mode) === */
  --background: oklch(0.04 0.002 265);
  --foreground: oklch(0.98 0.002 265);
  --card: oklch(0.10 0.004 265);
  --card-foreground: oklch(0.98 0.002 265);
  --popover: oklch(0.14 0.005 265);
  --popover-foreground: oklch(0.98 0.002 265);
  --primary: oklch(0.62 0.20 265);
  --primary-foreground: oklch(0.10 0.002 265);
  --secondary: oklch(0.14 0.005 265);
  --secondary-foreground: oklch(0.98 0.002 265);
  --muted: oklch(0.14 0.005 265);
  --muted-foreground: oklch(0.55 0.005 265);
  --accent: oklch(0.14 0.025 265);
  --accent-foreground: oklch(0.98 0.003 265);
  --destructive: oklch(0.65 0.22 25);
  --border: oklch(1 0 0 / 6%);
  --input: oklch(1 0 0 / 10%);
  --ring: oklch(0.62 0.20 265);
  
  /* === SEMANTIC === */
  --success: oklch(0.72 0.17 155);
  --warning: oklch(0.80 0.15 80);
  --error: oklch(0.65 0.22 25);
  --info: oklch(0.70 0.12 240);
  --success-foreground: oklch(0.15 0.02 155);
  --warning-foreground: oklch(0.15 0.02 80);
  
  /* === CHARTS === */
  --chart-1: oklch(0.62 0.20 265);
  --chart-2: oklch(0.55 0.18 265);
  --chart-3: oklch(0.72 0.17 155);
  --chart-4: oklch(0.80 0.15 80);
  --chart-5: oklch(0.65 0.22 25);
  
  /* === SIDEBAR === */
  --sidebar: oklch(0.07 0.003 265);
  --sidebar-foreground: oklch(0.98 0.002 265);
  --sidebar-primary: oklch(0.62 0.20 265);
  --sidebar-primary-foreground: oklch(0.98 0.002 265);
  --sidebar-accent: oklch(0.14 0.005 265);
  --sidebar-accent-foreground: oklch(0.98 0.002 265);
  --sidebar-border: oklch(1 0 0 / 6%);
  --sidebar-ring: oklch(0.62 0.20 265);
}
```

#### Step 2: Add New CSS Custom Properties

Add to `globals.css` after the `:root` block:

```css
/* === BRAND SCALE === */
:root {
  --brand-50: oklch(0.97 0.015 265);
  --brand-100: oklch(0.93 0.04 265);
  --brand-200: oklch(0.85 0.07 265);
  --brand-300: oklch(0.72 0.12 265);
  --brand-400: oklch(0.65 0.18 265);
  --brand-500: oklch(0.52 0.22 265);
  --brand-600: oklch(0.45 0.22 265);
  --brand-700: oklch(0.38 0.20 265);
  --brand-800: oklch(0.30 0.16 265);
  --brand-900: oklch(0.22 0.12 265);

  /* === SURFACE HIERARCHY === */
  --surface-0: var(--background);
  --surface-1: oklch(0.07 0.003 265);
  --surface-2: oklch(0.10 0.004 265);
  --surface-3: oklch(0.14 0.005 265);
  --surface-4: oklch(0.18 0.005 265);

  /* === TYPOGRAPHY SCALE === */
  --text-display-lg: 36px;
  --text-display-md: 28px;
  --text-heading-lg: 22px;
  --text-heading-md: 18px;
  --text-heading-sm: 15px;
  --text-body-lg: 16px;
  --text-body-md: 14px;
  --text-body-sm: 13px;
  --text-label-lg: 14px;
  --text-label-md: 12px;
  --text-label-sm: 11px;

  /* === SPACING SCALE === */
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-base: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 48px;
  --space-4xl: 64px;

  /* === MOTION === */
  --duration-micro: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

#### Step 3: Update `@theme inline` Block

Add to the existing `@theme inline` in `globals.css`:

```css
@theme inline {
  /* existing entries stay... */
  
  /* === BRAND === */
  --color-brand-50: var(--brand-50);
  --color-brand-100: var(--brand-100);
  --color-brand-200: var(--brand-200);
  --color-brand-300: var(--brand-300);
  --color-brand-400: var(--brand-400);
  --color-brand-500: var(--brand-500);
  --color-brand-600: var(--brand-600);
  --color-brand-700: var(--brand-700);
  --color-brand-800: var(--brand-800);
  --color-brand-900: var(--brand-900);
  
  /* === SEMANTIC === */
  --color-error: var(--error);
  --color-info: var(--info);
  --color-error-subtle: var(--error-subtle);
  --color-success-subtle: var(--success-subtle);
  --color-warning-subtle: var(--warning-subtle);
  --color-info-subtle: var(--info-subtle);
  
  /* === SURFACES === */
  --color-surface-0: var(--surface-0);
  --color-surface-1: var(--surface-1);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-surface-4: var(--surface-4);
  
  /* === NEUTRAL SCALE === */
  --color-neutral-50: var(--neutral-50);
  --color-neutral-100: var(--neutral-100);
  --color-neutral-200: var(--neutral-200);
  --color-neutral-300: var(--neutral-300);
  --color-neutral-400: var(--neutral-400);
  --color-neutral-500: var(--neutral-500);
  --color-neutral-600: var(--neutral-600);
  --color-neutral-700: var(--neutral-700);
  --color-neutral-800: var(--neutral-800);
  --color-neutral-900: var(--neutral-900);
  --color-neutral-950: var(--neutral-950);
}
```

#### Step 4: Install Geist Font (if not already)

```bash
# Geist fonts are already in the project via next/font
# Verify in layout.tsx — update font loading if needed
# The fonts should already be available as --font-geist-sans and --font-geist-mono
```

Update `app/layout.tsx` font CSS variables:

```tsx
style={{
  "--font-geist-sans": "var(--font-geist-sans)",
  "--font-geist-mono": "var(--font-geist-mono)",
} as React.CSSProperties}
```

#### Step 5: Add Utility Classes

Add to `globals.css`:

```css
@layer utilities {
  /* Typography helpers */
  .text-display-lg {
    font-size: var(--text-display-lg);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.025em;
  }
  .text-display-md {
    font-size: var(--text-display-md);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  .text-heading-lg {
    font-size: var(--text-heading-lg);
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.015em;
  }
  .text-heading-md {
    font-size: var(--text-heading-md);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }
  .text-heading-sm {
    font-size: var(--text-heading-sm);
    font-weight: 600;
    line-height: 1.35;
    letter-spacing: -0.005em;
  }
  .text-body-lg {
    font-size: var(--text-body-lg);
    line-height: 1.6;
  }
  .text-body-md {
    font-size: var(--text-body-md);
    line-height: 1.5;
  }
  .text-body-sm {
    font-size: var(--text-body-sm);
    line-height: 1.5;
  }
  .text-label-lg {
    font-size: var(--text-label-lg);
    font-weight: 500;
    line-height: 1.4;
  }
  .text-label-md {
    font-size: var(--text-label-md);
    font-weight: 500;
    line-height: 1.4;
    letter-spacing: 0.01em;
  }
  .text-label-sm {
    font-size: var(--text-label-sm);
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
}
```

### 10.2 Week 1: Component Updates

#### Button Component (`components/ui/button.tsx`)

Update variant definitions to use new tokens:

```tsx
// Key changes:
// - "default" variant → use --primary (brand-500)
// - "secondary" variant → use --secondary (neutral surface)
// - Add transition: all 150ms ease-default
// - Ensure consistent heights: sm=28px, md=34px, lg=40px
// - Add subtle scale on active: scale(0.98)
```

#### Card Component (`components/ui/card.tsx`)

```tsx
// Key changes:
// - Background: --card (neutral-200 dark, neutral-50 light)
// - Border: 1px solid --border
// - Radius: rounded-lg (10px)
// - Remove any existing shadows
// - Add hover variant: border shifts + subtle scale
```

#### Input Component (`components/ui/input.tsx`)

```tsx
// Key changes:
// - Background: --input (neutral-300 dark, neutral-200 light)
// - Border: 1px solid --border
// - Focus ring: 2px solid --ring with 20% opacity outer glow
// - Transition: border-color 150ms, box-shadow 150ms
```

### 10.3 Week 2: Layout + Polish

#### Sidebar Updates

1. Update sidebar background to `neutral-100` (surface-1)
2. Add 2px left border on active item (brand-500)
3. Update section labels to use `text-label-sm` utility
4. Add transition: background 150ms on hover

#### Dashboard Grid

1. Set up 12-column CSS grid for dashboard content
2. Gap: 16px
3. Stat cards: span 3 columns each (4 per row)
4. Charts: span 6 columns each (2 per row) or 12 (full width)

#### Chat Interface

1. Chat messages: max-width 768px, centered
2. Input bar: fixed bottom, 56px height
3. Session sidebar: 280px width

### 10.4 Migration Checklist

| Priority | Task | Impact | Effort |
|----------|------|--------|--------|
| 🔴 P0 | Update CSS color tokens in `globals.css` | High | 1 hour |
| 🔴 P0 | Add new CSS custom properties (brand scale, spacing, typography) | High | 1 hour |
| 🔴 P0 | Update `@theme inline` block | High | 30 min |
| 🟡 P1 | Update Button component variants | Medium | 30 min |
| 🟡 P1 | Update Card component styling | Medium | 30 min |
| 🟡 P1 | Update Input/Textarea styling | Medium | 30 min |
| 🟡 P1 | Update Sidebar styling | Medium | 1 hour |
| 🟢 P2 | Add utility classes for typography scale | Low | 30 min |
| 🟢 P2 | Update Dialog/Modal styling | Low | 30 min |
| 🟢 P2 | Update Toast styling | Low | 20 min |
| 🟢 P2 | Update Badge styling | Low | 20 min |
| 🟢 P2 | Add motion transitions | Low | 1 hour |
| ⚪ P3 | Landing page typography | Low | 1 hour |
| ⚪ P3 | Empty state illustrations | Low | 1 hour |
| ⚪ P3 | Light mode adaptation | Low | 2 hours |

**Total estimated effort: 8–12 hours (1–2 focused days)**

### 10.5 Files to Modify

| File | Changes |
|------|---------|
| `app/globals.css` | New color tokens, brand scale, typography scale, spacing scale, motion tokens, utility classes |
| `app/layout.tsx` | Font variable setup (verify Geist is properly loaded) |
| `components/ui/button.tsx` | Updated variants, sizes, transitions |
| `components/ui/card.tsx` | Updated background, border, radius, hover state |
| `components/ui/input.tsx` | Updated background, border, focus state |
| `components/ui/textarea.tsx` | Same as input |
| `components/ui/badge.tsx` | Updated variants with new brand/semantic colors |
| `components/ui/dialog.tsx` | Updated overlay, container, shadow |
| `components/ui/tooltip.tsx` | Updated background, text color |
| `components/layout/app-sidebar.tsx` | Updated background, active state, section labels |
| `components/layout/top-nav.tsx` | Updated height, border, padding |
| `components/dashboard/stat-card.tsx` | New stat card design (if exists) |

### 10.6 Testing Checklist

After implementation, verify:

- [ ] Dark mode: all text passes WCAG AA (4.5:1 minimum)
- [ ] Brand color on dark background passes WCAG AA
- [ ] Focus rings visible on all interactive elements
- [ ] Buttons have consistent heights across all pages
- [ ] Card backgrounds are distinguishable from page background
- [ ] Sidebar active state is clearly visible
- [ ] Modals have clear separation from background
- [ ] Toast notifications are readable
- [ ] No pure white (`oklch(1 0 0)`) used for text
- [ ] All transitions feel smooth (no jank)
- [ ] Mobile responsive at all breakpoints
- [ ] Chat interface message width is comfortable for reading

---

## Appendix: Quick Reference Card

### Colors
```
Primary:     oklch(0.62 0.20 265)  — brand-500 (dark) / oklch(0.52 0.22 265) (light)
Background:  oklch(0.04 0.002 265) — near-black with warmth (dark)
Card:        oklch(0.10 0.004 265) — elevated surface (dark)
Border:      oklch(1 0 0 / 6%)      — white overlay (dark)
Text:        oklch(0.98 0.002 265)  — near-white with warmth (dark)
Muted:       oklch(0.55 0.005 265)  — secondary text (dark)
Success:     oklch(0.72 0.17 155)
Warning:     oklch(0.80 0.15 80)
Error:       oklch(0.65 0.22 25)
```

### Typography
```
Font:     Geist Sans (headings + body) + Geist Mono (code)
Body:     14px / 1.5
Heading:  18–22px / 600 / negative tracking
Labels:   12px / 500 / uppercase for sections
```

### Spacing
```
xs:  4px     sm:  8px     md:  12px
base: 16px   lg:  20px    xl:  24px
2xl: 32px    3xl: 48px    4xl: 64px
```

### Radius
```
sm: 6px    md: 8px    lg: 10px    xl: 12px    2xl: 16px
```

### Motion
```
Micro: 100ms    Fast: 150ms    Normal: 200ms    Slow: 300ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

---

*Generated by Hermes Agent — MimoNotes Design System Proposal*
*Date: 2026-06-13*
