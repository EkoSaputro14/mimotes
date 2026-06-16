# LANDING_PAGE_V27_SPEC.md — MimoNotes Landing Page V2.7

> **Date:** June 14, 2026
> **Status:** Design Spec — Ruthlessly Simplified
> **Positioning:** AI Workspace for Team Knowledge
> **Differentiator:** Answers backed by citations
> **Review applied:** V2.6 Design Review (4.8/10 → target 8+/10)

---

## Design Philosophy

### What V2.6 Got Wrong

V2.6 had 12 sections. It was a marketing page that EXPLAINED the product instead of SHOWING it. The spec said "product-first" but then added feature grids, team checklists, security bullet points, and fake dashboards.

### What V2.7 Gets Right

V2.7 has **7 sections**. The Product Showcase IS the landing page. Every section that doesn't directly help a visitor understand "this AI answers from my documents" has been removed.

### The 5-Second Test

A visitor lands on the page. Within 5 seconds they must:

1. **Read the headline** → "Ask your documents anything"
2. **See the product** → Chat interface with visible citation
3. **Understand the difference** → "This AI cites its sources"
4. **Know what to do** → "Start Free" button

If any of these fail, the design has failed.

### Comparison to References

| Product | Landing Page Approach | MimoNotes V2.7 Adaptation |
|---------|----------------------|---------------------------|
| **Claude** | Brand + tagline + chat input | Product showcase IS the marketing |
| **ChatGPT** | Product-first, minimal chrome | Show the product, not features |
| **Perplexity** | "Where knowledge begins" + search | Lead with the differentiator |
| **Notion AI** | Product in context (doc + AI) | Show citations in context |
| **ChatbotApp.ai** | Product demo front and center | Real screenshot, not CSS mockup |

---

## Page Structure

```
1. HEADER          (sticky nav)
2. HERO            (headline + CTAs)
3. PRODUCT SHOWCASE (real screenshot, 50-60% viewport)
4. FEATURES        (3 cards, text-only)
5. TEAM            (real screenshot, outcome headline)
6. SECURITY        (1 paragraph)
7. PRICING         (1 tier)
8. FAQ             (3 questions)
9. FOOTER          (real links only)

Total: 9 sections
Scroll depth: ~2-3 viewports on desktop
```

**Sections removed from V2.6:**
- ❌ Knowledge You Can Trust (redundant with Product Showcase)
- ❌ Early Access / Beta (hurts conversion)
- ❌ Final CTA (redundant with Hero)

---

## Section 1: Header

```
Layout:
┌──────────────────────────────────────────────────────────┐
│  [Logo]           Product  Pricing  Security   [CTA]    │
└──────────────────────────────────────────────────────────┘

Position:   Sticky top, z-index: 50
Height:     64px
Background: bg-background/80, backdrop-blur-xl
Border:     border-b border-border (after 50px scroll)

Left:
  Bot icon (size-8, rounded-lg, bg-primary)
  "MimoNotes" (text-lg, font-semibold)

Center (lg+ only):
  "Product" → #product
  "Pricing" → #pricing
  "Security" → #security

Right:
  "Log In" → /login (text-sm, text-muted-foreground)
  "Start Free" → /chat (bg-primary, rounded-lg, px-4, py-2, text-sm)

Mobile: Logo + Start Free only
```

---

## Section 2: Hero

### Hero Concept Evaluation

**Concept 1:**
> Ask your documents anything.

- ✅ 5 words. Clear. Action-oriented.
- ✅ Mentions "documents" (the input)
- ✅ Mentions "anything" (the breadth)
- ❌ Doesn't mention citations (the differentiator)
- **Score: 7/10**

**Concept 2:**
> Get answers backed by citations.

- ✅ 5 words. Clear. Differentiator-first.
- ✅ Mentions "citations" (the differentiator)
- ✅ "Backed by" implies trust
- ❌ Doesn't mention documents
- **Score: 8/10**

**Concept 3:**
> Your team's knowledge. Answers you can verify.

- ✅ Mentions "team" (B2B positioning)
- ✅ Mentions "verify" (trust)
- ✅ Two-part structure is memorable
- ❌ 8 words. Slightly long.
- **Score: 7/10**

**Concept 4:**
> Ask questions. Get cited answers.

- ✅ 5 words. Minimal. Clear.
- ✅ "Cited answers" is the differentiator
- ✅ Two-part rhythm (action → result)
- ❌ Doesn't mention documents or team
- **Score: 9/10**

**Concept 5:**
> Upload documents. Get answers with sources.

- ✅ Mentions documents + answers + sources
- ✅ Describes the full flow
- ❌ 7 words. Feels like instructions, not a hook.
- ❌ "Upload" is a task, not a benefit
- **Score: 6/10**

### Winner: Concept 4

**"Ask questions. Get cited answers."**

Why:
- 5 words. Maximum impact, minimum text.
- "Ask questions" — the action everyone understands
- "Cited answers" — the differentiator in 2 words
- Rhythm: action → result (like "Think different" or "Just do it")
- Doesn't need to mention documents — the Product Showcase shows them

### Subheadline

**Option A (recommended):**
> Upload any document. Your team gets precise answers — each one linked to its source.

**Option B (shorter):**
> Your team's AI. Answers linked to real documents.

**Chosen: Option A** — 16 words. Covers documents, team, precision, and source linking.

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            Ask questions.                                │
│            Get cited answers.                            │
│                                                          │
│   Upload any document. Your team gets precise answers    │
│   — each one linked to its source.                       │
│                                                          │
│              [ Start Free ]                              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Ask questions."
  "Get cited answers."
  text-4xl sm:text-5xl lg:text-6xl
  font-bold, tracking-tight (-0.03em)
  Line 2: text-primary (subtle emphasis)

Subheadline:
  "Upload any document. Your team gets precise answers"
  "— each one linked to its source."
  text-lg, text-muted-foreground, max-w-xl, mx-auto

CTA:
  "Start Free" (bg-primary, text-primary-foreground, rounded-xl, px-8, py-3.5)
  ONLY ONE CTA. No secondary button.

Background: bg-background (clean, no decoration)
```

**Why only 1 CTA:** The V2.6 review identified CTA fatigue. "Start Free" is the only action a visitor needs. "Book Demo" is premature for a beta product.

---

## Section 3: Product Showcase (CENTERPIECE)

This section IS the landing page. It must occupy 50-60% of viewport height.

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │           REAL PRODUCT SCREENSHOT                  │ │
│  │           (not CSS mockup)                         │ │
│  │                                                    │ │
│  │  ┌──────────┬─────────────────────────────────┐   │ │
│  │  │          │                                 │   │ │
│  │  │ Sidebar  │  Chat: "What is our vacation    │   │ │
│  │  │ (docs)   │  policy?"                       │   │ │
│  │  │          │                                 │   │ │
│  │  │          │  AI: Full-time employees are    │   │ │
│  │  │          │  entitled to 20 days of paid    │   │ │
│  │  │          │  vacation per year...           │   │ │
│  │  │          │                                 │   │ │
│  │  │          │  ┌─────────────────────────┐   │   │ │
│  │  │          │  │ 📄 Employee Handbook    │   │   │ │
│  │  │          │  │    Section 4.2          │   │   │ │
│  │  │          │  └─────────────────────────┘   │   │ │
│  │  │          │  ▲                             │   │ │
│  │  │          │  │ ANNOTATION:                │   │ │
│  │  │          │  │ "Source citation —         │   │ │
│  │  │          │  │  always visible"           │   │ │
│  │  └──────────┴─────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘

Requirements:
1. REAL screenshot of the actual product (take from running instance)
2. Screenshot at 1440px desktop, full sidebar + chat visible
3. Citation must be visually prominent (larger, highlighted)
4. Add annotation line pointing to citation:
   "Source citation — always visible"

Screenshot specifications:
- Format: WebP (optimized), PNG fallback
- Path: /public/images/landing-showcase.webp
- Dimensions: 1440×900 (scaled to container)
- Must show: Sidebar with documents, chat with question + answer + citation
- Citation card: highlighted with bg-primary/10 or subtle border

Frame:
  rounded-2xl, border border-border
  shadow-2xl shadow-primary/10
  overflow-hidden

Annotation:
  Below the screenshot, centered
  "Every answer includes the exact source."
  text-sm, text-muted-foreground, italic
```

### How to Get the Screenshot

1. Open the running MimoNotes instance (localhost:3100 or production)
2. Log in
3. Navigate to /chat
4. Ask: "What is our vacation policy?"
5. Wait for answer with citation
6. Capture full-page screenshot at 1440px width
7. Crop to show sidebar + chat area
8. Optimize as WebP

**This is NOT optional.** A CSS mockup will not be accepted.

---

## Section 4: Feature Highlights (3 Cards)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │          │  │          │  │          │              │
│  │  Ask     │  │  Verify  │  │  Share   │              │
│  │          │  │          │  │          │              │
│  │  Ask     │  │  Every   │  │  Keep    │              │
│  │  questions│  │  answer  │  │  your    │              │
│  │  across  │  │  links   │  │  entire  │              │
│  │  all your│  │  back to │  │  team    │              │
│  │  docs.   │  │  its     │  │  aligned.│              │
│  │          │  │  source. │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Grid: sm:grid-cols-3, gap-6

Cards:
  bg-card, border border-border, rounded-2xl, p-8
  NO icons. NO images. Text only.

  Title: text-lg, font-semibold, text-foreground
  Description: text-sm, text-muted-foreground, mt-2

Card 1 — Ask:
  Title: "Ask"
  Description: "Ask questions across all your documents."

Card 2 — Verify:
  Title: "Verify"
  Description: "Every answer links back to its source."

Card 3 — Share:
  Title: "Share"
  Description: "Keep your entire team aligned."

Hover: border-primary/20, transition-colors
```

### Why No Icons

The V2.6 review identified "feature grids with icons everywhere" as a generic SaaS anti-pattern. Text-only cards are more premium. Linear does this. Vercel does this.

---

## Section 5: Team Collaboration

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Everyone works from the                                │
│  same source of truth.                                  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │        REAL PRODUCT SCREENSHOT                     │ │
│  │        (workspace / team view)                     │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Everyone works from the"
  "same source of truth."
  H2, text-3xl sm:text-4xl, font-bold
  Line 2: text-primary

Screenshot:
  REAL screenshot of workspace/team management view
  Shows: Workspace switcher, member list, shared documents
  NOT fake stats, NOT placeholder numbers

Frame: rounded-2xl, border border-border, shadow-xl

Caption (optional):
  "Shared workspace. Shared knowledge. Same answers."
  text-sm, text-muted-foreground, centered
```

### Why This Section Stays

The V2.6 review suggested removing this. But MimoNotes is NOT ChatPDF. Team collaboration is a real differentiator against single-user AI tools. This section communicates: "This is for teams, not individuals."

**Requirement:** Real screenshot only. No CSS mockups.

---

## Section 6: Security

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Private by default.                        │
│                                                          │
│   AES-256 encryption. Workspace isolation. Audit logging.│
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Private by default."
  H2, centered, text-3xl, font-bold

Body:
  "AES-256 encryption. Workspace isolation. Audit logging."
  text-muted-foreground, centered, max-w-lg, mx-auto

Background: bg-muted/30

That's it. No checklist. No grid. No icons. Just the statement.
```

---

## Section 7: Pricing

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   Start for free.                        │
│                                                          │
│  ┌─────────────────────────────────────┐               │
│  │                                     │               │
│  │  Starter                            │               │
│  │  Free During Beta                   │               │
│  │                                     │               │
│  │  ✓ 50 documents                     │               │
│  │  ✓ Unlimited chat                   │               │
│  │  ✓ 1 workspace                      │               │
│  │                                     │               │
│  │  [ Start Free ]                     │               │
│  │                                     │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│           Pro plans launching soon.                      │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Start for free."
  H2, centered, text-3xl, font-bold

Card:
  max-w-sm, mx-auto
  bg-card, border border-border, rounded-2xl, p-8
  Centered content

  Tier: "Starter" (text-sm, font-semibold, uppercase, tracking-widest, text-muted-foreground)
  Price: "Free During Beta" (text-3xl, font-bold)
  Features: CheckCircle2 icons, text-sm, space-y-2
    - 50 documents
    - Unlimited chat
    - 1 workspace
  CTA: "Start Free" (bg-primary, w-full)

Below card:
  "Pro plans launching soon."
  text-sm, text-muted-foreground, centered
```

---

## Section 8: FAQ

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            Questions?                                   │
│                                                          │
│  What file formats are supported?              [▼]      │
│  ───────────────────────────────────────────────────     │
│  Is my data secure?                              [▼]      │
│  ───────────────────────────────────────────────────     │
│  Is there a free plan?                           [▼]      │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Questions?"
  H2, centered, text-3xl, font-bold

Container: max-w-2xl, mx-auto

3 questions only. Native <details>. Zero JS.
```

---

## Section 9: Footer

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Logo] MimoNotes                                        │
│                                                          │
│  Product          Legal          Contact                 │
│  Features         Privacy        hello@mimonotes.com     │
│  Pricing          Terms                                   │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  © 2026 MimoNotes.                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘

3 columns only. Only real links.
No dead links (#). No fake pages.
```

---

## Complete Section Count

| # | Section | Exists in V2.6 | V2.7 Action |
|---|---------|---------------|-------------|
| 1 | Header | Yes | Simplified (removed dead links) |
| 2 | Hero | Yes | **Redesigned** (new headline, 1 CTA) |
| 3 | Product Showcase | Yes | **Must use real screenshot** |
| 4 | Features | Yes | **Reduced to 3 cards, no icons** |
| 5 | Team | Yes | **Must use real screenshot** |
| 6 | Security | Yes | **Compressed to 1 paragraph** |
| 7 | Pricing | Yes | **Simplified to 1 tier** |
| 8 | FAQ | Yes | **Reduced to 3 questions** |
| 9 | Footer | Yes | **Removed dead links** |
| — | Knowledge You Can Trust | Yes | ❌ **Removed** |
| — | Early Access | Yes | ❌ **Removed** |
| — | Final CTA | Yes | ❌ **Removed** |

**V2.6: 12 sections → V2.7: 9 sections** (25% reduction)

---

## Design Tokens

All from `globals.css`. Zero hardcoded colors.

| Token | Usage |
|-------|-------|
| `bg-background` | Page, header, footer |
| `bg-card` | Feature cards, pricing card, product frame |
| `bg-muted/30` | Security section background |
| `bg-primary` | CTA buttons, accent elements |
| `text-foreground` | Headlines, body text |
| `text-muted-foreground` | Descriptions, secondary text |
| `text-primary` | Headline accent line |
| `border-border` | Card borders, frame borders |
| `shadow-primary/10` | Product showcase shadow |

---

## Motion

Minimal. Professional.

| Element | Animation | Trigger |
|---------|-----------|---------|
| Hero headline | Fade in + slide up 20px | Page load |
| Hero subheadline | Fade in + slide up 20px | Page load, 0.1s delay |
| Hero CTA | Fade in | Page load, 0.2s delay |
| Product Showcase | Fade in + scale 0.98→1 | Page load, 0.3s delay |
| Feature cards | Fade in on scroll | IntersectionObserver |
| Other sections | Fade in on scroll | IntersectionObserver |

Respect `prefers-reduced-motion`.

---

## Responsive Breakpoints

| Breakpoint | Width | Changes |
|------------|-------|---------|
| Mobile | < 640px | Single column, no sidebar in mockup, stacked layout |
| Tablet | 640-1024px | 2-column where applicable |
| Desktop | > 1024px | Full layout, max-w-1200px |

---

## Success Criteria

| Test | Requirement |
|------|-------------|
| 5-second test | Visitor understands "AI that answers from documents with citations" |
| Single scroll | Entire page consumable in one scroll on desktop |
| CTA count | Maximum 3 "Start Free" buttons on entire page |
| Dead links | Zero |
| Fake content | Zero (no placeholder metrics, no fake dashboards) |
| Sections | 9 maximum |
| Word count | < 300 words total |
| Lighthouse | All categories > 95 |

---

*Spec generated: 2026-06-14*
*Hermes Agent — Sprint B V2.7 design spec*
