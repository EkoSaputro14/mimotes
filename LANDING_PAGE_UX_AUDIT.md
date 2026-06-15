# Landing Page UX Audit — MimoNotes

**Date:** June 14, 2026
**Auditor:** Principal Product Designer + Staff UX Engineer
**Scope:** Full landing page (app/page.tsx + 9 components)
**Current Version:** V2.7
**Status:** Read-only audit — no code changes

---

## Current Score: 6.5 / 10

V2.7 improved from V2.6 (4.8/10) by removing redundant sections, simplifying copy, and reducing word count. But the landing page still has structural issues that hurt conversion, trust, and mobile experience. The biggest problems: CSS mockup instead of real screenshot, weak CTAs, no social proof, and hero animation that hides the differentiator.

---

## Competitive Comparison

| Dimension | MimoNotes V2.7 | ChatbotApp.ai | Claude | OpenAI | Notion AI | Perplexity | Linear |
|-----------|----------------|---------------|--------|--------|-----------|------------|--------|
| **Headline clarity** | 6/10 | 9/10 | 9/10 | 8/10 | 7/10 | 9/10 | 9/10 |
| **Product showcase** | 4/10 | 10/10 | 9/10 | 9/10 | 8/10 | 8/10 | 8/10 |
| **CTA effectiveness** | 5/10 | 9/10 | 8/10 | 8/10 | 7/10 | 8/10 | 8/10 |
| **Trust signals** | 3/10 | 6/10 | 8/10 | 9/10 | 8/10 | 7/10 | 9/10 |
| **Mobile experience** | 5/10 | 8/10 | 9/10 | 9/10 | 8/10 | 8/10 | 9/10 |
| **Social proof** | 0/10 | 7/10 | 7/10 | 8/10 | 9/10 | 6/10 | 8/10 |
| **Conversion path** | 5/10 | 9/10 | 8/10 | 8/10 | 7/10 | 8/10 | 8/10 |
| **Overall** | **6.5/10** | **8.5/10** | **8.5/10** | **8.5/10** | **7.5/10** | **7.5/10** | **8.5/10** |

### What Competitors Do Better

**ChatbotApp.ai:**
- Shows the ACTUAL product immediately (no marketing sections)
- Hero IS the product demo
- Single CTA: "Try it free"
- No feature grid, no FAQ, no pricing section
- The page IS the product

**Claude:**
- Brand-first: "Claude" is the headline
- Product input (chat box) visible immediately
- Minimal chrome, maximum product
- No feature grid, no pricing, no FAQ
- Trust through brand recognition

**OpenAI:**
- Product-first: "ChatGPT" with product screenshot
- Clear value prop: "Get instant answers"
- Multiple entry points (Try ChatGPT, API, Enterprise)
- Trust through brand + enterprise logos

**Notion AI:**
- Product in context: document + AI features visible
- Warm, professional design
- Social proof: "Trusted by teams at..."
- Clear pricing with feature comparison

**Perplexity:**
- Aspirational: "Where knowledge begins"
- Product demo in hero
- Search-first design (matches product)
- Clean, minimal

**Linear:**
- Design-forward: premium feel
- Product screenshots throughout
- Feature details with real UI
- Trust through design quality

---

## Top 30 UX Issues

### Critical (1-10)

| # | Issue | Category | Impact | Effort |
|---|-------|----------|--------|--------|
| 1 | **CSS mockup instead of real screenshot** | Product | Critical — visitors notice it's not real | Low (screenshot) |
| 2 | **Hero animation hides the differentiator** | Hero | Critical — rotating words delay comprehension | Zero (remove) |
| 3 | **No social proof anywhere** | Trust | Critical — no logos, no testimonials, no numbers | Medium |
| 4 | **Two CTAs in hero dilute conversion** | CTA | High — "Start chatting" + "Get started free" | Zero (remove one) |
| 5 | **"Try the demo" badge above headline** | Hero | High — steals visual hierarchy from headline | Zero (remove) |
| 6 | **No real product screenshot** | Product | Critical — CSS mockup feels like wireframe | Low |
| 7 | **"Free During Beta" hurts trust** | Trust | High — signals unfinished product | Zero (change copy) |
| 8 | **Security section is too brief** | Trust | Medium — one line isn't convincing | Low |
| 9 | **Footer has dead links (#)** | Trust | Medium — "Privacy" and "Terms" link to # | Zero (remove) |
| 10 | **No "How it works" section** | Conversion | Medium — visitors don't understand the flow | Medium |

### High (11-20)

| # | Issue | Category | Impact | Effort |
|---|-------|----------|--------|--------|
| 11 | **Hero headline rotating animation is slow** | Hero | High — 2s per word, 5 words = 10s cycle | Zero (remove animation) |
| 12 | **Product showcase is too small on mobile** | Mobile | High — sidebar hidden, chat area compressed | Medium |
| 13 | **No "Get started free" below product showcase** | CTA | Medium — visitor scrolls past hero, no CTA | Low |
| 14 | **Feature cards are too generic** | Content | Medium — "Ask", "Verify", "Share" could be anyone | Low |
| 15 | **Team section shows fake data** | Trust | Medium — "4 members", fake names | Medium |
| 16 | **Pricing says "Free During Beta" — not "Free"** | Conversion | Medium — "Beta" word hurts confidence | Zero |
| 17 | **No comparison with alternatives** | Conversion | Medium — visitors don't know why MimoNotes vs ChatPDF | Medium |
| 18 | **FAQ is defensive — confident products don't need it** | Content | Low — but it's only 3 questions, acceptable | Low |
| 19 | **No video/demo** | Conversion | Medium — video converts 2x better than static | High |
| 20 | **Mobile nav has no hamburger menu** | Mobile | High — only logo + CTA, no nav links | Medium |

### Medium (21-30)

| # | Issue | Category | Impact | Effort |
|---|-------|----------|--------|--------|
| 21 | **No email capture / newsletter** | Conversion | Low — missed lead generation | Low |
| 22 | **No "Built with" / tech stack badge** | Trust | Low — developers like knowing the stack | Low |
| 23 | **No animated product demo** | Product | Medium — static mockup is less engaging | High |
| 24 | **Security section has no visual** | Trust | Low — just text, no icons or badges | Low |
| 25 | **Pricing card has no "most popular" badge** | Conversion | Low — subtle psychology missing | Zero |
| 26 | **No "What people are saying" section** | Trust | Medium — social proof is the #1 trust signal | High |
| 27 | **Hero subheadline is too long** | Hero | Medium — 24 words, visitors won't read all | Low |
| 28 | **No A/B testing infrastructure** | Conversion | Low — can't optimize without data | Medium |
| 29 | **No exit-intent popup** | Conversion | Low — last chance to capture leads | Medium |
| 30 | **Page load time not optimized** | Performance | Medium — framer-motion adds JS bundle | Medium |

---

## Conversion Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Two CTAs in hero | Dilutes primary action | Remove "Start chatting", keep only "Get started free" |
| "Try the demo" badge above headline | Steals visual hierarchy | Remove badge, let headline be first thing |
| No CTA below product showcase | Visitor scrolls past hero, no action | Add "Start Free" button below showcase |
| "Free During Beta" language | Signals unfinished product | Change to "Free" or "Free forever" |
| No comparison section | Visitors don't know why MimoNotes | Add "Why MimoNotes?" with 3 comparison points |
| No exit-intent capture | Lost leads | Add exit-intent popup with email capture |
| No video demo | Lower engagement than video | Add 30s product demo video |
| Pricing card too minimal | Doesn't show enough value | Add feature list with checkmarks |

---

## Trust Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| No social proof (logos, testimonials) | No external validation | Add "Trusted by X teams" or real testimonials |
| CSS mockup looks fake | Visitors notice it's not real | Replace with actual product screenshot |
| "Free During Beta" language | Signals unfinished product | Remove "Beta" from all copy |
| Dead footer links (#) | Looks unfinished | Remove all dead links |
| No company info / about | No sense of who's behind it | Add brief "About MimoNotes" or team photos |
| No security badges | No visual trust signals | Add AES-256, SOC2 badges (when available) |
| Fake team names | "Sarah Chen", "Marcus Rivera" are fake | Use real team or remove names |
| No user count | No scale proof | Add "X teams using MimoNotes" when available |

---

## Mobile Issues

| Issue | Impact | Fix |
|-------|--------|-----|
| Product showcase sidebar hidden | Loses context on mobile | Show chat-only view with larger citation |
| No hamburger menu | Can't access nav on mobile | Add mobile menu with all links |
| Hero text too large | May overflow on small screens | Ensure responsive sizing (text-4xl → text-3xl) |
| Feature cards stack vertically | Good, but too much scroll | Consider 2-column on tablet |
| Pricing card full-width | Good, but CTA too small | Ensure CTA is full-width on mobile |
| FAQ accordion works | Good | No change needed |
| Footer stacks well | Good | No change needed |

---

## Hero Issues

| Issue | Before | After |
|-------|--------|-------|
| Rotating animation | 5 words cycle every 2s | Remove animation, show static "Get cited answers" |
| "Try the demo" badge | Above headline, steals focus | Remove entirely |
| Two CTAs | "Start chatting" + "Get started free" | Single CTA: "Get started free" |
| Subheadline length | 24 words across 2 lines | Reduce to 12-15 words |
| No CTA below showcase | Visitor must scroll back up | Add CTA below product showcase |
| Headline font size | text-5xl md:text-7xl | Keep, but ensure mobile scaling |

---

## CTA Issues

| Issue | Location | Fix |
|-------|----------|-----|
| "Try the demo" badge | Above headline | Remove |
| "Start chatting" button | Hero | Remove (keep only "Get started free") |
| "Get started free" button | Hero | Keep, make primary |
| "Start Free" button | Header | Keep |
| "Start Free" button | Pricing | Keep |
| No CTA below product showcase | After showcase | Add "Get started free" |
| "Start Free" in pricing | Pricing card | Keep |
| No final CTA | Before footer | Add one: "Ready to try?" with single button |

---

## Section-by-Section Analysis

### 1. Header
**Score: 7/10**
- ✅ Sticky with backdrop-blur
- ✅ Clean nav links
- ✅ "Start Free" CTA
- ❌ No mobile hamburger menu
- ❌ "Product" link scrolls to CSS mockup, not real product

### 2. Hero
**Score: 5/10**
- ✅ "Ask questions. Get cited answers." is strong
- ✅ Clean layout
- ❌ Rotating animation delays comprehension
- ❌ "Try the demo" badge steals hierarchy
- ❌ Two CTAs dilute conversion
- ❌ Subheadline too long (24 words)

### 3. Product Showcase
**Score: 4/10**
- ✅ Correctly positioned as centerpiece
- ✅ Shows citation (the differentiator)
- ❌ CSS mockup, not real screenshot
- ❌ "Vacation policy" use case is boring
- ❌ Citation not prominent enough
- ❌ No annotation pointing to citation

### 4. Feature Highlights
**Score: 5/10**
- ✅ 3 cards (reduced from 6)
- ✅ Text-only (no generic icons)
- ❌ Too generic — "Ask", "Verify", "Share" could be anyone
- ❌ No visual hierarchy between cards

### 5. Team Section
**Score: 4/10**
- ✅ Shows team collaboration concept
- ✅ Clean member list
- ❌ Fake data ("4 members", fake names)
- ❌ "Everyone works from the same source of truth" is generic
- ❌ No real product screenshot of workspace

### 6. Security
**Score: 5/10**
- ✅ "Private by default" is strong headline
- ✅ Compact
- ❌ Too brief — one line isn't convincing
- ❌ No visual trust signals (badges, icons)
- ❌ No mention of "no training on your data"

### 7. Pricing
**Score: 5/10**
- ✅ Single tier (correct for beta)
- ✅ "Free During Beta" is honest
- ❌ "Beta" word hurts trust
- ❌ No feature comparison
- ❌ "Pro plans launching soon" is vague

### 8. FAQ
**Score: 6/10**
- ✅ 3 questions only (correct)
- ✅ Native `<details>` (zero JS)
- ✅ Answers are short
- ❌ Defensive design (confident products skip FAQ)
- ❌ No "How does it work?" question

### 9. Footer
**Score: 4/10**
- ✅ Clean layout
- ✅ Brand mark present
- ❌ Dead links (#) for Privacy and Terms
- ❌ No contact email
- ❌ No social links

---

## What V2.7 Got Right

1. **Reduced from 12 to 9 sections** — Less scrolling, more focus
2. **Hero headline is strong** — "Ask questions. Get cited answers." is clear
3. **Product Showcase is centerpiece** — Correct priority
4. **3 feature cards, no icons** — Less generic than V2.6
5. **Security section is compact** — One headline + one line
6. **FAQ is minimal** — 3 questions, short answers
7. **Footer is clean** — Only real links

---

## What V2.7 Still Gets Wrong

1. **CSS mockup instead of real screenshot** — The #1 issue
2. **Rotating hero animation** — Delays comprehension by 10 seconds
3. **Two CTAs in hero** — Dilutes conversion
4. **No social proof** — No logos, testimonials, or numbers
5. **"Free During Beta"** — Signals unfinished product
6. **Fake team data** — Hurts credibility
7. **No mobile hamburger menu** — Can't access nav
8. **No CTA below product showcase** — Visitor loses action path

---

## Score Progression

| Version | Score | Key Change |
|---------|-------|------------|
| V2.0 | 3.5/10 | Original landing page |
| V2.5 | 4.0/10 | Simplified sections |
| V2.6 | 4.8/10 | Design review applied |
| V2.7 | 6.5/10 | Ruthless simplification |
| **V3.0 (target)** | **8.0/10** | **Real screenshots + social proof + conversion optimization** |

---

## Top 10 Improvements for V3 (Ranked by ROI)

| Rank | Improvement | Impact | Effort |
|------|-------------|--------|--------|
| 1 | Replace CSS mockup with real screenshot | Critical | Low (screenshot) |
| 2 | Remove rotating hero animation | High | Zero (delete) |
| 3 | Single CTA in hero ("Get started free") | High | Zero (delete one) |
| 4 | Add social proof section (logos or testimonials) | High | Medium |
| 5 | Remove "Beta" from all copy | High | Zero (text change) |
| 6 | Add CTA below product showcase | Medium | Low |
| 7 | Add mobile hamburger menu | Medium | Medium |
| 8 | Make citation more prominent in showcase | Medium | Low |
| 9 | Add "How it works" section (3 steps) | Medium | Medium |
| 10 | Fix footer dead links | Low | Zero (remove) |

---

*Audit generated: June 14, 2026*
*Hermes Agent — Landing page UX audit complete*
