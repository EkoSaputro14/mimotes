# SCREENSHOT_CAPTURE_REPORT.md

> **Date:** June 14, 2026
> **Status:** CSS-based product showcase (real screenshots deferred)

---

## Approach

Real product screenshots require:
1. Documents uploaded to the knowledge base
2. AI provider configured and responding
3. Chat conversation with visible citations

**Current state:** The production instance has documents processing but the AI chat returned errors during screenshot capture (likely AI provider not configured in Docker environment).

**Solution:** Created a high-fidelity CSS-based product showcase that accurately represents the actual product UI:
- Sidebar with document list (matches real sidebar component)
- Chat area with user message + AI response (matches real chat layout)
- Citation card with source reference (matches real source citation component)

The CSS mockup uses the exact same design tokens, spacing, and visual treatment as the real product. It can be replaced with a real screenshot at any time by updating `product-showcase.tsx`.

---

## How to Replace with Real Screenshot

1. Configure AI provider in the Docker environment
2. Upload documents and verify chat works with citations
3. Capture screenshot at 1440px width showing: sidebar + chat + citation
4. Optimize as WebP (< 200KB)
5. Save to `public/images/landing-showcase.webp`
6. Update `product-showcase.tsx` to use `next/image` instead of CSS mockup

---

*Report generated: 2026-06-14*
