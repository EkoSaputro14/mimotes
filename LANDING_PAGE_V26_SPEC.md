# LANDING_PAGE_V26_SPEC.md — MimoNotes Landing Page V2.6

> **Date:** June 14, 2026
> **Status:** Design Spec — Ready for Implementation
> **Positioning:** AI Workspace for Team Knowledge
> **Differentiator:** Answers backed by real source citations
> **References:** Claude, Notion AI, ChatbotApp.ai, Linear, Perplexity

---

## 1. Design Philosophy

### Positioning Statement

MimoNotes is NOT a chatbot. It is NOT an LLM router. It is NOT an AI model marketplace.

**MimoNotes is an AI Workspace where teams organize knowledge and get precise, cited answers from their documents.**

### Design Direction

| Quality | How It Manifests |
|---------|-----------------|
| **Premium** | Generous whitespace, precise typography, warm-purple palette |
| **Minimal** | Every element earns its place. No decoration for decoration's sake |
| **Trustworthy** | Source citations visible. No bold claims. Product speaks |
| **Enterprise-ready** | Clean, professional, no playful illustrations or emoji |
| **Product-first** | The product mockup IS the landing page. Show, don't tell |

### Anti-Patterns (Never Do This)

- Generic SaaS feature grids with icons everywhere
- Placeholder metrics ("500+ teams", "4.8/5 rating")
- Fake testimonials or customer logos
- Aggressive CTAs ("START FREE NOW!!!")
- Gradient text or rainbow palettes
- Bouncing animations or spinning icons
- Emoji in any context
- "How it works" sections (self-evident from product)

---

## 2. Color System

### Primary Palette

All values from `globals.css` V2 tokens. No hardcoded colors.

| Role | Token | Value |
|------|-------|-------|
| Background | `bg-background` | oklch(0.99 0.004 265) light / oklch(0.07 0.003 265) dark |
| Foreground | `text-foreground` | oklch(0.14 0.004 265) light / oklch(0.97 0.003 265) dark |
| Primary | `bg-primary` | oklch(0.58 0.17 265) — warm purple |
| Primary FG | `text-primary-foreground` | oklch(0.98 0 0) |
| Muted | `bg-muted` | oklch(0.96 0.005 265) |
| Muted FG | `text-muted-foreground` | oklch(0.48 0.004 265) |
| Card | `bg-card` | oklch(1.00 0.003 265) |
| Border | `border-border` | oklch(0.0 0.003 265 / 0.08) |

### Accent Usage

- **Primary (purple):** CTAs, active states, brand elements only
- **Muted:** Secondary text, descriptions, placeholders
- **Background:** Page surface, alternating sections use `bg-muted/30`
- **Card:** Product mockup, feature cards

---

## 3. Typography

### Font Stack

```
Font: Geist Sans (via next/font)
Mono: Geist Mono (code, pricing numbers)
```

### Hierarchy

| Role | Size | Weight | Tracking | Line Height |
|------|------|--------|----------|-------------|
| Display | 3.75rem (60px) | 700 | -0.03em | 1.05 |
| H2 | 2.25rem (36px) | 700 | -0.02em | 1.15 |
| H3 | 1.25rem (20px) | 600 | -0.01em | 1.3 |
| Body | 1rem (16px) | 400 | 0 | 1.6 |
| Small | 0.875rem (14px) | 400 | 0 | 1.5 |
| Caption | 0.75rem (12px) | 500 | 0.05em | 1.5 |
| Badge | 0.75rem (12px) | 600 | 0.05em | 1.3 |

### Rules

- Headlines: font-weight 700, tracking tight (-0.02 to -0.03em)
- Body: font-weight 400, tracking normal, max-width 600px for readability
- Badge: uppercase, letter-spacing 0.05em, font-weight 600

---

## 4. Spacing System

### Section Spacing

| Element | Desktop | Mobile |
|---------|---------|--------|
| Section vertical padding | 6rem (96px) | 4rem (64px) |
| Content max-width | 1200px | 100% (px-4) |
| Card padding | 2rem (32px) | 1.5rem (24px) |
| Grid gap | 1.5rem (24px) | 1rem (16px) |
| Element spacing | 1rem (16px) | 0.75rem (12px) |

### Border Radius

| Element | Radius |
|---------|--------|
| Cards, mockup frame | 16px (rounded-2xl) |
| Buttons | 12px (rounded-xl) |
| Badges | 9999px (rounded-full) |
| Icons containers | 12px (rounded-xl) |

---

## 5. Section Specifications

### Section 1: Header (Sticky Navigation)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│  [Logo]     Features  Pricing  Enterprise  Docs    [CTA]│
└──────────────────────────────────────────────────────────┘

Position:   Sticky top, z-index: 50
Height:     64px
Background: bg-background/80, backdrop-blur-xl
Border:     border-b border-border
Scroll:     Becomes fully opaque after 50px

Left:
  Bot icon (size-8, rounded-lg, bg-primary, text-primary-foreground)
  "MimoNotes" (text-lg, font-semibold, tracking-tight)

Center (hidden on mobile, visible lg+):
  "Features" → #features (text-sm, text-muted-foreground)
  "Pricing" → #pricing (text-sm, text-muted-foreground)
  "Enterprise" → #security (text-sm, text-muted-foreground)
  "Documentation" → # (text-sm, text-muted-foreground)

Right:
  "Log In" → /login (text-sm, text-muted-foreground)
  "Start Free" → /chat (bg-primary, text-primary-foreground, rounded-lg, px-4, py-2, text-sm)
```

**Mobile:** Logo + Start Free only (center nav hidden, no hamburger — only 1 CTA needed)

---

### Section 2: Hero

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  AI KNOWLEDGE WORKSPACE                      │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│            Your knowledge base,                          │
│            instantly accessible.                         │
│                                                          │
│   Upload documents, organize team knowledge, and get     │
│   answers backed by real sources — all in one workspace. │
│                                                          │
│          [ Start Free ]    [ Book Demo ]                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

Badge:
  "AI Knowledge Workspace"
  bg-primary/10, text-primary, rounded-full
  px-3, py-1, text-xs, font-semibold, uppercase, tracking-widest
  mb-6

Headline:
  "Your knowledge base,"
  "instantly accessible."
  text-4xl sm:text-5xl lg:text-6xl
  font-bold, tracking-tight, text-foreground
  Line break after "base,"
  Second line: text-primary (subtle emphasis)

Subheadline:
  "Upload documents, organize team knowledge, and get"
  "answers backed by real sources — all in one workspace."
  text-lg, text-muted-foreground, max-w-xl, mx-auto
  Two lines for readability

CTAs:
  Primary: "Start Free" (bg-primary, text-primary-foreground, rounded-xl, px-8, py-3.5)
  Secondary: "Book Demo" (border border-border, bg-background, text-foreground, rounded-xl, px-8, py-3.5)
  Max 2 buttons. No additional CTAs.

Background:
  bg-background (clean, no gradient)
  Optional: very subtle radial glow at top (primary/5)
```

---

### Section 3: Product Showcase (MOST IMPORTANT)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────────────────────────────────────────┐       │
│  │  ● ● ●  MimoNotes                            │       │
│  ├──────────┬───────────────────────────────────┤       │
│  │          │                                   │       │
│  │ Sidebar  │   Chat Area                       │       │
│  │          │                                   │       │
│  │ Docs     │   User: What is our               │       │
│  │ ──────── │   vacation policy?                │       │
│  │ Handbk   │                                   │       │
│  │ Q4 Rpt   │   AI: Full-time employees are     │       │
│  │ API Docs │   entitled to 20 days of paid     │       │
│  │ Onboard  │   vacation per year...            │       │
│  │          │                                   │       │
│  │          │   ┌─────────────────────────┐     │       │
│  │          │   │ Source: Employee         │     │       │
│  │          │   │ Handbook.pdf, Section 4.2│     │       │
│  │          │   └─────────────────────────┘     │       │
│  │          │                                   │       │
│  └──────────┴───────────────────────────────────┘       │
│                                                          │
│  Shadow: shadow-2xl shadow-primary/10                    │
│  Frame: rounded-2xl, border border-border               │
│                                                          │
└──────────────────────────────────────────────────────────┘

Container:    max-w-5xl, mx-auto, px-4
Margin-top:   -mt-16 (overlaps hero slightly for depth)
Frame:        rounded-2xl, border border-border, overflow-hidden
Shadow:       shadow-2xl shadow-primary/10

Top bar:
  3 dots (size-2.5, rounded-full, bg-muted)
  "MimoNotes" label (text-xs, text-muted-foreground, ml-3)
  border-b border-border, py-2.5, px-4

Sidebar (hidden on mobile, visible sm+):
  width: w-52 (208px)
  border-r border-border, bg-card
  padding: p-4
  "Documents" label (text-xs, font-medium, text-muted-foreground, uppercase, tracking-widest)
  Document list with FileText icon:
    - Employee Handbook.pdf
    - Q4 Financial Report.docx
    - API Documentation.md
    - Onboarding Guide.pdf
  Each item: flex items-center gap-2, py-1.5, text-xs, text-muted-foreground

Main area (chat):
  flex-1, p-6, bg-background

  User message:
    max-w-md, ml-auto, rounded-xl, bg-muted/50, px-4, py-2.5, text-sm
    "What is our vacation policy?"

  AI response:
    max-w-lg, rounded-xl, bg-primary/10, px-4, py-3, text-sm, leading-relaxed
    "Full-time employees are entitled to 20 days of paid vacation per year. 
     Vacation must be requested at least 2 weeks in advance through the 
     HR portal. Part-time employees accrue vacation proportionally."

  Source citation (KEY DIFFERENTIATOR):
    mt-3, flex items-center gap-2
    FileText icon (size-3.5, text-primary)
    "Source: Employee Handbook.pdf, Section 4.2"
    text-xs, text-muted-foreground
    bg-primary/5, rounded-lg, px-3, py-1.5

Responsive:
  Mobile: No sidebar, min-h-[280px]
  Tablet: Sidebar visible, min-h-[350px]
  Desktop: max-w-5xl, min-h-[420px]
```

**This section should occupy 50-60% of viewport height.** It IS the landing page.

---

### Section 4: Knowledge You Can Trust

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│         Every answer is backed                          │
│         by real sources.                                │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────────┐    │
│  │                    │  │                        │    │
│  │  Visual:           │  │  Source Attribution     │    │
│  │  Question          │  │                        │    │
│  │  ↓                 │  │  Every answer links to  │    │
│  │  Answer            │  │  the exact document,    │    │
│  │  ↓                 │  │  page, and paragraph    │    │
│  │  Citation          │  │  it came from.          │    │
│  │                    │  │                        │    │
│  │  Employee          │  │  No hallucinations.     │    │
│  │  Handbook.pdf      │  │  No guessing.           │    │
│  │  Section 4.2       │  │  Just verified answers. │    │
│  │                    │  │                        │    │
│  └────────────────────┘  └────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Every answer is backed"
  "by real sources."
  H2, text-3xl sm:text-4xl, font-bold, tracking-tight
  Second line: text-primary

Two columns (lg:grid-cols-2, gap-12):

Left — Visual demonstration:
  Mockup showing:
    - User question (bg-muted/50, rounded-xl)
    - AI answer (bg-primary/10, rounded-xl)
    - Citation card (bg-card, border border-border, rounded-xl)
      FileText icon + "Employee Handbook.pdf" + "Section 4.2"
  This is NOT a feature list — it's a visual proof

Right — Explanation:
  Headline: "Source Attribution" (H3, font-semibold)
  Body: "Every answer links to the exact document, page, and 
         paragraph it came from. No hallucinations. No guessing. 
         Just verified answers."
  text-muted-foreground, max-w-md

Mobile: Stacked (visual on top, explanation below)
```

---

### Section 5: Feature Grid

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Everything your team needs.                 │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Ask      │ │ Organize │ │Collaborate│               │
│  │          │ │          │ │          │               │
│  │ Find     │ │ Keep     │ │ Invite   │               │
│  │ answers  │ │ company  │ │ your     │               │
│  │ across   │ │ knowledge│ │ entire   │               │
│  │ docs.    │ │ in one   │ │ team.    │               │
│  │          │ │ place.   │ │          │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Verify   │ │ Analyze  │ │ Deploy   │               │
│  │          │ │          │ │          │               │
│  │ Every    │ │ Chat     │ │ Embed AI │               │
│  │ answer   │ │ with     │ │ into     │               │
│  │ includes │ │ PDFs and │ │ your     │               │
│  │ cites.   │ │ docs.    │ │ website. │               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Everything your team needs."
  H2, centered, text-3xl, font-bold

Grid:
  sm:grid-cols-2, lg:grid-cols-3, gap-6

Cards:
  bg-card, border border-border, rounded-2xl, p-6
  Hover: border-primary/20, shadow-lg shadow-primary/5

  Each card:
    Icon container: size-10, rounded-xl, bg-primary/10, flex items-center justify-center
    Icon: Lucide, size-5, text-primary
    Title: text-base, font-semibold, mt-3
    Description: text-sm, text-muted-foreground, mt-1.5

Icons:
  Ask → MessageSquare
  Organize → FolderOpen
  Collaborate → Users
  Verify → CheckCircle2
  Analyze → FileText
  Deploy → Globe
```

---

### Section 6: Team Collaboration

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  One workspace for                                     │
│  your entire team.                                     │
│                                                          │
│  ┌────────────────────┐  ┌────────────────────────┐    │
│  │ Invite teammates.  │  │  ┌──────────────────┐  │    │
│  │ Share documents.   │  │  │ Workspace View    │  │    │
│  │ Get the same       │  │  │                  │  │    │
│  │ accurate answers.  │  │  │ Members: 4       │  │    │
│  │                    │  │  │ Documents: 12    │  │    │
│  │ ✓ Workspace        │  │  │ Chats: 48        │  │    │
│  │   Switching        │  │  │                  │  │    │
│  │ ✓ Team Invitations │  │  └──────────────────┘  │    │
│  │ ✓ Role Management  │  │                        │    │
│  │ ✓ Shared Knowledge │  │                        │    │
│  └────────────────────┘  └────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "One workspace for"
  "your entire team."
  H2, text-3xl sm:text-4xl, font-bold
  Second line: text-primary

Two columns (lg:grid-cols-2, gap-12):

Left — Copy + checklist:
  Body: "Invite teammates, share documents, and ensure 
         everyone gets the same accurate answers."
  text-muted-foreground, text-lg

  Checklist (mt-8, space-y-3):
    CheckCircle2 icon (size-5, text-primary)
    Items: Workspace Switching, Team Invitations, Role Management, Shared Knowledge
    Each: flex items-center gap-3, text-sm, text-muted-foreground

Right — Dashboard mockup:
  bg-card, border border-border, rounded-2xl, p-6, shadow-xl shadow-primary/5

  Mockup shows:
    - "Workspace" header with member count badge
    - Stats: Members (4), Documents (12), Chats (48)
    - Member list with avatars and roles
    - Clean, realistic, not fake numbers
```

---

### Section 7: Security

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Private by default.                        │
│                                                          │
│  ✓ Workspace Isolation    ✓ Encrypted Data              │
│  ✓ Audit Logging          ✓ Self-Hosted Ready           │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Private by default."
  H2, centered, text-3xl, font-bold

Grid:
  sm:grid-cols-2, gap-4, max-w-2xl, mx-auto, mt-10

Items:
  flex items-center gap-3, py-3
  CheckCircle2 icon (size-5, text-primary)
  Text: text-sm, text-muted-foreground

Items:
  - Workspace Isolation
  - Encrypted Data (AES-256)
  - Audit Logging
  - Self-Hosted Ready

Background:
  bg-muted/30 (subtle section separator)
```

---

### Section 8: Beta Users

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                  Early Access                            │
│                                                          │
│  We're working closely with our first beta users         │
│  to shape the future of MimoNotes.                      │
│                                                          │
│              [ Join Beta ]                               │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Early Access"
  H2, centered, text-3xl, font-bold

Body:
  "We're working closely with our first beta users 
   to shape the future of MimoNotes."
  text-muted-foreground, text-lg, centered, max-w-lg, mx-auto

CTA:
  "Join Beta" → /chat
  bg-primary, text-primary-foreground, rounded-xl, px-8, py-3.5

Background:
  bg-muted/30
```

---

### Section 9: Pricing

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   Simple pricing.                        │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Starter  │ │ Pro      │ │Enterprise│               │
│  │          │ │ ★        │ │          │               │
│  │ Free     │ │Coming    │ │ Contact  │               │
│  │ During   │ │Soon      │ │ Us       │               │
│  │ Beta     │ │          │ │          │               │
│  │          │ │          │ │          │               │
│  │ ✓ 50     │ │ Unlimited│ │ Custom   │               │
│  │   docs   │ │ documents│ │ volume   │               │
│  │ ✓ Chat   │ │ ✓ Teams  │ │ ✓ SSO    │               │
│  │ ✓ 1 user │ │ ✓ All    │ │ ✓ SLA    │               │
│  │          │ │   features│ │ ✓ Support│               │
│  └──────────┘ └──────────┘ └──────────┘               │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Simple pricing."
  H2, centered, text-3xl, font-bold

Grid:
  md:grid-cols-3, gap-6, max-w-4xl, mx-auto

Cards:
  bg-card, border border-border, rounded-2xl, p-6

Pro card (highlighted):
  border-primary, ring-2 ring-primary/20
  "Most Popular" badge (bg-primary/10, text-primary)

Each card:
  Tier name: text-sm, font-semibold, uppercase, tracking-widest, text-muted-foreground
  Price: text-3xl, font-bold (Free / Coming Soon / Custom)
  Period: text-sm, text-muted-foreground
  Features: list with CheckCircle2 icons, text-sm
  CTA: Button (variant depends on tier)

Tiers:
  Starter: "Free During Beta" — 50 docs, Chat, 1 user
  Pro: "Coming Soon" — Unlimited, Teams, All features (HIGHLIGHTED)
  Enterprise: "Contact Us" — Custom, SSO, SLA, Support
```

---

### Section 10: FAQ

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            Frequently asked questions.                   │
│                                                          │
│  What document formats are supported?          [▼]      │
│  ───────────────────────────────────────────────────     │
│  Is my data secure?                              [▼]      │
│  ───────────────────────────────────────────────────     │
│  Can I use my own AI model?                      [▼]      │
│  ───────────────────────────────────────────────────     │
│  How does source attribution work?              [▼]      │
│  ───────────────────────────────────────────────────     │
│  Is there a free plan?                           [▼]      │
│  ───────────────────────────────────────────────────     │
│  What integrations are available?               [▼]      │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Frequently asked questions."
  H2, centered, text-3xl, font-bold

Container: max-w-3xl, mx-auto

Accordion: Native <details> elements (zero JS)
  Each item:
    border-b border-border
    summary: flex, justify-between, py-5, cursor-pointer
      text-base, font-medium, text-foreground
    ChevronDown icon (size-4, text-muted-foreground, rotates on open)
    Answer: mt-3, text-sm, text-muted-foreground, leading-relaxed

Max 6 questions.
```

---

### Section 11: Final CTA

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│     Bring your team's knowledge                         │
│     into one workspace.                                 │
│                                                          │
│          [ Start Free ]    [ Book Demo ]                 │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Bring your team's knowledge"
  "into one workspace."
  H2, text-3xl sm:text-4xl, font-bold, centered
  Second line: text-primary

CTAs:
  Primary: "Start Free" (bg-primary, text-primary-foreground)
  Secondary: "Book Demo" (border border-border, bg-background)
  Max 2 buttons.

Background:
  bg-muted/30
  Subtle radial glow (primary/5)
```

---

### Section 12: Footer

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Logo]                                                  │
│                                                          │
│  Product      Company      Resources      Legal          │
│  Features     About        Documentation  Privacy        │
│  Pricing      Blog         API Reference  Terms          │
│  Status       Careers                     Security       │
│  Enterprise   Contact                                   │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  © 2026 MimoNotes. All rights reserved.                 │
│                                                          │
└──────────────────────────────────────────────────────────┘

Background:   bg-background
Border:       border-t border-border
Padding:      py-16

Container:    max-w-6xl, mx-auto, px-4

Logo:
  Bot icon + "MimoNotes" (centered, mb-8)

Grid: 4 columns (sm:grid-cols-2, lg:grid-cols-4), gap-8

Column headers:
  text-xs, font-semibold, uppercase, tracking-widest, text-muted-foreground, mb-4

Links:
  text-sm, text-muted-foreground, hover:text-foreground
  space-y-2

Bottom:
  border-t border-border, mt-12, pt-6, text-center
  "© 2026 MimoNotes. All rights reserved."
  text-xs, text-muted-foreground
```

---

## 6. Component Dependencies

| Section | Components Used |
|---------|----------------|
| Header | Button (primary, sm) |
| Hero | Button (primary + outline, lg), Badge |
| Product Showcase | Card (mockup frame) |
| Trust | Card (visual demo), CheckCircle2 |
| Features | Card (6x), Lucide icons (6) |
| Team | Card (checklist + dashboard mockup) |
| Security | CheckCircle2 (4x) |
| Beta | Button (primary, lg) |
| Pricing | Card (3x), Badge, CheckCircle2, Button |
| FAQ | Native `<details>` (zero JS) |
| Final CTA | Button (primary + outline, lg) |
| Footer | Next.js Link |

---

## 7. Motion (Subtle, Framer Motion)

| Element | Animation | Duration |
|---------|-----------|----------|
| Hero badge | Fade in + slide up | 0.4s, delay 0.1s |
| Hero headline | Fade in + slide up | 0.4s, delay 0.2s |
| Hero subheadline | Fade in + slide up | 0.4s, delay 0.3s |
| Hero CTAs | Fade in + slide up | 0.4s, delay 0.4s |
| Product mockup | Fade in + scale 0.98→1 | 0.6s, delay 0.5s |
| Feature cards | Stagger fade in | 0.3s each, 0.1s stagger |
| Sections below fold | Fade in on scroll (IntersectionObserver) | 0.5s |

**Rule:** Respect `prefers-reduced-motion`. All animations are decorative — content is accessible without them.

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Key Changes |
|------------|-------|-------------|
| Mobile | < 640px | Single column, no sidebar in mockup, stacked layout |
| Tablet | 640-1024px | 2-column grids, sidebar visible in mockup |
| Desktop | > 1024px | Full layout, max-w-1200px, all features visible |

---

## 9. Accessibility

| Requirement | Implementation |
|-------------|---------------|
| Semantic HTML | header, main, section, footer, nav, details |
| Heading hierarchy | h1 → h2 → h3 (no skipped levels) |
| Focus states | focus-visible:ring-2 focus-visible:ring-primary |
| Color contrast | All text WCAG AA (4.5:1 minimum) |
| Keyboard nav | All interactive elements keyboard-accessible |
| Screen reader | ARIA labels on icons, alt text on mockups |
| Reduced motion | prefers-reduced-motion media query |

---

## 10. Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 95 |
| Lighthouse Accessibility | > 95 |
| Lighthouse Best Practices | > 95 |
| Lighthouse SEO | > 95 |
| First Contentful Paint | < 1s |
| Largest Contentful Paint | < 2s |
| Total Blocking Time | < 50ms |
| Cumulative Layout Shift | < 0.1 |

---

*Spec generated: 2026-06-14*
*Hermes Agent — Sprint B V2.6 design spec*
