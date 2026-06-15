# CHAT_GAP_ANALYSIS.md

MimoNotes Chat UX vs. Claude, ChatGPT, Perplexity, Notion AI

**Date:** 2026-06-14  
**Scope:** Chat interface features, UX patterns, competitive positioning  
**Status:** Living document — update as product evolves

---

## Current MimoNotes Chat Capabilities

- 4 components: chat-window, message-bubble, source-card, session-sidebar
- Empty state: emoji robot + 'Selamat datang di Mimotes' text (no prompts, no quick actions)
- Sources: horizontal scrolling cards below messages, only for last response, disappear on next message
- No inline citations [1][2] in response text
- No thumbs up/down, no regenerate, no feedback
- Loading: bouncing dots only (no 'thinking' indicator)
- Error: toast + generic bubble, no retry
- Mobile: overlay sidebar, basic textarea
- No streaming cursor, no typewriter beyond progressive text
- Message bubbles: max-w-[80%], user right-aligned, assistant left-aligned
- Markdown rendering: ReactMarkdown + remarkGfm + rehypeHighlight
- Copy button: hover-only on each message

---

## Comparison Matrix

| Feature | MimoNotes | Claude | ChatGPT | Perplexity | Notion AI |
|---------|-----------|--------|---------|------------|----------|
| **Core Chat UX** | | | | | |
| Threaded conversations | 3 | 4 | 5 | 5 | 0 (not applicable) |
| Auto-titling | 0 | 4 | 5 | 4 | 0 |
| New chat button | 3 | 5 | 5 | 5 | 0 |
| Search conversations | 0 | 5 | 5 | 3 | N/A |
| Session history/sidebar | 3 | 5 | 5 | 5 | N/A |
| **Response Quality UX** | | | | | |
| Streaming text | 2 | 5 | 5 | 5 | 3 |
| Thinking/loading indicator | 0 | 5 | 5 | 5 | 2 |
| Stop generation | 0 | 5 | 5 | 3 | 0 |
| Regenerate response | 0 | 5 | 5 | 4 | 0 |
| Edit user message | 0 | 5 | 5 | 3 | N/A |
| **Sources & Citations** | | | | | |
| Inline citations [1][2] | 0 | 5 | 4 | 5 | 0 |
| Source cards before answer | 0 | 3 | 3 | 5 | 0 |
| Source cards after answer | 2 | 4 | 4 | 3 | 0 |
| Source preview on hover | 0 | 3 | 3 | 5 | 0 |
| Source persistence across turns | 0 | 4 | 3 | 5 | N/A |
| **Code & Rich Content** | | | | | |
| Syntax highlighting | 4 | 5 | 5 | 4 | 3 |
| Copy code button | 1 | 5 | 5 | 4 | 3 |
| Run code button | 0 | 3 | 5 | 0 | 0 |
| Artifacts/side-by-side | 0 | 5 | 3 | 0 | N/A |
| **Feedback & Iteration** | | | | | |
| Thumbs up/down | 0 | 5 | 5 | 4 | 0 |
| Copy full response | 1 | 5 | 5 | 5 | 0 |
| Follow-up suggestions | 0 | 3 | 4 | 5 | 0 |
| Related questions | 0 | 2 | 3 | 5 | 0 |
| **Input & Mobile** | | | | | |
| Rich text input | 2 | 4 | 4 | 4 | 5 |
| Keyboard shortcuts | 0 | 4 | 4 | 3 | 5 |
| Mobile experience | 2 | 4 | 5 | 4 | 4 |
| Model selector | 0 | 0 | 5 | 3 | 0 |
| **Empty State & Onboarding** | | | | | |
| Welcome prompts | 0 | 4 | 5 | 5 | 5 |
| Quick action chips | 0 | 3 | 5 | 5 | 5 |
| Example conversations | 0 | 3 | 4 | 5 | 3 |
| **Error Handling** | | | | | |
| Retry on error | 0 | 5 | 5 | 4 | 0 |
| Graceful degradation | 1 | 4 | 5 | 4 | 3 |
| Offline/poor network UX | 1 | 3 | 4 | 3 | 3 |

---

## MimoNotes Score Summary

| Category | Avg Score | Assessment |
|----------|-----------|------------|
| Core Chat UX | 1.8 | Critical — missing table-stakes features |
| Response Quality UX | 0.5 | Critical — no streaming feedback loop |
| Sources & Citations | 0.4 | Critical — core differentiator underutilized |
| Code & Rich Content | 1.0 | Important — markdown works, interactions missing |
| Feedback & Iteration | 0.3 | Critical — no feedback mechanism |
| Input & Mobile | 1.0 | Important — functional but basic |
| Empty State & Onboarding | 0.0 | Critical — hostile first impression |
| Error Handling | 0.7 | Critical — users hit dead ends |

**Overall: 0.7 / 5.0** — Significant gaps across all categories.

---

## Priority Classification

### CRITICAL GAPS (Score 0-1) — Must Fix

These are table-stakes features. Users expect them. Missing them creates friction every session.

| Gap | Score | Impact | Complexity | Priority |
|-----|-------|--------|------------|----------|
| **Inline citations [1][2]** | 0 | High — users can't verify claims | Medium — parse source refs in response | **P0** |
| **Empty state with prompts** | 0 | High — first-time users bounce | Low — static content + onClick handlers | **P0** |
| **Regenerate response** | 0 | High — users stuck with bad answers | Low — replay last message | **P0** |
| **Thumbs up/down feedback** | 0 | Medium — no quality signal collection | Low — UI + API endpoint | **P0** |
| **Retry on error** | 0 | High — users hit dead ends | Low — retry button in error bubble | **P0** |
| **Copy full response** | 1 | Medium — users need to export answers | Low — copy-to-clipboard | **P1** |
| **Stop generation** | 0 | Medium — users waste time on long responses | Medium — abort streaming | **P1** |
| **Source persistence across turns** | 0 | High — sources disappear, confusing | Medium — state management refactor | **P1** |
| **Quick action chips** | 0 | Medium — cold start problem | Low — pre-defined prompts | **P1** |
| **Thinking/loading indicator** | 0 | Medium — users don't know if it's working | Low — animated indicator | **P1** |

### IMPORTANT GAPS (Score 2-3) — Should Fix

These differentiate MimoNotes from basic chat wrappers.

| Gap | Score | Impact | Complexity | Priority |
|-----|-------|--------|------------|----------|
| **Copy code button** | 1 | Medium — developers expect this | Low — button + clipboard | **P2** |
| **Source cards before answer** | 2 | Medium — Perplexity-style UX is compelling | Medium — layout reorder | **P2** |
| **Search conversations** | 0 | High for power users | Medium — full-text search | **P2** |
| **Auto-titling** | 0 | Medium — session management | Medium — LLM call on first message | **P2** |
| **Edit user message** | 0 | Medium — iterate on prompts | Medium — message editing + resubmit | **P2** |
| **Follow-up suggestions** | 0 | Medium — keeps users engaged | Low — LLM generates suggestions | **P2** |
| **Streaming improvements** | 2 | Medium — feels sluggish | Medium — SSE/WebSocket tuning | **P2** |
| **Mobile keyboard shortcuts** | 2 | Low — power users only | Low — keyboard event handlers | **P3** |

### NICE-TO-HAVES (Score 4) — Could Improve

Features that delight but aren't essential.

| Gap | Score | Impact | Complexity | Priority |
|-----|-------|--------|------------|----------|
| **Source preview on hover** | 0 | Low — tooltip UX | Low — hover event + preview | **P4** |
| **Artifacts/side-by-side** | 0 | Low — Claude-specific pattern | High — new panel system | **P4** |
| **Run code button** | 0 | Low — niche use case | High — sandboxed execution | **P4** |
| **Related questions sidebar** | 0 | Low — Perplexity pattern | Medium — sidebar component | **P4** |
| **Focus modes** | 0 | Low — Perplexity pattern | Medium — mode selector + prompt templates | **P4** |
| **Keyboard shortcuts** | 0 | Low — power users | Low — event handlers | **P4** |

---

## Competitive Advantages — What MimoNotes Does Well

| Advantage | Why It Matters |
|-----------|---------------|
| **Source card system exists** | Foundation for citation UX — just needs inline integration |
| **Markdown rendering solid** | ReactMarkdown + remarkGfm + rehypeHighlight is production-ready |
| **Message bubble layout** | Clean, standard chat layout — no rework needed |
| **Session sidebar** | Basic structure exists — enhance with search/titling |
| **Indonesian-first** | No competitor optimizes for Bahasa — this is a wedge |
| **Lightweight** | No bloat — can move fast on features |

---

## Prioritized Improvement Roadmap

### Phase 1: Table Stakes (Week 1-2)

**Goal:** Stop the bleeding. Users should not hit dead ends.

1. **Empty state with quick actions** — 4-6 prompt chips + example conversations
2. **Inline citations** — Parse [1][2] refs in response, link to source cards
3. **Regenerate response** — Button on last assistant message
4. **Thumbs up/down** — Simple feedback on each message
5. **Retry on error** — Replace toast with inline retry button
6. **Thinking indicator** — Replace bouncing dots with "Mimotes sedang berpikir..."
7. **Stop generation** — Abort button during streaming

### Phase 2: Engagement (Week 3-4)

**Goal:** Keep users in the loop. Make them want to come back.

1. **Source persistence** — Sources stay visible across turns, collapsible
2. **Copy full response** — Button on each assistant message
3. **Follow-up suggestions** — 2-3 suggested questions after each answer
4. **Auto-titling** — Generate session title from first message
5. **Source cards before answer** — Reorder: sources → answer (Perplexity-style)
6. **Search conversations** — Full-text search in sidebar

### Phase 3: Differentiation (Week 5-8)

**Goal:** Stand out. Own a niche.

1. **Indonesian-first prompts** — Localized quick actions, not translated English
2. **Source preview on hover** — Tooltip with snippet
3. **Focus modes** — Akademik, Penulisan, Umum (rebranded for Indonesian market)
4. **Edit user message** — Iterate on prompts without starting over
5. **Code copy button** — One-click copy for code blocks
6. **Streaming improvements** — Smoother text delivery

### Phase 4: Delight (Month 3+)

**Goal:** Surprise and retain.

1. **Artifacts panel** — Side-by-side code/preview for technical content
2. **Run code** — Sandboxed execution for code snippets
3. **Keyboard shortcuts** — Power user productivity
4. **Related questions sidebar** — Discover more topics
5. **Model selector** — If supporting multiple LLMs

---

## Key Insight

MimoNotes has the **structural foundation** (sidebar, message bubbles, source cards, markdown rendering) but lacks the **interaction layer** that makes chat feel alive. The gap isn't architecture — it's UX polish.

The biggest quick win: **inline citations + source persistence**. This is where MimoNotes can differentiate from ChatGPT (weak citations) and match Perplexity (strong citations). Combined with Indonesian-first positioning, this creates a defensible niche.

---

## Appendix: Competitive Positioning Matrix

| Dimension | MimoNotes | Claude | ChatGPT | Perplexity | Notion AI |
|-----------|-----------|--------|---------|------------|----------|
| Primary use case | Research + notes | Creative writing | General assistant | Research | Document editing |
| Citation strength | Weak (cards only) | Strong | Medium | Best-in-class | None |
| Indonesian optimization | Best | None | None | None | None |
| Code capabilities | Basic | Good | Best | Basic | Basic |
| Price positioning | Free/freemium | $20/mo | $20/mo | Free/freemium | $10/mo |
| Mobile experience | Basic | Good | Excellent | Good | Good |

**MimoNotes' wedge:** Indonesian-first research assistant with source-backed answers. Not trying to be everything — trying to be the best at one thing.
