# TECH_DEBT.md — Mimotes Technical Debt Registry

> Maintained by Principal Software Architect.
> Sources: AGENTS.md, IMPLEMENTATION_ROADMAP.md, IMPLEMENTATION_PLAN.md, plans/architecture.md, Phase 5 Review.
> Each entry traces back to a specific source. No invented debt.

---

## 1. Documented Debt (AGENTS.md §Technical Debt & Known Issues)

### DEBT-001: pdf-parse v1 Pinning
- **Priority**: Medium
- **Source**: AGENTS.md #1
- **Status**: Known, accepted
- **Resolution**: Wait for upstream fix or evaluate alternative parsers.

### DEBT-002: Local Embedding Quality (Feature Hashing)
- **Priority**: High
- **Source**: AGENTS.md #2
- **Status**: Functional but degraded
- **Resolution**: Use embedding-capable provider or add local model.

### DEBT-003: In-Memory Rate Limiter
- **Priority**: Medium
- **Source**: AGENTS.md #3
- **Status**: Fallback only
- **Resolution**: Use Upstash Redis in production.

### DEBT-004: No Pagination on Document List
- **Priority**: Medium → Low
- **Source**: AGENTS.md #4
- **Status**: Partially resolved — Phase 3 added `/api/knowledge/*` pagination. Original `/api/documents` still unbounded.

### DEBT-005: No Search/Filter on Document List
- **Priority**: Low
- **Source**: AGENTS.md #5
- **Status**: Partially resolved — Phase 3 added search/filter/sort via `/api/knowledge/*`.

### DEBT-006: File Upload Without Size Limit
- **Priority**: High
- **Source**: AGENTS.md #6, plans/architecture.md (`MAX_FILE_SIZE=10485760`)
- **Status**: Unimplemented — env var defined but never read by upload route.

### DEBT-007: Empty components/ui/ Directory
- **Priority**: Low → Resolved
- **Source**: AGENTS.md #7
- **Status**: Resolved — 17 shadcn/ui components now exist (14 original + textarea, slider, switch from Phase 5).

---

## 2. Security Debt (AGENTS.md §Security Model)

### SEC-001: API Keys Stored in Plaintext Database
- **Priority**: Critical
- **Source**: AGENTS.md §Data Protection: "TODO: encrypt at rest"

### SEC-002: File Storage on Local Filesystem
- **Priority**: Medium
- **Source**: AGENTS.md §Data Protection: "TODO: cloud storage"

---

## 3. Architectural Drift (plans/architecture.md vs Implementation)

### DRIFT-001 through DRIFT-004
- **Priority**: Low
- **Status**: Additive changes (Mimo Pro provider, analytics, dashboard, knowledge base). No action needed.

---

## 4. Roadmap Debt (IMPLEMENTATION_ROADMAP.md)

### ROAD-001: Phase 5 — AI Management
- **Priority**: Medium → Resolved
- **Source**: IMPLEMENTATION_ROADMAP.md Phase 5
- **Status**: ✅ IMPLEMENTED — Playground, Prompt CRUD, Versioning, Diff, Revert, Compare all working.
- **Remaining**: Collapsible/resizable shadcn components not created (not needed).

### ROAD-002: Phase 6 — Workspace System
- **Priority**: Medium
- **Source**: IMPLEMENTATION_ROADMAP.md Phase 6
- **Status**: Pending

### ROAD-003: Phase 7 — Public Widget
- **Priority**: Low
- **Source**: IMPLEMENTATION_ROADMAP.md Phase 7
- **Status**: Pending

---

## 5. UI/UX Debt (IMPLEMENTATION_PLAN.md)

### UI-001: Toast, Markdown, Auto-Resize, Copy Button, Session Sidebar
- **Priority**: Low → Resolved
- **Source**: IMPLEMENTATION_PLAN.md
- **Status**: ✅ ALL 5 IMPLEMENTED in prior sessions.

---

## 6. Phase 5 New Debt

### PH5-001: No Unit Tests Added
- **Priority**: High
- **Source**: Phase 5 Sprint Plan (Acceptance Criteria #9), Phase 5 Review Q-07
- **Status**: Skipped — sprint plan called for ≥3 test cases for prompt CRUD
- **Resolution**: Add Vitest + tests for prompt CRUD in next sprint

### PH5-002: Duplicate Streaming Logic
- **Priority**: Low
- **Source**: Phase 5 Review Q-03
- **Status**: Playground and test endpoints have near-identical streaming code
- **Resolution**: Extract shared streaming helper to lib/

### PH5-003: No Pagination on Prompt List
- **Priority**: Low
- **Source**: Phase 5 Review Q-01
- **Status**: GET /api/ai/prompts returns all prompts
- **Resolution**: Add limit/offset when prompt count grows

### PH5-004: Client-Side Playground History
- **Priority**: Low
- **Source**: Phase 5 Review Q-02
- **Status**: History stored in React state, lost on page refresh. Endpoint exists but returns empty.
- **Resolution**: Implement server-side history storage

### PH5-005: Approximate Token Counting
- **Priority**: Low
- **Source**: Phase 5 Review Q-05
- **Status**: Stats count API response chunks, not actual tokens
- **Resolution**: Use response.usage if provider supports it

### PH5-006: prompt() Browser Dialog
- **Priority**: Low
- **Source**: Phase 5 Review Q-06
- **Status**: handleSaveAsTemplate uses native prompt() dialog
- **Resolution**: Replace with modal input

---

## 7. Sprint: Optimization & Debt Reduction (In Progress)

This sprint addresses the highest-impact items from the priority list below.

### Items Being Resolved This Sprint
| Item | Task | Status |
|------|------|--------|
| DEBT-006 | File size limit on upload | T-01 |
| SEC-003 | Rate limiting on upload | T-02 |
| SQL injection in getDailyEventCounts | Fix eventTypes interpolation | T-03 |
| PERF-005 (partial) | Optimize getUniqueActiveUsers | T-04 |
| PERF-005 (partial) | Optimize getCostAnalytics memory | T-05 |
| PERF-005 (partial) | Optimize getChatAnalytics sources | T-06 |
| DEBT-004 | Pagination on /api/documents | T-07 |
| PH5-002 | Extract shared streaming helper | T-08 |
| PH5-001 | Vitest + unit tests | T-09 |

### New Debt Identified
| Item | Priority | Description |
|------|----------|-------------|
| PERF-006 | Medium | getChatAnalytics topQuestions loads 200 messages client-side (acceptable, bounded by take:200) |
| PERF-007 | Low | exportAnalyticsCSV loads all events without pagination |

---

## 8. Priority Summary (Post-Sprint)

| Priority | Count | Items |
|----------|-------|-------|
| Critical | 1 | SEC-001 (API keys plaintext) |
| High | 1 | DEBT-002 (local embedding) |
| Medium | 3 | DEBT-001 (pdf-parse), DEBT-003 (rate limiter), SEC-002 (local filesystem) |
| Low | 7 | DEBT-005 (partial), DEBT-007 (resolved), DRIFT-001-004, PH5-003 through PH5-006 |

### Remaining Recommended Next Steps (After This Sprint)
1. **SEC-001**: Plan API key encryption (Critical, but can defer to Phase 6)
2. **DEBT-002**: Improve embedding quality (High — use Ollama nomic-embed-text)
3. **ROAD-002**: Begin Phase 6 (Workspace System) planning
4. **QUAL-003**: TypeScript strict mode migration (separate sprint)

---

*Last updated: 2025-06-05 (Optimization sprint created)*
*Source files: AGENTS.md, IMPLEMENTATION_ROADMAP.md, IMPLEMENTATION_PLAN.md, plans/architecture.md, Phase 5 Review, codebase audit*
