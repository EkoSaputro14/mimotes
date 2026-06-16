# IMPLEMENTATION_PLAN.md — MimoNotes Landing Page V2.6

> **Date:** June 14, 2026
> **Scope:** Frontend-only landing page redesign
> **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide
> **Estimate:** 6-8 hours

---

## 1. Goal

Rewrite `app/page.tsx` from V2 (generic SaaS landing page) to V2.6 (premium AI Knowledge Workspace landing page) following the V2.6 spec, wireframes, and content documents.

---

## 2. Current State

| Metric | V2 (Current) |
|--------|-------------|
| File | `app/page.tsx` |
| Lines | 619 |
| Sections | 10 |
| Word count | ~500 |
| CTAs | 6+ |
| Components used | Lucide icons (15), Link |

---

## 3. Target State

| Metric | V2.6 (Target) |
|--------|--------------|
| File | `app/page.tsx` |
| Lines | ~700-800 |
| Sections | 12 |
| Word count | ~354 |
| CTAs | 4 (Start Free ×3, Book Demo ×2, Join Beta ×1) |
| Components used | Lucide icons (12), Link, Button, Badge, Framer Motion |

---

## 4. File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/page.tsx` | **Rewrite** | Complete landing page V2.6 |
| `package.json` | **Add** | `framer-motion` dependency |

**No other files change.** No routes, no APIs, no DB, no layout.

---

## 5. Implementation Steps

### Step 1: Install framer-motion (5 min)

```bash
npm install framer-motion
```

### Step 2: Create section components (2h)

Create reusable section components to avoid monolithic page.tsx:

| Component | File | Purpose |
|-----------|------|---------|
| `LandingHeader` | `components/landing/header.tsx` | Sticky nav with backdrop-blur |
| `LandingHero` | `components/landing/hero.tsx` | Badge + headline + CTAs |
| `ProductShowcase` | `components/landing/product-showcase.tsx` | Full-width product mockup |
| `TrustSection` | `components/landing/trust-section.tsx` | Two-column citation demo |
| `FeatureGrid` | `components/landing/feature-grid.tsx` | 6-card outcome grid |
| `TeamSection` | `components/landing/team-section.tsx` | Split layout + dashboard mockup |
| `SecuritySection` | `components/landing/security-section.tsx` | 4-item compact grid |
| `BetaSection` | `components/landing/beta-section.tsx` | Early Access + CTA |
| `PricingSection` | `components/landing/pricing-section.tsx` | 3-tier pricing cards |
| `FaqSection` | `components/landing/faq-section.tsx` | 6-item accordion |
| `FinalCta` | `components/landing/final-cta.tsx` | Dark section + dual CTA |
| `LandingFooter` | `components/landing/footer.tsx` | 4-column footer |

**Directory structure:**
```
components/landing/
├── header.tsx
├── hero.tsx
├── product-showcase.tsx
├── trust-section.tsx
├── feature-grid.tsx
├── team-section.tsx
├── security-section.tsx
├── beta-section.tsx
├── pricing-section.tsx
├── faq-section.tsx
├── final-cta.tsx
└── footer.tsx
```

### Step 3: Implement each section (3h)

**Implementation order (highest impact first):**

1. **Product Showcase** — The hero of the page. Get the mockup right first.
2. **Hero** — Badge, headline, CTAs. Simple but must be perfect.
3. **Header** — Sticky nav, backdrop-blur, responsive.
4. **Trust Section** — Two-column layout with citation demo.
5. **Feature Grid** — 6 cards, outcome-focused.
6. **Team Section** — Split layout with dashboard mockup.
7. **Security** — Compact 4-item grid.
8. **Pricing** — 3-tier cards with Pro highlighted.
9. **FAQ** — Native `<details>` accordion.
10. **Beta Section** — Simple CTA section.
11. **Final CTA** — Dark section, dual buttons.
12. **Footer** — 4-column layout.

### Step 4: Compose page.tsx (15 min)

```tsx
// app/page.tsx
import LandingHeader from "@/components/landing/header";
import LandingHero from "@/components/landing/hero";
import ProductShowcase from "@/components/landing/product-showcase";
import TrustSection from "@/components/landing/trust-section";
import FeatureGrid from "@/components/landing/feature-grid";
import TeamSection from "@/components/landing/team-section";
import SecuritySection from "@/components/landing/security-section";
import BetaSection from "@/components/landing/beta-section";
import PricingSection from "@/components/landing/pricing-section";
import FaqSection from "@/components/landing/faq-section";
import FinalCta from "@/components/landing/final-cta";
import LandingFooter from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <ProductShowcase />
        <TrustSection />
        <FeatureGrid />
        <TeamSection />
        <SecuritySection />
        <BetaSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
```

### Step 5: Add Framer Motion animations (1h)

Add subtle entrance animations to key sections:

```tsx
// Reusable animation wrapper
"use client";
import { motion } from "framer-motion";

export function FadeIn({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

**Animations:**
- Hero elements: Staggered fade-in (0.1s delay each)
- Product mockup: Fade-in + scale 0.98→1 (0.6s)
- Feature cards: Stagger fade-in on scroll
- Other sections: Fade-in on scroll (once)

### Step 6: Responsive testing (30 min)

Test at:
- 375px (iPhone SE)
- 768px (iPad)
- 1024px (small desktop)
- 1440px (standard desktop)

### Step 7: Build + Test + Lighthouse (30 min)

```bash
npm run build          # Must pass with 0 errors
npx vitest run         # Must pass 353/353
npx lighthouse ...     # Target: all >95
```

---

## 6. Component Specifications

### Header (`components/landing/header.tsx`)

- **Client component** (needs scroll listener + mobile state)
- Sticky: `position: sticky; top: 0; z-index: 50`
- Backdrop blur: `backdrop-blur-xl`
- Border on scroll: Add `border-b border-border` after 50px scroll
- Logo: Bot icon + "MimoNotes" (same as sidebar)
- Center nav: Links to #features, #pricing, #security
- Right: Log In link + Start Free button

### Hero (`components/landing/hero.tsx`)

- **Server component** (no interactivity needed)
- Badge: `<span>` with bg-primary/10, text-primary, rounded-full
- Headline: `<h1>` with responsive text sizes
- Subheadline: `<p>` with text-muted-foreground
- CTAs: Button components from `components/ui/button.tsx`

### Product Showcase (`components/landing/product-showcase.tsx`)

- **Server component**
- CSS-only mockup (no iframe, no image)
- Sidebar: Document list with FileText icons
- Chat: User message + AI response + citation
- Citation is the key differentiator — must be clearly visible

### Trust Section (`components/landing/trust-section.tsx`)

- **Server component**
- Two columns: Visual demo (left) + Explanation (right)
- Visual shows question → answer → citation flow
- Explanation is short: 2 sentences max

### Feature Grid (`components/landing/feature-grid.tsx`)

- **Server component**
- 6 cards in 3×2 grid (2×3 on tablet, 1×6 on mobile)
- Each card: icon + title + 5-word description
- No detail text. No bullet points.

### Team Section (`components/landing/team-section.tsx`)

- **Server component**
- Two columns: Checklist (left) + Dashboard mockup (right)
- Mockup shows workspace stats: Members, Documents, Chats
- Checklist with CheckCircle2 icons

### Security (`components/landing/security-section.tsx`)

- **Server component**
- 2×2 grid of check items
- No body text. Just headline + 4 items.

### Beta Section (`components/landing/beta-section.tsx`)

- **Server component**
- Centered: Headline + body + CTA
- bg-muted/30 background

### Pricing (`components/landing/pricing-section.tsx`)

- **Server component**
- 3 cards in a row
- Pro card: border-primary, ring-2 ring-primary/20
- No invented pricing. "Coming Soon" for Pro.

### FAQ (`components/landing/faq-section.tsx`)

- **Server component** (native `<details>`, zero JS)
- 6 items, accordion pattern
- ChevronDown rotates on open via CSS

### Final CTA (`components/landing/final-cta.tsx`)

- **Server component**
- Dark section (bg-muted/30)
- Headline + 2 CTAs

### Footer (`components/landing/footer.tsx`)

- **Server component**
- 4-column grid
- Links use Next.js `<Link>`

---

## 7. Dependency Changes

| Package | Action | Version |
|---------|--------|---------|
| `framer-motion` | Add | latest |

**No other dependencies.** All other components already exist (Button, Badge from A2).

---

## 8. Verification Checklist

| Check | Requirement |
|-------|-------------|
| `npm run build` | 0 errors |
| `npx vitest run` | 353/353 pass |
| TypeScript strict | No type errors |
| Routes unchanged | All 34 routes resolve |
| APIs unchanged | Zero API modifications |
| DB unchanged | Zero schema changes |
| Mobile (375px) | All sections render correctly |
| Tablet (768px) | 2-column grids work |
| Desktop (1440px) | Full layout, max-w-1200px |
| Dark mode | All tokens resolve |
| Light mode | All tokens resolve |
| Lighthouse Performance | > 95 |
| Lighthouse Accessibility | > 95 |
| Lighthouse SEO | > 95 |
| Lighthouse Best Practices | > 95 |
| Zero emoji | ✅ |
| Zero hardcoded colors | ✅ |
| Zero placeholder metrics | ✅ |
| Zero fake testimonials | ✅ |
| Max 3 CTA types | Start Free, Book Demo, Join Beta |

---

## 9. Rollback Strategy

If V2.6 has issues:

```bash
git checkout HEAD~1 -- app/page.tsx
git checkout HEAD~1 -- components/landing/
npm uninstall framer-motion
```

V2.6 is purely additive — no existing files modified (only app/page.tsx rewritten + new components created).

---

## 10. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Framer Motion bundle size | Low | Tree-shaking, only import what's used |
| Product mockup accuracy | Medium | CSS-only, no images, easy to adjust |
| Mobile responsive issues | Medium | Test at 375px early, fix incrementally |
| Build time increase | Low | New components are small, fast to compile |
| Test failures | None | Zero test files modified |

---

*Plan generated: 2026-06-14*
*Hermes Agent — Sprint B V2.6 implementation plan*
