# IMPLEMENTATION_PLAN_V27.md — MimoNotes Landing Page V2.7

> **Date:** June 14, 2026
> **Scope:** Frontend-only landing page redesign
> **Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Lucide
> **Estimate:** 4-6 hours (down from V2.6's 6-8h)

---

## 1. Goal

Rewrite `app/page.tsx` from V2 to V2.7 — a ruthlessly focused, product-first landing page with real screenshots, 136 words, and 9 sections.

---

## 2. V2.6 → V2.7 Changes

| Metric | V2.6 | V2.7 | Change |
|--------|------|------|--------|
| Sections | 12 | 9 | -25% |
| Word count | ~354 | ~136 | -62% |
| CTA types | 3 | 1 | -67% |
| Feature cards | 6 | 3 | -50% |
| Screenshots needed | 0 (CSS mockup) | 2 (real) | +2 |
| Dead links | 6 | 0 | -100% |
| Framer Motion | Yes | Yes | Same |
| Components | 12 new | 9 new | -25% |

---

## 3. File Changes

| File | Action | Description |
|------|--------|-------------|
| `app/page.tsx` | **Rewrite** | V2.7 landing page (9 sections) |
| `components/landing/*.tsx` | **Create** | 9 section components |
| `public/images/landing-showcase.webp` | **Create** | Real product screenshot |
| `public/images/landing-team.webp` | **Create** | Real team/workspace screenshot |
| `package.json` | **Add** | `framer-motion` |

**No other files change.** No routes, no APIs, no DB.

---

## 4. Implementation Steps

### Step 1: Capture Screenshots (30 min)

**This is the most critical step.** The landing page depends on real product screenshots.

**Screenshot 1: Product Showcase**
1. Start dev server: `npm run dev`
2. Open localhost:3000
3. Log in
4. Navigate to /chat
5. Ask: "What is our vacation policy?"
6. Wait for answer with source citation
7. Resize browser to 1440px wide
8. Capture screenshot showing: sidebar + chat + citation
9. Crop to product area only
10. Optimize: convert to WebP, target < 200KB
11. Save: `public/images/landing-showcase.webp`

**Screenshot 2: Team Workspace**
1. Navigate to /settings/workspace or team view
2. Capture workspace with members visible
3. Crop to workspace area
4. Optimize: convert to WebP
5. Save: `public/images/landing-team.webp`

### Step 2: Install framer-motion (5 min)

```bash
npm install framer-motion
```

### Step 3: Create section components (2h)

| Component | File | Lines (est.) |
|-----------|------|-------------|
| `LandingHeader` | `components/landing/header.tsx` | ~60 |
| `LandingHero` | `components/landing/hero.tsx` | ~40 |
| `ProductShowcase` | `components/landing/product-showcase.tsx` | ~50 |
| `FeatureHighlights` | `components/landing/feature-highlights.tsx` | ~45 |
| `TeamSection` | `components/landing/team-section.tsx` | ~40 |
| `SecuritySection` | `components/landing/security-section.tsx` | ~25 |
| `PricingSection` | `components/landing/pricing-section.tsx` | ~50 |
| `FaqSection` | `components/landing/faq-section.tsx` | ~40 |
| `LandingFooter` | `components/landing/footer.tsx` | ~45 |

**Total: ~395 lines across 9 files**

### Step 4: Compose page.tsx (15 min)

```tsx
import LandingHeader from "@/components/landing/header";
import LandingHero from "@/components/landing/hero";
import ProductShowcase from "@/components/landing/product-showcase";
import FeatureHighlights from "@/components/landing/feature-highlights";
import TeamSection from "@/components/landing/team-section";
import SecuritySection from "@/components/landing/security-section";
import PricingSection from "@/components/landing/pricing-section";
import FaqSection from "@/components/landing/faq-section";
import LandingFooter from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader />
      <main>
        <LandingHero />
        <ProductShowcase />
        <FeatureHighlights />
        <TeamSection />
        <SecuritySection />
        <PricingSection />
        <FaqSection />
      </main>
      <LandingFooter />
    </div>
  );
}
```

### Step 5: Add animations (30 min)

Minimal Framer Motion:
- Hero: staggered fade-in (3 elements, 0.1s delay each)
- Product Showcase: fade-in + scale 0.98→1
- Feature cards: fade-in on scroll
- Other sections: fade-in on scroll

### Step 6: Responsive testing (30 min)

Test at 375px, 768px, 1024px, 1440px.

### Step 7: Build + Test + Lighthouse (30 min)

```bash
npm run build          # 0 errors
npx vitest run         # 353/353 pass
npx lighthouse ...     # all > 95
```

---

## 5. Component Specifications

### ProductShowcase (`components/landing/product-showcase.tsx`)

```tsx
// Server component (no "use client")
// Uses next/image for optimized screenshots

import Image from "next/image";

export default function ProductShowcase() {
  return (
    <section id="product" className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-border shadow-2xl shadow-primary/10">
          <Image
            src="/images/landing-showcase.webp"
            alt="MimoNotes chat interface showing a question about vacation policy, AI response, and source citation from Employee Handbook"
            width={1440}
            height={900}
            priority
            className="w-full h-auto"
          />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground italic">
          Every answer includes the exact source.
        </p>
      </div>
    </section>
  );
}
```

### FeatureHighlights (`components/landing/feature-highlights.tsx`)

```tsx
// Server component
// 3 text-only cards, no icons

const features = [
  { title: "Ask", description: "Ask questions across all your documents." },
  { title: "Verify", description: "Every answer links back to its source." },
  { title: "Share", description: "Keep your entire team aligned." },
];

export default function FeatureHighlights() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/20"
            >
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

### SecuritySection — compress to 1 paragraph

```tsx
<section id="security" className="bg-muted/30 py-16 sm:py-20">
  <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
    <h2 className="text-3xl font-bold tracking-tight">Private by default.</h2>
    <p className="mt-4 text-muted-foreground">
      AES-256 encryption. Workspace isolation. Audit logging.
    </p>
  </div>
</section>
```

---

## 6. Verification Checklist

| Check | Requirement |
|-------|-------------|
| `npm run build` | 0 errors |
| `npx vitest run` | 353/353 pass |
| Real screenshots | 2 (product showcase + team) |
| Dead links | 0 |
| CTA count | ≤ 3 "Start Free" buttons |
| Sections | 9 |
| Word count | < 200 |
| 5-second test | Visitor understands "AI that answers from documents with citations" |
| Lighthouse | All > 95 |
| Mobile 375px | All sections render |
| Dark mode | All tokens resolve |

---

## 7. Rollback

```bash
git checkout HEAD~1 -- app/page.tsx
rm -rf components/landing/
rm public/images/landing-*.webp
npm uninstall framer-motion
```

---

## 8. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Screenshot quality | High — entire page depends on it | Take multiple, pick best |
| Screenshot file size | Low — WebP optimization | Target < 200KB |
| Framer Motion bundle | Low — tree-shaking | Import only what's used |
| Build time | None | Small components |

---

*Plan generated: 2026-06-14*
*Hermes Agent — Sprint B V2.7 implementation plan*
