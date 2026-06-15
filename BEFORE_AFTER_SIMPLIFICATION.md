# BEFORE_AFTER_SIMPLIFICATION.md — Landing Page V2 → V2.5

> **Date:** June 14, 2026
> **Purpose:** Visual comparison of what was removed and why
> **Principle:** The product IS the landing page

---

## The Problem with V2

V2 was a textbook SaaS landing page. It had every section the playbook recommends:

```
V2 Page Structure:
┌─────────────────────────────────────────────┐
│  Navigation (sticky)                        │
├─────────────────────────────────────────────┤
│  Hero (headline + 2 CTAs + trust line)      │
├─────────────────────────────────────────────┤
│  Social Proof (4 placeholder metrics)       │  ← Fake numbers
├─────────────────────────────────────────────┤
│  Features (4 cards with icons)              │  ← Tells, doesn't show
├─────────────────────────────────────────────┤
│  How It Works (3 steps)                     │  ← Unnecessary
├─────────────────────────────────────────────┤
│  Security (3 pillars)                       │  ← Features, not landing
├─────────────────────────────────────────────┤
│  Team Collaboration (split layout)          │  ← Feature, not hook
├─────────────────────────────────────────────┤
│  FAQ (6 accordion items)                    │  ← Defensive, not confident
├─────────────────────────────────────────────┤
│  Final CTA (duplicate of hero)              │  ← Redundant
├─────────────────────────────────────────────┤
│  Footer (4-column)                          │
└─────────────────────────────────────────────┘

Total: 10 sections, ~500 words, 6+ CTAs
Scroll depth: ~4 viewports
Time to understand: 15-20 seconds
```

**Why it failed:** It *explained* MimoNotes instead of *showing* it. Every section was another paragraph of marketing copy. The visitor had to read to understand. Nobody reads landing pages.

---

## The V2.5 Approach

Look at how the best AI products launch:

| Product | Landing Page | What They Show |
|---------|-------------|----------------|
| **claude.ai** | Hero + chat input | The product itself |
| **chatgpt.com** | Hero + chat input | The product itself |
| **perplexity.ai** | Hero + search bar | The product itself |
| **chatbotapp.ai** | Hero + product demo | The product itself |

None of them have:
- Feature grids
- How it works sections
- Testimonials
- FAQ accordions
- Social proof bars

They all follow the same pattern: **Here's what it does. Try it.**

---

## Before → After: Section by Section

### Navigation

```
BEFORE (V2):
┌──────────────────────────────────────────────────────┐
│ [Logo]  Product  How It Works  Security  FAQ    [CTA]│
└──────────────────────────────────────────────────────┘
5 nav items (3 are section anchors that no longer exist)

AFTER (V2.5):
┌──────────────────────────────────────────────────────┐
│ [Logo]                              [Log In]  [CTA]  │
└──────────────────────────────────────────────────────┘
2 items (Log In + CTA). Clean. Nothing to navigate to —
the page IS the product.
```

### Hero

```
BEFORE (V2):
┌──────────────────────────────────────────────────────┐
│                                                      │
│     Your knowledge base,                             │
│     instantly accessible.                            │
│                                                      │
│     Upload your documents and get precise, sourced   │
│     answers in seconds — not hours of searching.     │
│                                                      │
│     [ Start Free — No Credit Card  → ]               │
│     [ View Demo ]                                    │
│                                                      │
│     Free for up to 50 documents · No credit card     │
│     required · Set up in 2 minutes                   │
│                                                      │
│     ┌──────────────────────────────────────┐         │
│     │  [Small product mockup]              │         │
│     └──────────────────────────────────────┘         │
│                                                      │
└──────────────────────────────────────────────────────┘
Hero: headline + subheadline + 2 CTAs + trust line + small mockup
4 text elements competing for attention

AFTER (V2.5):
┌──────────────────────────────────────────────────────┐
│                                                      │
│     Your knowledge base,                             │
│     instantly accessible.                            │
│                                                      │
│     Upload documents. Get precise answers.           │
│                                                      │
│     [ Start Free → ]                                 │
│                                                      │
└──────────────────────────────────────────────────────┘
Hero: headline + subheadline + 1 CTA
3 elements. Clear hierarchy. 5-second understanding.
```

### Product Showcase

```
BEFORE (V2):
  Small mockup inside hero section (30% of hero height)
  Surrounded by text, CTAs, trust line
  Easy to miss

AFTER (V2.5):
┌──────────────────────────────────────────────────────┐
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  │     FULL-WIDTH PRODUCT MOCKUP                │   │
│  │     (40-50% of viewport height)              │   │
│  │                                              │   │
│  │  Sidebar │  Chat with source citations       │   │
│  │  (docs)  │  clearly visible                  │   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
└──────────────────────────────────────────────────────┘
The product IS the landing page. No explanation needed.
Source citations visible = instant differentiation.
```

### Sections Removed

```
REMOVED: Social Proof Bar
  Why: Placeholder metrics (500+ Teams, 4.8/5 Rating) are not credible
        for a product in beta. Real metrics come later.

REMOVED: Core Features (4 cards)
  Why: The product mockup shows the features. Cards that say
        "AI Chat" and "Knowledge Base" add nothing when the
        visitor can SEE the AI chat and knowledge base.

REMOVED: How It Works (3 steps)
  Why: Upload → Ask → Answer is self-evident from the product.
        Explaining obvious workflows insults the visitor's intelligence.

REMOVED: Security Section
  Why: Important, but not a landing page hook. Move to:
        - Footer link → /security page
        - In-product settings
        - Documentation

REMOVED: Team Collaboration
  Why: A feature, not a value proposition. Show it in-product,
        not as a marketing section.

REMOVED: FAQ (6 items)
  Why: Defensive design. Confident products don't need FAQs on
        the landing page. Answer questions in-product or docs.

REMOVED: Final CTA (duplicate)
  Why: One CTA in the hero is enough. Repeating it at the bottom
        of a long page was compensating for the page being too long.
```

---

## Metrics Comparison

| Metric | V2 | V2.5 | Change |
|--------|-----|------|--------|
| Sections | 10 | 3 | -70% |
| Scroll depth | ~4 viewports | ~1.5 viewports | -62% |
| Text volume | ~500 words | ~30 words | -94% |
| CTAs | 6+ | 1 (nav + hero) | -83% |
| Icons | 15 | 3 | -80% |
| Time to understand | 15-20s | <5s | -75% |
| Placeholder content | Yes (metrics, testimonials) | None | Clean |

---

## Design Principles Applied

### 1. Product as Hero
The mockup isn't an illustration — it's a screenshot of the actual product experience. The source citation in the AI response is the key differentiator. It should be immediately visible.

### 2. Confidence over Explanation
V2 *explained* MimoNotes ("Upload PDF, DOCX, TXT, CSV..."). V2.5 *shows* it. Confident products don't need to list features — they demonstrate them.

### 3. 5-Second Test
A visitor lands on the page. Within 5 seconds they should:
1. Read the headline → "knowledge base, instantly accessible"
2. See the product → chat interface with source citations
3. Understand the value → upload docs, get answers with sources
4. Know what to do → "Start Free" button

### 4. Single Scroll
The entire page is consumable in one scroll on desktop. No pagination, no "scroll to learn more." The product showcase below the hero does all the work.

### 5. Zero Filler
Every element on the page earns its place. If an element can be removed without reducing comprehension, it should be removed.

---

## What Stays

| Element | Why It Stays |
|---------|-------------|
| Sticky nav with backdrop-blur | Standard, expected, functional |
| Headline | Clear value proposition in 6 words |
| Subheadline | 6 words that explain the product |
| Single CTA | "Start Free" — low friction, clear action |
| Product mockup | The hero of the page — shows the product |
| Source citation in mockup | Key differentiator — visible immediately |
| Minimal footer | Legal/compliance requirement |

---

## Reference: How Competitors Do It

### claude.ai
```
[Nav: Claude logo + Sign Up]
[Hero: "Claude" + tagline + chat input]
[Chat interface IS the landing page]
```
No features. No FAQ. No social proof. The product speaks.

### chatgpt.com
```
[Nav: Logo + Log in + Sign up]
[Hero: "ChatGPT" + description + message input]
[Chat interface IS the landing page]
```
Same pattern. Product-first.

### perplexity.ai
```
[Nav: Logo + Sign in + Sign up]
[Hero: "Where knowledge begins" + search bar]
[Search interface IS the landing page]
```
Aspirational headline + product input.

### chatbotapp.ai
```
[Nav: Logo + CTA]
[Hero: headline + product demo video/screenshot]
[Product showcase IS the landing page]
```
Show, don't tell.

**Common pattern:** Hero + Product + CTA. Nothing else.

---

*Report generated: 2026-06-14*
*Hermes Agent — V2.5 simplification analysis*
