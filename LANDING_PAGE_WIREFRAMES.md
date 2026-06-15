# LANDING_PAGE_WIREFRAMES.md — MimoNotes V2.6

> **Date:** June 14, 2026
> **Purpose:** ASCII wireframes for every section of the landing page
> **Viewport:** Desktop (1440px) primary, Mobile (375px) secondary

---

## Full Page Wireframe (Desktop)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ████ HEADER (sticky, backdrop-blur)                                       │
│                                                                            │
│  [Bot Icon] MimoNotes        Features  Pricing  Enterprise  Docs   [CTA] │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                         ████ HERO                                          │
│                                                                            │
│                      ┌─────────────────┐                                   │
│                      │ AI KNOWLEDGE    │                                   │
│                      │ WORKSPACE       │                                   │
│                      └─────────────────┘                                   │
│                                                                            │
│                       Your knowledge base,                                 │
│                       instantly accessible.                                │
│                                                                            │
│            Upload documents, organize team knowledge, and get              │
│            answers backed by real sources — all in one workspace.          │
│                                                                            │
│                   [ Start Free ]      [ Book Demo ]                        │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ PRODUCT SHOWCASE                                   │
│                    (50-60% of viewport)                                    │
│                                                                            │
│         ┌────────────────────────────────────────────────────┐            │
│         │ ● ● ●  MimoNotes                                   │            │
│         ├────────────┬───────────────────────────────────────┤            │
│         │            │                                       │            │
│         │  SIDEBAR   │          CHAT AREA                    │            │
│         │            │                                       │            │
│         │  Documents │    ┌──────────────────────────┐      │            │
│         │  ────────  │    │ What is our vacation     │      │            │
│         │  📄 Handbk │    │ policy?                  │      │            │
│         │  📄 Q4 Rpt │    └──────────────────────────┘      │            │
│         │  📄 API    │                                       │            │
│         │  📄 Onbrd  │    ┌──────────────────────────┐      │            │
│         │            │    │ Full-time employees are   │      │            │
│         │            │    │ entitled to 20 days of    │      │            │
│         │            │    │ paid vacation per year... │      │            │
│         │            │    │                           │      │            │
│         │            │    │ ┌───────────────────────┐ │      │            │
│         │            │    │ │ 📄 Employee Handbook  │ │      │            │
│         │            │    │ │    Section 4.2        │ │      │            │
│         │            │    │ └───────────────────────┘ │      │            │
│         │            │    └──────────────────────────┘      │            │
│         │            │                                       │            │
│         └────────────┴───────────────────────────────────────┘            │
│                                                                            │
│              shadow: 0 25px 50px primary/10                                │
│              border-radius: 16px                                           │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ KNOWLEDGE YOU CAN TRUST                           │
│                                                                            │
│               Every answer is backed                                       │
│               by real sources.                                             │
│                                                                            │
│    ┌─────────────────────┐    ┌──────────────────────────┐                │
│    │                     │    │                          │                │
│    │  VISUAL DEMO        │    │  Source Attribution      │                │
│    │                     │    │                          │                │
│    │  ┌───────────────┐  │    │  Every answer links to   │                │
│    │  │ What's our    │  │    │  the exact document,     │                │
│    │  │ vacation      │  │    │  page, and paragraph     │                │
│    │  │ policy?       │  │    │  it came from.           │                │
│    │  └───────────────┘  │    │                          │                │
│    │                     │    │  No hallucinations.      │                │
│    │  ┌───────────────┐  │    │  No guessing.           │                │
│    │  │ Employees are │  │    │  Just verified answers.  │                │
│    │  │ entitled to   │  │    │                          │                │
│    │  │ 20 days...    │  │    │                          │                │
│    │  └───────────────┘  │    │                          │                │
│    │                     │    │                          │                │
│    │  ┌───────────────┐  │    │                          │                │
│    │  │ 📄 Employee   │  │    │                          │                │
│    │  │ Handbook 4.2  │  │    │                          │                │
│    │  └───────────────┘  │    │                          │                │
│    │                     │    │                          │                │
│    └─────────────────────┘    └──────────────────────────┘                │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ FEATURE GRID                                       │
│                                                                            │
│               Everything your team needs.                                  │
│                                                                            │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│    │  💬 Ask      │  │  📁 Organize │  │  👥 Collab   │                  │
│    │              │  │              │  │              │                  │
│    │  Find        │  │  Keep        │  │  Invite      │                  │
│    │  answers     │  │  company     │  │  your        │                  │
│    │  across      │  │  knowledge   │  │  entire      │                  │
│    │  your docs.  │  │  in one      │  │  team.       │                  │
│    │              │  │  place.      │  │              │                  │
│    └──────────────┘  └──────────────┘  └──────────────┘                  │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│    │  ✓ Verify    │  │  📄 Analyze  │  │  🌐 Deploy   │                  │
│    │              │  │              │  │              │                  │
│    │  Every       │  │  Chat with   │  │  Embed AI    │                  │
│    │  answer      │  │  PDFs and    │  │  into your   │                  │
│    │  includes    │  │  documents.  │  │  website.    │                  │
│    │  citations.  │  │              │  │              │                  │
│    └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ TEAM COLLABORATION                                 │
│                                                                            │
│              One workspace for                                             │
│              your entire team.                                             │
│                                                                            │
│    ┌───────────────────┐    ┌────────────────────────────┐                │
│    │                   │    │  ┌──────────────────────┐  │                │
│    │  Invite           │    │  │ Workspace            │  │                │
│    │  teammates.       │    │  │                      │  │                │
│    │  Share docs.      │    │  │ Members    4         │  │                │
│    │  Get the same     │    │  │ Documents  12        │  │                │
│    │  accurate answers.│    │  │ Chats      48        │  │                │
│    │                   │    │  │                      │  │                │
│    │  ✓ Workspace      │    │  │ ┌────┐ ┌────┐      │  │                │
│    │    Switching      │    │  │ │ SC │ │ MR │ ...  │  │                │
│    │  ✓ Team           │    │  │ └────┘ └────┘      │  │                │
│    │    Invitations    │    │  │                      │  │                │
│    │  ✓ Role           │    │  └──────────────────────┘  │                │
│    │    Management     │    │                            │                │
│    │  ✓ Shared         │    │                            │                │
│    │    Knowledge      │    │                            │                │
│    └───────────────────┘    └────────────────────────────┘                │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ SECURITY                                           │
│                    (bg-muted/30)                                           │
│                                                                            │
│                  Private by default.                                       │
│                                                                            │
│         ✓ Workspace Isolation          ✓ Encrypted Data                   │
│         ✓ Audit Logging                ✓ Self-Hosted Ready                │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ BETA USERS                                         │
│                                                                            │
│                     Early Access                                           │
│                                                                            │
│           We're working closely with our first beta users                  │
│           to shape the future of MimoNotes.                               │
│                                                                            │
│                       [ Join Beta ]                                        │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ PRICING                                            │
│                                                                            │
│                    Simple pricing.                                         │
│                                                                            │
│    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│    │  STARTER     │  │  PRO ★       │  │  ENTERPRISE  │                  │
│    │              │  │  (highlighted)│  │              │                  │
│    │  Free        │  │  Coming Soon  │  │  Contact Us  │                  │
│    │  During Beta │  │              │  │              │                  │
│    │              │  │              │  │              │                  │
│    │  ✓ 50 docs   │  │  ✓ Unlimited │  │  ✓ Custom    │                  │
│    │  ✓ Chat      │  │  ✓ Teams     │  │  ✓ SSO       │                  │
│    │  ✓ 1 user    │  │  ✓ All       │  │  ✓ SLA       │                  │
│    │              │  │    features  │  │  ✓ Support   │                  │
│    └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ FAQ                                                │
│                                                                            │
│               Frequently asked questions.                                  │
│                                                                            │
│         What document formats are supported?              [▼]             │
│         ─────────────────────────────────────────────────────             │
│         Is my data secure?                                [▼]             │
│         ─────────────────────────────────────────────────────             │
│         Can I use my own AI model?                        [▼]             │
│         ─────────────────────────────────────────────────────             │
│         How does source attribution work?                [▼]             │
│         ─────────────────────────────────────────────────────             │
│         Is there a free plan?                             [▼]             │
│         ─────────────────────────────────────────────────────             │
│         What integrations are available?                 [▼]             │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ FINAL CTA                                          │
│                    (bg-muted/30)                                           │
│                                                                            │
│              Bring your team's knowledge                                   │
│              into one workspace.                                           │
│                                                                            │
│                   [ Start Free ]      [ Book Demo ]                        │
│                                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                    ████ FOOTER                                             │
│                                                                            │
│  [Bot Icon] MimoNotes                                                      │
│                                                                            │
│  Product       Company       Resources       Legal                         │
│  Features      About         Documentation   Privacy                       │
│  Pricing       Blog          API Reference   Terms                         │
│  Status        Careers                       Security                      │
│  Enterprise    Contact                                                           │
│                                                                            │
│  ──────────────────────────────────────────────────────────────────────    │
│  © 2026 MimoNotes. All rights reserved.                                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Mobile Wireframe (375px)

```
┌──────────────────────┐
│ [Bot] MimoNotes  [▶] │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ AI KNOWLEDGE   │  │
│  │ WORKSPACE      │  │
│  └────────────────┘  │
│                      │
│  Your knowledge      │
│  base, instantly     │
│  accessible.         │
│                      │
│  Upload documents,   │
│  organize team       │
│  knowledge...        │
│                      │
│  [ Start Free ]      │
│  [ Book Demo ]       │
│                      │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │ ● ● ●  MimoNotes│  │
│  ├────────────────┤  │
│  │                │  │
│  │ What is our    │  │
│  │ vacation       │  │
│  │ policy?        │  │
│  │                │  │
│  │ Employees are  │  │
│  │ entitled to    │  │
│  │ 20 days...     │  │
│  │                │  │
│  │ 📄 Employee    │  │
│  │ Handbook 4.2   │  │
│  │                │  │
│  └────────────────┘  │
│                      │
├──────────────────────┤
│                      │
│  Every answer is     │
│  backed by real      │
│  sources.            │
│                      │
│  [Visual demo]       │
│  [Explanation]       │
│                      │
├──────────────────────┤
│                      │
│  Everything your     │
│  team needs.         │
│                      │
│  ┌────────────────┐  │
│  │ 💬 Ask         │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ 📁 Organize    │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ 👥 Collaborate │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ ✓ Verify       │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ 📄 Analyze     │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ 🌐 Deploy      │  │
│  └────────────────┘  │
│                      │
├──────────────────────┤
│ (remaining sections) │
│ ...                  │
├──────────────────────┤
│ [Footer: stacked]    │
└──────────────────────┘
```

---

*Wireframes generated: 2026-06-14*
*Hermes Agent — Sprint B V2.6 wireframes*
