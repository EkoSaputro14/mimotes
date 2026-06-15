# FINAL EMBEDDING RECOMMENDATION — MimoNotes Multi-Tier Embedding Architecture

**Date:** June 13, 2026
**Status:** Recommended
**Decision Owner:** Engineering Team
**Documents Synthesized:** ADR-MULTI-TIER-EMBEDDING.md, EMBEDDING_PROVIDER_ARCHITECTURE.md, WORKSPACE_EMBEDDING_SETTINGS.md, REEMBEDDING_WORKFLOW.md, EMBEDDING_COST_ANALYSIS.md

---

## 1. Executive Summary

MimoNotes currently operates with feature-hashing embeddings (107K chunks), yielding a 100% false positive rate, 0% refusal accuracy, and 0.32 average similarity — fundamentally broken for semantic search. The recommended solution is a **three-tier embedding architecture** that preserves zero-barrier entry (no API key required) while enabling dramatic quality improvements for users who supply their own API keys (BYOK). The **Free tier** uses feature hashing as the default for all new workspaces, ensuring anyone can start immediately. The **BYOK tier** accepts user-provided API keys (OpenAI, Gemini, OpenRouter) to unlock production-grade semantic search with target similarity >0.70. A **Pro tier** is reserved for future hosted embedding infrastructure. This approach balances the critical business requirement — users must be able to use MimoNotes without an API key — with the technical reality that feature hashing cannot deliver acceptable search quality. The implementation is phased to deliver the highest-impact improvement (OpenAI provider) first, followed by workspace settings UI, additional providers, and finally Pro tier infrastructure.

---

## 2. Recommended Default Settings for New Workspaces

### 2.1 Default Provider: `feature_hashing`

| Setting | Default Value | Notes |
|---|---|---|
| `embeddingProvider` | `feature_hashing` | Zero barrier — works immediately |
| `embeddingModel` | `null` | Not applicable for feature hashing |
| `apiKeyRef` | `null` | No API key required |
| `dimensions` | `256` | Internal feature hashing dimension |
| `maxChunkSize` | `512` | Tokens per chunk |

**Rationale:** Every new workspace gets functional (if basic) semantic search out of the box. No onboarding friction, no API key prompts, no configuration required.

### 2.2 Onboarding Prompt Strategy

After a user performs their **first 10 queries** on the free tier, display a non-blocking upgrade prompt:

> **💡 Want better search results?**
> Your search is using basic matching. Connect your OpenAI API key for semantic search that understands meaning, not just keywords.
> [Connect API Key] [Maybe Later] [Don't Show Again]

**Triggers:**
- 10+ queries completed on feature_hashing provider
- Average top-result similarity < 0.50 (indicating poor results)
- User has not previously dismissed the prompt with "Don't Show Again"
- Show at most **once per session**, max **3 times total**

### 2.3 Quality Indicator in UI

Display a persistent quality badge in the search interface:

| Badge | Provider State | Color | Tooltip |
|---|---|---|---|
| 🟡 **Basic** | `feature_hashing` | Amber | "Using keyword-based matching. Connect an API key for semantic search." |
| 🟢 **Enhanced** | Any API-backed provider | Green | "Using [Provider] [Model] for semantic search." |
| 🔵 **Pro** | `pro` tier | Blue | "Using MimoNotes Pro hosted embeddings." |

The badge should be clickable and link to workspace embedding settings.

---

## 3. Implementation Priority

### Phase 1: Provider Abstraction + OpenAI Provider (Weeks 1–3)
**Goal:** Deliver the highest-quality embedding option first.

| Task | Effort | Impact |
|---|---|---|
| Define `EmbeddingProvider` interface | 2 days | Foundation for all providers |
| Implement `FeatureHashingProvider` (wrap existing logic) | 1 day | Preserve current behavior |
| Implement `OpenAIProvider` (text-embedding-3-small) | 3 days | Target: >0.70 avg similarity |
| Provider registry + factory pattern | 1 day | Dynamic provider selection |
| Workspace settings storage schema | 1 day | `embeddingProvider`, `embeddingModel`, `apiKeyRef` |
| Integration with `getWorkspaceAIConfig()` | 1 day | Leverage existing encryption infra |
| Unit + integration tests | 2 days | Quality gate |
| Benchmark: re-embed 1K sample chunks | 1 day | Validate quality targets |

**Deliverable:** Workspaces can switch between `feature_hashing` and `openai` providers. BYOK with OpenAI key.

### Phase 2: Workspace Settings UI + Re-embedding Workflow (Weeks 4–6)
**Goal:** Let users configure and migrate their embeddings.

| Task | Effort | Impact |
|---|---|---|
| Settings UI: provider selector dropdown | 2 days | User-facing configuration |
| Settings UI: API key input with encryption | 2 days | Secure key storage |
| Settings UI: quality badge display | 1 day | Visibility into current state |
| Re-embedding workflow (background job) | 3 days | Migrate existing chunks |
| Progress tracking + rollback on failure | 2 days | Safety for large workspaces |
| Onboarding prompt (10-query trigger) | 1 day | Upgrade funnel |

**Deliverable:** Full UI for provider switching. Background re-embedding with progress bar and rollback.

### Phase 3: Gemini + OpenRouter Providers (Weeks 7–9)
**Goal:** Multi-provider support for user flexibility.

| Task | Effort | Impact |
|---|---|---|
| `GeminiProvider` (text-embedding-004) | 2 days | Google ecosystem users |
| `OpenRouterProvider` (proxy to multiple models) | 2 days | Flexibility for power users |
| Provider-specific dimension handling | 1 day | Different models = different dims |
| Cross-provider compatibility testing | 2 days | Ensure consistent interface |
| UI: model selector per provider | 1 days | Fine-grained control |

**Deliverable:** Users can choose between OpenAI, Gemini, and OpenRouter with model selection.

### Phase 4: Pro Tier Infrastructure (Weeks 10–14)
**Goal:** Hosted embeddings for users who don't want BYOK.

| Task | Effort | Impact |
|---|---|---|
| Embedding proxy service (rate limiting, queuing) | 5 days | Server-side embedding |
| Usage metering + billing integration | 3 days | Per-embedding cost tracking |
| Quota management (free tier limits) | 2 days | Prevent abuse |
| `ProProvider` implementation | 2 days | Pro tier provider |
| Admin dashboard for usage monitoring | 3 days | Operational visibility |

**Deliverable:** MimoNotes-hosted embedding service with usage-based pricing.

---

## 4. Success Metrics

### 4.1 Target Benchmarks

| Metric | Current (Feature Hashing) | Target (OpenAI) | Measurement Method |
|---|---|---|---|
| **Avg Top-1 Similarity** | 0.32 | >0.70 | Sample 1K queries, measure cosine similarity |
| **False Positive Rate** | 100% | <10% | Human evaluation on 200 query-result pairs |
| **Refusal Accuracy** | 0% | >80% | Track "no relevant results" + user feedback |
| **Avg Query Latency** | ~50ms | <200ms | P95 server-side latency |
| **Re-embedding Speed** | N/A | >100 chunks/sec | Background job throughput |

### 4.2 Quality Tiers Summary

| Tier | Provider | Avg Similarity | False Positive Rate | Refusal Accuracy | Cost |
|---|---|---|---|---|---|
| **Free** | feature_hashing | ~0.32 | ~100% | ~0% | $0 |
| **BYOK** | openai (text-embedding-3-small) | >0.70 | <10% | >80% | ~$0.02/1M tokens (user pays) |
| **BYOK** | gemini (text-embedding-004) | >0.65 | <15% | >70% | Free tier available |
| **Pro** | hosted | >0.70 | <10% | >80% | Usage-based (TBD) |

### 4.3 Key Performance Indicators (KPIs)

- **Upgrade Rate:** % of users who connect an API key after onboarding prompt (target: >15%)
- **Retention Delta:** Compare 30-day retention of Free vs BYOK users (target: BYOK +20%)
- **Search Satisfaction:** Post-query thumbs up/down (target: BYOK >80% positive)
- **Re-embedding Completion:** % of workspaces that successfully complete migration (target: >95%)

---

## 5. Risk Mitigations

### 5.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **API key leakage** | Medium | Critical | Encrypt keys using existing `workspace_settings` encryption. Never log keys. Use `apiKeyRef` (reference) not raw key in code paths. |
| **Provider API downtime** | Medium | High | Automatic fallback to `feature_hashing` if provider call fails. Cache recent embeddings. Retry with exponential backoff. |
| **Dimension mismatch on provider switch** | High | High | Enforce re-embedding when switching providers. Block search until migration completes or fallback to feature_hashing. |
| **Re-embedding fails mid-workspace** | Medium | High | Transactional re-embedding: keep old vectors until new ones are confirmed. Rollback capability. Progress checkpointing. |
| **Cost surprise for BYOK users** | Low | Medium | Display estimated cost before re-embedding. Show running token count in settings. |
| **Feature hashing produces inconsistent vectors** | Low | Low | Feature hashing is deterministic by design. Pin hash function version. |

### 5.2 Product Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Users confused by "Basic" badge** | Medium | Low | Clear tooltip explanation. Link to docs. Don't nag — respect "Don't Show Again". |
| **Users don't have API keys** | High | Medium | Provide clear setup guides. Consider Pro tier as future alternative. Gemini offers free embedding quota. |
| **Breaking change for existing workspaces** | High | Critical | Default all existing workspaces to `feature_hashing` (preserves current behavior). Migration is opt-in. |
| **Provider deprecates embedding model** | Low | High | Abstract model name from provider. Support model versioning. Re-embedding workflow handles model upgrades. |

### 5.3 Security Considerations

- API keys encrypted at rest using workspace-level encryption (existing infrastructure)
- API keys never returned in API responses (only provider name + model exposed)
- API keys never logged in application logs
- Rate limiting on embedding API calls to prevent abuse
- Input sanitization on all text sent to external embedding APIs

---

## 6. Open Questions for Product Team

### 6.1 Free Tier Limits

| Question | Options | Recommendation |
|---|---|---|
| **Max documents per workspace?** | Unlimited / 100 / 500 / 1000 | 100 documents (encourages upgrade without blocking core use) |
| **Max chunks per workspace?** | Unlimited / 5K / 10K / 50K | 10K chunks (~20 docs avg) |
| **Max workspaces per user?** | Unlimited / 3 / 5 / 10 | 5 workspaces |
| **Should free tier have query rate limits?** | Yes / No | No for now — monitor usage first |

**Needs decision:** These limits directly affect the upgrade funnel. Too restrictive = users leave. Too generous = no revenue incentive.

### 6.2 Pro Tier Pricing Model

| Model | Pros | Cons |
|---|---|---|
| **Per-embedding token** | Fair, usage-aligned | Complex billing, unpredictable for users |
| **Per-workspace flat rate** | Simple, predictable | May over/under-charge |
| **Per-seat** | Familiar SaaS model | Doesn't scale with usage |
| **Freemium + paid tiers** | Clear upgrade path | Need to define tier boundaries |

**Needs decision:** Recommend starting with **per-workspace flat rate** ($5–10/workspace/month) for simplicity, with token-based as a future option.

### 6.3 BYOK Rate Limiting

| Question | Options | Recommendation |
|---|---|---|
| **Should MimoNotes rate-limit BYOK calls?** | Yes / No | Yes — protect users from accidental cost spikes |
| **Default rate limit?** | 100 / 500 / 1000 req/min | 500 embedding calls/min per workspace |
| **Should users be able to configure their own limit?** | Yes / No | Yes — in advanced settings |
| **What happens on limit exceeded?** | Queue / Reject / Fallback to feature_hashing | Queue with 30s timeout, then fallback |

**Needs decision:** Rate limiting approach and whether to expose configuration to users.

### 6.4 Embedding Model Versioning

| Question | Options | Recommendation |
|---|---|---|
| **What if OpenAI updates text-embedding-3-small?** | Auto-migrate / Pin version / Manual upgrade | Pin version, notify user of upgrade availability |
| **Should we store the model version with each embedding?** | Yes / No | Yes — store `provider:model:version` metadata per chunk |
| **How to handle incompatible model updates?** | Re-embed all / Dual-index / Accept degradation | Trigger re-embedding workflow, dual-index during transition |
| **What about dimension changes in model updates?** | Block upgrade / Auto-re-embed / Accept mismatch | Auto-trigger re-embedding, block search during migration |

**Needs decision:** Model versioning strategy. Recommend storing version metadata and supporting graceful migration.

### 6.5 Additional Open Questions

1. **Multi-provider embeddings in one workspace?** Should a workspace be able to have chunks embedded by different providers (e.g., old chunks with feature_hashing, new with OpenAI), or must all chunks use the same provider?
   - **Recommendation:** Single provider per workspace. Re-embedding migrates all chunks.

2. **Embedding cache strategy?** Should we cache embeddings for identical text to reduce API calls?
   - **Recommendation:** Yes, content-hash-based cache with 30-day TTL.

3. **Offline/degraded mode?** If the embedding provider is down, should search degrade gracefully or fail?
   - **Recommendation:** Degrade to feature_hashing with a UI indicator showing degraded mode.

4. **Data residency?** For BYOK, should we warn users that their text is sent to third-party APIs?
   - **Recommendation:** Yes, display a notice when connecting an API key: "Your document text will be sent to [Provider] for processing."

---

## Appendix A: Document Index

| Document | Purpose | Location |
|---|---|---|
| ADR-MULTI-TIER-EMBEDDING.md | Architecture decision record | `mimotes/ADR-MULTI-TIER-EMBEDDING.md` |
| EMBEDDING_PROVIDER_ARCHITECTURE.md | Provider abstraction layer design | `mimotes/EMBEDDING_PROVIDER_ARCHITECTURE.md` |
| WORKSPACE_EMBEDDING_SETTINGS.md | Workspace configuration schema | `mimotes/WORKSPACE_EMBEDDING_SETTINGS.md` |
| REEMBEDDING_WORKFLOW.md | Migration workflow design | `mimotes/REEMBEDDING_WORKFLOW.md` |
| EMBEDDING_COST_ANALYSIS.md | Cost analysis per provider | `mimotes/EMBEDDING_COST_ANALYSIS.md` |
| **FINAL_EMBEDDING_RECOMMENDATION.md** | **This document — synthesis of all decisions** | `mimotes/FINAL_EMBEDDING_RECOMMENDATION.md` |

## Appendix B: Current State Baseline

- **Total chunks:** 107,000
- **Current provider:** Feature hashing (implicit)
- **Average similarity:** 0.32
- **False positive rate:** 100%
- **Refusal accuracy:** 0%
- **Existing infrastructure:** `workspace_settings` table with encryption, `getWorkspaceAIConfig()` function

## Appendix C: Quick Reference — Provider Comparison

| Provider | Model | Dimensions | Cost (est. per 1M tokens) | Avg Similarity (target) | Free Tier |
|---|---|---|---|---|---|
| feature_hashing | N/A | 256 | $0 | 0.32 | ✅ Always free |
| openai | text-embedding-3-small | 1536 | $0.02 | >0.70 | ❌ |
| openai | text-embedding-3-large | 3072 | $0.13 | >0.75 | ❌ |
| gemini | text-embedding-004 | 768 | Free (limited) | >0.65 | ✅ (quota) |
| openrouter | varies | varies | varies | varies | ❌ |
| pro (hosted) | TBD | TBD | TBD | >0.70 | ❌ |

---

*This document is the authoritative synthesis of all embedding architecture decisions for MimoNotes. Refer to individual design documents for implementation details.*
