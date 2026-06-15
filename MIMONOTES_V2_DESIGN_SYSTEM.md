# MimoNotes V2 Design System

> **Version:** 2.0.0  
> **Status:** Authoritative Reference  
> **Last Updated:** June 13, 2026  
> **Purpose:** This document is the single source of truth for all MimoNotes V2 visual, interaction, and layout decisions. All other V2 documents defer to this spec.

---

## 1. Design Philosophy

### Brand Essence

**MimoNotes gives knowledge workers an AI-powered second brain that is precise in its answers, warm in its presence, and invisible in its complexity.**

### Design Principles

1. **Precision over decoration.** Every pixel earns its place. We communicate information density without visual noise. A user should never wonder where to look — hierarchy does the work, not ornamentation.

2. **Warmth without whimsy.** Our brand is inviting but professional. We use a warm-purple palette, generous whitespace, and human-friendly copy to create comfort — never cartoons, never cold minimalism.

3. **Intelligence that recedes.** The AI is the product's superpower, but the interface never shows off. Responses appear calm, confident, and unhurried. No spinning icons, no flashy "AI" badges. The magic is in the result, not the performance.

4. **Calm at every layer.** From the first landing page to the thousandth chat, the interface reduces cognitive load. Consistent spacing, predictable patterns, and restrained motion create a sense of control and peace.

5. **Premium through restraint.** Quality is communicated through meticulous craft: perfect alignment, tight typography, intentional negative space, and zero tolerance for visual debt. We compete with Linear and Vercel on polish, not features.

### What MimoNotes Is NOT

- **Not a toy.** No playful illustrations, no gradient text, no bouncing elements.
- **Not cluttered.** No busy sidebars, no multi-level nested menus, no chrome for chrome's sake.
- **Not generic.** No default shadcn look, no Tailwind boilerplate feel, no "startup template" aesthetics.
- **Not aggressive.** No shouting CTAs, no flashing notifications, no dark patterns.
- **Not experimental.** No untested interaction paradigms, no novel UI patterns users must learn. We use familiar patterns executed exceptionally.

### Emotional Journey

| Stage | Feeling | Design Response |
|-------|---------|-----------------|
| **Landing** | Curiosity + trust | Clean hero, social proof, warm-purple palette, fast load |
| **First use** | Delight + confidence | Guided onboarding, immediate value in first message, subtle onboarding hints |
| **Daily use** | Flow + calm | Keyboard shortcuts, minimal UI, fast responses, persistent context |
| **Power use** | Mastery + ownership | Customizable workspace, advanced features behind clean defaults |

---

## 2. Color System

### 2.1 Brand Scale (Warm Purple — Hue 265°)

All values in **oklch** format. Derived at hue 265° with perceptually uniform lightness steps.

| Step | oklch (Dark Mode) | oklch (Light Mode) | Hex Approx (Light) |
|------|-------------------|--------------------|--------------------|
| 50 | `oklch(0.95 0.03 265)` | `oklch(0.97 0.02 265)` | `#f5f0fa` |
| 100 | `oklch(0.90 0.05 265)` | `oklch(0.93 0.04 265)` | `#ece3f5` |
| 200 | `oklch(0.82 0.08 265)` | `oklch(0.86 0.07 265)` | `#dcc8ed` |
| 300 | `oklch(0.74 0.11 265)` | `oklch(0.78 0.10 265)` | `#c5a6e0` |
| 400 | `oklch(0.66 0.14 265)` | `oklch(0.68 0.14 265)` | `#a87cd4` |
| **500** | `oklch(0.58 0.17 265)` | `oklch(0.58 0.17 265)` | **`#8b5cc6`** |
| 600 | `oklch(0.50 0.16 265)` | `oklch(0.50 0.16 265)` | `#6f3fb5` |
| 700 | `oklch(0.43 0.14 265)` | `oklch(0.43 0.14 265)` | `#5a2e9e` |
| 800 | `oklch(0.36 0.12 265)` | `oklch(0.36 0.12 265)` | `#462087` |
| 900 | `oklch(0.28 0.10 265)` | `oklch(0.28 0.10 265)` | `#331570` |

### 2.2 Neutral Scale (Warm Undertone)

12-step neutral scale with subtle warm-purple undertone (chroma 0.003–0.005 at hue 265°). This prevents the "dead gray" of pure neutral scales.

| Step | oklch (Dark Mode) | oklch (Light Mode) |
|------|-------------------|--------------------|
| 0 | `oklch(0.00 0.003 265)` | `oklch(1.00 0.003 265)` |
| 50 | `oklch(0.05 0.003 265)` | `oklch(0.98 0.004 265)` |
| 100 | `oklch(0.10 0.004 265)` | `oklch(0.96 0.005 265)` |
| 150 | `oklch(0.14 0.004 265)` | `oklch(0.93 0.004 265)` |
| 200 | `oklch(0.18 0.004 265)` | `oklch(0.90 0.004 265)` |
| 300 | `oklch(0.26 0.005 265)` | `oklch(0.82 0.004 265)` |
| 400 | `oklch(0.38 0.005 265)` | `oklch(0.70 0.004 265)` |
| 500 | `oklch(0.48 0.004 265)` | `oklch(0.58 0.004 265)` |
| 600 | `oklch(0.58 0.004 265)` | `oklch(0.48 0.004 265)` |
| 700 | `oklch(0.70 0.004 265)` | `oklch(0.38 0.005 265)` |
| 800 | `oklch(0.82 0.004 265)` | `oklch(0.26 0.005 265)` |
| 900 | `oklch(0.93 0.004 265)` | `oklch(0.14 0.004 265)` |
| 950 | `oklch(0.97 0.003 265)` | `oklch(0.07 0.003 265)` |

### 2.3 Semantic Colors

| Role | Hue | Light Mode oklch | Dark Mode oklch | WCAG AA on surface |
|------|-----|-------------------|------------------|--------------------|
| **Success** | 155° | `oklch(0.62 0.17 155)` | `oklch(0.72 0.19 155)` | ✅ 4.8:1 |
| **Warning** | 80° | `oklch(0.70 0.16 80)` | `oklch(0.80 0.16 80)` | ✅ 4.5:1 |
| **Error** | 25° | `oklch(0.55 0.20 25)` | `oklch(0.65 0.22 25)` | ✅ 4.6:1 |
| **Info** | 240° | `oklch(0.55 0.15 240)` | `oklch(0.65 0.16 240)` | ✅ 4.5:1 |

### 2.4 Surface Hierarchy (Dark Mode)

| Level | Token | oklch | Use |
|-------|-------|-------|-----|
| Base | `surface-base` | `oklch(0.11 0.004 265)` | Page background |
| Raised | `surface-raised` | `oklch(0.14 0.004 265)` | Cards, sidebar |
| Overlay | `surface-overlay` | `oklch(0.17 0.005 265)` | Dropdowns, popovers |
| Elevated | `surface-elevated` | `oklch(0.20 0.005 265)` | Modal backgrounds |
| Floating | `surface-floating` | `oklch(0.23 0.005 265)` | Tooltips, toast |

### 2.5 Surface Hierarchy (Light Mode)

| Level | Token | oklch | Use |
|-------|-------|-------|-----|
| Base | `surface-base` | `oklch(0.99 0.004 265)` | Page background |
| Raised | `surface-raised` | `oklch(0.97 0.004 265)` | Cards, sidebar |
| Overlay | `surface-overlay` | `oklch(0.95 0.005 265)` | Dropdowns, popovers |
| Elevated | `surface-elevated` | `oklch(0.93 0.005 265)` | Modal backgrounds |
| Floating | `surface-floating` | `oklch(0.91 0.005 265)` | Tooltips, toast |

### 2.6 Border Treatment

| Level | Dark Mode | Light Mode | Use |
|-------|-----------|------------|-----|
| Subtle | `oklch(1.0 0.003 265 / 0.04)` | `oklch(0.0 0.003 265 / 0.06)` | Dividers, separators |
| Default | `oklch(1.0 0.003 265 / 0.08)` | `oklch(0.0 0.003 265 / 0.08)` | Card borders, inputs |
| Strong | `oklch(1.0 0.003 265 / 0.14)` | `oklch(0.0 0.003 265 / 0.14)` | Focus rings, active states |

---

## 3. Typography System

### 3.1 Font Stack

| Role | Font | Fallback | Weight Range |
|------|------|----------|--------------|
| Primary (sans) | Geist Sans | system-ui, -apple-system, sans-serif | 400, 500, 600, 700 |
| Mono | Geist Mono | ui-monospace, monospace | 400, 500 |

### 3.2 Type Scale

| Level | Token | Size | Weight | Line Height | Letter Spacing | Use |
|-------|-------|------|--------|-------------|----------------|-----|
| Display | `text-display` | 36px / 2.25rem | 700 | 1.2 | -0.02em | Marketing hero |
| H1 | `text-h1` | 30px / 1.875rem | 700 | 1.25 | -0.015em | Page title |
| H2 | `text-h2` | 24px / 1.5rem | 700 | 1.3 | -0.01em | Section title |
| H3 | `text-h3` | 20px / 1.25rem | 600 | 1.35 | -0.005em | Subsection title |
| H4 | `text-h4` | 18px / 1.125rem | 600 | 1.4 | 0 | Card title |
| H5 | `text-h5` | 16px / 1rem | 600 | 1.45 | 0 | Small heading |
| H6 | `text-h6` | 14px / 0.875rem | 600 | 1.5 | 0.01em | Label heading |
| Body Large | `text-lg` | 18px / 1.125rem | 400 | 1.6 | 0 | Lead paragraphs |
| Body | `text-base` | 16px / 1rem | 400 | 1.6 | 0 | Default body text |
| Body Small | `text-sm` | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary text |
| Caption | `text-xs` | 12px / 0.75rem | 400 | 1.5 | 0.01em | Captions, metadata |
| Overline | `text-overline` | 11px / 0.6875rem | 500 | 1.5 | 0.08em | Uppercase labels |

### 3.3 Heading Rules

```css
/* H1 - Page titles. One per page. */
h1, .text-h1 { font-size: 30px; font-weight: 700; line-height: 1.25; letter-spacing: -0.015em; }

/* H2 - Major sections. */
h2, .text-h2 { font-size: 24px; font-weight: 700; line-height: 1.3; letter-spacing: -0.01em; }

/* H3 - Subsections. */
h3, .text-h3 { font-size: 20px; font-weight: 600; line-height: 1.35; letter-spacing: -0.005em; }

/* H4 - Card titles, form group labels. */
h4, .text-h4 { font-size: 18px; font-weight: 600; line-height: 1.4; }

/* H5 - Inline headings. */
h5, .text-h5 { font-size: 16px; font-weight: 600; line-height: 1.45; }

/* H6 - Small labels with emphasis. */
h6, .text-h6 { font-size: 14px; font-weight: 600; line-height: 1.5; letter-spacing: 0.01em; }
```

### 3.4 Body Text

- **Base size:** 16px (1rem)
- **Line height:** 1.6 (25.6px)
- **Max line length:** 65–75 characters (≈ 680px at 16px)
- **Paragraph spacing:** 1em (16px)
- **Font weight:** 400 (regular) for body; 500 (medium) for emphasis

### 3.5 Label Text

- **Size:** 12px–14px
- **Weight:** 500 (medium)
- **Transform:** UPPERCASE for overlines and section labels
- **Tracking:** 0.08em (80) for uppercase labels
- **Color:** Neutral-400 (dark) or Neutral-500 (light)

### 3.6 Code Text

- **Font:** Geist Mono
- **Size:** 13px (0.8125rem)
- **Line height:** 1.6
- **Background:** `surface-raised` with 1px border (subtle)
- **Border-radius:** 4px (radius-sm)
- **Padding:** 2px 6px (inline) / 16px (block)
- **Color:** Brand-300 (dark) / Brand-700 (light)

---

## 4. Spacing System

### 4.1 Base Unit & Scale

**Base unit:** 4px

| Token | Value | Rem |
|-------|-------|-----|
| `space-0.5` | 2px | 0.125rem |
| `space-1` | 4px | 0.25rem |
| `space-1.5` | 6px | 0.375rem |
| `space-2` | 8px | 0.5rem |
| `space-3` | 12px | 0.75rem |
| `space-4` | 16px | 1rem |
| `space-5` | 20px | 1.25rem |
| `space-6` | 24px | 1.5rem |
| `space-8` | 32px | 2rem |
| `space-10` | 40px | 2.5rem |
| `space-12` | 48px | 3rem |
| `space-16` | 64px | 4rem |
| `space-20` | 80px | 5rem |
| `space-24` | 96px | 6rem |

### 4.2 Component Spacing Rules

| Component | Padding (x) | Padding (y) | Gap |
|-----------|-------------|-------------|-----|
| Button (sm) | 12px | 6px | 6px |
| Button (md) | 16px | 8px | 8px |
| Button (lg) | 24px | 12px | 8px |
| Input | 12px | 8px | — |
| Card | 16px | 16px | — |
| Badge | 8px | 2px | — |
| Modal | 24px | 24px | 16px |
| Dropdown item | 12px | 8px | 4px |
| Table cell | 12px | 12px | — |
| Chat message | 16px | 12px | — |
| Sidebar nav item | 12px | 8px | 2px |

### 4.3 Page Layout

| Property | Desktop | Tablet | Mobile |
|----------|---------|--------|--------|
| Page margin-x | 24px | 16px | 16px |
| Content max-width | 1200px | 100% | 100% |
| Chat max-width | 768px | 100% | 100% |
| Centered content | margin: 0 auto | margin: 0 auto | margin: 0 auto |

### 4.4 Section Spacing

| Context | Space |
|---------|-------|
| Between page sections | 64px (`space-16`) |
| Between major UI blocks | 32px (`space-8`) |
| Between cards in grid | 16px (`space-4`) |
| Between list items | 8px (`space-2`) |
| Between related form fields | 16px (`space-4`) |
| Between unrelated form groups | 24px (`space-6`) |

---

## 5. Border Radius System

| Token | Value | Use |
|-------|-------|-----|
| `radius-none` | 0px | Code blocks, tables |
| `radius-sm` | 4px | Badges, tags, inline code |
| `radius-md` | 6px | Buttons, inputs, selects |
| `radius-lg` | 8px | Cards, panels |
| `radius-xl` | 12px | Modals, dialogs |
| `radius-2xl` | 16px | Feature cards, hero sections |
| `radius-full` | 9999px | Avatars, pills, toggles |

---

## 6. Shadow System

All shadows expressed as CSS `box-shadow` values. Dark-mode shadows use colored tints for realism.

| Token | Light Mode | Dark Mode | Use |
|-------|-----------|-----------|-----|
| `shadow-xs` | `0 1px 2px oklch(0 0 0 / 0.05)` | `0 1px 2px oklch(0.05 0.003 265 / 0.3)` | Cards at rest |
| `shadow-sm` | `0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)` | `0 2px 4px oklch(0.05 0.003 265 / 0.4)` | Dropdowns, popovers |
| `shadow-md` | `0 4px 6px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.04)` | `0 4px 12px oklch(0.05 0.003 265 / 0.5)` | Modals, dialogs |
| `shadow-lg` | `0 10px 15px oklch(0 0 0 / 0.10), 0 4px 6px oklch(0 0 0 / 0.05)` | `0 8px 24px oklch(0.05 0.003 265 / 0.6)` | Floating panels |
| `shadow-glow` | `0 0 20px oklch(0.58 0.17 265 / 0.25)` | `0 0 20px oklch(0.58 0.17 265 / 0.35)` | Primary CTA focus |

---

## 7. Motion System

### 7.1 Duration

| Token | Value | Use |
|-------|-------|-----|
| `duration-instant` | 0ms | State toggles (opacity swap) |
| `duration-fast` | 100ms | Hover states, focus rings |
| `duration-normal` | 200ms | Buttons, inputs, transitions |
| `duration-slow` | 300ms | Page transitions, modals |
| `duration-slower` | 500ms | Complex animations, loading |

### 7.2 Easing

| Token | Value | Use |
|-------|-------|-----|
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for all transitions |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Transforms (scale, rotate) |
| `spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful micro-interactions (toggle, badge pop) |

### 7.3 Micro-Interactions

| Element | Trigger | Animation |
|---------|---------|-----------|
| Button | Press | Scale to 0.98, duration-fast, ease-out |
| Button | Release | Scale to 1.0, duration-fast, spring |
| Input | Focus | Border-color to brand-500, ring-2 brand-500/25%, duration-fast |
| Input | Blur | Border-color to default border, duration-fast |
| Card | Hover | Shadow-xs → shadow-sm, translate-y -1px, duration-normal, ease-out |
| Toggle | Switch | Thumb slides, 150ms, spring easing |
| Modal | Open | Fade in + scale 0.95→1, 200ms, ease-out |
| Modal | Close | Fade out + scale 1→0.98, 150ms, ease-out |
| Toast | Enter | Slide up from bottom + fade, 300ms, ease-out |
| Toast | Exit | Slide up + fade out, 200ms, ease-in-out |

### 7.4 Page Transitions

| Transition | Duration | Easing |
|------------|----------|--------|
| Route fade | 200ms | ease-out |
| Slide-up (new content) | 300ms | ease-out |
| Crossfade (tab switch) | 200ms | ease-out |

### 7.5 Loading States

| Pattern | Animation | Duration |
|---------|-----------|----------|
| Shimmer | Gradient sweep left→right | 1.5s infinite |
| Pulse | Opacity 0.4↔1.0 | 2s infinite |
| Skeleton | Gray blocks with shimmer | Until content loads |

### 7.6 Reduced Motion

**All animations MUST respect `prefers-reduced-motion: reduce`.**

When reduced motion is preferred:
- All transitions → instant (0ms)
- All animations → disabled
- Skeleton/pulse → static gray blocks
- Page transitions → instant swap

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Icon System

### 8.1 Library

**Lucide React** — consistent 24px grid, stroke-based, 1.5px stroke width.

### 8.2 Sizes

| Token | Size | Stroke Width | Use |
|-------|------|-------------|-----|
| `icon-xs` | 12px | 2px | Inline badges, counters |
| `icon-sm` | 14px | 1.75px | Compact UI, table rows |
| `icon-md` | 16px | 1.5px | Default for buttons with text |
| `icon-lg` | 20px | 1.5px | Standalone buttons, nav items |
| `icon-xl` | 24px | 1.5px | Feature icons, empty states |

### 8.3 Usage Rules

1. **Always pair icon + label** in buttons, nav items, and menu items. Never use an icon alone unless it is an universally understood action:
   - ✅ Search (magnifying glass, no label needed)
   - ✅ Settings (gear, no label needed)
   - ✅ Close (X, no label needed)
   - ❌ Never icon-only for "New Chat", "Export", or less common actions

2. **Color:** Inherit parent text color by default. Use `brand-500` for active/selected states.

3. **Alignment:** Icons vertically centered with text baseline. Use `flex items-center gap-2` pattern.

4. **Decorative icons** in headers/empty states: use `icon-xl` (24px) with `brand-500` color and 24px margin-bottom.

---

## 9. Layout System

### 9.1 Grid

- **Columns:** 12
- **Gutter:** 16px (`space-4`)
- **Margin:** 24px desktop / 16px mobile

```css
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
```

### 9.2 Breakpoints

| Token | Min Width | Columns |
|-------|-----------|---------|
| `sm` | 640px | 4 |
| `md` | 768px | 8 |
| `lg` | 1024px | 12 |
| `xl` | 1280px | 12 |
| `2xl` | 1536px | 12 (max-width container) |

### 9.3 Key Layout Zones

| Zone | Width | Position | Notes |
|------|-------|----------|-------|
| Sidebar (expanded) | 240px | Fixed left | Collapsible |
| Sidebar (collapsed) | 64px | Fixed left | Icons only |
| Main content | 100% (max 1200px) | Flow | Centered in viewport |
| Chat panel | 100% (max 768px) | Centered | Messages, input |
| Right panel (if any) | 320px | Fixed right | Context, details |

### 9.4 Responsive Behavior

| Breakpoint | Sidebar | Content | Chat |
|------------|---------|---------|------|
| < 640px (mobile) | Hidden (drawer) | Full width, 16px pad | Full width, 16px pad |
| 640–1023px (tablet) | Collapsed (64px) | Full width, 16px pad | Full width, 16px pad |
| ≥ 1024px (desktop) | Expanded (240px) | Max 1200px, centered | Max 768px, centered |

---

## 10. Dark Mode Rules

### 10.1 Surface Hierarchy

Dark mode uses a 5-level surface system. Each level is progressively lighter to simulate depth:

```
Base (darkest) → Raised → Overlay → Elevated → Floating (lightest)
```

Background tint is always warm-purple (hue 265°) to prevent "pure black" coldness.

### 10.2 Text Colors

| Level | oklch | Opacity on surface | Use |
|-------|-------|--------------------|-----|
| Primary | `oklch(0.93 0.003 265)` | 100% | Headings, body, primary content |
| Secondary | `oklch(0.70 0.004 265)` | 100% | Secondary text, descriptions |
| Tertiary | `oklch(0.50 0.004 265)` | 100% | Placeholders, timestamps |
| Disabled | `oklch(0.35 0.003 265)` | 100% | Disabled states |

### 10.3 Borders

- Use **white overlay** at low opacity: `oklch(1.0 0.003 265 / 0.08)` for default borders
- Subtle borders: 4% opacity
- Strong borders: 14% opacity

### 10.4 Shadows

Dark-mode shadows use **colored shadows** (brand-tinted dark) instead of pure black:

```
shadow-xs: 0 1px 2px oklch(0.05 0.003 265 / 0.3)
shadow-sm: 0 2px 4px oklch(0.05 0.003 265 / 0.4)
shadow-md: 0 4px 12px oklch(0.05 0.003 265 / 0.5)
shadow-lg: 0 8px 24px oklch(0.05 0.003 265 / 0.6)
```

### 10.5 Focus Rings

```css
:focus-visible {
  outline: 2px solid oklch(0.58 0.17 265);
  outline-offset: 2px;
}
```

---

## 11. Light Mode Adaptation

### 11.1 Surfaces

Light mode uses **warm whites** with a subtle brand tint to avoid sterile coldness:

| Level | oklch |
|-------|-------|
| Base | `oklch(0.99 0.004 265)` — near-white with warmth |
| Raised | `oklch(0.97 0.004 265)` |
| Overlay | `oklch(0.95 0.005 265)` |
| Elevated | `oklch(0.93 0.005 265)` |
| Floating | `oklch(0.91 0.005 265)` |

### 11.2 Text Colors

| Level | oklch | Use |
|-------|-------|-----|
| Primary | `oklch(0.14 0.004 265)` | Headings, body text |
| Secondary | `oklch(0.35 0.004 265)` | Secondary text |
| Tertiary | `oklch(0.50 0.004 265)` | Placeholders, timestamps |
| Disabled | `oklch(0.70 0.003 265)` | Disabled states |

### 11.3 Borders

- Use **black overlay** at low opacity: `oklch(0.0 0.003 265 / 0.08)` for default borders
- Subtle borders: 6% opacity
- Strong borders: 14% opacity

### 11.4 Shadows

Light mode uses traditional gray shadows:

```
shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05)
shadow-sm: 0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04)
shadow-md: 0 4px 6px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.04)
shadow-lg: 0 10px 15px oklch(0 0 0 / 0.10), 0 4px 6px oklch(0 0 0 / 0.05)
```

### 11.5 Focus Rings

```css
:focus-visible {
  outline: 2px solid oklch(0.58 0.17 265);
  outline-offset: 2px;
}
```

---

## 12. CSS Custom Properties

All CSS custom properties use the naming convention: `--mn-{category}-{step}`

### 12.1 Complete Variable Set (Dark Mode Defaults)

Add the following to `globals.css`:

```css
/* ============================================================
   MimoNotes V2 Design System — CSS Custom Properties
   ============================================================ */

:root {
  /* ---- Brand Colors ---- */
  --mn-brand-50: oklch(0.97 0.02 265);
  --mn-brand-100: oklch(0.93 0.04 265);
  --mn-brand-200: oklch(0.86 0.07 265);
  --mn-brand-300: oklch(0.78 0.10 265);
  --mn-brand-400: oklch(0.68 0.14 265);
  --mn-brand-500: oklch(0.58 0.17 265);
  --mn-brand-600: oklch(0.50 0.16 265);
  --mn-brand-700: oklch(0.43 0.14 265);
  --mn-brand-800: oklch(0.36 0.12 265);
  --mn-brand-900: oklch(0.28 0.10 265);

  /* ---- Neutral Colors ---- */
  --mn-neutral-0: oklch(1.00 0.003 265);
  --mn-neutral-50: oklch(0.98 0.004 265);
  --mn-neutral-100: oklch(0.96 0.005 265);
  --mn-neutral-150: oklch(0.93 0.004 265);
  --mn-neutral-200: oklch(0.90 0.004 265);
  --mn-neutral-300: oklch(0.82 0.004 265);
  --mn-neutral-400: oklch(0.70 0.004 265);
  --mn-neutral-500: oklch(0.58 0.004 265);
  --mn-neutral-600: oklch(0.48 0.004 265);
  --mn-neutral-700: oklch(0.38 0.005 265);
  --mn-neutral-800: oklch(0.26 0.005 265);
  --mn-neutral-900: oklch(0.14 0.004 265);
  --mn-neutral-950: oklch(0.07 0.003 265);

  /* ---- Semantic Colors ---- */
  --mn-success: oklch(0.62 0.17 155);
  --mn-warning: oklch(0.70 0.16 80);
  --mn-error: oklch(0.55 0.20 25);
  --mn-info: oklch(0.55 0.15 240);

  /* ---- Surfaces ---- */
  --mn-surface-base: oklch(0.99 0.004 265);
  --mn-surface-raised: oklch(0.97 0.004 265);
  --mn-surface-overlay: oklch(0.95 0.005 265);
  --mn-surface-elevated: oklch(0.93 0.005 265);
  --mn-surface-floating: oklch(0.91 0.005 265);

  /* ---- Borders ---- */
  --mn-border-subtle: oklch(0.0 0.003 265 / 0.06);
  --mn-border-default: oklch(0.0 0.003 265 / 0.08);
  --mn-border-strong: oklch(0.0 0.003 265 / 0.14);

  /* ---- Text ---- */
  --mn-text-primary: oklch(0.14 0.004 265);
  --mn-text-secondary: oklch(0.35 0.004 265);
  --mn-text-tertiary: oklch(0.50 0.004 265);
  --mn-text-disabled: oklch(0.70 0.003 265);

  /* ---- Shadows ---- */
  --mn-shadow-xs: 0 1px 2px oklch(0 0 0 / 0.05);
  --mn-shadow-sm: 0 1px 3px oklch(0 0 0 / 0.08), 0 1px 2px oklch(0 0 0 / 0.04);
  --mn-shadow-md: 0 4px 6px oklch(0 0 0 / 0.08), 0 2px 4px oklch(0 0 0 / 0.04);
  --mn-shadow-lg: 0 10px 15px oklch(0 0 0 / 0.10), 0 4px 6px oklch(0 0 0 / 0.05);
  --mn-shadow-glow: 0 0 20px oklch(0.58 0.17 265 / 0.25);

  /* ---- Border Radius ---- */
  --mn-radius-none: 0px;
  --mn-radius-sm: 4px;
  --mn-radius-md: 6px;
  --mn-radius-lg: 8px;
  --mn-radius-xl: 12px;
  --mn-radius-2xl: 16px;
  --mn-radius-full: 9999px;

  /* ---- Spacing ---- */
  --mn-space-0.5: 2px;
  --mn-space-1: 4px;
  --mn-space-1.5: 6px;
  --mn-space-2: 8px;
  --mn-space-3: 12px;
  --mn-space-4: 16px;
  --mn-space-5: 20px;
  --mn-space-6: 24px;
  --mn-space-8: 32px;
  --mn-space-10: 40px;
  --mn-space-12: 48px;
  --mn-space-16: 64px;
  --mn-space-20: 80px;
  --mn-space-24: 96px;

  /* ---- Typography ---- */
  --mn-font-sans: 'Geist Sans', system-ui, -apple-system, sans-serif;
  --mn-font-mono: 'Geist Mono', ui-monospace, monospace;

  --mn-text-display: 36px;
  --mn-text-h1: 30px;
  --mn-text-h2: 24px;
  --mn-text-h3: 20px;
  --mn-text-h4: 18px;
  --mn-text-h5: 16px;
  --mn-text-h6: 14px;
  --mn-text-lg: 18px;
  --mn-text-base: 16px;
  --mn-text-sm: 14px;
  --mn-text-xs: 12px;
  --mn-text-overline: 11px;

  /* ---- Motion ---- */
  --mn-duration-instant: 0ms;
  --mn-duration-fast: 100ms;
  --mn-duration-normal: 200ms;
  --mn-duration-slow: 300ms;
  --mn-duration-slower: 500ms;
  --mn-ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --mn-ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --mn-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ---- Layout ---- */
  --mn-sidebar-width: 240px;
  --mn-sidebar-collapsed: 64px;
  --mn-content-max: 1200px;
  --mn-chat-max: 768px;
  --mn-page-padding: 24px;
  --mn-gutter: 16px;
}

/* ============================================================
   Dark Mode Override
   ============================================================ */

.dark, [data-theme="dark"] {
  --mn-brand-50: oklch(0.95 0.03 265);
  --mn-brand-100: oklch(0.90 0.05 265);
  --mn-brand-200: oklch(0.82 0.08 265);
  --mn-brand-300: oklch(0.74 0.11 265);
  --mn-brand-400: oklch(0.66 0.14 265);
  --mn-brand-500: oklch(0.58 0.17 265);
  --mn-brand-600: oklch(0.50 0.16 265);
  --mn-brand-700: oklch(0.43 0.14 265);
  --mn-brand-800: oklch(0.36 0.12 265);
  --mn-brand-900: oklch(0.28 0.10 265);

  --mn-neutral-0: oklch(0.00 0.003 265);
  --mn-neutral-50: oklch(0.05 0.003 265);
  --mn-neutral-100: oklch(0.10 0.004 265);
  --mn-neutral-150: oklch(0.14 0.004 265);
  --mn-neutral-200: oklch(0.18 0.004 265);
  --mn-neutral-300: oklch(0.26 0.005 265);
  --mn-neutral-400: oklch(0.38 0.005 265);
  --mn-neutral-500: oklch(0.48 0.004 265);
  --mn-neutral-600: oklch(0.58 0.004 265);
  --mn-neutral-700: oklch(0.70 0.004 265);
  --mn-neutral-800: oklch(0.82 0.004 265);
  --mn-neutral-900: oklch(0.93 0.004 265);
  --mn-neutral-950: oklch(0.97 0.003 265);

  --mn-success: oklch(0.72 0.19 155);
  --mn-warning: oklch(0.80 0.16 80);
  --mn-error: oklch(0.65 0.22 25);
  --mn-info: oklch(0.65 0.16 240);

  --mn-surface-base: oklch(0.11 0.004 265);
  --mn-surface-raised: oklch(0.14 0.004 265);
  --mn-surface-overlay: oklch(0.17 0.005 265);
  --mn-surface-elevated: oklch(0.20 0.005 265);
  --mn-surface-floating: oklch(0.23 0.005 265);

  --mn-border-subtle: oklch(1.0 0.003 265 / 0.04);
  --mn-border-default: oklch(1.0 0.003 265 / 0.08);
  --mn-border-strong: oklch(1.0 0.003 265 / 0.14);

  --mn-text-primary: oklch(0.93 0.003 265);
  --mn-text-secondary: oklch(0.70 0.004 265);
  --mn-text-tertiary: oklch(0.50 0.004 265);
  --mn-text-disabled: oklch(0.35 0.003 265);

  --mn-shadow-xs: 0 1px 2px oklch(0.05 0.003 265 / 0.3);
  --mn-shadow-sm: 0 2px 4px oklch(0.05 0.003 265 / 0.4);
  --mn-shadow-md: 0 4px 12px oklch(0.05 0.003 265 / 0.5);
  --mn-shadow-lg: 0 8px 24px oklch(0.05 0.003 265 / 0.6);
  --mn-shadow-glow: 0 0 20px oklch(0.58 0.17 265 / 0.35);
}

/* ============================================================
   Reduced Motion
   ============================================================ */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 12.2 Tailwind Integration

Map these variables in `tailwind.config.ts`:

```ts
// Extend theme with design system tokens
theme: {
  extend: {
    colors: {
      brand: {
        50: 'var(--mn-brand-50)',
        100: 'var(--mn-brand-100)',
        200: 'var(--mn-brand-200)',
        300: 'var(--mn-brand-300)',
        400: 'var(--mn-brand-400)',
        500: 'var(--mn-brand-500)',
        600: 'var(--mn-brand-600)',
        700: 'var(--mn-brand-700)',
        800: 'var(--mn-brand-800)',
        900: 'var(--mn-brand-900)',
      },
      neutral: {
        0: 'var(--mn-neutral-0)',
        50: 'var(--mn-neutral-50)',
        100: 'var(--mn-neutral-100)',
        150: 'var(--mn-neutral-150)',
        200: 'var(--mn-neutral-200)',
        300: 'var(--mn-neutral-300)',
        400: 'var(--mn-neutral-400)',
        500: 'var(--mn-neutral-500)',
        600: 'var(--mn-neutral-600)',
        700: 'var(--mn-neutral-700)',
        800: 'var(--mn-neutral-800)',
        900: 'var(--mn-neutral-900)',
        950: 'var(--mn-neutral-950)',
      },
      surface: {
        base: 'var(--mn-surface-base)',
        raised: 'var(--mn-surface-raised)',
        overlay: 'var(--mn-surface-overlay)',
        elevated: 'var(--mn-surface-elevated)',
        floating: 'var(--mn-surface-floating)',
      },
    },
    borderRadius: {
      'mn-none': 'var(--mn-radius-none)',
      'mn-sm': 'var(--mn-radius-sm)',
      'mn-md': 'var(--mn-radius-md)',
      'mn-lg': 'var(--mn-radius-lg)',
      'mn-xl': 'var(--mn-radius-xl)',
      'mn-2xl': 'var(--mn-radius-2xl)',
      'mn-full': 'var(--mn-radius-full)',
    },
    boxShadow: {
      'mn-xs': 'var(--mn-shadow-xs)',
      'mn-sm': 'var(--mn-shadow-sm)',
      'mn-md': 'var(--mn-shadow-md)',
      'mn-lg': 'var(--mn-shadow-lg)',
      'mn-glow': 'var(--mn-shadow-glow)',
    },
    spacing: {
      'mn-0.5': 'var(--mn-space-0.5)',
      'mn-1': 'var(--mn-space-1)',
      'mn-1.5': 'var(--mn-space-1.5)',
      'mn-2': 'var(--mn-space-2)',
      'mn-3': 'var(--mn-space-3)',
      'mn-4': 'var(--mn-space-4)',
      'mn-5': 'var(--mn-space-5)',
      'mn-6': 'var(--mn-space-6)',
      'mn-8': 'var(--mn-space-8)',
      'mn-10': 'var(--mn-space-10)',
      'mn-12': 'var(--mn-space-12)',
      'mn-16': 'var(--mn-space-16)',
      'mn-20': 'var(--mn-space-20)',
      'mn-24': 'var(--mn-space-24)',
    },
    fontFamily: {
      sans: ['var(--mn-font-sans)'],
      mono: ['var(--mn-font-mono)'],
    },
    transitionDuration: {
      'mn-instant': 'var(--mn-duration-instant)',
      'mn-fast': 'var(--mn-duration-fast)',
      'mn-normal': 'var(--mn-duration-normal)',
      'mn-slow': 'var(--mn-duration-slow)',
      'mn-slower': 'var(--mn-duration-slower)',
    },
    transitionTimingFunction: {
      'mn-out': 'var(--mn-ease-out)',
      'mn-in-out': 'var(--mn-ease-in-out)',
      'mn-spring': 'var(--mn-ease-spring)',
    },
  },
},
```

---

## Appendix A: Quick Reference Card

| Category | Tokens | Values |
|----------|--------|--------|
| Brand | 10 | 50–900 |
| Neutral | 13 | 0–950 |
| Semantic | 4 | success, warning, error, info |
| Surfaces | 5 | base, raised, overlay, elevated, floating |
| Borders | 3 | subtle, default, strong |
| Text | 4 | primary, secondary, tertiary, disabled |
| Radius | 7 | none, sm, md, lg, xl, 2xl, full |
| Shadows | 5 | xs, sm, md, lg, glow |
| Spacing | 14 | 0.5–24 |
| Type scale | 12 | display, h1–h6, lg, base, sm, xs, overline |
| Durations | 5 | instant, fast, normal, slow, slower |
| Easing | 3 | out, in-out, spring |
| Icon sizes | 5 | xs, sm, md, lg, xl |

---

## Appendix B: File Locations

| File | Purpose |
|------|---------|
| `globals.css` | CSS custom properties (Section 12.1) |
| `tailwind.config.ts` | Tailwind token mapping (Section 12.2) |
| `components/ui/` | All shadcn component overrides using design tokens |
| `lib/design-system.ts` | Exported tokens for programmatic use |

---

*This document is the authoritative reference for MimoNotes V2. All component specs, page layouts, and interaction patterns in subsequent V2 documents must reference and comply with this design system.*
