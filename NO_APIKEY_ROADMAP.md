# NO_APIKEY_ROADMAP.md — MimoNotes Improvement Plan (No External Embedding Providers)

> **Purpose**: Prioritized improvements for MimoNotes RAG pipeline that require **zero external embedding API keys** (no OpenAI, Gemini, or OpenRouter embeddings).
>
> **Current state**: 107,571 chunks using feature-hashing embeddings (trigram + word hashing). Similarity range 0.15–0.50 (max observed 0.4711). 100% false-positive retrieval rate. 0% refusal accuracy. Avg latency 325ms.
>
> **Constraint**: All improvements must work with the existing `LocalHashEmbedding` provider (feature hashing) — no external API calls for embeddings.

---

## Table of Contents

1. [Refusal Mechanism](#1-refusal-mechanism)
2. [Retrieval Threshold Tuning](#2-retrieval-threshold-tuning)
3. [Context Packing](#3-context-packing)
4. [Workspace Management](#4-workspace-management)
5. [Widget System](#5-widget-system)
6. [Billing Readiness](#6-billing-readiness)

---

## 1. Refusal Mechanism

### Description
The RAG chain should **refuse to answer** when no sufficiently relevant chunks are found, rather than always producing a response from low-quality matches. Currently the only refusal is `chunks.length === 0`, which never triggers because the threshold is too low.

### Current State
- **`chain.ts` line 67**: `if (similarChunks.length === 0)` — the only refusal check
- **`chain.ts` line 60**: Default `minSimilarity = 0.30` passed to retrieval
- **`vectorstore.ts` line 73**: `DEFAULT_MIN_SIMILARITY = 0.30`
- **Problem**: With feature-hashing embeddings scoring 0.15–0.50, threshold 0.30 passes nearly everything. Result: the LLM receives low-quality context and either hallucinates or gives vague answers citing irrelevant chunks.
- **Hybrid search**: When hybrid mode is active, `hybridSearch()` sets `threshold: 0` (line 300) and does **zero threshold filtering** — every result passes.

### Proposed Improvement

**Phase A — Max-similarity refusal gate (immediate)**
```typescript
// In chain.ts, after retrieveChunks():
const maxSimilarity = similarChunks.length > 0
  ? Math.max(...similarChunks.map(c => c.similarity))
  : 0;

if (similarChunks.length === 0 || maxSimilarity < 0.40) {
  return {
    answer: "Maaf, saya tidak menemukan informasi yang cukup relevan...",
    sources: [],
    metrics,
    refused: true,        // new field
    refusalReason: maxSimilarity < 0.40 ? "low_confidence" : "no_results",
  };
}
```

**Phase B — Tiered confidence responses**
- `maxSimilarity >= 0.55`: High confidence — answer normally
- `maxSimilarity 0.45–0.55`: Medium — answer with caveat ("Berdarkan dokumen yang tersedia, ...namun saya tidak sepenuhnya yakin")
- `maxSimilarity 0.35–0.45`: Low — partial answer + disclaimer
- `maxSimilarity < 0.35`: Refuse entirely

**Phase C — Hybrid search threshold fix**
Add `minSimilarity` filtering to `hybridSearch()` after RRF ranking, currently missing.

### Impact
| Metric | Current | After Phase A | After Phase B |
|---|---|---|---|
| False positive rate | 100% | ~30–40% | ~10–15% |
| Refusal accuracy | 0% | ~60% | ~80% |
| User trust | Low | Medium | High |

**Impact on retrieval quality**: **HIGH** — directly addresses the #1 problem (100% false positive rate)

### Effort
- Phase A: **3–4 hours** (modify chain.ts, add refusal fields to RAGResponse)
- Phase B: **4–6 hours** (tiered logic, UI changes to show confidence)
- Phase C: **2–3 hours** (add threshold to hybridSearch)
- **Total: ~10–13 hours**

### Dependencies
- Requires [Threshold Tuning](#2-retrieval-threshold-tuning) for calibrated cutoff values
- UI needs a "no relevant info" state (currently shows empty sources)

### Risk
- **Medium**: Raising thresholds may refuse legitimate queries that score 0.25–0.35 with feature hashing (e.g., factual-001: 0.2504, factual-002: 0.2083). Mitigation: use hybrid search (BM25) as safety net for keyword-matched queries.

---

## 2. Retrieval Threshold Tuning

### Description
Calibrate the similarity threshold for feature-hashing embeddings. The current 0.30 is far too low for the observed 0.15–0.50 distribution, but a blanket increase may over-filter queries where BM25 compensates.

### Current State
- **`vectorstore.ts` line 73**: `DEFAULT_MIN_SIMILARITY = 0.30`
- **`chain.ts` line 60**: Hardcoded default `minSimilarity = 0.30`
- **Observed similarity distribution**:
  - Irrelevant queries: 0.15–0.30
  - Weakly relevant: 0.25–0.35
  - Relevant: 0.35–0.47
  - Max observed: 0.4711
- **No adaptive thresholding**: Same threshold for all queries regardless of query length, type, or document density.
- **Hybrid mode bypasses threshold entirely**: `threshold: 0` in metrics, no filtering applied.

### Proposed Improvement

**Step 1 — Static threshold raise**
```typescript
// vectorstore.ts
const DEFAULT_MIN_SIMILARITY = 0.42;  // up from 0.30
```
Impact: Filters ~60-70% of false positives. Some true positives at 0.25–0.35 will be lost.

**Step 2 — Query-adaptive threshold**
```typescript
function getAdaptiveThreshold(queryText: string, baseThreshold: number): number {
  const wordCount = queryText.split(/\s+/).length;
  // Longer, more specific queries → lower threshold needed
  if (wordCount >= 10) return baseThreshold - 0.05;
  // Short/vague queries → higher threshold to avoid false matches
  if (wordCount <= 3) return baseThreshold + 0.05;
  return baseThreshold;
}
```

**Step 3 — Per-workspace threshold override**
Add `rag_similarity_threshold` to workspace settings, allowing per-workspace tuning. Store in `workspace_settings` table (already exists).

**Step 4 — Threshold auto-calibration script**
Build a benchmark script that tests known queries against the corpus and computes optimal threshold:
```bash
# scripts/calibrate-threshold.ts
# Tests factual-001..010, analytical-001..010, etc.
# Outputs precision/recall curve, recommends threshold
```

### Impact
| Metric | Current (0.30) | Static (0.42) | Adaptive |
|---|---|---|---|
| False positive rate | 100% | ~35% | ~20% |
| Recall (true positives) | 100% | ~85% | ~90% |
| Precision | ~5% | ~40% | ~55% |

**Impact on retrieval quality**: **HIGH** — second most impactful after refusal mechanism

### Effort
- Step 1: **1 hour** (single constant change)
- Step 2: **3–4 hours** (threshold function + testing)
- Step 3: **2–3 hours** (settings integration)
- Step 4: **6–8 hours** (benchmark dataset, calibration script)
- **Total: ~12–16 hours**

### Dependencies
- Benchmark dataset (factual-001..010 etc.) should be available for calibration
- Per-workspace threshold depends on workspace_settings infrastructure

### Risk
- **Medium-High**: Raising threshold without hybrid search safety net will cause recall loss. Always deploy with hybrid search enabled. Test with benchmark queries before/after.

---

## 3. Context Packing

### Description
Optimize how retrieved chunks are assembled into the LLM context window. Current implementation is sequential concatenation with a token budget — improvements can reduce noise, deduplicate content, and prioritize higher-quality matches.

### Current State
- **`vectorstore.ts` line 335–394**: `buildMultimodalContext()` function
- **Token budget**: `DEFAULT_MAX_CONTEXT_TOKENS = 3000` (~4 chars/token estimation)
- **Ordering**: Chunks arrive in similarity order from retrieval (good)
- **Deduplication**: Already exists in `searchSimilarChunks()` (line 151–158) — exact-content dedup via `toLowerCase().replace(/\s+/g, " ").trim()`
- **Missing features**:
  - No near-duplicate detection (chunks with >90% overlap but not identical)
  - No source attribution headers in context (just `[Document: title]`)
  - No whitespace/content compression
  - No token-count-aware truncation of individual chunks
  - Hybrid search chunks mixed with vector-only chunks without score normalization

### Proposed Improvement

**A. Near-duplicate chunk filtering**
```typescript
function deduplicateNearMatches(chunks: SimilarChunk[], threshold = 0.90): SimilarChunk[] {
  const kept: SimilarChunk[] = [];
  for (const chunk of chunks) {
    const isNearDup = kept.some(existing =>
      jaccardSimilarity(existing.content, chunk.content) > threshold
    );
    if (!isNearDup) kept.push(chunk);
  }
  return kept;
}
```
Jaccard on word-level tokens is fast, no external API needed.

**B. Content compression**
```typescript
function compressChunkContent(content: string): string {
  return content
    .replace(/\n{3,}/g, '\n\n')      // collapse excessive newlines
    .replace(/[ \t]{2,}/g, ' ')       // collapse whitespace
    .replace(/^\s+$/gm, '')           // remove blank lines
    .trim();
}
```

**C. Enhanced source attribution**
```typescript
// Instead of: [Document: title]\n[Chunk: 3] [Similarity: 42%]\n{content}
// Use: ---\nSource: {title} (chunk #{n}, relevance: {score}%)\n---\n{content}
```
Makes it clearer for the LLM to cite sources.

**D. Per-chunk token budget with truncation**
```typescript
// When a single chunk exceeds remaining budget, truncate mid-sentence
// rather than skipping it entirely
if (blockTokens > remainingTokens) {
  const maxChars = remainingTokens * CHARS_PER_TOKEN;
  block = truncateAtSentence(content, maxChars) + '...';
}
```

### Impact
**Impact on retrieval quality**: **MEDIUM** — improves answer quality when good chunks exist, but doesn't fix retrieval precision

| Improvement | Latency Impact | Quality Impact |
|---|---|---|
| Near-dedup | +5ms | Prevents repetitive answers |
| Compression | Negligible | +5–10% more chunks fit |
| Source attribution | Negligible | Better citation accuracy |
| Truncation | Negligible | +1–2 more chunks in budget |

### Effort
- A: **3–4 hours** (Jaccard implementation + integration)
- B: **1–2 hours** (simple regex)
- C: **1–2 hours** (formatting change)
- D: **2–3 hours** (sentence-boundary truncation)
- **Total: ~7–11 hours**

### Dependencies
- None — fully self-contained improvement

### Risk
- **Low**: All changes are additive. Worst case: slightly different formatting that the LLM handles equally well.

---

## 4. Workspace Management

### Description
Improve workspace lifecycle, health monitoring, and per-workspace configuration. Currently workspaces are simple containers; they need operational tooling for multi-tenant production use.

### Current State
- **Schema**: `Workspace` model with `name`, `slug`, `settings`, `subscription`, `usage`, `invoices`, `payments`, `apiKeys`, `widgets`, `auditLogs`
- **Workspace settings**: `WorkspaceSetting` model exists (key-value store per workspace)
- **Members**: `WorkspaceMember` with role-based access
- **No health dashboard**: No way to see workspace-level stats (chunk count, document count, error rate)
- **No document limits**: A workspace can have unlimited documents/chunks
- **No workspace analytics**: Usage is tracked in `WorkspaceUsage` but not surfaced

### Proposed Improvement

**A. Workspace health dashboard**
New page: `/dashboard/workspace/[id]/health`
```
- Document count / chunk count / embedding status
- Average retrieval similarity (last 7 days)
- Query volume (messages/day)
- Error rate (failed retrievals / total queries)
- Storage used (DB size estimate)
- Top queries with lowest similarity (indicates knowledge gaps)
```

**B. Per-workspace document limits**
```typescript
const PLAN_LIMITS = {
  free: { maxDocuments: 10, maxChunks: 5000, maxWorkspaceMembers: 2 },
  pro: { maxDocuments: 100, maxChunks: 100000, maxWorkspaceMembers: 10 },
  enterprise: { maxDocuments: -1, maxChunks: -1, maxWorkspaceMembers: -1 },
};
```
Enforce at upload time. Check in `storeChunks()`.

**C. Workspace-level analytics**
Expose per-workspace metrics via existing `analytics_events` table:
- Most queried topics (cluster by embedding similarity)
- Knowledge gaps (queries with < 0.35 max similarity)
- Peak usage hours
- Average response quality (if feedback mechanism exists)

### Impact
**Impact on retrieval quality**: **LOW** — indirect improvement through operational visibility

| Improvement | User Value | Operational Value |
|---|---|---|
| Health dashboard | High | High — catch issues early |
| Document limits | Medium | High — prevent runaway costs |
| Workspace analytics | Medium | Medium — optimization insights |

### Effort
- A: **8–10 hours** (dashboard page + backend queries)
- B: **4–5 hours** (limit enforcement + UI feedback)
- C: **6–8 hours** (analytics queries + visualization)
- **Total: ~18–23 hours**

### Dependencies
- Requires `workspace_settings` table (already exists)
- Plan limits require billing plan integration ([Billing Readiness](#6-billing-readiness))

### Risk
- **Low**: Non-breaking additions. Document limits could frustrate free-tier users if limits are too restrictive.

---

## 5. Widget System

### Description
The embeddable chat widget allows external websites to integrate MimoNotes. Currently functional but needs customization, security hardening, and analytics.

### Current State
- **Routes**: `/api/widget/config`, `/api/widget/chat`, `/api/widget/conversations`
- **Schema**: `Widget`, `WidgetConversation`, `WidgetMessage` models exist
- **CORS**: `Access-Control-Allow-Origin: *` on `/api/widget/*` (next.config.ts line 26) — wide open
- **Rate limiting**: Inherits global rate limit, no widget-specific limits
- **Customization**: `Widget` model has `theme` (JSON), `welcomeMessage`, `placeholder`, `position`, `primaryColor`, etc.
- **Analytics**: Widget conversations stored in `WidgetMessage` but no aggregated analytics
- **Auth**: Public key based (`publicKey` in Widget model), no per-origin validation

### Proposed Improvement

**A. CORS tightening**
```typescript
// Instead of Access-Control-Allow-Origin: *, validate against allowedOrigins
// Widget model should have: allowedOrigins String[] (e.g., ["example.com", "shop.example.com"])
// Middleware validates Origin header against this list
```

**B. Widget-specific rate limiting**
```typescript
// Separate rate limit for widget endpoints:
// - 30 messages/minute per widget (not per IP — prevents distributed abuse)
// - 100 messages/day per widget on free plan
// Use widget.id as rate limit key
```

**C. Widget analytics dashboard**
New page: `/dashboard/widgets/[id]/analytics`
```
- Total conversations (7d/30d/all)
- Total messages
- Average messages per conversation
- Busiest hours
- Most common queries (top 10)
- Unanswered queries (where RAG refused)
- Embed code with customization preview
```

**D. Widget customization improvements**
- Custom CSS injection (scoped to widget iframe)
- Custom avatar/icon upload
- Brand color auto-detection from URL
- Multi-language welcome messages
- Predefined quick-reply buttons

### Impact
**Impact on retrieval quality**: **LOW** — widget is a delivery mechanism, not retrieval

| Improvement | Security | UX | Business Value |
|---|---|---|---|
| CORS tightening | High | — | Medium |
| Rate limiting | High | — | High |
| Analytics | — | — | High |
| Customization | — | High | Medium |

### Effort
- A: **3–4 hours** (origin validation middleware + schema update)
- B: **2–3 hours** (widget-specific rate limiter)
- C: **8–10 hours** (analytics page + aggregation queries)
- D: **6–8 hours** (customization UI + CSS injection)
- **Total: ~19–25 hours**

### Dependencies
- CORS tightening requires Widget schema update (add `allowedOrigins`)
- Rate limiting needs widget-level identification (already have `publicKey`)
- Analytics depends on existing `WidgetMessage` data

### Risk
- **Medium**: CORS tightening may break existing widget deployments if origins aren't pre-configured. Migration: set `allowedOrigins: ["*"]` for existing widgets, require explicit origins for new ones.

---

## 6. Billing Readiness

### Description
Prepare the billing infrastructure for production launch. Schema exists but enforcement and user-facing flows are incomplete.

### Current State
- **Schema**: `WorkspaceSubscription`, `WorkspaceUsage`, `Invoice`, `Payment`, `SubscriptionEvent` models exist
- **Entitlements**: `seed-entitlements.ts` defines plans: `free`, `pro`, `enterprise`
  - `free`: basic features
  - `pro`: `mcp`, `public_widget`, `api_access`, `analytics`
  - `enterprise`: all pro + extended limits
- **Usage tracking**: `WorkspaceUsage` model exists for recording usage events
- **Missing**:
  - No usage alerts (user hits 80% of quota)
  - No quota enforcement (upload/query even when over limit)
  - No plan upgrade/downgrade UI
  - No payment gateway integration
  - No invoice generation

### Proposed Improvement

**A. Usage alerts**
```typescript
// In storeChunks() and chat API:
async function checkUsageQuota(workspaceId: string, metric: string): Promise<UsageCheck> {
  const usage = await getCurrentUsage(workspaceId, metric);
  const limit = await getPlanLimit(workspaceId, metric);
  
  if (usage >= limit) return { allowed: false, reason: 'quota_exceeded' };
  if (usage >= limit * 0.8) return { allowed: true, warning: 'approaching_limit' };
  return { allowed: true };
}
```

**B. Quota enforcement**
- Document upload: Check `maxDocuments` and `maxChunks` before processing
- Chat messages: Check `monthlyMessages` quota
- API calls: Check `apiCallsPerMonth` quota
- Widget messages: Check `widgetMessagesPerMonth` quota
- Grace period: Allow 10% over-quota with warning, hard block at 20%

**C. Plan upgrade flow**
```
1. User sees "Upgrade" banner when approaching limits
2. /dashboard/billing page shows:
   - Current plan + usage bars
   - Plan comparison table
   - "Upgrade to Pro" / "Upgrade to Enterprise" buttons
3. (Future) Stripe/payment integration point
4. Immediate plan switch + entitlement refresh
```

**D. Usage dashboard**
```
/dashboard/billing/usage
- Messages used this month (bar chart)
- Documents uploaded (counter)
- Storage used (estimate)
- API calls (if applicable)
- Cost breakdown (when payment is integrated)
```

### Impact
**Impact on retrieval quality**: **NONE** — purely business/operational

| Improvement | Revenue Protection | User Experience | Operational |
|---|---|---|---|
| Usage alerts | High | Medium | Medium |
| Quota enforcement | Critical | Low (negative) | High |
| Plan upgrade flow | High | High | Low |
| Usage dashboard | Low | High | Medium |

### Effort
- A: **4–5 hours** (quota check function + alert system)
- B: **6–8 hours** (enforcement points in upload/chat/API)
- C: **8–10 hours** (billing page + plan management)
- D: **6–8 hours** (usage visualization)
- **Total: ~24–31 hours**

### Dependencies
- Requires `subscription_plans` seed data (exists in `seed-entitlements.ts`)
- Quota enforcement requires `WorkspaceUsage` tracking to be active
- Plan upgrade flow eventually needs payment gateway (not blocking MVP)

### Risk
- **Medium**: Aggressive quota enforcement can alienate users. Mitigation: generous free tier, clear communication, grace period.

---

## Summary Matrix

| # | Area | Impact | Effort | Dependencies | Risk | Priority |
|---|---|---|---|---|---|---|
| 1 | Refusal Mechanism | 🔴 High | 10–13h | Threshold Tuning | Medium | **P0** |
| 2 | Threshold Tuning | 🔴 High | 12–16h | Benchmark dataset | Med-High | **P0** |
| 3 | Context Packing | 🟡 Medium | 7–11h | None | Low | **P1** |
| 4 | Workspace Management | 🟢 Low | 18–23h | Billing plan schema | Low | **P2** |
| 5 | Widget System | 🟢 Low | 19–25h | Widget schema update | Medium | **P2** |
| 6 | Billing Readiness | ⚪ None | 24–31h | Subscription schema | Medium | **P2** |

## Recommended Execution Order

```
Sprint 1 (Week 1–2): "Fix the retrieval"
  ├── #2 Step 1: Raise DEFAULT_MIN_SIMILARITY to 0.42      [1h]
  ├── #2 Step 2: Adaptive threshold                         [4h]
  ├── #1 Phase A: Max-similarity refusal gate               [4h]
  ├── #1 Phase C: Hybrid search threshold fix               [3h]
  └── Testing with benchmark queries                        [4h]

Sprint 2 (Week 3–4): "Improve answer quality"
  ├── #1 Phase B: Tiered confidence responses               [6h]
  ├── #3 A: Near-duplicate chunk filtering                  [4h]
  ├── #3 B+C: Compression + source attribution              [3h]
  ├── #3 D: Per-chunk token truncation                      [3h]
  └── Testing + prompt tuning                               [4h]

Sprint 3 (Week 5–6): "Production readiness"
  ├── #5 A+B: Widget CORS + rate limiting                   [6h]
  ├── #6 A+B: Usage alerts + quota enforcement              [12h]
  ├── #4 A: Workspace health dashboard                      [10h]
  └── Integration testing                                   [4h]
```

## Key Metrics to Track

| Metric | Current Baseline | Sprint 1 Target | Sprint 2 Target |
|---|---|---|---|
| False positive rate | 100% | <40% | <15% |
| Refusal accuracy | 0% | >60% | >80% |
| Max observed similarity | 0.4711 | 0.4711 | 0.4711 |
| Avg retrieval latency | 325ms | <350ms | <400ms |
| Context chunks per query | 5 | 3–5 | 3–5 |
| Answer hallucination rate | Unknown | Measured | <10% |

## Files Modified by Each Area

| Area | Files |
|---|---|
| Refusal Mechanism | `lib/rag/chain.ts`, `app/api/chat/route.ts` |
| Threshold Tuning | `lib/rag/vectorstore.ts`, `lib/settings.ts`, `scripts/calibrate-threshold.ts` |
| Context Packing | `lib/rag/vectorstore.ts` (buildMultimodalContext) |
| Workspace Management | `app/dashboard/workspace/`, `lib/workspace.ts` |
| Widget System | `app/api/widget/`, `lib/widget.ts`, `next.config.ts` |
| Billing Readiness | `app/dashboard/billing/`, `lib/billing.ts`, `lib/quota.ts` |

---

*Generated: 2026-06-13 | MimoNotes RAG Pipeline Analysis*
*Based on: 107,571 chunks, feature-hashing embeddings, hybrid search (BM25+vector RRF)*
