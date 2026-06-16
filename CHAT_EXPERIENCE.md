# CHAT_EXPERIENCE.md — AI Chat UX Redesign

> Date: 2026-06-10
> Phase: UI-REVAMP — Step 6

---

## Current Problem

- Chat is a basic message list with no source citations
- No retrieval insights (what chunks were used, similarity scores)
- No confidence indicators
- No conversation organization (sessions, folders, search)
- No workspace context switching

## Redesign: Production Chat Experience

### Chat Layout

```
┌──────────┬────────────────────────────────────────────┐
│ Sessions │  💬 Property Auction Q&A            ⋮     │
│          │────────────────────────────────────────────│
│ ● Active │                                            │
│ ──────── │  👤 What is the auction date for          │
│ Today    │     the property in Tegal?                 │
│ ──────── │                                            │
│ 💬 Prop..│  🤖 Based on the property auction          │
│ 💬 DB Sc.│  document (lelang1.jpg), the auction       │
│ 💬 Cost  │  is scheduled for:                         │
│ ──────── │                                            │
│ Yesterday│  📅 May 12, 2026 at 09:45 WIB              │
│ ──────── │                                            │
│ 💬 Sear..│  📎 Source: lelang1.jpg (chunk #0)         │
│          │     Confidence: 82.3%                       │
│          │     [View Source] [Copy]                    │
│          │                                            │
│          │────────────────────────────────────────────│
│          │                                            │
│          │  👤 What about the price?                  │
│          │                                            │
│          │  🤖 The property has two price points:     │
│          │                                            │
│          │  💰 Rp 151,400,000 (original)              │
│          │  💰 Rp 110,000,000 (reduced)               │
│          │                                            │
│          │  📎 Sources (2):                            │
│          │     1. lelang1.jpg (chunk #0) — 82.3%      │
│          │     2. lelang1.jpg (chunk #0) — 81.1%      │
│          │     [View All Sources] [Copy Answer]        │
│          │                                            │
│          │────────────────────────────────────────────│
│          │                                            │
│          │  🔍 Ask about your documents...             │
│          │  ┌──────────────────────────────────────┐  │
│          │  │ Type a message...            [Send]  │  │
│          │  └──────────────────────────────────────┘  │
│          │  [📎 Upload] [🔍 Search] [📊 Context Info] │
│          │                                            │
└──────────┴────────────────────────────────────────────┘
```

### Source Citation Component

```
┌─────────────────────────────────────────────────┐
│ 📎 Sources (3 chunks found)                     │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ 1. lelang1.jpg #0                     82% │  │
│ │    "RUMAH TINGGAL DI KAB TEGAL..."        │  │
│ │    [View] [Copy]                          │  │
│ ├───────────────────────────────────────────┤  │
│ │ 2. lelang1.jpg #0                     81% │  │
│ │    "Tanggal Lelang: 12 Mei 2026..."       │  │
│ │    [View] [Copy]                          │  │
│ ├───────────────────────────────────────────┤  │
│ │ 3. invoice-sample.png #0              79% │  │
│ │    "INV-2026-0042 Total: Rp 193..."       │  │
│ │    [View] [Copy]                          │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [Show less]                                     │
└─────────────────────────────────────────────────┘
```

### Retrieval Insights Panel (Expandable)

```
┌─────────────────────────────────────────────────┐
│ 🔍 Retrieval Insights                           │
│                                                 │
│ Query: "auction date property Tegal"            │
│ Mode: Vector Search                             │
│ Chunks Found: 5 (threshold: 30%)               │
│ Latency: 12ms                                   │
│                                                 │
│ Top Results:                                    │
│ ┌───────────────────────────────────────────┐  │
│ │ 1. lelang1.jpg #0       82.3% ████████░░ │  │
│ │ 2. lelang1.jpg #0       81.1% ████████░░ │  │
│ │ 3. invoice-sample.png   79.0% ███████░░░ │  │
│ │ 4. quarterly-report.png 45.2% ████░░░░░░ │  │
│ │ 5. network-dashboard    38.1% ███░░░░░░░ │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Context Used: 247 / 3000 tokens                 │
│ Model: mimo-v2.5-pro                            │
└─────────────────────────────────────────────────┘
```

### Session Management

```
┌─────────────────────────────────────────────────┐
│ 💬 Sessions                                    │
│                                                 │
│ 🔍 Search sessions...                           │
│                                                 │
│ ● Today                                        │
│ ┌───────────────────────────────────────────┐  │
│ │ 💬 Property Auction Q&A          3 msgs  │  │
│ │ 💬 Database Schema Questions     5 msgs  │  │
│ │ 💬 Cost Analysis Discussion      2 msgs  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Yesterday                                      │
│ ┌───────────────────────────────────────────┐  │
│ │ 💬 Invoice Processing Help       8 msgs  │  │
│ │ 💬 Setup Guide Questions         4 msgs  │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ [+ New Chat]                                    │
└─────────────────────────────────────────────────┘
```

### Confidence Indicators

| Level | Color | Range | Display |
|-------|-------|-------|---------|
| High | Green | >70% | ✅ Strong match |
| Medium | Yellow | 40-70% | ⚡ Possible match |
| Low | Gray | <40% | 💭 Weak match |

### Key UX Improvements

1. **Source Citations** — Every answer shows which documents/chunks were used
2. **Confidence Scores** — Users see how confident the system is
3. **Retrieval Insights** — Expandable panel showing search details
4. **Session History** — Organized by date, searchable
5. **Context Info** — Token usage, model, latency visible
6. **Copy Actions** — Quick copy for answers and sources
7. **Workspace Switching** — Switch context without losing chat

---

*Generated by Hermes Agent — Phase UI-REVAMP Step 6*
