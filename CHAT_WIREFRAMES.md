# MimoNotes Chat V2 — ASCII Wireframes

> **Brand**: warm-purple 265° · Geist Sans + Mono  
> **Tone**: Linear precision + Claude warmth + Notion clarity  
> **Language**: Indonesian (Bahasa Indonesia)

---

## 1. DESKTOP EMPTY STATE

**Viewport**: 1440×900 · **Sidebar**: collapsed (48px icon rail)  
**No messages, fresh start.**

```
┌─[48px]──────────────────────────────────────────────────────────────────────┐
│ ┌──┐                                            ┌─────────────────────────┐│
│ │≡ │  [Logo MimoNotes]                          │ ○ ○ ○  Chat V2        ││
│ └──┘  [AppSidebar — icon rail]                   └─────────────────────────┘│
│ ┌─[48px]─┐ ┌──────────────────────────────────────────────────────────────┐ │
│ │        │ │                                                              │ │
│ │  💬    │ │              ╔══════════════════════════════╗                │ │
│ │        │ │              ║     [MimoNotes Logo 64px]   ║                │ │
│ │  📄    │ │              ║                              ║                │ │
│ │        │ │              ║  Hai! Ada yang bisa saya     ║                │ │
│ │  ⚙️    │ │              ║  bantu?                      ║                │ │
│ │        │ │              ║                              ║                │ │
│ │        │ │              ║  [Subtitle — muted 14px]     ║                │ │
│ └────────┘ │              ║  Tanyakan apapun tentang    ║                │ │
│            │              ║  dokumen Anda.               ║                │ │
│            │              ╚══════════════════════════════╝                │ │
│            │                                                              │ │
│            │  ┌─────────────────────┐  ┌─────────────────────┐           │ │
│            │  │ [SuggestedPrompt]   │  │ [SuggestedPrompt]   │           │ │
│            │  │ 📋 Ringkas dokumen  │  │ 🔍 Cari informasi   │           │ │
│            │  │ ini untuk saya      │  │ tentang topik X     │           │ │
│            │  │ [hover: bg-120]     │  │ [hover: bg-120]     │           │ │
│            │  └─────────────────────┘  └─────────────────────┘           │ │
│            │                                                              │ │
│            │  ┌─────────────────────┐  ┌─────────────────────┐           │ │
│            │  │ [SuggestedPrompt]   │  │ [SuggestedPrompt]   │           │ │
│            │  │ 💡 Jelaskan konsep  │  │ 📊 Analisis data    │           │ │
│            │  │ dalam dokumen ini   │  │ dari spreadsheet    │           │ │
│            │  └─────────────────────┘  └─────────────────────┘           │ │
│            │                                                              │ │
│            │  ┌─────────────────────┐  ┌─────────────────────┐           │ │
│            │  │ [SuggestedPrompt]   │  │ [SuggestedPrompt]   │           │ │
│            │  │ ✍️ Buat ringkasan   │  │ 🔄 Bandingkan       │           │ │
│            │  │ eksekutif           │  │ versi dokumen       │           │ │
│            │  └─────────────────────┘  └─────────────────────┘           │ │
│            │                                                              │ │
│            │  ── Atau mulai cepat ──────────────────────────              │ │
│            │                                                              │ │
│            │  ┌──────┐  ┌──────────┐  ┌──────────────┐                   │ │
│            │  │ 📎   │  │ 🌐 URL   │  │ 📁 Upload    │                   │ │
│            │  │ Lampir│  │ dari web │  │ dokumen      │                   │ │
│            │  └──────┘  └──────────┘  └──────────────┘                   │ │
│            │  [QuickActionButtons — border: muted, rounded-xl, 12px]     │ │
│            │                                                              │ │
│            │  ── Dokumen Terbaru ────────────────────────── [Lihat Semua] │ │
│            │                                                              │ │
│            │  ┌────────────┐ ┌────────────┐ ┌────────────┐               │ │
│            │  │ 📄         │ │ 📊         │ │ 📝         │               │ │
│            │  │ Laporan Q4 │ │ Data Penju │ │ Meeting No │               │ │
│            │  │ 2025.pdf   │ │ lan.xlsx   │ │ tes.docx   │               │ │
│            │  │ 3 menit lalu│ │ 1 jam lalu │ │ Kemarin    │               │ │
│            │  └────────────┘ └────────────┘ └────────────┘               │ │
│            │  [RecentDocuments — horizontal scroll if > 3]               │ │
│            │                                                              │ │
├────────────┼──────────────────────────────────────────────────────────────┤ │
│            │  ┌────────────────────────────────────────┐  ┌──┐           │ │
│            │  │ [ChatInput — placeholder: "Ketik        │  │➤ │           │ │
│            │  │  pertanyaan Anda..."]                    │  └──┘           │ │
│            │  │ [h: 48px, rounded-2xl, border: muted]   │  [SendBtn]     │ │
│            │  └────────────────────────────────────────┘                  │ │
│            │  [attach-icon]  [url-icon]     [Shift+Enter = baris baru]   │ │
└────────────┴──────────────────────────────────────────────────────────────┘

Notes:
- Logo: 64px, centered, brand-purple gradient
- Greeting: Geist Sans 28px semibold, color: text-primary
- Subtitle: Geist Sans 14px, color: text-muted-foreground
- SuggestedPrompts: 2×3 grid, gap 12px, card bg: surface, border: muted
  - Each card: min-h 72px, rounded-xl, padding 16px
  - On hover: border-color transitions to primary-500, bg slight lift
  - Click → prefills ChatInput and sends
- QuickActionButtons: 3 items, horizontal, gap 12px
  - Each: rounded-xl, border: muted, padding 12px 20px
  - Icon + label, hover: bg surface-hover
- RecentDocuments: max 3 visible, horizontal scroll on overflow
  - Each card: 200px wide, file icon, title (truncated), timestamp (muted)
- ChatInput: full width of main area (flex-1), max-w 800px centered
  - rounded-2xl, border: muted, bg: surface
  - Padding: 12px 16px, min-h: 48px, auto-grows to 120px
  - Attach/URL buttons: 32px icons left-aligned inside input
  - Send button: 32px circle, bg: primary, white icon
  - Disabled state: bg: muted, opacity 0.5
```

---

## 2. DESKTOP ACTIVE CONVERSATION

**Viewport**: 1440×900 · **Sidebar**: expanded (280px)  
**Mid-conversation with sources.**

```
┌─[280px]─────────────────────────────────────────────────────────────────────┐
│ ┌───────────────────────────┐ ┌──────────────────────────────────────────┐ │
│ │  [SessionSidebar]         │ │  [TopBar]                               │ │
│ │                           │ │  ┌──┐  Judul Sesi: "Laporan Q4"  [···] │ │
│ │  ┌───────────────────┐   │ │  │≡ │                                   │ │
│ │  │ 🔍 Cari sesi...   │   │ │  └──┘                                   │ │
│ │  │ [SearchInput]     │   │ ├──────────────────────────────────────────┤ │
│ │  └───────────────────┘   │ │                                          │ │
│ │                           │ │  ┌─[User Message]──────────────────┐   │ │
│ │  ┌─[active session]────┐ │ │  │  [UserAvatar]                    │   │ │
│ │  │ 💬 Laporan Q4       │ │ │  │  "Apa saja rekomendasi utama     │   │ │
│ │  │    2 menit lalu     │ │ │  │   dalam laporan ini?"            │   │ │
│ │  │ [bg: primary-50,    │ │ │  │                                  │   │ │
│ │  │  border-left: 3px   │ │ │  │  [bg: primary, text: white]      │   │ │
│ │  │  primary]           │ │ │  │  [rounded-2xl, right-aligned]    │   │ │
│ │  └─────────────────────┘ │ │  └──────────────────────────────────┘   │ │
│ │                           │ │                                          │ │
│ │  ┌─[inactive session]──┐ │ │  ┌─[Assistant Message]─────────────┐   │ │
│ │  │ 💬 Strategi Marketing│ │ │  │  [AssistantAvatar]               │   │ │
│ │  │    Kemarin          │ │ │  │                                  │   │ │
│ │  └─────────────────────┘ │ │  │  Berdasarkan laporan Q4 2025,    │   │ │
│ │                           │ │  │  terdapat 3 rekomendasi utama:  │   │ │
│ │  ┌─[inactive session]──┐ │ │  │                                  │   │ │
│ │  │ 💬 Riset Kompetitor │ │ │  │  1. Optimasi biaya operasional   │   │ │
│ │  │    3 hari lalu      │ │ │  │     [1]                          │   │ │
│ │  └─────────────────────┘ │ │  │                                  │   │ │
│ │                           │ │  │  2. Ekspansi ke segmen premium  │   │ │
│ │                           │ │  │     [1][2]                      │   │ │
│ │  ┌─[inactive session]──┐ │ │  │                                  │   │ │
│ │  │ 💬 Anggaran 2026    │ │ │  │  3. Peningkatan retensi pelanggan│  │ │
│ │  │    1 minggu lalu    │ │ │  │     [3]                          │   │ │
│ │  └─────────────────────┘ │ │  │                                  │   │ │
│ │                           │ │  │  ───────────────────────────     │   │ │
│ │  [sessionList — scroll   │ │  │  📎 Sumber:                       │   │ │
│ │   overflow-y, gap 4px]  │ │  │  [1] Laporan Q4 — hlm 12 [PDF]  │   │ │
│ │                           │ │  │  [2] Laporan Q4 — hlm 15 [PDF]  │   │ │
│ │                           │ │  │  [3] Analisis Pelanggan [DOCX]  │   │ │
│ │                           │ │  │                                  │   │ │
│ │                           │ │  │  [Sources below message,        │   │ │
│ │                           │ │  │   horizontal scroll]             │   │ │
│ │                           │ │  └──────────────────────────────────┘   │ │
│ │                           │ │                                          │ │
│ │                           │ │  ┌─[User Message]──────────────────┐   │ │
│ │                           │ │  │  "Bisa jelaskan lebih detail     │   │ │
│ │                           │ │  │   rekomendasi nomor 2?"         │   │ │
│ │                           │ │  └──────────────────────────────────┘   │ │
│ │                           │ │                                          │ │
│ │                           │ │  ┌─[Assistant Message]─────────────┐   │ │
│ │                           │ │  │  [AssistantAvatar]               │   │ │
│ │                           │ │  │                                  │   │ │
│ │  ┌─────────────────────┐ │ │  │  Rekomendasi ekspansi ke segmen │   │ │
│ │  │  + Chat Baru        │ │ │  │  premium didasarkan pada data    │   │ │
│ │  │  [PrimaryButton]    │ │ │  │  berikut [1]:                    │   │ │
│ │  └─────────────────────┘ │ │  │                                  │   │ │
│ └───────────────────────────┘ │  │  • Pertumbuhan segmen premium:  │   │ │
│                               │  │    +23% YoY                     │   │ │
│                               │  │  • Margin rata-rata: 45% vs 28% │   │ │
│                               │  │    untuk segmen reguler          │   │ │
│                               │  │  • Potensi revenue tambahan:     │   │ │
│                               │  │    Rp 2.4M per kuartal          │   │ │
│                               │  │                                  │   │ │
│                               │  │  [Streaming cursor ▌]            │   │ │
│                               │  └──────────────────────────────────┘   │ │
│                               │                                          │ │
│                               │  ┌─[SourceCards — horizontal scroll]────┐│ │
│                               │  │ ┌──────────┐ ┌──────────┐ ┌───────┐││ │
│                               │  │ │📄 Lapor..│ │📊 Analis.│ │📝 Me..│││ │
│                               │  │ │[click to │ │[click to │ │[cl..  │││ │
│                               │  │ │ expand]  │ │ expand]  │ │      │││ │
│                               │  │ └──────────┘ └──────────┘ └───────┘││ │
│                               │  │ [SourceCard — w: 200px, scroll-x]   ││ │
│                               │  └─────────────────────────────────────┘│ │
│                               ├──────────────────────────────────────────┤ │
│                               │  ┌──────────────────────────────┐  ┌──┐ │ │
│                               │  │ Ketik pertanyaan Anda...     │  │➤ │ │ │
│                               │  │ [h: 48px, rounded-2xl]       │  └──┘ │ │
│                               │  └──────────────────────────────┘       │ │
│                               │  [📎] [🌐]   Shift+Enter = baris baru  │ │
│                               └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘

Notes:
- SessionSidebar: w 280px, bg: surface, border-right: muted
  - Search input: full width, rounded-lg, mb 12px
  - Session items: px 12, py 8, rounded-lg, cursor pointer
    - Active: bg primary-50, border-left 3px solid primary
    - Hover: bg surface-hover
    - Delete icon (×): visible on hover only, right-aligned
  - "Chat Baru" button: fixed bottom, full width, primary color
- TopBar: h 48px, flex, items-center, px 16
  - Menu icon (≡): toggles sidebar on mobile
  - Title: truncated, semibold
  - More menu (···): dropdown for rename, export, delete
- Messages area: flex-1, overflow-y auto, px 24, py 16
  - Max-w: 760px, centered
  - User messages: bg primary, text white, right-aligned
    - rounded-2xl (top-right sharp)
  - Assistant messages: bg surface, text default, left-aligned
    - rounded-2xl (top-left sharp)
  - Inline citations [1]: superscript, bg primary-100, text primary-700
    - Click → scrolls to source reference below
- Source references below assistant message:
  - Small text, muted color
  - Each: [number] Document Title — page/chunk [FileType]
  - Clickable → opens SourcePreview
- SourceCards: horizontal scroll row below last assistant message
  - Each card: w 200px, h 64px, rounded-lg, border muted
  - Shows: file icon, truncated title, file type badge
  - Click → expands to SourcePreview
- ChatInput: same as empty state but full width (no centering constraint)
```

---

## 3. DESKTOP LOADING STATE

**Three-phase loading indicator during AI response generation.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Previous messages visible above...]                                      │
│                                                                             │
│  ┌─[Assistant Loading Message]────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ┌─[Phase 1: Searching]─────────────────────────────────────────────┐ │ │
│  │  │                                                                  │ │ │
│  │  │    ◌  Mencari dokumen...                                        │ │ │
│  │  │                                                                  │ │ │
│  │  │    [Spinner: 16px, stroke: primary, animation: rotate 1s]       │ │ │
│  │  │    [Text: Geist Sans 14px, color: muted-foreground]             │ │ │
│  │  │                                                                  │ │ │
│  │  │    [Progress dots: ● ○ ○ — step indicator, primary color]       │ │ │
│  │  │                                                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ── OR ──                                                             │ │
│  │                                                                       │ │
│  │  ┌─[Phase 2: Generating]───────────────────────────────────────────┐ │ │
│  │  │                                                                  │ │ │
│  │  │    ◉  Menghasilkan jawaban...                                   │ │ │
│  │  │                                                                  │ │ │
│  │  │    [Pulsing dot: 16px, bg: primary, animation: pulse 1.5s]     │ │ │
│  │  │    [Text: Geist Sans 14px, color: muted-foreground]             │ │ │
│  │  │                                                                  │ │ │
│  │  │    [Progress dots: ● ● ○ — step indicator]                      │ │ │
│  │  │                                                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ── OR ──                                                             │ │
│  │                                                                       │ │
│  │  ┌─[Phase 3: Streaming]────────────────────────────────────────────┐ │ │
│  │  │                                                                  │ │ │
│  │  │    Berdasarkan analisis dokumen yang saya temukan,               │ │ │
│  │  │    berikut adalah ringkasan dari laporan Q4:                    │ │ │
│  │  │                                                                  │ │ │
│  │  │    1. Pertumbuhan pendapatan meningkat 15% dari kuartal        │ │ │
│  │  │       sebelumnya, dengan kontribusi terbesar dari segmen...     │ │ │
│  │  │                                                                  │ │ │
│  │  │    [StreamingCursor ▌]  [blinking: animation blink 1s]         │ │ │
│  │  │                                                                  │ │ │
│  │  │    [Text appears word-by-word, fade-in animation]               │ │ │
│  │  │                                                                  │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  [Stop button visible during streaming]  ┌──┐                       │   │
│  │  "Menghentikan respons"                  │■ │ [StopBtn: 32px,      │   │
│  │  [Text muted, hover: primary]            └──┘  red, rounded-full]  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

Notes:
- Phase transitions: smooth crossfade (200ms ease-out)
- Phase 1 duration: ~1-3s (vector search)
- Phase 2 duration: ~0.5-2s (context building)
- Phase 3: streaming begins, text appears token-by-token
- Stop button: appears when streaming starts, hidden during phases 1-2
  - Click → cancels stream, shows partial response
  - Red background, white square icon
- Progress dots: 3 dots below text, filled = completed phase
  - Active phase: primary color, filled
  - Completed: primary color, filled
  - Pending: muted color, outline only
- Skeleton shimmer: during phase 1-2, subtle shimmer on placeholder lines
  - Animation: translateX 2s infinite, opacity 0.3→0.6→0.3
```

---

## 4. DESKTOP SOURCE PREVIEW (Expanded)

**Source card expanded inline or as popover panel.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Chat message area dimmed: bg overlay 40% opacity black]                  │
│                                                                             │
│  ┌─[SourcePreviewPanel]───────────────────────────────────────────────────┐ │
│  │                                                                       │ │
│  │  ┌─[Header]─────────────────────────────────────────────────────────┐ │ │
│  │  │  [FileIcon: 24px]  Laporan Q4 2025                               │ │ │
│  │  │                                                                  │ │ │
│  │  │  ┌────────┐  ┌────────┐  ┌───────────────┐                      │ │ │
│  │  │  │  PDF   │  │ 92%    │  │  Hlm 12 dari  │                      │ │ │
│  │  │  │ [badge]│  │ [score]│  │  45           │                      │ │ │
│  │  │  └────────┘  └────────┘  └───────────────┘                      │ │ │
│  │  │  [FileTypeBadge: bg primary-100, text primary-700, rounded-md]  │ │ │
│  │  │  [SimilarityScore: bg green-100, text green-700, rounded-md]   │ │ │
│  │  │  [PageInfo: bg muted, text muted-foreground, rounded-md]        │ │ │
│  │  │                                                                  │ │ │
│  │  │  ┌────────────────────────────────────┐                         │ │ │
│  │  │  │  ✕  [CloseBtn]                    │  [position: top-right]  │ │ │
│  │  │  └────────────────────────────────────┘                         │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─[ContentSnippet]────────────────────────────────────────────────┐ │ │
│  │  │                                                                  │ │ │
│  │  │  "Dari analisis data penjualan Q4 2025, terdapat peningkatan   │ │ │
│  │  │   signifikan pada segmen premium sebesar 23% year-over-year.    │ │ │
│  │  │                                                                  │ │ │
│  │  │   Margin kotor untuk segmen ini mencapai 45%, dibandingkan     │ │ │
│  │  │   dengan 28% untuk segmen reguler. Potensi revenue tambahan    │ │ │
│  │  │   diperkirakan mencapai Rp 2.4 miliar per kuartal jika        │ │ │
│  │  │   strategi ekspansi diimplementasikan dengan tepat."            │ │ │
│  │  │                                                                  │ │ │
│  │  │  [bg: surface, border: muted, rounded-lg, p: 16px]            │ │ │
│  │  │  [Text: Geist Sans 14px, line-height: 1.6]                    │ │ │
│  │  │  [Max-h: 300px, overflow-y: auto]                             │ │ │
│  │  │                                                                  │ │ │
│  │  │  [Highlighted terms: bg primary-100, rounded-sm, px 2px]       │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ── Konteks Tambahan ─────────────────────────────────────────────   │ │
│  │                                                                       │ │
│  │  ┌─[ContextChunk]─────────────────────────────────────────────────┐ │ │
│  │  │  Chunks terkait:                                                │ │ │
│  │  │  • Hlm 11: "Pendapatan total Q4 mencapai Rp 15.2 miliar..."  │ │ │
│  │  │  • Hlm 13: "Strategi pricing untuk segmen premium..."         │ │ │
│  │  │  [hover: bg surface-hover]                                     │ │ │
│  │  └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                       │ │
│  │  ┌─[Footer]──────────────────────────────────────────────────────┐  │ │
│  │  │                                                                │  │ │
│  │  │  ┌──────────────────────┐  ┌──────────────────────────────┐   │  │ │
│  │  │  │  📄 Lihat dokumen    │  │  📋 Salin kutipan            │   │  │ │
│  │  │  │  [LinkButton: primary]│  │  [LinkButton: muted]         │   │  │ │
│  │  │  └──────────────────────┘  └──────────────────────────────┘   │  │ │
│  │  │                                                                │  │ │
│  │  └────────────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

Notes:
- Panel width: 480px (or 60% of viewport, max 600px)
- Panel position: centered or anchored to clicked source card
- Backdrop: overlay bg-black/40, click → close panel
- Close: ✕ button top-right, also ESC key
- Content snippet: the exact chunk that was retrieved
  - Highlighted terms: matches from user query, bg primary-100
- Similarity score: cosine similarity percentage
  - Green: ≥80%, Yellow: 60-79%, Red: <60%
- "Lihat dokumen" → navigates to /knowledge/documents/[id]
- "Salin kutipan" → copies snippet text to clipboard
  - Toast notification: "Kutipan tersalin ✓"
- Context chunks: related chunks from same document
  - Click → navigates to that chunk in document view
```

---

## 5. MOBILE EMPTY STATE

**Viewport**: 375×812 (iPhone 14) · **Safe areas respected**

```
┌──────────────────────────────────┐
│ ◐ 12:30              🔋 📶 🔊   │  [Status bar — system]
├──────────────────────────────────┤
│ ┌──┐                            │
│ │≡ │  MimoNotes Chat    [+ new] │  [TopBar — h: 48px]
│ └──┘                            │
├──────────────────────────────────┤
│                                  │
│          ╔══════════════╗        │
│          ║ [Logo 48px]  ║        │
│          ╚══════════════╝        │
│                                  │
│      Hai! Ada yang bisa          │
│        saya bantu?               │  [Greeting: 22px semibold]
│                                  │
│  Tanyakan apapun tentang        │  [Subtitle: 13px muted]
│  dokumen Anda.                   │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 📋 Ringkas dokumen ini     │ │  [SuggestedPrompt — full width]
│  │ untuk saya                 │ │  [rounded-xl, border muted]
│  └────────────────────────────┘ │  [py: 14px, px: 16px]
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🔍 Cari informasi tentang  │ │
│  │ topik X                    │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 💡 Jelaskan konsep dalam   │ │
│  │ dokumen ini                │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 📊 Analisis data dari      │ │
│  │ spreadsheet                │ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ ✍️ Buat ringkasan eksekutif│ │
│  └────────────────────────────┘ │
│                                  │
│  ┌────────────────────────────┐ │
│  │ 🔄 Bandingkan versi        │ │
│  │ dokumen                    │ │
│  └────────────────────────────┘ │
│                                  │
│  ── Mulai Cepat ──────────────  │
│                                  │
│  ┌────────┐ ┌────────┐ ┌──────┐ │
│  │ 📎     │ │ 🌐     │ │ 📁   │ │  [QuickActions: horizontal scroll]
│  │Lampir  │ │URL     │ │Upload│ │  [rounded-xl, border muted]
│  └────────┘ └────────┘ └──────┘ │
│                                  │
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │ Ketik pertanyaan Anda... │   │  [ChatInput — h: 44px, mb: 8px]
│  │                    [➤]   │   │  [rounded-2xl, border muted]
│  └──────────────────────────┘   │  [px: 12px from edges]
│  [📎] [🌐]    Shift+Enter      │
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │                          │   │  [Safe area bottom — 34px iPhone]
│  └──────────────────────────┘   │
└──────────────────────────────────┘

Notes:
- TopBar: h 48px, sticky top
  - Hamburger (≡): opens SessionDrawer (slide from left)
  - [+ new]: creates new session
- Logo: 48px, centered
- Greeting: 22px, centered, semibold
- SuggestedPrompts: full width, stacked vertically, gap 8px
  - No grid — single column for mobile
  - Each: min-h 56px, py 14px, px 16px
  - On tap: bg surface-hover, ripple effect
  - Click → prefills input and sends
- QuickActions: horizontal scroll, gap 8px
  - Each: w 100px, h 72px, rounded-xl
- ChatInput: full width minus 24px (12px each side)
  - h 44px, rounded-2xl
  - Send button: inside input, right-aligned
  - Keyboard aware: input moves up with keyboard
  - Safe area: 34px bottom padding (iPhone notch)
```

---

## 6. MOBILE ACTIVE CONVERSATION

**Viewport**: 375×812 · **Messages visible, input at bottom**

```
┌──────────────────────────────────┐
│ ◐ 12:30              🔋 📶 🔊   │
├──────────────────────────────────┤
│ ┌──┐                            │
│ │≡ │  Laporan Q4        [···]   │  [TopBar — h: 48px, sticky]
│ └──┘                            │
├──────────────────────────────────┤
│                                  │
│  ┌─[User Message]────────────┐  │
│  │         "Apa saja          │  │
│  │    rekomendasi utama       │  │
│  │    dalam laporan ini?"     │  │
│  │                            │  │
│  │  [w: 85%, ml: auto]       │  │
│  │  [bg: primary, text: white]│  │
│  │  [rounded-2xl]            │  │
│  │  [text-right]             │  │
│  │  [14px]                   │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─[Assistant Message]────────┐  │
│  │ [🤖]                       │  │
│  │ Berdasarkan laporan Q4     │  │
│  │ 2025, terdapat 3           │  │
│  │ rekomendasi utama:         │  │
│  │                            │  │
│  │ 1. Optimasi biaya          │  │
│  │    operasional [1]         │  │
│  │                            │  │
│  │ 2. Ekspansi ke segmen      │  │
│  │    premium [1][2]          │  │
│  │                            │  │
│  │ 3. Peningkatan retensi     │  │
│  │    pelanggan [3]           │  │
│  │                            │  │
│  │ [w: 90%, mr: auto]        │  │
│  │ [bg: surface, rounded-2xl] │  │
│  │ [text-left, 14px]         │  │
│  │                            │  │
│  │ 📎 [1] Laporan Q4 [PDF]   │  │
│  │     [2] Laporan Q4 [PDF]  │  │
│  │     [3] Analisis [DOCX]   │  │
│  │  [sources: text-xs muted]  │  │
│  │  [tap source → bottomSheet]│  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─[User Message]────────────┐  │
│  │      "Bisa jelaskan       │  │
│  │   lebih detail nomor 2?"  │  │
│  │  [bg: primary, right]     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌─[Assistant Message]────────┐  │
│  │ [🤖]                       │  │
│  │ Rekomendasi ekspansi ke   │  │
│  │ segmen premium didasarkan  │  │
│  │ pada data berikut [1]:     │  │
│  │                            │  │
│  │ • Pertumbuhan: +23% YoY   │  │
│  │ • Margin: 45% vs 28%      │  │
│  │ • Revenue: Rp 2.4M/ktr    │  │
│  │                            │  │
│  │ [Streaming cursor ▌]      │  │
│  │                            │  │
│  │ [bg: surface, w: 90%]     │  │
│  └────────────────────────────┘  │
│                                  │
│  [Scroll area: flex-1,           │
│   overflow-y: auto]              │
│                                  │
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │ Ketik pertanyaan Anda... │   │  [ChatInput — h: 44px, sticky bottom]
│  │                    [➤]   │   │  [rounded-2xl, border muted]
│  └──────────────────────────┘   │
│  [📎] [🌐]    Shift+Enter      │
├──────────────────────────────────┤
│  ┌──────────────────────────┐   │
│  │         [Safe area]      │   │  [34px bottom safe area]
│  └──────────────────────────┘   │
└──────────────────────────────────┘

Notes:
- TopBar: h 48px, sticky
  - Hamburger (≡): opens SessionDrawer (slide from left, 280px)
  - Title: session title, truncated with ellipsis
  - More (···): dropdown — rename, export, delete session
- Messages: w 90% of viewport, px 12
  - User: ml auto (right-aligned), bg primary, text white
  - Assistant: mr auto (left-aligned), bg surface, text default
  - Both: rounded-2xl, py 10px, px 14px, mb 8px
  - Text: Geist Sans 14px, line-height 1.5
  - Inline citations: same as desktop
- Sources below assistant message:
  - Tap → opens SourceBottomSheet
  - Small text, muted, each on new line
- ChatInput: sticky bottom, full width minus 24px
  - Keyboard: input repositions, messages scroll
  - Auto-grows: single line → max 4 lines (120px)
- Scroll: messages area scrolls, input stays fixed
  - Scroll to bottom button: appears when scrolled up
    - 40px circle, bg surface, shadow, ↓ arrow
```

---

## 7. MOBILE SOURCE BOTTOM SHEET

**Viewport**: 375×812 · **Slide-up sheet from bottom**

```
┌──────────────────────────────────┐
│ ◐ 12:30              🔋 📶 🔊   │
├──────────────────────────────────┤
│ ┌──┐                            │
│ │≡ │  Laporan Q4        [···]   │
│ └──┘                            │
├──────────────────────────────────┤
│                                  │
│  [Chat messages — dimmed        │
│   with overlay bg-black/30]     │
│                                  │
│                                  │
│                                  │
├──────────────────────────────────┤ ← Sheet slides up from here
│ ┌──────────────────────────────┐ │
│ │         ──────               │ │  [CloseHandle: 40px wide, rounded-full]
│ │                              │ │  [bg: muted, centered]
│ │  Sumber Referensi            │ │  [SheetTitle: 16px semibold, px 16]
│ │                              │ │
│ ├──────────────────────────────┤ │
│ │                              │ │
│ │  ┌─[SourceCard]───────────┐ │ │  [Swipeable left/right]
│ │  │                        │ │ │  [w: 100%, rounded-xl]
│ │  │  📄 Laporan Q4 2025   │ │ │  [border muted, mb 8px]
│ │  │                        │ │ │
│ │  │  ┌──────┐  ┌────────┐ │ │ │
│ │  │  │ PDF  │  │ 92%    │ │ │ │  [FileTypeBadge + SimilarityScore]
│ │  │  └──────┘  └────────┘ │ │ │
│ │  │                        │ │ │
│ │  │  "Dari analisis data   │ │ │  [Snippet: 2-3 lines, muted]
│ │  │   penjualan Q4 2025,  │ │ │
│ │  │   terdapat peningkatan │ │ │
│ │  │   signifikan..."       │ │ │
│ │  │                        │ │ │
│ │  │  [Lihat dokumen →]    │ │ │  [Link: primary, text-sm]
│ │  └────────────────────────┘ │ │
│ │                              │ │
│ │  ┌─[SourceCard]───────────┐ │ │
│ │  │  📊 Analisis Pelanggan │ │ │
│ │  │  ┌──────┐  ┌────────┐ │ │ │
│ │  │  │XLSX  │  │ 87%    │ │ │ │
│ │  │  └──────┘  └────────┘ │ │ │
│ │  │  "Segmen premium       │ │ │
│ │  │   menunjukkan pertum..."│ │ │
│ │  │  [Lihat dokumen →]    │ │ │
│ │  └────────────────────────┘ │ │
│ │                              │ │
│ │  ┌─[SourceCard]───────────┐ │ │
│ │  │  📝 Meeting Notes      │ │ │
│ │  │  ┌──────┐  ┌────────┐ │ │ │
│ │  │  │DOCX  │  │ 78%    │ │ │ │
│ │  │  └──────┘  └────────┘ │ │ │
│ │  │  "Discussion regarding │ │ │
│ │  │   expansion strategy..."│ │ │
│ │  │  [Lihat dokumen →]    │ │ │
│ │  └────────────────────────┘ │ │
│ │                              │ │
│ │  [SourceCards: scroll-y,    │ │
│ │   max-h: 50vh, gap 12px]   │ │
│ │                              │ │
│ ├──────────────────────────────┤ │
│ │  ┌──────────────────────┐   │ │
│ │  │  Tutup               │   │ │  [CloseButton: full width, muted]
│ │  └──────────────────────┘   │ │  [rounded-xl, py 12px]
│ └──────────────────────────────┘ │
└──────────────────────────────────┘

Notes:
- Sheet height: 60% of viewport (max 480px)
- Drag handle: 40px wide, 4px height, rounded-full, bg muted
  - Drag down → dismiss (snap points: 100%, 60%, 0%)
- Overlay: bg-black/30, click → dismiss
- Source cards: full width, rounded-xl, border muted
  - Each: py 16px, px 16px, mb 12px
  - Swipe left/right: reveals "Tutup" action (optional)
  - Tap card → navigates to document view
- Animation: slide-up 300ms ease-out
- Haptic feedback on open/close (navigator.vibrate if supported)
- "Tutup" button: fixed at bottom of sheet
  - Full width, rounded-xl, bg muted, text default
  - py 12px, mb: safe-area bottom
```

---

## 8. ERROR STATE

**Various error scenarios with recovery options.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─[Network Error Banner]───────────────────────────────────────────────┐  │
│  │  ⚠️  Koneksi terputus. Periksa jaringan Anda.                       │  │
│  │     [bg: red-50, border: red-200, text: red-700]                    │  │
│  │                              [Coba Lagi]                             │  │
│  │  [RetryBtn: bg red-100, text red-700, hover: bg red-200]           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── OR ──                                                                   │
│                                                                             │
│  ┌─[Offline Detection Banner]───────────────────────────────────────────┐  │
│  │  📡  Anda sedang offline. Respons akan dikirim saat kembali online. │  │
│  │     [bg: amber-50, border: amber-200, text: amber-700]              │  │
│  │     [position: fixed, top: 0, w: 100%, z-index: 50]                │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── OR ──                                                                   │
│                                                                             │
│  ┌─[Message-Level Error]───────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌─[Assistant Message]───────────────────────────────────────────┐  │  │
│  │  │  [🤖]                                                         │  │  │
│  │  │  Berdasarkan analisis dokumen yang saya temukan...            │  │  │
│  │  │                                                               │  │  │
│  │  │  ┌─[ErrorBanner inline]──────────────────────────────────┐   │  │  │
│  │  │  │  ⚠️  Terjadi kesalahan saat menghasilkan jawaban.     │   │  │  │
│  │  │  │     [bg: red-50, border: red-200, rounded-lg]         │   │  │  │
│  │  │  │                                                       │   │  │  │
│  │  │  │  [Coba Lagi]  [Salin Pesan]                           │   │  │  │
│  │  │  │  [btn: red-100]  [btn: muted]                         │   │  │  │
│  │  │  │                                                       │   │  │  │
│  │  │  │  Error ID: err_abc123  [click to copy]                │   │  │  │
│  │  │  │  [text-xs, muted]                                     │   │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │
│  │  │                                                               │  │
│  │  │  [Partial response visible above error]                      │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── OR ──                                                                   │
│                                                                             │
│  ┌─[Rate Limit Error]───────────────────────────────────────────────────┐  │
│  │  ┌─[Assistant Message]───────────────────────────────────────────┐  │  │
│  │  │  [🤖]                                                         │  │  │
│  │  │  ┌─[ErrorBanner]─────────────────────────────────────────┐   │  │  │
│  │  │  │  ⏳  Batas penggunaan tercapai.                        │   │  │  │
│  │  │  │     Coba lagi dalam 30 detik.                          │   │  │  │
│  │  │  │     [bg: amber-50, border: amber-200]                  │   │  │  │
│  │  │  │                                                       │   │  │  │
│  │  │  │  [CountdownTimer: "0:30" → "0:00"]                    │   │  │  │
│  │  │  │  [text-sm, muted, mono font]                           │   │  │  │
│  │  │  │                                                       │   │  │  │
│  │  │  │  [Coba Lagi — disabled until countdown ends]           │   │  │  │
│  │  │  │  [btn: muted, opacity 0.5]                             │   │  │  │
│  │  │  └───────────────────────────────────────────────────────────┘  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ── OR ──                                                                   │
│                                                                             │
│  ┌─[Empty State Error]──────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │              ╔══════════════════════════════╗                        │  │
│  │              ║     [Error Icon 64px]        ║                        │  │
│  │              ║     ⚠️                       ║                        │  │
│  │              ╚══════════════════════════════╝                        │  │
│  │                                                                      │  │
│  │         Ups! Terjadi kesalahan.                                     │  │
│  │         [18px, semibold, centered]                                  │  │
│  │                                                                      │  │
│  │         Kami tidak dapat memuat percakapan ini.                     │  │
│  │         Silakan coba lagi atau mulai sesi baru.                     │  │
│  │         [14px, muted, centered, max-w 300px]                       │  │
│  │                                                                      │  │
│  │         ┌──────────────┐  ┌──────────────────┐                      │  │
│  │         │  Coba Lagi   │  │  Chat Baru        │                      │  │
│  │         │  [PrimaryBtn]│  │  [SecondaryBtn]   │                      │  │
│  │         └──────────────┘  └──────────────────┘                      │  │
│  │                                                                      │  │
│  │         Error ID: err_xyz789  [click to copy]                       │  │
│  │         [text-xs, muted, centered]                                  │  │
│  │                                                                      │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Notes:
- Network Error: appears at top of chat, dismissible after 10s
  - Auto-retries 3 times with exponential backoff (1s, 2s, 4s)
  - Shows "Menyambungkan kembali..." during retry
- Offline Detection: uses navigator.onLine + heartbeat check
  - Listens to online/offline events
  - When back online: auto-dismisses, resends pending message
  - Position: fixed top, z-index highest
- Message-Level Error: inline within assistant message flow
  - Partial response preserved above error
  - "Coba Lagi": resends the same query
  - "Salin Pesan": copies user's original message
  - Error ID: for debugging, click to copy
- Rate Limit: countdown timer in mono font
  - Button enables when countdown reaches 0
  - Visual: progress bar depleting (amber color)
- Empty State Error: full page error when session fails to load
  - Two actions: retry or start new
  - Error ID always shown for support reference
```

---

## 9. FEEDBACK STATE

**Inline feedback controls on assistant messages.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─[Assistant Message]────────────────────────────────────────────────────┐│
│  │                                                                        ││
│  │  [🤖]                                                                 ││
│  │                                                                        ││
│  │  Berdasarkan laporan Q4 2025, terdapat 3 rekomendasi utama:          ││
│  │                                                                        ││
│  │  1. Optimasi biaya operasional [1]                                    ││
│  │  2. Ekspansi ke segmen premium [1][2]                                 ││
│  │  3. Peningkatan retensi pelanggan [3]                                 ││
│  │                                                                        ││
│  │  📎 [1] Laporan Q4 [PDF]  [2] Analisis [DOCX]  [3] Notes [DOCX]     ││
│  │                                                                        ││
│  │  ──────────────────────────────────────────────────────────────────── ││
│  │                                                                        ││
│  │  ┌─[FeedbackBar]──────────────────────────────────────────────────┐   ││
│  │  │                                                                │   ││
│  │  │  ┌──┐  ┌──┐           ┌──────────────┐                       │   ││
│  │  │  │👍│  │👎│           │  📋 Salin     │                       │   ││
│  │  │  └──┘  └──┘           │  [CopyBtn]    │                       │   ││
│  │  │  [LikeBtn] [Dislike]  └──────────────┘                       │   ││
│  │  │  [32px circle]                                                │   ││
│  │  │  [border: muted, bg: transparent]                             │   ││
│  │  │  [hover: bg surface-hover]                                    │   ││
│  │  │  [active: bg primary-100, border primary]                     │   ││
│  │  │                                                               │   ││
│  │  │  [Only visible on hover/touch]                                │   ││
│  │  │  [opacity: 0 → 1 on hover, transition: 150ms]                │   ││
│  │  │                                                               │   ││
│  │  └───────────────────────────────────────────────────────────────┘   ││
│  │                                                                        ││
│  │  ┌─[After Thumbs Up Clicked]─────────────────────────────────────┐   ││
│  │  │                                                                │   ││
│  │  │  ┌──┐  ┌──┐           ┌──────────────┐                       │   ││
│  │  │  │👍│  │👎│           │  📋 Salin     │                       │   ││
│  │  │  └──┘  └──┘           └──────────────┘                       │   ││
│  │  │  [active: bg primary-100, border primary, scale: 1.1]        │   ││
│  │  │  [inactive: opacity 0.5]                                      │   ││
│  │  │                                                               │   ││
│  │  │  ┌──────────────────────────────────────────────────────┐     │   ││
│  │  │  │  Terima kasih! Masukan Anda membantu kami            │     │   ││
│  │  │  │  meningkatkan kualitas.                              │     │   ││
│  │  │  │  [text-xs, muted, fade-in 200ms]                    │     │   ││
│  │  │  └──────────────────────────────────────────────────────┘     │   ││
│  │  └───────────────────────────────────────────────────────────────┘   ││
│  │                                                                        ││
│  │  ┌─[After Thumbs Down Clicked — shows reason dialog]─────────────┐   ││
│  │  │                                                                │   ││
│  │  │  ┌──┐  ┌──┐                                                   │   ││
│  │  │  │👍│  │👎│  [active: red-100, border: red]                   │   ││
│  │  │  └──┘  └──┘                                                   │   ││
│  │  │                                                               │   ││
│  │  │  ┌──────────────────────────────────────────────────────┐     │   ││
│  │  │  │  Apa yang kurang dari jawaban ini?                   │     │   ││
│  │  │  │  [text-xs, semibold, mb 8px]                         │     │   ││
│  │  │  │                                                      │     │   ││
│  │  │  │  ○ Tidak akurat                                     │     │   ││
│  │  │  │  ○ Tidak relevan                                    │     │   ││
│  │  │  │  ○ Terlalu panjang                                  │     │   ││
│  │  │  │  ○ Terlalu pendek                                   │     │   ││
│  │  │  │  ○ Lainnya: [input]                                 │     │   ││
│  │  │  │                                                      │     │   ││
│  │  │  │  [Kirim]  [Batal]                                   │     │   ││
│  │  │  └──────────────────────────────────────────────────────┘     │   ││
│  │  └───────────────────────────────────────────────────────────────┘   ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
│                                                                             │
│  ┌─[Last Assistant Message — additional controls]──────────────────────────┐│
│  │                                                                        ││
│  │  ┌─[RegenerateBar]───────────────────────────────────────────────┐    ││
│  │  │                                                               │    ││
│  │  │  ┌──────────────────────┐                                    │    ││
│  │  │  │  🔄 Buat ulang      │                                    │    ││
│  │  │  │  [RegenerateBtn]     │                                    │    ││
│  │  │  │  [icon rotate 180°]  │                                    │    ││
│  │  │  │  [btn: muted,        │                                    │    ││
│  │  │  │   hover: surface]    │                                    │    ││
│  │  │  └──────────────────────┘                                    │    ││
│  │  │                                                               │    ││
│  │  │  [Only on LAST assistant message]                            │    ││
│  │  │  [Click → deletes last response, resends query]             │    ││
│  │  │  [Shows loading state during regeneration]                   │    ││
│  │  │                                                               │    ││
│  │  └───────────────────────────────────────────────────────────────┘    ││
│  │                                                                        ││
│  └────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────┘

Notes:
- FeedbackBar: appears below each assistant message
  - Visibility: opacity 0 by default, opacity 1 on message hover
  - Mobile: always visible (touch doesn't have hover)
  - Position: below message, above next message, gap 4px
- Thumbs Up:
  - Default: 32px circle, border muted, bg transparent
  - Hover: bg surface-hover, border primary-300
  - Click: bg primary-100, border primary, scale 1.1
  - Animation: bounce 300ms ease-out
  - Shows "Terima kasih!" confirmation (3s, then fades)
  - Stores feedback in chat_messages.feedback field
- Thumbs Down:
  - Default: same as thumbs up
  - Click: opens reason selection (inline, not modal)
  - Reasons: radio buttons, single select
  - "Lainnya" → text input appears
  - Submit → stores feedback + reason
  - Cancel → closes reason dialog, resets selection
- Copy Button:
  - Always visible (no hover required)
  - Copies entire assistant message content (text only, no markdown)
  - On copy: icon changes to ✓ for 2s, shows "Tersalin!" toast
- Regenerate Button:
  - Only on the LAST assistant message
  - Full width of feedback bar, centered
  - Icon: 🔄, rotates 180° on hover
  - Click: deletes last assistant message, resends user query
  - During regeneration: shows loading spinner, button disabled
  - After regeneration: new response replaces old one
```

---

## 10. SESSION SIDEBAR (Desktop)

**Full sidebar view with search, sessions, and new chat action.**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ┌─[SessionSidebar]──────────────────────────────────────────────────────┐  │
│  │  w: 280px · bg: surface · border-right: 1px solid muted             │  │
│  │                                                                       │  │
│  │  ┌─[Header]────────────────────────────────────────────────────────┐  │  │
│  │  │  [Logo 24px]   Sesi Chat              [← CollapseBtn]          │  │  │
│  │  │  [h: 48px, flex, items-center, px 12]                          │  │  │
│  │  │  [CollapseBtn: 28px, rounded-md, hover: bg surface-hover]      │  │  │
│  │  │  [Click → sidebar collapses to 48px icon rail]                 │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─[SearchInput]──────────────────────────────────────────────────┐  │  │
│  │  │  🔍 Cari sesi...                                               │  │  │
│  │  │  [rounded-lg, h: 36px, bg: surface-hover, border: none]       │  │  │
│  │  │  [px: 12px, text: 13px, placeholder: muted]                   │  │  │
│  │  │  [mb: 8px, mx: 12px]                                          │  │  │
│  │  │  [Clear button (×): appears when typing, right-aligned]        │  │  │
│  │  │  [Filters sessions by title in real-time]                      │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ── Hari Ini ─────────────────────────────────────────────────────   │  │
│  │  [SectionLabel: text-xs, font-medium, text-muted-foreground, px 12]  │  │
│  │                                                                       │  │
│  │  ┌─[SessionItem — active]────────────────────────────────────────┐  │  │
│  │  │  💬 Laporan Q4 2025                                           │  │  │
│  │  │     2 menit lalu                                              │  │  │
│  │  │  [bg: primary-50, border-left: 3px solid primary]             │  │  │
│  │  │  [rounded-lg, mx: 8px, px: 12px, py: 8px]                    │  │  │
│  │  │  [Title: 14px, font-medium, truncate]                         │  │  │
│  │  │  [Timestamp: 12px, text-muted-foreground]                     │  │  │
│  │  │  [Delete icon (🗑): visible on hover, right-aligned]          │  │  │
│  │  │  [hover: bg primary-50 → confirm dialog]                      │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─[SessionItem — inactive]──────────────────────────────────────┐  │  │
│  │  │  💬 Strategi Marketing 2026                                   │  │  │
│  │  │     Kemarin                                                   │  │  │
│  │  │  [bg: transparent]                                            │  │  │
│  │  │  [hover: bg surface-hover]                                    │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─[SessionItem — inactive]──────────────────────────────────────┐  │  │
│  │  │  💬 Riset Kompetitor                                          │  │  │
│  │  │     3 hari lalu                                               │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ── Minggu Lalu ───────────────────────────────────────────────────   │  │
│  │                                                                       │  │
│  │  ┌─[SessionItem — inactive]──────────────────────────────────────┐  │  │
│  │  │  💬 Anggaran 2026                                             │  │  │
│  │  │     5 hari lalu                                               │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ┌─[SessionItem — inactive]──────────────────────────────────────┐  │  │
│  │  │  💬 Evaluasi Kinerja                                          │  │  │
│  │  │     1 minggu lalu                                             │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  [SessionList — flex-1, overflow-y: auto, gap: 2px]                  │  │
│  │  [Custom scrollbar: w 4px, track transparent, thumb muted]           │  │
│  │  [Scrollbar visible only on hover of sidebar]                        │  │
│  │                                                                       │  │
│  │  ── Delete Confirmation Dialog ──                                    │  │
│  │                                                                       │  │
│  │  ┌─[ConfirmDialog — appears on delete click]─────────────────────┐  │  │
│  │  │  ┌──────────────────────────────────────────────┐             │  │  │
│  │  │  │  Hapus sesi ini?                             │             │  │  │
│  │  │  │  [14px, semibold]                            │             │  │  │
│  │  │  │                                              │             │  │  │
│  │  │  │  Semua pesan dalam sesi ini akan             │             │  │  │
│  │  │  │  dihapus secara permanen.                    │             │  │  │
│  │  │  │  [13px, muted]                               │             │  │  │
│  │  │  │                                              │             │  │  │
│  │  │  │  ┌──────────┐  ┌────────────┐               │             │  │  │
│  │  │  │  │  Batal   │  │  Hapus     │               │             │  │  │
│  │  │  │  │ [muted]  │  │  [destructive]             │             │  │  │
│  │  │  │  └──────────┘  └────────────┘               │             │  │  │
│  │  │  └──────────────────────────────────────────────┘             │  │  │
│  │  │  [rounded-xl, border muted, shadow-lg, w: 240px]             │  │  │
│  │  └──────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                       │  │
│  │  ── New Chat Button ──                                               │  │
│  │                                                                       │  │
│  │  ┌──────────────────────────────────────────────────────────────┐    │  │
│  │  │  + Chat Baru                                                │    │  │
│  │  │  [PrimaryButton, full-width, rounded-xl]                    │    │  │
│  │  │  [fixed to bottom of sidebar, px 12, py 10]                │    │  │
│  │  │  [bg: primary, text: white, hover: primary-hover]           │    │  │
│  │  │  [shadow: 0 -1px 0 surface]                                │    │  │
│  │  │  [Click → creates new session, navigates to empty state]    │    │  │
│  │  └──────────────────────────────────────────────────────────────┘    │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘

Notes:
- Sidebar width: 280px (expanded), 48px (collapsed icon rail)
- Collapse: smooth transition 200ms ease-in-out
  - Icon rail shows: 💬, 📄, ⚙️ icons only
  - Expand on hover (desktop) or toggle (mobile)
- Search input:
  - Debounced: 300ms delay before filtering
  - Filters by session title
  - Clear button (×): appears when value.length > 0
  - Keyboard: Escape clears input
- Session list:
  - Grouped by time: "Hari Ini", "Kemarin", "Minggu Lalu", "Bulan Lalu"
  - Section labels: text-xs, font-medium, muted, px 12, py 4
  - Items: mx 8px, mb 2px, rounded-lg, cursor pointer
    - Active: bg primary-50, border-left 3px primary
    - Inactive: bg transparent, hover bg surface-hover
    - Title: 14px, font-medium, truncate (max-w ~230px)
    - Timestamp: 12px, muted
  - Delete: 🗑 icon, opacity 0 by default, opacity 1 on hover
    - Click → ConfirmDialog (not immediate delete)
    - ConfirmDialog: centered in sidebar, overlay backdrop
    - "Hapus" → API call, removes from list with slide animation
  - Empty state: "Belum ada sesi" with illustration
- Sort order: most recent first within each group
- "Chat Baru" button:
  - Fixed bottom, full width, primary color
  - z-index above scroll content
  - Shadow: subtle top shadow for separation
  - Creates new session via API, navigates to empty state
```

---

## DESIGN TOKENS REFERENCE

```
Brand Colors:
  primary:      oklch(0.60 0.18 265)   — warm purple
  primary-hover: oklch(0.55 0.20 265)  — darker purple
  primary-50:   oklch(0.97 0.02 265)   — light purple tint
  primary-100:  oklch(0.93 0.04 265)   — purple tint
  surface:      oklch(0.99 0.005 265)  — near white with purple hint
  surface-hover: oklch(0.96 0.01 265)  — slightly darker surface
  muted:        oklch(0.85 0.02 265)   — muted border
  destructive:  oklch(0.55 0.20 25)    — red for delete/error

Typography:
  heading:   Geist Sans, semibold (600)
  body:      Geist Sans, regular (400)
  mono:      Geist Mono, regular (400)
  sizes:     12px (caption), 13px (small), 14px (body), 16px (subtitle),
             18px (section), 22px (mobile heading), 28px (desktop heading)

Spacing:
  xs: 4px · sm: 8px · md: 12px · lg: 16px · xl: 24px · 2xl: 32px

Radius:
  sm: 8px · md: 12px · lg: 16px · xl: 20px · 2xl: 24px

Shadows:
  sm:  0 1px 2px oklch(0 0 0 / 0.05)
  md:  0 4px 6px oklch(0 0 0 / 0.07)
  lg:  0 10px 15px oklch(0 0 0 / 0.10)
```

---

## INTERACTION PATTERNS

```
Hover States:
  - Buttons: bg darken 5%, border color shift
  - Cards: subtle lift (translateY -1px), shadow increase
  - Links: underline, primary color
  - Icons: opacity 100% (from 70% default)

Click/Press:
  - Buttons: scale(0.98), active state
  - Cards: scale(0.99)
  - Ripple effect on touch devices

Transitions:
  - Default: 150ms ease-out
  - Expand/collapse: 200ms ease-in-out
  - Page transitions: 300ms ease-in-out
  - Modal/sheet: 300ms ease-out (spring-like)

Scroll Behaviors:
  - Messages: scroll to bottom on new message
  - Smooth scroll for citation jumps
  - Source cards: horizontal scroll with momentum
  - Session sidebar: custom thin scrollbar

Keyboard Shortcuts:
  - Enter: send message
  - Shift+Enter: new line in input
  - Escape: close modals/sheets/dropdowns
  - Cmd/Ctrl+K: focus search input
  - Cmd/Ctrl+N: new chat session
```

---

## RESPONSIVE BREAKPOINTS

```
Mobile:     0 — 639px    (single column, stacked layout)
Tablet:     640 — 1023px (collapsible sidebar, wider cards)
Desktop:    1024+         (full sidebar, grid layouts)

Sidebar Behavior:
  Mobile:  Hidden by default, slide-in drawer (overlay)
  Tablet:  Collapsed by default (48px), expand on toggle
  Desktop: Expanded by default (280px), collapsible to 48px

Message Width:
  Mobile:  90% of viewport
  Tablet:  80% of main area
  Desktop: max 760px, centered in main area
```

---

*Last updated: June 2026 · MimoNotes Chat V2 Wireframes*
