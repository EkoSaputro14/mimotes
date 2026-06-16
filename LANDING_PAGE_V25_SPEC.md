# LANDING_PAGE_V25_SPEC.md — MimoNotes Landing Page V2.5

> **Date:** June 14, 2026
> **Status:** Design Spec — Ready for Implementation
> **Direction:** Product-first. The product IS the landing page.
> **References:** claude.ai, chatgpt.com, perplexity.ai, chatbotapp.ai

---

## Design Philosophy

### From V2 to V2.5

V2 was a generic SaaS landing page with 10 sections, placeholder metrics, and marketing copy that *explained* the product instead of *showing* it.

V2.5 follows a different principle:

> **If the product is good, the product should speak for itself.**

Look at claude.ai, chatgpt.com, and perplexity.ai. They don't have 10-section marketing pages. They have:
1. A clean header
2. A headline
3. The product
4. A way to start

That's it. The product experience IS the marketing.

### Core Rules

1. **Show, don't tell.** The product mockup should do 80% of the selling.
2. **5-second rule.** A visitor should understand what MimoNotes does within 5 seconds of landing.
3. **Minimal text.** If you need more than 10 words to explain it, the design has failed.
4. **One scroll.** The entire page should be consumable in a single scroll on desktop.
5. **3 CTAs max.** Every CTA is "Start Free" or "Log In" — no other actions.

---

## Page Structure

```
┌──────────────────────────────────────────────────────────┐
│  NAV: [Logo]              [Log In]  [Start Free →]       │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                    HERO SECTION                          │
│                                                          │
│            Your knowledge base,                          │
│            instantly accessible.                         │
│                                                          │
│       Upload documents. Get precise answers.             │
│                                                          │
│              [ Start Free → ]                            │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│               PRODUCT SHOWCASE                           │
│                                                          │
│     ┌──────────────────────────────────────────┐        │
│     │                                          │        │
│     │     Large, full-width product mockup     │        │
│     │     showing chat interface with          │        │
│     │     source citations visible             │        │
│     │                                          │        │
│     │     Document sidebar + chat area +       │        │
│     │     answer with highlighted sources      │        │
│     │                                          │        │
│     └──────────────────────────────────────────┘        │
│                                                          │
│          Subtle shadow + slight perspective              │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   FOOTER                                 │
│                                                          │
│  [Logo]   Product · Security · API · Status              │
│                                                          │
│  © 2026 MimoNotes                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Total sections: 3** (Hero + Product Showcase + Footer)
**Total scroll depth: ~1.5 viewport heights on desktop**

---

## Section 1: Navigation

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Logo]                         [Log In]  [Start Free →] │
└──────────────────────────────────────────────────────────┘
```

### Spec

```
Position:     Sticky top, z-index: 50
Height:       64px
Background:   bg-background/80, backdrop-blur-xl
Border:       border-b border-border

Logo:
  Left-aligned
  Bot icon (size-8, rounded-lg, bg-primary, text-primary-foreground)
  "MimoNotes" (text-lg, font-semibold, tracking-tight)

Right side:
  "Log In" link (text-sm, text-muted-foreground, hover:text-foreground)
  "Start Free →" button (bg-primary, text-primary-foreground, rounded-lg, px-4, py-2, text-sm)
  ArrowRight icon (size-3.5)
```

### Mobile
- Same layout, no hamburger menu (only 2 items, they fit)

---

## Section 2: Hero

### Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│            Your knowledge base,                          │
│            instantly accessible.                         │
│                                                          │
│       Upload documents. Get precise answers.             │
│                                                          │
│              [ Start Free → ]                            │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Copy

```
Headline:     "Your knowledge base,"
              "instantly accessible."
              (text-4xl sm:text-5xl lg:text-6xl, font-bold, tracking-tight)
              Line break after "base,"
              Second line: text-primary

Subheadline:  "Upload documents. Get precise answers."
              (text-lg sm:text-xl, text-muted-foreground, max-w-lg, mx-auto)

CTA:          "Start Free →"
              (bg-primary, text-primary-foreground, rounded-xl, px-8, py-3.5, text-base, font-semibold)
              ArrowRight icon

Background:   bg-background (no gradient, no decoration)
              Optional: very subtle radial glow at top (primary/5)
```

### Design Notes

- **No trust line** below CTA (removed from V2 — it was filler)
- **No secondary CTA** (removed "View Demo" — unnecessary)
- **No product screenshot in hero** (the showcase below IS the screenshot)
- **Centered, minimal, clean** — like claude.ai's hero

---

## Section 3: Product Showcase

### Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│     ┌──────────────────────────────────────────────┐    │
│     │                                              │    │
│     │          PRODUCT MOCKUP (full-width)         │    │
│     │                                              │    │
│     │  ┌──────────┬───────────────────────────┐    │    │
│     │  │ Sidebar  │  Chat Area                │    │    │
│     │  │          │                           │    │    │
│     │  │ Docs     │  User: "What's our       │    │    │
│     │  │ ──────── │  vacation policy?"        │    │    │
│     │  │ Handbk   │                           │    │    │
│     │  │ Q4 Rpt   │  AI: Full-time employees  │    │    │
│     │  │ API Docs │  are entitled to 20 days  │    │    │
│     │  │ Onboard  │  of paid vacation...      │    │    │
│     │  │          │                           │    │    │
│     │  │          │  📎 Source: Employee      │    │    │
│     │  │          │     Handbook, Section 4.2 │    │    │
│     │  │          │                           │    │    │
│     │  └──────────┴───────────────────────────┘    │    │
│     │                                              │    │
│     └──────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Spec

```
Container:    max-w-5xl, mx-auto, px-4
Frame:        rounded-2xl, border border-border, overflow-hidden
Shadow:       shadow-2xl shadow-primary/5
Background:   bg-card

Top bar:
  3 dots (size-3, rounded-full, bg-muted)
  "MimoNotes" label (text-xs, text-muted-foreground)
  border-b border-border, py-3, px-4

Layout:       flex (sidebar + main area)

Sidebar (hidden on mobile, visible sm+):
  width: w-56 (224px)
  border-r border-border
  padding: p-4
  "Documents" label (text-xs, font-medium, text-muted-foreground)
  Document list: FileText icon + name, text-xs, text-muted-foreground
  Items: Employee Handbook, Q4 Report, API Docs, Onboarding Guide

Main area (chat):
  flex-1, p-6

  User message:
    max-w-md, rounded-xl, bg-muted/50, px-4, py-2.5, text-sm
    "What's our vacation policy?"

  AI response:
    max-w-lg, rounded-xl, bg-primary/10, px-4, py-3, text-sm, leading-relaxed
    "Full-time employees are entitled to 20 days of paid
     vacation per year. Vacation must be requested at least
     2 weeks in advance through the HR portal."
    
    Source citation (below response):
      flex items-center gap-1.5, text-xs, text-muted-foreground
      FileText icon (size-3)
      "Source: Employee Handbook, Section 4.2"
```

### Responsive Behavior

| Breakpoint | Sidebar | Mockup Size |
|------------|---------|-------------|
| Mobile (< 640px) | Hidden | Full-width, min-h-[250px] |
| Tablet (640-1024px) | Visible | Full-width, min-h-[350px] |
| Desktop (> 1024px) | Visible | max-w-5xl, min-h-[400px] |

### Design Notes

- **This is the hero of the page.** The mockup should take up 40-50% of viewport height.
- **No animations** — static, clean, professional.
- **No placeholder text** — the conversation shown is a realistic use case.
- **Source citation is the key differentiator** — it's what separates MimoNotes from generic chatbots.
- **No additional feature cards** — the product speaks for itself.

---

## Section 4: Footer

### Layout

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Logo]                                                  │
│                                                          │
│  Product · Security · API · Status                       │
│                                                          │
│  © 2026 MimoNotes                                       │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Spec

```
Background:   bg-background
Border:       border-t border-border
Padding:      py-12

Content:      max-w-6xl, mx-auto, px-4, text-center

Logo:         Bot icon + "MimoNotes" (inline, centered)
              mb-4

Links:        Single row, centered
              "Product · Security · API · Status"
              text-sm, text-muted-foreground
              Separator: middot (·) between items
              Each link: hover:text-foreground

Copyright:    "© 2026 MimoNotes"
              text-xs, text-muted-foreground, mt-4
```

### Design Notes

- **Minimal footer** — just enough for legal/compliance
- **No column layout** — single row of links
- **No social media icons** — not needed for launch
- **No newsletter signup** — not needed yet

---

## Color & Token Reference

| Element | Token |
|---------|-------|
| Page background | `bg-background` |
| Nav background | `bg-background/80` + `backdrop-blur-xl` |
| Nav border | `border-border` |
| Headline | `text-foreground` |
| Headline accent | `text-primary` |
| Subheadline | `text-muted-foreground` |
| CTA button | `bg-primary`, `text-primary-foreground` |
| CTA hover | `hover:bg-primary/80` |
| Mockup frame | `bg-card`, `border-border`, `shadow-2xl shadow-primary/5` |
| Mockup sidebar | `border-border` |
| User message | `bg-muted/50` |
| AI response | `bg-primary/10` |
| Source citation | `text-muted-foreground` |
| Footer links | `text-muted-foreground`, `hover:text-foreground` |

---

## Mobile Specifications

```
Mobile (< 640px):
  - Nav: Logo + Start Free (no Log In link — too crowded)
  - Hero: text-4xl, py-20
  - Product mockup: full-width, no sidebar, min-h-[250px]
  - Footer: stacked, centered
  - Total scroll: ~2 viewports

Tablet (640-1024px):
  - Nav: Logo + Log In + Start Free
  - Hero: text-5xl, py-24
  - Product mockup: full-width, sidebar visible, min-h-[350px]
  - Footer: single row
  - Total scroll: ~1.5 viewports

Desktop (> 1024px):
  - Nav: Logo + links + CTA
  - Hero: text-6xl, py-32
  - Product mockup: max-w-5xl, min-h-[400px]
  - Footer: single row
  - Total scroll: ~1.5 viewports
```

---

## What Was Removed (vs V2)

| V2 Section | Status | Reason |
|------------|--------|--------|
| Social Proof Bar | Removed | Placeholder metrics — not credible |
| Core Features (4 cards) | Removed | Product showcase replaces explanation |
| How It Works (3 steps) | Removed | Self-evident from product |
| Security Section | Removed | Move to footer link or separate page |
| Team Collaboration | Removed | Feature, not a selling point for landing |
| FAQ (6 items) | Removed | Answer questions in-product, not on landing |
| Final CTA (duplicate) | Removed | First CTA is enough |

---

## What Changed (vs V2)

| Element | V2 | V2.5 |
|---------|-----|------|
| Total sections | 10 | 3 (Hero + Showcase + Footer) |
| Total CTAs | 6+ | 1 (Start Free, repeated in nav + hero) |
| Page length | ~4 viewports | ~1.5 viewports |
| Text volume | ~500 words | ~30 words |
| Product visibility | Small mockup in hero | Full-width showcase, 40% of viewport |
| Features explained | 4 feature cards | Zero — shown in product |
| Metrics shown | 4 placeholder stats | Zero |
| FAQ items | 6 | Zero |

---

## Implementation Checklist

When implementing V2.5:

- [ ] Remove all V2 sections except Nav, Hero, Product Showcase, Footer
- [ ] Make product mockup full-width, max-w-5xl
- [ ] Remove all text except headline, subheadline, CTA
- [ ] Remove all icons except Lucide (Bot, ArrowRight, FileText)
- [ ] Keep all V2 design tokens
- [ ] Test: 5-second test — can a visitor understand what MimoNotes does?
- [ ] Test: single scroll — is the entire page consumable in one scroll?
- [ ] Test: mobile — does it look premium on 375px?

---

*Spec generated: 2026-06-14*
*Hermes Agent — Sprint B V2.5 design spec*
