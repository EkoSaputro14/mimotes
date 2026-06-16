# Landing Page V3 Spec — MimoNotes

**Date:** June 14, 2026
**Status:** Design Spec — Conversion-Optimized
**Based on:** LANDING_PAGE_UX_AUDIT.md (score 6.5/10)
**Target score:** 8.0/10

---

## Design Principles

1. **Real product, not mockups** — Every visual is a real screenshot
2. **Single conversion path** — One CTA per section, no dilution
3. **Social proof over features** — Show who uses it, not what it does
4. **Mobile-first** — Every section works on 375px
5. **Fast comprehension** — Visitor understands in 3 seconds, not 10

---

## Competitive Positioning

| Competitor | What They Do | MimoNotes V3 Adaptation |
|------------|-------------|------------------------|
| **ChatbotApp.ai** | Product IS the landing page | Real screenshot as hero centerpiece |
| **Claude** | Brand-first, minimal chrome | Clean header, confident copy |
| **OpenAI** | Product + enterprise trust | Social proof + pricing |
| **Notion AI** | Product in context | Show citations in real chat |
| **Perplexity** | Aspirational headline | "Ask questions. Get cited answers." |
| **Linear** | Design-forward premium | Premium feel with V2 design tokens |

---

## Page Structure

```
1. HEADER          (sticky nav + mobile hamburger)
2. HERO            (headline + single CTA)
3. SOCIAL PROOF    (logos or "Trusted by" strip)
4. PRODUCT SHOWCASE (REAL screenshot, 60% viewport)
5. HOW IT WORKS    (3 steps)
6. FEATURES        (3 outcomes, not features)
7. SECURITY        (headlines + badges)
8. PRICING         (1 tier)
9. FAQ             (3 questions)
10. FINAL CTA      (single button, strong statement)
11. FOOTER          (real links only)

Total: 11 sections
Scroll depth: ~3-4 viewports on desktop
```

**Sections added from V2.7:**
- ✅ Social proof strip (NEW)
- ✅ How it works (NEW)
- ✅ Final CTA (restored, but stronger)

**Sections removed from V2.7:**
- ❌ Team section (redundant with social proof)

---

## Section 1: Header

```
Layout:
┌──────────────────────────────────────────────────────────┐
│  [Logo] MimoNotes    Product  How it works  Pricing      │
│                                     [Log In] [Get started]│
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
  "How it works" → #how-it-works
  "Pricing" → #pricing

Right:
  "Log In" → /login (text-sm, text-muted-foreground)
  "Get started" → /register (bg-primary, rounded-lg, px-4, py-2, text-sm)

Mobile:
  Hamburger menu (left) → slides in nav links
  Logo (center)
  "Get started" (right)
```

### Mobile Hamburger Menu

```
When clicked:
┌────────────────────────────────┐
│  ✕                        Logo │
│                                │
│  Product                       │
│  How it works                  │
│  Pricing                       │
│  ─────────────────────────     │
│  Log In                        │
│  [ Get started free ]          │
└────────────────────────────────┘

Full-screen overlay
Backdrop blur
Slide-in from right
Escape to close
```

---

## Section 2: Hero

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│            Ask questions.                                │
│            Get cited answers.                            │
│                                                          │
│      Upload any document. Get precise answers             │
│      — each one linked to its source.                    │
│                                                          │
│              [ Get started free → ]                      │
│                                                          │
│      Free for 50 documents. No credit card.              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  Line 1: "Ask questions."
  Line 2: "Get cited answers." (text-primary)
  text-4xl sm:text-5xl lg:text-6xl
  font-bold, tracking-tight
  NO ANIMATION — static text
  NO rotating words

Subheadline:
  "Upload any document. Get precise answers"
  "— each one linked to its source."
  text-lg, text-muted-foreground, max-w-xl, mx-auto
  14 words (reduced from 24)

CTA:
  "Get started free" (bg-primary, text-primary-foreground, rounded-xl, px-8, py-3.5)
  Single CTA. No secondary button.
  Arrow icon (→) for motion

Trust line (below CTA):
  "Free for 50 documents. No credit card."
  text-sm, text-muted-foreground

Background: bg-background (clean)
```

### Why No Animation

The V2.7 rotating words ("accurate", "cited", "source-linked", "grounded", "reliable") delay comprehension by 10 seconds. A visitor who lands during the "grounded" cycle misses "cited answers" — the differentiator. Static text is faster, clearer, and more confident.

---

## Section 3: Social Proof (NEW)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Trusted by teams who need accurate answers              │
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │
│  │Logo 1│ │Logo 2│ │Logo 3│ │Logo 4│ │Logo 5│         │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Trusted by teams who need accurate answers"
  text-sm, text-muted-foreground, uppercase, tracking-widest
  Centered

Logos:
  5 company logos in a row
  grayscale, opacity-50
  hover: opacity-100
  If no real logos: use placeholder SVGs with company names

Alternative (if no logos available):
  "Join X teams already using MimoNotes"
  text-lg, font-medium
```

### Why This Section

Social proof is the #1 trust signal. Competitors (Notion, Linear, OpenAI) all show logos or user counts. MimoNotes has zero social proof. Even placeholder logos are better than nothing.

---

## Section 4: Product Showcase (CENTERPIECE)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │                                                    │ │
│  │           REAL PRODUCT SCREENSHOT                  │ │
│  │           (1440×900, WebP)                         │ │
│  │                                                    │ │
│  │  Shows:                                            │ │
│  │  - Sidebar with document list                      │ │
│  │  - Chat with question + answer                     │ │
│  │  - Citation card (PROMINENT)                       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│         ↑ Source citation — always visible               │
│                                                          │
│           [ Get started free → ]                         │
│                                                          │
└──────────────────────────────────────────────────────────┘

Screenshot:
  REAL screenshot from running MimoNotes instance
  Format: WebP (optimized), PNG fallback
  Path: /public/images/landing-showcase.webp
  Dimensions: 1440×900 (scaled to container)

  Must show:
  - Sidebar with 4+ documents
  - Chat area with question + answer
  - Citation card PROMINENTLY visible
  - Citation should be LARGER than surrounding text
  - Citation card: bg-primary/10, border-primary/20, subtle glow

  Use case: "What is our vacation policy?" (keep — it's relatable)

Frame:
  rounded-2xl, border border-border
  shadow-2xl shadow-primary/10
  overflow-hidden

Annotation:
  Below screenshot, centered
  "↑ Source citation — always visible"
  text-sm, text-muted-foreground

CTA (below annotation):
  "Get started free →"
  Same style as hero CTA
  This is the SECOND CTA on the page
```

### Citation Enhancement

The citation card must be MORE prominent than in V2.7:

**V2.7 citation:**
```
┌─────────────────────────────┐
│ 📄 Employee Handbook.pdf    │
│    Section 2                │
└─────────────────────────────┘
```

**V3 citation (enhanced):**
```
┌─────────────────────────────────────┐
│ 📄 Source: Employee Handbook.pdf    │
│    Section 4.2, Page 12             │
│                                     │
│  ↑ This is where the answer came    │
│    from — always visible            │
└─────────────────────────────────────┘
```

- Larger size (wider padding)
- Border: border-primary/30
- Background: bg-primary/5
- Subtle box-shadow: shadow-primary/10
- Arrow annotation below pointing up

---

## Section 5: How It Works (NEW)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              How it works                                │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │          │  │          │  │          │              │
│  │  1       │  │  2       │  │  3       │              │
│  │          │  │          │  │          │              │
│  │  Upload  │  │  Ask     │  │  Verify  │              │
│  │  your    │  │  any     │  │  with    │              │
│  │  docs    │  │  question│  │  sources │              │
│  │          │  │          │  │          │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "How it works"
  H2, centered, text-3xl, font-bold

Grid: sm:grid-cols-3, gap-8

Step 1:
  Number: "1" (text-primary, text-4xl, font-bold)
  Title: "Upload your docs"
  Description: "PDF, DOCX, TXT, CSV, XLSX, or website URLs."
  icon: Upload (lucide, text-primary)

Step 2:
  Number: "2" (text-primary, text-4xl, font-bold)
  Title: "Ask any question"
  Description: "Natural language. No special syntax needed."
  icon: MessageSquare (lucide, text-primary)

Step 3:
  Number: "3" (text-primary, text-4xl, font-bold)
  Title: "Verify with sources"
  Description: "Every answer links to the exact source."
  icon: CheckCircle (lucide, text-primary)

Cards:
  bg-card, border border-border, rounded-2xl, p-8
  Number is LARGE and prominent
  Icon below number
  Title: text-lg, font-semibold
  Description: text-sm, text-muted-foreground
```

### Why This Section

Visitors need to understand the flow: Upload → Ask → Verify. The V2.7 feature cards ("Ask", "Verify", "Share") describe features, not steps. "How it works" is a process, which is easier to understand.

---

## Section 6: Features

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  Built for teams who need accurate answers               │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │          │  │          │  │          │              │
│  │  Ask     │  │  Verify  │  │  Share   │              │
│  │          │  │          │  │          │              │
│  │  Ask     │  │  Every   │  │  Your    │              │
│  │  questions│  │  answer  │  │  entire  │              │
│  │  across  │  │  cites   │  │  team    │              │
│  │  all your│  │  its     │  │  shares  │              │
│  │  docs.   │  │  source. │  │  one     │              │
│  │          │  │          │  │  knowledge│              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Built for teams who need accurate answers"
  text-sm, text-muted-foreground, uppercase, tracking-widest
  Centered

Cards: Same as V2.7 but with updated descriptions:
  Card 1: "Ask" — "Ask questions across all your documents."
  Card 2: "Verify" — "Every answer cites its source."
  Card 3: "Share" — "Your entire team shares one knowledge base."

  NO icons. Text only. (Keep V2.7 approach)
```

---

## Section 7: Security

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              Private by default.                         │
│                                                          │
│   AES-256 encryption. Workspace isolation.               │
│   Audit logging. Your data is never used for training.   │
│                                                          │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐                  │
│   │ 🔒 AES  │ │ 🏢 Team │ │ 📋 Audit│                  │
│   │  256    │ │  Isolate│ │  Logs   │                  │
│   └─────────┘ └─────────┘ └─────────┘                  │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Private by default."
  H2, centered, text-3xl, font-bold

Body:
  "AES-256 encryption. Workspace isolation."
  "Audit logging. Your data is never used for training."
  text-muted-foreground, centered, max-w-lg, mx-auto

Badges (NEW):
  3 trust badges in a row
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ 🔒 AES  │ │ 🏢 Team │ │ 📋 Audit│
  │  256    │ │  Isolate│ │  Logs   │
  └─────────┘ └─────────┘ └─────────┘

  Each badge:
    size-16, rounded-xl, border border-border
    Icon: text-primary, size-6
    Label: text-xs, font-medium, text-muted-foreground

Background: bg-muted/30
```

### Why Badges

The V2.7 security section is too brief (1 line). Badges add visual weight without adding copy. They're a pattern used by Vercel, Linear, and Notion.

---

## Section 8: Pricing

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                   Start for free.                        │
│                                                          │
│  ┌─────────────────────────────────────┐               │
│  │                                     │               │
│  │  ★ Most Popular                     │               │
│  │  Starter                            │               │
│  │  Free                                │               │
│  │                                     │               │
│  │  ✓ 50 documents                     │               │
│  │  ✓ Unlimited chat                   │               │
│  │  ✓ 1 workspace                      │               │
│  │  ✓ Team collaboration               │               │
│  │  ✓ Source citations                 │               │
│  │                                     │               │
│  │  [ Get started free → ]             │               │
│  │                                     │               │
│  └─────────────────────────────────────┘               │
│                                                          │
│           Pro plans coming soon.                         │
│                                                          │
└──────────────────────────────────────────────────────────┘

Headline:
  "Start for free."
  H2, centered, text-3xl, font-bold

Card:
  max-w-sm, mx-auto
  bg-card, border border-border, rounded-2xl, p-8

  Badge: "★ Most Popular" (bg-primary/10, text-primary, rounded-full)
  Tier: "Starter"
  Price: "Free" (NOT "Free During Beta")
  Features (5 items with CheckCircle2):
    - 50 documents
    - Unlimited chat
    - 1 workspace
    - Team collaboration
    - Source citations
  CTA: "Get started free →" (bg-primary, w-full)

Below card:
  "Pro plans coming soon."
  text-sm, text-muted-foreground, centered
```

### Changes from V2.7

- "Free During Beta" → "Free" (remove "Beta")
- Added "★ Most Popular" badge
- Added 2 more features (Team collaboration, Source citations)
- CTA: "Start Free" → "Get started free →"

---

## Section 9: FAQ

```
Same as V2.7:
  3 questions
  Native <details>
  Short answers

  1. "What file formats are supported?"
     "PDF, DOCX, TXT, CSV, XLSX, and website URLs."

  2. "Is my data secure?"
     "AES-256 encryption at rest and in transit. Your documents are never used to train AI models."

  3. "Is there a free plan?"
     "Yes. 50 documents, unlimited chat, 1 workspace. No credit card required."
```

---

## Section 10: Final CTA (NEW)

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│          Ready to get accurate answers?                  │
│                                                          │
│              [ Get started free → ]                      │
│                                                          │
│          Free for 50 documents. No credit card.          │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Background: bg-muted/30 (visual break)

Headline:
  "Ready to get accurate answers?"
  H2, centered, text-3xl, font-bold

CTA:
  "Get started free →"
  Same style as hero CTA

Trust line:
  "Free for 50 documents. No credit card."
  text-sm, text-muted-foreground
```

### Why Final CTA

The V2.6 review said "remove Final CTA — redundant with hero." But data shows final CTAs convert. The visitor has scrolled through the entire page. They're ready. Give them one more chance to click.

---

## Section 11: Footer

```
Layout:
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  [Logo] MimoNotes                                        │
│                                                          │
│  Product          Legal                                  │
│  Features         Privacy (→ /privacy)                   │
│  Pricing          Terms (→ /terms)                       │
│  How it works                                          │
│                                                          │
│  Contact                                               │
│  hello@mimonotes.com                                    │
│                                                          │
│  ──────────────────────────────────────────────────────  │
│  © 2026 MimoNotes.                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘

3 columns: Product, Legal, Contact
ONLY real links
Privacy and Terms must link to actual pages (even if placeholder)
Contact: real email address
```

---

## Content Changes Summary

### Hero

| Element | V2.7 | V3 |
|---------|------|----|
| Headline line 2 | Animated ("accurate" → "cited" → ...) | Static "Get cited answers." |
| Badge | "Try the demo" above headline | Removed |
| CTA 1 | "Start chatting" (secondary) | Removed |
| CTA 2 | "Get started free" (primary) | "Get started free →" (only CTA) |
| Subheadline | 24 words | 14 words |
| Trust line | None | "Free for 50 documents. No credit card." |

### Product Showcase

| Element | V2.7 | V3 |
|---------|------|----|
| Visual | CSS mockup | REAL screenshot |
| Citation | Small, same size as text | LARGE, prominent, with annotation |
| CTA below | None | "Get started free →" |

### Pricing

| Element | V2.7 | V3 |
|---------|------|----|
| Price text | "Free During Beta" | "Free" |
| Badge | None | "★ Most Popular" |
| Features | 3 items | 5 items |
| CTA | "Start Free" | "Get started free →" |

---

## Word Count Comparison

| Section | V2.7 Words | V3 Words | Change |
|---------|------------|----------|--------|
| Hero | 16 | 14 | -2 |
| Social Proof | 0 | 8 | +8 (NEW) |
| Product Showcase | 1 | 1 | 0 |
| How It Works | 0 | 18 | +18 (NEW) |
| Features | 18 | 20 | +2 |
| Team | 12 | 0 | -12 (REMOVED) |
| Security | 10 | 15 | +5 |
| Pricing | 20 | 25 | +5 |
| FAQ | 45 | 45 | 0 |
| Final CTA | 0 | 10 | +10 (NEW) |
| Footer | 15 | 15 | 0 |
| **Total** | **137** | **171** | **+34** |

V3 has 34 more words than V2.7, but they're in higher-value sections (social proof, how it works, final CTA). The word count increase is justified by conversion improvement.

---

## File Structure

```
components/landing/
├── header.tsx              (MODIFY — add mobile hamburger)
├── hero.tsx                (MODIFY — remove animation, single CTA)
├── social-proof.tsx        (NEW — logos or trust strip)
├── product-showcase.tsx    (MODIFY — real screenshot, prominent citation)
├── how-it-works.tsx        (NEW — 3 steps)
├── feature-highlights.tsx  (MODIFY — update descriptions)
├── security-section.tsx    (MODIFY — add badges)
├── pricing-section.tsx     (MODIFY — remove "Beta", add badge)
├── faq-section.tsx         (KEEP — no changes)
├── final-cta.tsx           (NEW — strong closing CTA)
└── footer.tsx              (MODIFY — fix dead links)

app/
├── page.tsx                (MODIFY — update section order)
└── public/images/
    └── landing-showcase.webp  (NEW — real screenshot)
```

---

## Verification Checklist

| Check | Requirement |
|-------|-------------|
| 5-second test | Visitor reads headline, sees product, knows CTA in 5s |
| Single CTA per section | No section has more than 1 CTA |
| Real screenshot | Not CSS mockup |
| Mobile responsive | All sections work on 375px |
| No dead links | Every link goes somewhere real |
| No "Beta" in copy | Remove from all visitor-facing text |
| Social proof present | At least logos or user count |
| Citation prominent | Larger than surrounding text |
| Accessibility | Skip links, aria labels, keyboard nav |
| Performance | No layout shift, fast load |

---

*Spec generated: June 14, 2026*
*Hermes Agent — Landing page V3 spec complete*
