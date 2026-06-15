# MimoNotes Landing Page V2 — Complete Redesign Spec

**Author:** Principal Product Designer
**Date:** 2026-06-13
**Status:** Ready for Implementation
**Priority:** P0 — Highest-leverage surface. Every user forms their first impression here.

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Landing Page Philosophy](#2-landing-page-philosophy)
3. [Design System Reference](#3-design-system-reference)
4. [Section 1: Navigation (Top Bar)](#4-section-1-navigation-top-bar)
5. [Section 2: Hero (Above the Fold)](#5-section-2-hero-above-the-fold)
6. [Section 3: Social Proof Bar](#6-section-3-social-proof-bar)
7. [Section 4: Product Showcase](#7-section-4-product-showcase)
8. [Section 5: Features](#8-section-5-features)
9. [Section 6: How It Works](#9-section-6-how-it-works)
10. [Section 7: Testimonials](#10-section-7-testimonials)
11. [Section 8: Pricing](#11-section-8-pricing)
12. [Section 9: FAQ](#12-section-9-faq)
13. [Section 10: Final CTA](#13-section-10-final-cta)
14. [Section 11: Footer](#14-section-11-footer)
15. [Mobile Specifications](#15-mobile-specifications)
16. [Animation System](#16-animation-system)
17. [SEO & Meta](#17-seo--meta)
18. [Wireframes](#18-wireframes)
19. [Implementation Checklist](#19-implementation-checklist)

---

## 1. Current State Audit

### What's Broken (V1)

| Problem | Severity | Impact |
|---------|----------|--------|
| Emoji icons (🤖📚🔍⚡) | Critical | Screams 'weekend hackathon' — destroys credibility |
| Generic blue gradient | High | Looks like a 2020 Tailwind template |
| Title: 'Mimotes AI Chatbot' | Critical | A description, not a value proposition. Tells nothing about WHY. |
| No social proof | High | Zero trust signals — no logos, no user count, no ratings |
| No product screenshots | Critical | Users can't see what they're buying |
| No pricing on landing | High | Forces navigation — drops conversion |
| No testimonials | High | No social validation |
| Footer: one line | Medium | Feels incomplete, unprofessional |
| Generic CTAs | Medium | 'Sign Up' says nothing about what happens next |
| No interactive demo | High | Users can't experience value before committing |
| No 'How It Works' | Medium | Users must guess the workflow |
| No FAQ | Medium | Unanswered objections = lost conversions |

### Competitor Benchmark

| Competitor | Hero Approach | Key Strength |
|-----------|---------------|-------------|
| **Linear** | Dark, minimal, product screenshot | Product-led, shows the UI |
| **Notion** | Clean, warm, connected workspace tagline | Clear value prop |
| **Stripe** | Animated gradients, developer-friendly | Technical credibility |
| **Perplexity** | 'Where knowledge begins' | Aspirational, intriguing |
| **Claude** | Warm terracotta, editorial | Trustworthy, human |
| **Superhuman** | Premium dark, purple glow | Speed as brand identity |

### Design Direction for V2

**Position:** Between Perplexity (aspirational) and Linear (product-led). Premium dark theme with warm purple accents. Show the product. Earn trust through specificity.

---

## 2. Landing Page Philosophy

### Core Principles

1. **Product-led:** Show the product, not marketing copy. Every section should make the product tangible.
2. **One message per section:** Each section communicates exactly one idea. If it needs sub-headers, it's too complex.
3. **Minimal text, maximum impact:** Headlines ≤ 8 words. Subheads ≤ 15 words. Body copy ≤ 30 words.
4. **Mobile-first:** Design for 375px, then expand. Mobile gets 70%+ of traffic.
5. **Earn attention:** Don't demand it. The product should be interesting enough that people scroll.
6. **Specificity over superlatives:** '500+ teams' beats 'thousands of users'. 'Source citations' beats 'smart answers'.

### Voice & Tone

- **Confident, not arrogant.** 'Your knowledge, instantly accessible' not 'The world's best AI'.
- **Clear, not clever.** 'Upload documents, get answers' not 'Unlock the potential of your institutional knowledge'.
- **Specific, not generic.** 'Answers with source citations' not 'Powered by advanced AI'.
- **Warm, not corporate.** 'Built for teams who care about knowledge' not 'Enterprise-grade solutions'.

---

## 3. Design System Reference

### Colors (Dark Theme)

```
--background:        oklch(0.13 0.01 265)     /* Near-black with purple undertone */
--foreground:        oklch(0.95 0.01 265)     /* Off-white */
--card:              oklch(0.16 0.01 265)     /* Slightly lighter than bg */
--card-foreground:   oklch(0.95 0.01 265)
--primary:           oklch(0.65 0.20 265)     /* Warm purple — brand */
--primary-foreground: oklch(0.98 0.01 265)
--secondary:         oklch(0.20 0.01 265)     /* Subtle purple-gray */
--secondary-foreground: oklch(0.90 0.01 265)
--muted:             oklch(0.18 0.01 265)
--muted-foreground:  oklch(0.60 0.01 265)
--accent:            oklch(0.65 0.20 265)     /* Same as primary */
--destructive:       oklch(0.55 0.22 25)
--border:            oklch(0.22 0.01 265)     /* Subtle border */
--ring:              oklch(0.65 0.20 265)     /* Focus ring = primary */
```

### Typography

```
Font:          Geist Sans (headings + body)
Mono:          Geist Mono (code, pricing numbers)
Hero:          4.5rem / 1.05 / -0.03em tracking
H2:            3rem / 1.1 / -0.02em tracking
H3:            1.5rem / 1.3 / -0.01em tracking
Body:          1.125rem / 1.6 / 0
Small:         0.875rem / 1.5 / 0
Caption:       0.75rem / 1.5 / 0.05em uppercase
```

### Spacing System

```
Section padding:    6rem vertical (4rem mobile)
Content max-width:  1200px (centered)
Card padding:       2rem (1.5rem mobile)
Grid gap:           1.5rem
```

### Components

- **Buttons:** `shadcn/ui Button` — primary, secondary, ghost, outline
- **Cards:** `shadcn/ui Card` — with subtle border, hover glow
- **Badges:** Custom pill badges for pricing tiers
- **Icons:** Lucide React (NOT emoji, EVER)

---

## 4. Section 1: Navigation (Top Bar)

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Logo]   Product  Pricing  Docs  Blog         [Sign Up Free →]    │
│                                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### Behavior

- **Position:** Fixed top, z-index: 50
- **Background:** `oklch(0.13 0.01 265 / 0.8)` — translucent dark, backdrop-blur(16px)
- **Border:** `border-bottom: 1px solid oklch(0.22 0.01 265 / 0.5)`
- **Scroll:** Background becomes fully opaque after 50px scroll
- **Mobile:** Hamburger menu (lucide: Menu), opens slide-down panel

### Copy

```
Logo:        MimoNotes (Geist Sans, 1.25rem, font-weight: 600, primary color)
Links:       Product | Pricing | Docs | Blog
CTA:         "Sign Up Free" — Button (primary, sm size, arrow icon right)
```

### Mobile Menu

When hamburger is tapped:
```
┌──────────────────┐
│  ✕ Close         │
│                  │
│  Product         │
│  Pricing         │
│  Docs            │
│  Blog            │
│                  │
│  [Sign Up Free]  │
│  [Log In]        │
│                  │
└──────────────────┘
```

### Component Reference

```tsx
// components/layout/LandingNav.tsx
// Uses: shadcn Button, MobileNav pattern
// Links: Next.js Link component
// Sticky: CSS position: sticky + backdrop-blur
```

---

## 5. Section 2: Hero (Above the Fold)

### Desktop Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          [Gradient background:                       │
│                           radial-gradient from primary               │
│                           at 50% 0%, fading to background]          │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │                                                         │      │
│    │         Your knowledge base,                            │      │
│    │         instantly accessible.                           │      │
│    │                                                         │      │
│    │    Upload your documents and get precise, sourced       │      │
│    │    answers in seconds — not hours of searching.         │      │
│    │                                                         │      │
│    │         [  Start Free — No Credit Card  →  ]            │      │
│    │                                                         │      │
│    │         [  ▶ Watch Demo  ]                              │      │
│    │                                                         │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │                                                         │      │
│    │              [ PRODUCT SCREENSHOT ]                     │      │
│    │         Chat interface showing a question               │      │
│    │         and answer with source citations                │      │
│    │         and document references                        │      │
│    │                                                         │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    Subtle reflection/shadow below the screenshot                     │
│    Slight perspective transform for depth                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Headline:       "Your knowledge base, instantly accessible."
                (Geist Sans, 4.5rem, font-weight: 700, tracking: -0.03em)
                Line break: after "base,"

Subheadline:    "Upload your documents and get precise, sourced answers
                 in seconds — not hours of searching."
                (Geist Sans, 1.25rem, muted-foreground, max-width: 600px)

Primary CTA:    "Start Free — No Credit Card" → Button (primary, lg, arrow-right icon)
Secondary CTA:  "▶ Watch Demo" — Button (ghost, lg, play-circle icon)

Trust line:     "Free for up to 50 documents • No credit card required • Set up in 2 minutes"
                (caption size, muted-foreground, below CTAs)
```

### Background Treatment

```
- Base: var(--background)
- Top-center radial gradient: oklch(0.65 0.20 265 / 0.08) spreading outward
- Optional: subtle grid pattern overlay at 3% opacity
- NO animated gradient (save for pricing section)
- NO generic blue — warm purple only
```

### Product Screenshot Specifications

```
- Dimensions: 1200×700px (scaled to container)
- Frame: Rounded corners (12px), 1px border (var(--border))
- Shadow: 0 25px 50px oklch(0.13 0.01 265 / 0.5)
- Show: Chat interface with a sample question and answer
- Include: Source citations visible in the answer
- Include: Document sidebar with uploaded files
- Include: Subtle glow effect around the screenshot frame
- Format: WebP preferred, PNG fallback
- Path: /public/images/hero-screenshot.webp
```

---

## 6. Section 3: Social Proof Bar

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│    Trusted by teams who take knowledge seriously                      │
│                                                                      │
│    [Company Logo] [Company Logo] [Company Logo] [Company Logo]       │
│    [Company Logo] [Company Logo] [Company Logo] [Company Logo]       │
│                                                                      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│    │  500+    │  │  4.8/5   │  │  99.9%   │  │  10k+    │          │
│    │  Teams   │  │  Product │  │  Uptime  │  │  Questions│          │
│    │          │  │  Hunt    │  │          │  │  Answered │          │
│    └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Label:      "Trusted by teams who take knowledge seriously"
            (muted-foreground, caption size, uppercase, letter-spacing: 0.1em)

Logos:      Grayscale, 40% opacity, hover to 70% opacity
            If no real logos yet: use placeholder company silhouettes
            or replace with category labels: "Legal Teams", "Engineering", "Support"

Stats:
  "500+" — "Teams" (font-weight: 700, foreground)
  "4.8/5" — "Product Hunt" (font-weight: 700, foreground)
  "99.9%" — "Uptime" (font-weight: 700, foreground)
  "10k+" — "Questions Answered" (font-weight: 700, foreground)
```

### Behavior

- Stats animate counting up when scrolled into view
- Company logos: CSS filter grayscale(1) opacity(0.4), hover: grayscale(0) opacity(0.7)
- Subtle horizontal scroll on mobile (overflow-x: auto, hide scrollbar)

### Component Reference

```tsx
// components/landing/SocialProofBar.tsx
// Uses: Custom stat cards, logo cloud
// Animation: framer-motion number counter
// Stats from: /api/stats (or hardcoded for launch)
```

---

## 7. Section 4: Product Showcase

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    See MimoNotes in action                           │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │                                                         │      │
│    │              [ LARGE PRODUCT SCREENSHOT ]               │      │
│    │                                                         │      │
│    │    Caption: Upload any document — PDF, Word, or URL     │      │
│    │    — and MimoNotes instantly understands it.             │      │
│    │                                                         │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌──────────────────────┐  ┌──────────────────────┐               │
│    │                      │  │                      │               │
│    │  [ SCREENSHOT 2 ]   │  │  [ SCREENSHOT 3 ]   │               │
│    │                      │  │                      │               │
│    │  Ask questions in    │  │  Get answers with    │               │
│    │  natural language    │  │  source citations    │               │
│    └──────────────────────┘  └──────────────────────┘               │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │                                                         │      │
│    │  BEFORE: "Where is that policy about vacation days?"    │      │
│    │          *30 minutes searching through folders*         │      │
│    │                                                         │      │
│    │  AFTER:  "What's our vacation policy?" →                │      │
│    │          Answer + Source: Employee Handbook, p.12       │      │
│    │          Time: 3 seconds                                │      │
│    │                                                         │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "See MimoNotes in action"
                    (H2, centered)

Screenshot 1 caption: "Upload any document — PDF, Word, or URL —
                       and MimoNotes instantly understands it."

Screenshot 2 caption: "Ask questions in natural language"

Screenshot 3 caption: "Get answers with source citations"

Before/After:
  Before: "Where is that policy about vacation days?"
          "30 minutes searching through folders"
  After:  "What's our vacation policy?"
          "Answer + Source: Employee Handbook, p.12"
          "Time: 3 seconds"
```

### Screenshot Specifications

```
Screenshot 1 (large):
  - Shows: Upload interface with drag-and-drop zone
  - Size: Full width, 500px tall
  - Frame: Same as hero screenshot

Screenshot 2 (half-width):
  - Shows: Chat interface with typing indicator
  - Size: 50% width, 350px tall

Screenshot 3 (half-width):
  - Shows: Answer with highlighted source citation
  - Size: 50% width, 350px tall

All screenshots:
  - Border-radius: 12px
  - Border: 1px solid var(--border)
  - Shadow: 0 15px 30px oklch(0.13 0.01 265 / 0.3)
  - Format: WebP, /public/images/
```

---

## 8. Section 5: Features

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    Everything you need,                              │
│                    nothing you don't.                                │
│                                                                      │
│    ┌──────────────┐  ┌──────────────┐                               │
│    │              │  │              │                               │
│    │   [Upload]   │  │  [Sources]   │                               │
│    │              │  │              │                               │
│    │  Upload &    │  │  Source      │                               │
│    │  Chat        │  │  Attribution │                               │
│    │              │  │              │                               │
│    │  Drop any    │  │  Every       │                               │
│    │  document.   │  │  answer cites│                               │
│    │  We handle   │  │  its exact   │                               │
│    │  the rest.   │  │  source.     │                               │
│    │              │  │              │                               │
│    └──────────────┘  └──────────────┘                               │
│                                                                      │
│    ┌──────────────┐  ┌──────────────┐                               │
│    │              │  │              │                               │
│    │  [Teams]     │  │ [Analytics]  │                               │
│    │              │  │              │                               │
│    │  Team        │  │  Usage       │                               │
│    │  Workspace   │  │  Analytics   │                               │
│    │              │  │              │                               │
│    │  Shared      │  │  Know what   │                               │
│    │  knowledge   │  │  questions   │                               │
│    │  base for    │  │  get asked.  │                               │
│    │  your whole  │  │  Track cost. │                               │
│    │  team.       │  │  Improve.    │                               │
│    │              │  │              │                               │
│    └──────────────┘  └──────────────┘                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "Everything you need, nothing you don't."
                    (H2, centered)

Feature 1 — Upload & Chat:
  Icon:       lucide-upload (24px, primary color)
  Headline:   "Upload & Chat"
  Description: "Drop any document. We handle the rest."
  Detail:     "PDF, DOCX, TXT, CSV, URLs — MimoNotes parses, chunks,
               and indexes everything automatically."

Feature 2 — Source Attribution:
  Icon:       lucide-file-check (24px, primary color)
  Headline:   "Source Attribution"
  Description: "Every answer cites its exact source."
  Detail:     "No hallucinations. Every response links back to the
               specific document and paragraph it came from."

Feature 3 — Team Workspace:
  Icon:       lucide-users (24px, primary color)
  Headline:   "Team Workspace"
  Description: "Shared knowledge base for your whole team."
  Detail:     "Invite teammates, share documents, and ensure everyone
               gets the same accurate answers."

Feature 4 — Usage Analytics:
  Icon:       lucide-bar-chart-3 (24px, primary color)
  Headline:   "Usage Analytics"
  Description: "Know what questions get asked. Track cost. Improve."
  Detail:     "See which documents are most referenced. Track AI costs.
               Identify knowledge gaps in your documentation."
```

### Card Styling

```
Card:
  background: var(--card)
  border: 1px solid var(--border)
  border-radius: 16px
  padding: 2rem
  transition: border-color 0.2s, box-shadow 0.2s

Card:hover:
  border-color: oklch(0.65 0.20 265 / 0.3)
  box-shadow: 0 0 40px oklch(0.65 0.20 265 / 0.05)

Icon:
  width: 48px, height: 48px
  background: oklch(0.65 0.20 265 / 0.1)
  border-radius: 12px
  padding: 12px
  color: primary

Headline:
  font-size: 1.25rem, font-weight: 600

Description:
  font-size: 1rem, muted-foreground
```

---

## 9. Section 6: How It Works

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    How it works                                      │
│                    Three steps. That's it.                           │
│                                                                      │
│         1                    2                    3                  │
│        ┌─┐───────────────────┬───────────────────┬─┐               │
│        │○│                   │                   │○│               │
│        └─┘                   │                   └─┘               │
│                              │                                      │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐                │
│    │          │      │          │      │          │                │
│    │ [Upload] │      │ [Ask]    │      │ [Answer] │                │
│    │          │      │          │      │          │                │
│    │ Upload   │      │ Ask      │      │ Get      │                │
│    │ your     │      │ questions│      │ precise  │                │
│    │ documents│      │ in       │      │ answers  │                │
│    │          │      │ natural  │      │ with     │                │
│    │          │      │ language │      │ sources  │                │
│    │          │      │          │      │          │                │
│    └──────────┘      └──────────┘      └──────────┘                │
│                                                                      │
│         [CTA: "Start Free →"]                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "How it works"
Section subhead:    "Three steps. That's it."

Step 1:
  Number:     "1"
  Icon:       lucide-upload-cloud (32px, primary)
  Headline:   "Upload your documents"
  Description: "Drag and drop PDFs, Word docs, text files, or paste a URL.
                MimoNotes indexes everything in seconds."

Step 2:
  Number:     "2"
  Icon:       lucide-message-square (32px, primary)
  Headline:   "Ask questions in natural language"
  Description: "Type whatever you want to know. No special syntax,
                no search operators. Just ask like you'd ask a colleague."

Step 3:
  Number:     "3"
  Icon:       lucide-quote (32px, primary)
  Headline:   "Get answers with source citations"
  Description: "Receive precise answers that cite their exact source —
                the document, the page, the paragraph."

CTA:   "Start Free →"
```

### Visual Treatment

```
Horizontal line connecting the 3 steps:
  - Color: var(--border)
  - Height: 2px
  - Dashed or dotted style

Step circles:
  - Size: 48px
  - Background: var(--primary)
  - Color: var(--primary-foreground)
  - Font-weight: 700, font-size: 1.25rem
  - Box-shadow: 0 0 20px oklch(0.65 0.20 265 / 0.3)

On mobile: Steps stack vertically with a vertical connecting line
```

---

## 10. Section 7: Testimonials

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    What our users say                                │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │                                                         │      │
│    │  "MimoNotes cut our support response time by 60%.      │      │
│    │   Our team used to spend 20 minutes finding answers     │      │
│    │   in our docs. Now it takes 30 seconds."                │      │
│    │                                                         │      │
│    │  ┌─────┐                                                │      │
│    │  │ AVT │  Sarah Chen                                    │      │
│    │  └─────┘  Head of Support, Acme Corp                   │      │
│    │                                                         │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌───────────────────────────┐  ┌───────────────────────────┐     │
│    │                           │  │                           │     │
│    │  "Finally, an AI that     │  │  "We onboard new hires    │     │
│    │   tells you WHERE it      │  │   in half the time.       │     │
│    │   got its answer. No      │  │   They just ask           │     │
│    │   more guessing."         │  │   MimoNotes."             │     │
│    │                           │  │                           │     │
│    │  Marcus Rivera            │  │  Priya Sharma             │     │
│    │  CTO, DevStack            │  │  VP People, ScaleUp       │     │
│    └───────────────────────────┘  └───────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "What our users say"

Testimonial 1:
  Quote:      "MimoNotes cut our support response time by 60%. Our team
               used to spend 20 minutes finding answers in our docs.
               Now it takes 30 seconds."
  Name:       "Sarah Chen"
  Title:      "Head of Support"
  Company:    "Acme Corp"
  Use case:   Customer support knowledge base

Testimonial 2:
  Quote:      "Finally, an AI that tells you WHERE it got its answer.
               No more guessing."
  Name:       "Marcus Rivera"
  Title:      "CTO"
  Company:    "DevStack"
  Use case:   Engineering documentation

Testimonial 3:
  Quote:      "We onboard new hires in half the time. They just ask
               MimoNotes."
  Name:       "Priya Sharma"
  Title:      "VP People"
  Company:    "ScaleUp"
  Use case:   HR onboarding
```

### Card Styling

```
Testimonial card:
  background: var(--card)
  border: 1px solid var(--border)
  border-radius: 16px
  padding: 2rem
  position: relative

Quote mark:
  Position: absolute top-left
  Color: oklch(0.65 0.20 265 / 0.15)
  Font-size: 4rem
  Font-family: Georgia, serif
  Line-height: 1

Avatar:
  Size: 40px × 40px
  Border-radius: 50%
  Background: oklch(0.65 0.20 265 / 0.2)
  Display: initials if no photo

Name:   font-weight: 600
Title:  muted-foreground, small size
```

### Testimonial Sources

> **IMPORTANT:** Replace these with real testimonials before launch.
> If unavailable at launch, use realistic but clearly marked placeholder quotes.
> Gather real testimonials during beta via in-app feedback prompt.

---

## 11. Section 8: Pricing

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    Simple pricing                                    │
│                    Start free. Scale when ready.                     │
│                                                                      │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│    │              │  │              │  │              │            │
│    │    FREE      │  │  ★ PRO ★     │  │  ENTERPRISE  │            │
│    │              │  │              │  │              │            │
│    │    $0        │  │    $19       │  │    Custom    │            │
│    │  /month      │  │  /month      │  │              │            │
│    │              │  │  billed yearly│  │              │            │
│    │              │  │              │  │              │            │
│    │  • 50 docs   │  │  • Unlimited │  │  • Everything│            │
│    │  • 100 msgs  │  │    documents │  │    in Pro    │            │
│    │  • 1 workspace│ │  • Unlimited │  │  • SSO/SAML  │            │
│    │  • Basic     │  │    messages  │  │  • Custom    │            │
│    │    analytics │  │  • 5 workspaces│ │    training  │            │
│    │              │  │  • Full      │  │  • Dedicated │            │
│    │              │  │    analytics │  │    support   │            │
│    │              │  │  • Priority  │  │  • SLA       │            │
│    │              │  │    support   │  │  • On-prem   │            │
│    │              │  │              │  │    option    │            │
│    │              │  │              │  │              │            │
│    │ [Start Free] │  │ [Start Pro]  │  │[Contact Sales│            │
│    │              │  │              │  │              │            │
│    └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                      │
│    All plans include: 256-bit encryption • SOC 2 compliant          │
│                       • GDPR ready • 99.9% uptime SLA               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "Simple pricing"
Section subhead:    "Start free. Scale when ready."

--- FREE TIER ---
  Name:       "Free"
  Price:      "$0"
  Period:     "/month"
  CTA:        "Start Free" — Button (outline, full-width)
  Features:
    "50 documents"
    "100 messages/month"
    "1 workspace"
    "Basic analytics"
    "Community support"

--- PRO TIER (Featured) ---
  Name:       "Pro"
  Price:      "$19"
  Period:     "/month · billed yearly"
  Badge:      "Most Popular" — Pill badge (primary)
  CTA:        "Start Pro" — Button (primary, full-width)
  Features:
    "Everything in Free"
    "Unlimited documents"
    "Unlimited messages"
    "5 workspaces"
    "Full analytics dashboard"
    "Priority email support"
    "Custom AI prompts"
    "API access"

--- ENTERPRISE TIER ---
  Name:       "Enterprise"
  Price:      "Custom"
  Period:     ""
  CTA:        "Contact Sales" — Button (outline, full-width)
  Features:
    "Everything in Pro"
    "Unlimited workspaces"
    "SSO / SAML authentication"
    "Custom AI model training"
    "Dedicated account manager"
    "99.99% uptime SLA"
    "On-premise deployment option"
    "Custom integrations"

--- Trust Line ---
  "All plans include: 256-bit encryption · SOC 2 compliant · GDPR ready · 99.9% uptime"
```

### Card Styling

```
Free card:
  background: var(--card)
  border: 1px solid var(--border)

Pro card (featured):
  background: var(--card)
  border: 2px solid var(--primary)
  box-shadow: 0 0 40px oklch(0.65 0.20 265 / 0.1)
  Transform: scale(1.02)
  Position: relative (Badge positioned top-center)

Enterprise card:
  background: var(--card)
  border: 1px solid var(--border)

Price:
  font-size: 3.5rem
  font-weight: 700
  font-family: Geist Mono

Period:
  font-size: 0.875rem
  muted-foreground

Feature list:
  ✓ icon (lucide-check, primary, 16px)
  font-size: 0.9375rem
  Line-height: 2
```

### Pricing Toggle (Optional)

```
Monthly | Yearly (save 20%)

Toggle:
  background: var(--secondary)
  Active: var(--primary)
  Radius: pill
  Width: 200px
```

---

## 12. Section 9: FAQ

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                    Frequently asked questions                        │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  What documents can I upload?                        │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  Is my data secure?                                  │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  Can I use my own AI model?                          │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  How does source attribution work?                   │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  Do you offer a free trial for Pro?                  │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────┐      │
│    │  ▸  What integrations do you support?                   │      │
│    └─────────────────────────────────────────────────────────┘      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Section headline:   "Frequently asked questions"

FAQ 1:
  Question: "What documents can I upload?"
  Answer:   "MimoNotes supports PDF, DOCX, TXT, CSV, XLSX files, and
             web URLs. We're adding support for images and audio
             transcription soon."

FAQ 2:
  Question: "Is my data secure?"
  Answer:   "Absolutely. All data is encrypted at rest (AES-256) and in
             transit (TLS 1.3). We're SOC 2 compliant and GDPR ready.
             Your documents are never used to train AI models."

FAQ 3:
  Question: "Can I use my own AI model?"
  Answer:   "Yes. Pro and Enterprise plans support custom AI providers
             including OpenAI, Ollama, LM Studio, and any
             OpenAI-compatible API. You control which model powers your
             knowledge base."

FAQ 4:
  Question: "How does source attribution work?"
  Answer:   "Every answer links back to the exact document, page, and
             paragraph it was sourced from. You can verify any claim
             instantly — no hallucinations, no guessing."

FAQ 5:
  Question: "Do you offer a free trial for Pro?"
  Answer:   "The Free plan is yours forever — no credit card required.
             When you're ready for more, upgrade to Pro for $19/month.
             Enterprise customers get a personalized demo."

FAQ 6:
  Question: "What integrations do you support?"
  Answer:   "MimoNotes integrates with Slack, Notion, Google Drive,
             and offers a REST API for custom integrations. We're
             building a widget for embedding in any website."
```

### Accordion Behavior

```
Default state:
  - Icon: lucide-chevron-right (16px, muted-foreground)
  - Border-bottom: 1px solid var(--border)
  - Padding: 1.5rem 0
  - Cursor: pointer

Expanded state:
  - Icon rotates 90° → lucide-chevron-down
  - Answer slides down (framer-motion AnimatePresence)
  - Max-height transition: 0.3s ease
  - Answer padding-top: 0.5rem
  - Answer color: muted-foreground

Only one item expanded at a time (accordion pattern)
```

---

## 13. Section 10: Final CTA

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                                                                      │
│                                                                      │
│        Stop searching. Start knowing.                                │
│                                                                      │
│        Join 500+ teams using MimoNotes to turn                        │
│        their documents into instant knowledge.                       │
│                                                                      │
│             [  Start Free — No Credit Card  →  ]                     │
│                                                                      │
│             [  Talk to Sales  ]                                       │
│                                                                      │
│                                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Headline:       "Stop searching. Start knowing."
                (H2, 3rem, font-weight: 700, centered)

Subheadline:    "Join 500+ teams using MimoNotes to turn their documents
                 into instant knowledge."
                (1.125rem, muted-foreground, centered, max-width: 500px)

Primary CTA:    "Start Free — No Credit Card" → Button (primary, lg)
Secondary CTA:  "Talk to Sales" → Button (outline, lg)

Background:     Radial gradient (similar to hero, but inverted)
                oklch(0.65 0.20 265 / 0.06) at center
```

---

## 14. Section 11: Footer

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  [Logo]                                                              │
│  Your knowledge base,                                                │
│  instantly accessible.                                               │
│                                                                      │
│  Product          Company          Legal           Connect           │
│  ─────────        ─────────        ─────           ───────           │
│  Features         About            Privacy Policy   Twitter          │
│  Pricing          Blog             Terms of Service GitHub           │
│  Docs             Careers          Security         LinkedIn         │
│  Status           Contact                             email@           │
│                                                                      │
│  ────────────────────────────────────────────────────────────────── │
│  © 2026 MimoNotes. All rights reserved.                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Copy

```
Tagline:    "Your knowledge base, instantly accessible."

Column 1 — Product:
  Features    → /features
  Pricing     → /pricing
  Docs        → /docs
  Status      → /status (link to status page, e.g. status.mimonotes.com)

Column 2 — Company:
  About       → /about
  Blog        → /blog
  Careers     → /careers
  Contact     → /contact

Column 3 — Legal:
  Privacy Policy      → /privacy
  Terms of Service    → /terms
  Security            → /security

Column 4 — Connect:
  Twitter     → https://twitter.com/mimonotes
  GitHub      → https://github.com/mimonotes
  LinkedIn    → https://linkedin.com/company/mimonotes
  Email       → hello@mimonotes.com

Copyright:  "© 2026 MimoNotes. All rights reserved."
```

### Footer Styling

```
Background: var(--background)
Border-top: 1px solid var(--border)
Padding: 4rem 0 2rem

Logo:     Height 32px, Geist Sans
Tagline:  muted-foreground, small size
Column headers: font-weight: 600, foreground, caption size
Links:    muted-foreground, small size, hover: foreground
Social:   20px icons, muted-foreground, hover: foreground
Bottom:   border-top, muted-foreground, caption size, centered
```

---

## 15. Mobile Specifications

### Breakpoint

```
Mobile:    ≤ 768px (default design target)
Tablet:    769px — 1024px (2-column where applicable)
Desktop:   ≥ 1025px (full layout)
```

### Mobile Hero

```
┌──────────────────────┐
│  [≡]        [Sign Up] │
│                      │
│  Your knowledge      │
│  base, instantly     │
│  accessible.         │
│                      │
│  Upload your docs    │
│  and get precise,    │
│  sourced answers     │
│  in seconds.         │
│                      │
│  [ Start Free → ]    │
│                      │
│  ▶ Watch Demo        │
│                      │
│  ┌────────────────┐  │
│  │ [Screenshot]   │  │
│  │ (smaller)      │  │
│  └────────────────┘  │
│                      │
└──────────────────────┘
```

### Mobile Changes

```
Hero:
  - Headline: 2.5rem (down from 4.5rem)
  - Subheadline: 1rem
  - Screenshot: hidden or very small (below fold)
  - CTAs: stacked vertically, full-width

Features:
  - Single column (not 2×2 grid)
  - Cards stack vertically

How It Works:
  - Vertical layout (numbered steps stacked)
  - Connecting line becomes vertical

Pricing:
  - Single column (cards stack)
  - Pro card NOT scaled up (remove transform)
  - Monthly/Yearly toggle hidden (show yearly price only)

Testimonials:
  - Single column
  - Horizontal scroll or stack

Footer:
  - 2-column grid for links
  - Social links inline

Navigation:
  - Hamburger menu → slide-down panel
  - Logo left, hamburger right
```

### Mobile Touch Targets

```
- Minimum tap target: 44px × 44px
- CTAs: min-height 48px
- Accordion items: min-height 56px
- Spacing between tappable elements: 8px minimum
```

---

## 16. Animation System

### Principles

1. **Subtle, not showy.** Animations should feel natural, not distracting.
2. **Performance first.** Use CSS transforms and opacity only. No layout thrashing.
3. **Respect user preference.** Honor `prefers-reduced-motion: reduce`.

### Animation Inventory

| Element | Animation | Duration | Easing | Trigger |
|---------|-----------|----------|--------|---------|
| Hero headline | Fade up | 0.6s | ease-out | Page load |
| Hero subhead | Fade up, delayed 0.1s | 0.6s | ease-out | Page load |
| Hero CTAs | Fade up, delayed 0.2s | 0.6s | ease-out | Page load |
| Hero screenshot | Fade up + scale 0.98→1 | 0.8s | ease-out | Page load |
| Social proof stats | Count up | 1.5s | ease-out | Scroll into view |
| Social logos | Fade in | 0.5s | ease | Scroll into view |
| Feature cards | Fade up, staggered 0.1s | 0.5s | ease-out | Scroll into view |
| How-it-works steps | Fade up, staggered 0.15s | 0.5s | ease-out | Scroll into view |
| Testimonial cards | Fade up | 0.5s | ease-out | Scroll into view |
| Pricing cards | Fade up, staggered 0.1s | 0.5s | ease-out | Scroll into view |
| Pricing hover | Border glow + slight lift | 0.2s | ease | Hover |
| FAQ accordion | Height transition | 0.3s | ease | Click |
| Nav background | Opacity transition | 0.3s | ease | Scroll |
| Buttons | Scale 1→1.02 on hover | 0.15s | ease | Hover |
| All sections | Scroll-triggered fade-in | 0.5s | ease-out | Intersection Observer |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Implementation

```tsx
// Use framer-motion for scroll-triggered animations
// Use CSS transitions for hover states
// Use Intersection Observer for scroll detection

// Example: Feature card animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-100px" }}
  transition={{ duration: 0.5, delay: index * 0.1 }}
>
```

---

## 17. SEO & Meta

### Title Tag

```
Your Knowledge Base, Instantly Accessible | MimoNotes
```

### Meta Description

```
Upload documents and get precise, sourced answers in seconds. MimoNotes turns your knowledge base into an AI-powered assistant with source citations.
```

### Open Graph

```
og:title:       "MimoNotes — Your Knowledge Base, Instantly Accessible"
og:description: "Upload documents and get precise, sourced answers in seconds."
og:image:       /images/og-landing.png (1200×630px)
og:type:        website
og:url:         https://mimonotes.com
```

### Twitter Card

```
twitter:card:        summary_large_image
twitter:title:       "MimoNotes — Your Knowledge Base, Instantly Accessible"
twitter:description: "Upload documents and get precise, sourced answers in seconds."
twitter:image:       /images/og-landing.png
```

### Structured Data (JSON-LD)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "MimoNotes",
  "description": "AI-powered knowledge base. Upload documents and get precise, sourced answers.",
  "url": "https://mimonotes.com",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "offers": [
    {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "name": "Free"
    },
    {
      "@type": "Offer",
      "price": "19",
      "priceCurrency": "USD",
      "name": "Pro",
      "billingIncrement": "P1M"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}
```

### Additional SEO

```
- Canonical URL: https://mimonotes.com
- Language: en
- Robots: index, follow
- Sitemap: /sitemap.xml (auto-generated by Next.js)
- H1: "Your knowledge base, instantly accessible." (one H1 per page)
- Image alt tags: Descriptive, keyword-rich
- Internal links: /features, /pricing, /docs, /blog
```

---

## 18. Wireframes

### Desktop (1440px)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ NAV: [Logo]     Product  Pricing  Docs  Blog          [Sign Up Free →]      │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│ HERO:                                                                        │
│                                                                              │
│            Your knowledge base,                                              │
│            instantly accessible.                                             │
│                                                                              │
│       Upload your documents and get precise, sourced                         │
│       answers in seconds — not hours of searching.                           │
│                                                                              │
│              [  Start Free — No Credit Card  →  ]                            │
│                                                                              │
│                    [  ▶ Watch Demo  ]                                        │
│                                                                              │
│       Free for up to 50 documents · No credit card · 2 min setup            │
│                                                                              │
│       ┌────────────────────────────────────────────────────┐                 │
│       │                                                    │                 │
│       │              [ PRODUCT SCREENSHOT ]                │                 │
│       │                                                    │                 │
│       └────────────────────────────────────────────────────┘                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ SOCIAL PROOF:                                                                │
│                                                                              │
│      TRUSTED BY TEAMS WHO TAKE KNOWLEDGE SERIOUSLY                           │
│                                                                              │
│      [Logo] [Logo] [Logo] [Logo] [Logo] [Logo] [Logo] [Logo]               │
│                                                                              │
│      ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                                │
│      │ 500+ │  │ 4.8/5│  │ 99.9%│  │ 10k+ │                                │
│      │Teams │  │  PH  │  │Uptime│  │Q&A   │                                │
│      └──────┘  └──────┘  └──────┘  └──────┘                                │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ PRODUCT SHOWCASE:                                                            │
│                                                                              │
│                 See MimoNotes in action                                      │
│                                                                              │
│      ┌──────────────────────────────────────────────┐                       │
│      │         [ SCREENSHOT 1 — Upload ]            │                       │
│      │                                              │                       │
│      │  Upload any document — PDF, Word, or URL —   │                       │
│      │  and MimoNotes instantly understands it.     │                       │
│      └──────────────────────────────────────────────┘                       │
│                                                                              │
│      ┌─────────────────────┐  ┌─────────────────────┐                       │
│      │  [ SCREENSHOT 2 ]   │  │  [ SCREENSHOT 3 ]   │                       │
│      │  Ask questions in   │  │  Get answers with   │                       │
│      │  natural language   │  │  source citations   │                       │
│      └─────────────────────┘  └─────────────────────┘                       │
│                                                                              │
│      ┌──────────────────────────────────────────────┐                       │
│      │  BEFORE: "Where is that policy?" → 30 min    │                       │
│      │  AFTER:  "What's our policy?" → 3 sec        │                       │
│      └──────────────────────────────────────────────┘                       │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ FEATURES:                                                                    │
│                                                                              │
│              Everything you need, nothing you don't.                         │
│                                                                              │
│      ┌──────────────────┐  ┌──────────────────┐                             │
│      │  [Upload icon]   │  │  [Sources icon]  │                             │
│      │  Upload & Chat   │  │  Source           │                             │
│      │  Drop any doc.   │  │  Attribution      │                             │
│      │  We handle the   │  │  Every answer     │                             │
│      │  rest.           │  │  cites its source.│                             │
│      └──────────────────┘  └──────────────────┘                             │
│                                                                              │
│      ┌──────────────────┐  ┌──────────────────┐                             │
│      │  [Teams icon]    │  │  [Analytics icon]│                             │
│      │  Team Workspace  │  │  Usage Analytics  │                             │
│      │  Shared knowledge│  │  Know what gets   │                             │
│      │  for your team.  │  │  asked. Improve.  │                             │
│      └──────────────────┘  └──────────────────┘                             │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ HOW IT WORKS:                                                                │
│                                                                              │
│              How it works. Three steps. That's it.                           │
│                                                                              │
│         1 ────────────────── 2 ────────────────── 3                         │
│        (○)                  (○)                  (○)                         │
│                                                                              │
│    ┌──────────┐      ┌──────────┐      ┌──────────┐                        │
│    │ [Upload] │      │  [Ask]   │      │ [Answer] │                        │
│    │ Upload   │      │  Ask     │      │ Get      │                        │
│    │ your     │      │ questions│      │ precise  │                        │
│    │ documents│      │ naturally│      │ answers  │                        │
│    └──────────┘      └──────────┘      └──────────┘                        │
│                                                                              │
│                      [ Start Free → ]                                        │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ TESTIMONIALS:                                                                │
│                                                                              │
│                 What our users say                                           │
│                                                                              │
│      ┌────────────────────────────────────────────────┐                     │
│      │ " MimoNotes cut our support response time     │                     │
│      │   by 60%..."                                   │                     │
│      │   [AVT] Sarah Chen, Head of Support, Acme     │                     │
│      └────────────────────────────────────────────────┘                     │
│                                                                              │
│      ┌────────────────────┐  ┌────────────────────┐                         │
│      │ "Finally, an AI    │  │ "We onboard new    │                         │
│      │  that tells you    │  │  hires in half the │                         │
│      │  WHERE..."         │  │  time..."          │                         │
│      │  Marcus Rivera,    │  │  Priya Sharma,     │                         │
│      │  CTO, DevStack     │  │  VP People, ScaleUp│                         │
│      └────────────────────┘  └────────────────────┘                         │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ PRICING:                                                                     │
│                                                                              │
│              Simple pricing. Start free. Scale when ready.                   │
│                                                                              │
│      ┌──────────┐  ┌──────────┐  ┌──────────┐                              │
│      │   FREE   │  │ ★ PRO ★  │  │ ENTERPRISE│                             │
│      │   $0     │  │   $19    │  │   Custom  │                              │
│      │ /month   │  │ /month   │  │           │                              │
│      │          │  │          │  │           │                              │
│      │ • 50 docs│  │ • Unlimited│ │ • SSO    │                              │
│      │ • 100 msg│  │ • 5 spaces│  │ • On-prem│                              │
│      │ • 1 space│  │ • Full    │  │ • SLA    │                              │
│      │          │  │   analytics│ │           │                              │
│      │[Start Free│ │[Start Pro]│  │[Contact  │                              │
│      │          │  │          │  │ Sales]   │                              │
│      └──────────┘  └──────────┘  └──────────┘                              │
│                                                                              │
│      All plans: 256-bit encryption · SOC 2 · GDPR · 99.9% uptime           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ FAQ:                                                                         │
│                                                                              │
│              Frequently asked questions                                      │
│                                                                              │
│      ▸ What documents can I upload?                                         │
│      ▸ Is my data secure?                                                   │
│      ▸ Can I use my own AI model?                                           │
│      ▸ How does source attribution work?                                    │
│      ▸ Do you offer a free trial for Pro?                                   │
│      ▸ What integrations do you support?                                    │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ FINAL CTA:                                                                   │
│                                                                              │
│          Stop searching. Start knowing.                                      │
│                                                                              │
│          Join 500+ teams using MimoNotes to turn                             │
│          their documents into instant knowledge.                             │
│                                                                              │
│                [  Start Free — No Credit Card  →  ]                          │
│                [  Talk to Sales  ]                                           │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ FOOTER:                                                                      │
│                                                                              │
│  [Logo]                     Product       Company      Legal      Connect   │
│  Your knowledge base,       Features      About        Privacy    Twitter   │
│  instantly accessible.      Pricing       Blog         Terms      GitHub    │
│                             Docs          Careers      Security   LinkedIn  │
│                             Status        Contact                           │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────── │
│  © 2026 MimoNotes. All rights reserved.                                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (375px)

```
┌──────────────────────┐
│ [Logo]          [≡]  │
├──────────────────────┤
│                      │
│ HERO:                │
│                      │
│  Your knowledge      │
│  base, instantly     │
│  accessible.         │
│                      │
│  Upload your docs    │
│  and get precise,    │
│  sourced answers     │
│  in seconds.         │
│                      │
│  [ Start Free → ]    │
│    (full-width)      │
│                      │
│  ▶ Watch Demo        │
│                      │
│  ┌────────────────┐  │
│  │  [Screenshot]  │  │
│  └────────────────┘  │
│                      │
├──────────────────────┤
│ SOCIAL PROOF:        │
│                      │
│  TRUSTED BY...       │
│                      │
│  ┌──────┐ ┌──────┐  │
│  │ 500+ │ │4.8/5 │  │
│  │Teams │ │ PH   │  │
│  └──────┘ └──────┘  │
│  ┌──────┐ ┌──────┐  │
│  │99.9% │ │ 10k+ │  │
│  │Uptime│ │ Q&A  │  │
│  └──────┘ └──────┘  │
│  (2×2 grid)         │
│                      │
├──────────────────────┤
│ FEATURES:            │
│                      │
│  Everything you      │
│  need, nothing you   │
│  don't.              │
│                      │
│  ┌────────────────┐  │
│  │ Upload & Chat  │  │
│  │ Drop any doc.  │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Source Attr.   │  │
│  │ Every answer   │  │
│  │ cites source.  │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Team Workspace │  │
│  │ Shared for     │  │
│  │ your team.     │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Analytics      │  │
│  │ Know what gets │  │
│  │ asked. Improve.│  │
│  └────────────────┘  │
│  (stacked)           │
│                      │
├──────────────────────┤
│ HOW IT WORKS:        │
│                      │
│  1 ──── 2 ──── 3     │
│                      │
│  ┌────────────────┐  │
│  │ Upload docs    │  │
│  └────────────────┘  │
│         │            │
│  ┌────────────────┐  │
│  │ Ask questions  │  │
│  └────────────────┘  │
│         │            │
│  ┌────────────────┐  │
│  │ Get answers    │  │
│  └────────────────┘  │
│  (vertical)          │
│                      │
├──────────────────────┤
│ TESTIMONIALS:        │
│                      │
│  ┌────────────────┐  │
│  │ "Quote..."     │  │
│  │ [AVT] Name     │  │
│  └────────────────┘  │
│                      │
│  (horizontal scroll  │
│   or stacked)        │
│                      │
├──────────────────────┤
│ PRICING:             │
│                      │
│  ┌────────────────┐  │
│  │ FREE           │  │
│  │ $0/month       │  │
│  │ [Start Free]   │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ ★ PRO ★        │  │
│  │ $19/month      │  │
│  │ [Start Pro]    │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ ENTERPRISE     │  │
│  │ Custom         │  │
│  │ [Contact Sales]│  │
│  └────────────────┘  │
│  (stacked)           │
│                      │
├──────────────────────┤
│ FAQ:                 │
│                      │
│  ▸ Question 1        │
│  ▸ Question 2        │
│  ▸ Question 3        │
│  ▸ Question 4        │
│  ▸ Question 5        │
│  ▸ Question 6        │
│                      │
├──────────────────────┤
│ FINAL CTA:           │
│                      │
│  Stop searching.     │
│  Start knowing.      │
│                      │
│  [ Start Free → ]    │
│  [ Talk to Sales ]   │
│                      │
├──────────────────────┤
│ FOOTER:              │
│                      │
│  [Logo]              │
│  Tagline             │
│                      │
│  Product    Company  │
│  Features   About    │
│  Pricing    Blog     │
│  Docs       Careers  │
│                      │
│  Legal     Connect   │
│  Privacy   Twitter   │
│  Terms     GitHub    │
│  Security  LinkedIn  │
│                      │
│  © 2026 MimoNotes   │
│                      │
└──────────────────────┘
```

---

## 19. Implementation Checklist

### Phase 1: Structure (Day 1)

- [ ] Create `app/page.tsx` — new landing page (replace current)
- [ ] Create `components/landing/` directory
- [ ] Implement `LandingNav.tsx` — sticky navigation
- [ ] Implement `Hero.tsx` — above the fold
- [ ] Implement `SocialProofBar.tsx` — trust signals
- [ ] Update `globals.css` — ensure dark theme vars are correct

### Phase 2: Content Sections (Day 2)

- [ ] Implement `ProductShowcase.tsx` — screenshots + captions
- [ ] Implement `Features.tsx` — 4 feature cards with Lucide icons
- [ ] Implement `HowItWorks.tsx` — 3-step process
- [ ] Implement `Testimonials.tsx` — user quotes
- [ ] Gather or write placeholder testimonials

### Phase 3: Conversion (Day 3)

- [ ] Implement `Pricing.tsx` — 3-tier pricing cards
- [ ] Implement `FAQ.tsx` — accordion component
- [ ] Implement `FinalCTA.tsx` — closing section
- [ ] Implement `LandingFooter.tsx` — full footer

### Phase 4: Polish (Day 4)

- [ ] Add scroll animations (framer-motion)
- [ ] Add reduced-motion media query
- [ ] Create product screenshots (or placeholders)
- [ ] Create OG image (1200×630)
- [ ] Add JSON-LD structured data
- [ ] Test mobile responsiveness (375px, 768px, 1024px, 1440px)

### Phase 5: Launch (Day 5)

- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Performance audit (Lighthouse score target: 95+)
- [ ] SEO audit (title, meta, OG, structured data)
- [ ] A/B test hero headline variants
- [ ] Set up analytics tracking (CTA clicks, scroll depth)
- [ ] Deploy to production

### Component File Structure

```
components/
  landing/
    LandingNav.tsx
    Hero.tsx
    SocialProofBar.tsx
    ProductShowcase.tsx
    Features.tsx
    HowItWorks.tsx
    Testimonials.tsx
    Pricing.tsx
    FAQ.tsx
    FinalCTA.tsx
    LandingFooter.tsx

app/
  page.tsx                    # New landing page (imports all landing components)

public/
  images/
    hero-screenshot.webp      # Main product screenshot
    showcase-upload.webp      # Upload interface screenshot
    showcase-chat.webp        # Chat interface screenshot
    showcase-sources.webp     # Source citation screenshot
    og-landing.png            # Open Graph image (1200×630)
    logo.svg                  # MimoNotes logo (light + dark variants)
```

### Dependencies

```json
{
  "framer-motion": "^11.x",     // Scroll animations
  "lucide-react": "^0.400.x",   // Icons (already in project)
  "next": "^16.x"               // Framework (already in project)
}
```

### Performance Targets

```
Lighthouse Performance:    ≥ 95
Lighthouse Accessibility:  ≥ 95
Lighthouse Best Practices: ≥ 95
Lighthouse SEO:            ≥ 100
First Contentful Paint:    ≤ 1.0s
Largest Contentful Paint:  ≤ 2.5s
Total Blocking Time:       ≤ 100ms
Cumulative Layout Shift:   ≤ 0.1
```

---

## Appendix A: Hero Headline Variants (A/B Testing)

Test these headlines to find the highest-converting option:

| Variant | Headline | Subheadline | Hypothesis |
|---------|----------|-------------|------------|
| A (Default) | "Your knowledge base, instantly accessible." | "Upload your documents and get precise, sourced answers in seconds." | Aspirational + specific |
| B | "Stop searching. Start knowing." | "Upload documents. Ask questions. Get cited answers." | Action-oriented |
| C | "The AI that knows your documents." | "Upload anything. Get answers with sources in seconds." | Personification |
| D | "Answers, not searches." | "Upload your docs and get precise answers with source citations." | Problem-solution |

---

## Appendix B: Color Utilities

```css
/* Purple glow effect for cards */
.glow-purple {
  box-shadow: 0 0 40px oklch(0.65 0.20 265 / 0.08);
}

/* Gradient border for featured card */
.gradient-border {
  border: 2px solid transparent;
  background-image: linear-gradient(var(--card), var(--card)),
                    linear-gradient(135deg, var(--primary), oklch(0.65 0.20 300));
  background-origin: border-box;
  background-clip: padding-box, border-box;
}

/* Subtle background pattern */
.bg-grid {
  background-image:
    linear-gradient(oklch(0.22 0.01 265 / 0.3) 1px, transparent 1px),
    linear-gradient(90deg, oklch(0.22 0.01 265 / 0.3) 1px, transparent 1px);
  background-size: 40px 40px;
}
```

---

## Appendix C: Icon Reference

All icons from `lucide-react`. No emoji. Ever.

```
Upload & Chat:       lucide-upload-cloud
Source Attribution:  lucide-file-check
Team Workspace:      lucide-users
Analytics:           lucide-bar-chart-3
Step 1 (Upload):     lucide-upload-cloud
Step 2 (Ask):        lucide-message-square
Step 3 (Answer):     lucide-quote
Pricing checkmark:   lucide-check
Navigation menu:     lucide-menu
Navigation close:    lucide-x
Chevron (accordion): lucide-chevron-right → lucide-chevron-down
Play (demo):         lucide-play-circle
Arrow (CTA):         lucide-arrow-right
Star (rating):       lucide-star
Shield (security):   lucide-shield
Clock (uptime):      lucide-clock
Users (teams):       lucide-users
External link:       lucide-external-link
Twitter:             lucide-twitter
GitHub:              lucide-github
LinkedIn:            lucide-linkedin
Email:               lucide-mail
```

---

## Appendix D: Typography Scale

```css
/* Hero */
.hero-headline {
  font-family: 'Geist Sans', sans-serif;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: var(--foreground);
}

.hero-subhead {
  font-family: 'Geist Sans', sans-serif;
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 400;
  line-height: 1.6;
  color: var(--muted-foreground);
  max-width: 600px;
}

/* Section headlines */
.section-headline {
  font-family: 'Geist Sans', sans-serif;
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--foreground);
}

/* Feature headlines */
.feature-headline {
  font-family: 'Geist Sans', sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--foreground);
}

/* Pricing numbers */
.price {
  font-family: 'Geist Mono', monospace;
  font-size: clamp(2.5rem, 4vw, 3.5rem);
  font-weight: 700;
  color: var(--foreground);
}

/* Captions */
.caption {
  font-family: 'Geist Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--muted-foreground);
}
```

---

*End of spec. This document is ready for implementation. Follow the checklist in Section 19 for ordered execution.*
