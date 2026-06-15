# ADR: Multi-Tier Embedding Architecture for MimoNotes

**Status:** Accepted
**Date:** 2026-06-13
**Deciders:** MimoNotes Engineering Team

---

## Context

MimoNotes is a RAG chatbot built on Next.js + PostgreSQL + pgvector. The current embedding system uses feature hashing (trigram hashing), which produces vectors that are ~85% zeros with a maximum pairwise similarity of only 0.50. Retrieval quality is catastrophically bad: **100% false positive rate, 0% refusal accuracy** — the system returns irrelevant results for every query and cannot distinguish when it should refuse to answer.

The core tension: **users expect useful retrieval, but MimoNotes cannot require every user to bring their own API key** — that would eliminate casual exploration, demos, and self-hosted deployments where users may not have or want to manage embedding API credentials.

### Current Infrastructure

- **lib/crypto.ts** — AES-256-GCM encryption producing `enc:v1:iv:tag:ciphertext` format, already used for secret storage
- **lib/settings.ts** — `workspace_settings` table with per-workspace configuration; `getWorkspaceAIConfig()` already supports `ai_provider`, `ai_api_key`, `ai_base_url`, `ai_model`, `ai_embedding_model`; secret keys are auto-encrypted on write and auto-decrypted on read
- **lib/rag/embedder.ts** — Current embedder with `generateLocalEmbedding()` feature hashing fallback (the broken path)

### Problem

Feature hashing is the only embedding path. It produces degenerate vectors that make pgvector cosine similarity meaningless. Users cannot improve this without modifying source code.

---

## Decision

Implement a **three-tier embedding architecture** scoped at the **workspace level**, reusing the existing `workspace_settings` infrastructure.

### Tier Definitions

| Tier | Name | API Key Required | Embedding Source | Quality | Use Case |
|------|------|-----------------|------------------|---------|----------|
| 1 | **Free** | No | Feature hashing (local trigram) | Low | Demo, evaluation, zero-config |
| 2 | **BYOK** | Yes (user-owned) | OpenAI / Gemini / OpenRouter | High | Production workspaces |
| 3 | **Pro** (future) | No | MimoNotes-provided | High | Subscription, no key management |

### Tier 1: Free — Feature Hashing (Default)

**What:** The existing `generateLocalEmbedding()` trigram feature hashing.

**Why keep it instead of removing it:**
- **Zero barrier to entry.** Anyone can clone, deploy, and start using MimoNotes immediately. No signup, no API key, no billing.
- **It works for exact/near-exact keyword matching.** For simple "find the note about X" queries on small datasets, trigram hashing is acceptable.
- **Fallback safety net.** If a BYOK key expires, is revoked, or the external API is down, the system can degrade gracefully rather than hard-fail.
- **Development velocity.** Contributors can run the full stack without provisioning external services.

**Limitations (acknowledged, not hidden):**
- Vector quality is low — queries return noisy results.
- Not suitable for semantic search, paraphrase matching, or large corpora.
- UI should clearly indicate "Free tier — limited retrieval quality" and prompt upgrade.

### Tier 2: BYOK — User-Provided API Key

**What:** The workspace owner configures an embedding provider (OpenAI, Gemini, or OpenRouter) and provides their own API key. MimoNotes uses that key to generate high-quality embeddings via the provider's embedding endpoint.

**Providers supported at launch:**
- `openai` — `text-embedding-3-small` / `text-embedding-3-large`
- `gemini` — `text-embedding-004` / `text-embedding-005`
- `openrouter` — passthrough to any embedding model available on OpenRouter

**Configuration fields (all already exist in `workspace_settings`):**
- `ai_provider` — selects the embedding provider
- `ai_api_key` — user's API key (auto-encrypted at rest by `lib/crypto.ts`)
- `ai_base_url` — override endpoint (for OpenRouter or self-hosted proxies)
- `ai_embedding_model` — model identifier

### Tier 3: Pro — MimoNotes-Provided (Future)

**What:** MimoNotes provides a managed embedding service. Users pay a subscription; no API key needed.

**Why plan for it now:**
- The tier abstraction makes adding this a config change, not an architecture change.
- Revenue model for sustaining the project.
- Competitive with products like Notion AI, Mem, etc.

**Not in scope for this ADR.** Deferred to a future decision record.

---

## Scope: Workspace-Level, Not User-Level or Global

**Decision:** Embedding tier and configuration are scoped per workspace, not per user or globally.

**Why workspace-level:**
- **Matches the data model.** Documents, chunks, and vector embeddings are all scoped to a workspace. Re-embedding changes the vectors in-place; this must be a workspace-wide operation.
- **Matches the settings model.** `workspace_settings` already stores per-workspace AI config. Adding embedding config here is zero new infrastructure.
- **Matches the access model.** All users in a workspace share the same retrieval quality. It would be incoherent for two users in the same workspace to get different search results.
- **Simplicity.** Per-user embedding tiers would require separate vector indices or metadata tagging per chunk — a massive complexity increase for no clear benefit.

**Why not global:**
- Different workspaces may have different quality needs and different API key owners.
- A global setting would force all workspaces to the same tier.

---

## Why Reuse Existing workspace_settings Infrastructure

The `workspace_settings` table and `getWorkspaceAIConfig()` already support:
- `ai_provider` — string field selecting the AI provider
- `ai_api_key` — string field with auto-encryption via AES-256-GCM (`enc:v1:iv:tag:ciphertext`)
- `ai_base_url` — override endpoint URL
- `ai_model` — model identifier
- `ai_embedding_model` — embedding model identifier

**What we add:**
- A resolver function `getEmbeddingTier(workspaceId)` that reads `ai_embedding_model` and returns the tier.
- A routing function `embedForWorkspace(workspaceId, text)` that dispatches to the correct backend based on tier.
- No new database columns. No new tables. No migration.

**Security properties already provided:**
- API keys are encrypted at rest using AES-256-GCM.
- Keys are decrypted only server-side in `getWorkspaceAIConfig()`.
- Keys are **never** exposed to the frontend — only a boolean `hasApiKey` is sent to the client.
- The encryption key is an environment variable, not stored in the database.

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| API key exposure | Keys encrypted at rest (AES-256-GCM), decrypted only server-side, never sent to frontend |
| Key leakage via logs | Embedding functions log provider + model, never the key |
| Key misuse | Keys are used only for embedding API calls from the server; no pass-through to client |
| Downgrade attacks | Tier is determined by server-side config; client cannot force a different tier |
| Key rotation | Workspace owner updates `ai_api_key` in settings; existing embeddings are not invalidated (same model = same vector space) |

---

## Migration Path

1. **Existing workspaces stay on Tier 1 (feature hashing)** with zero action required. The current `generateLocalEmbedding()` is the default fallback.
2. **Upgrade to Tier 2** happens when a workspace owner configures `ai_provider` + `ai_api_key` + `ai_embedding_model` in workspace settings.
3. **Re-embedding:** When a workspace upgrades from Tier 1 to Tier 2, existing chunks must be re-embedded with the new model. This is handled by a background job triggered on settings change. During re-embedding, search uses the new model for queries but may return stale (old-tier) results for some chunks — this is acceptable and temporary.
4. **Downgrade:** If a workspace removes its API key, new embeddings fall back to Tier 1. Existing high-quality embeddings remain in the index and are still searchable, but new content uses feature hashing. A UI warning indicates the mixed state.

---

## Alternatives Considered

### Alternative 1: Two Tiers (Free + BYOK, no Pro)
- **Rejected:** Leaves no revenue path. The three-tier model adds Pro with trivial marginal cost (one more case in the resolver) and creates a sustainable business model.

### Alternative 2: Four Tiers (Free + BYOK + Pro + Self-hosted Model)
- **Rejected:** Self-hosted embedding models (e.g., running a local model via Ollama) are complex to deploy and support. If a user can run Ollama, they can configure it as an OpenAI-compatible endpoint via `ai_base_url` in the BYOK tier. No dedicated tier needed.

### Alternative 3: User-Level Embedding Tiers
- **Rejected:** See "Scope" section above. Per-user tiers would require separate vector indices or per-chunk metadata, adding massive complexity for no clear benefit. All users in a workspace share the same data and should get the same retrieval quality.

### Alternative 4: Remove Feature Hashing Entirely
- **Rejected:** This would make MimoNotes unusable without an API key, violating the core requirement. Feature hashing is bad but it's not zero — for exact keyword matches on small datasets, it works. It also serves as a graceful degradation path.

### Alternative 5: Global Embedding Configuration
- **Rejected:** Different workspaces have different needs. A research workspace might want `text-embedding-3-large`; a casual workspace might be fine with the free tier. Global config forces one-size-fits-all.

### Alternative 6: BYOK Before Pro (Ordering)
- **Why BYOK comes first:**
  - Zero infrastructure cost — we use the user's API key and existing provider APIs.
  - Immediate value — users who already have OpenAI/Gemini keys get better retrieval today.
  - Validates demand — if users adopt BYOK eagerly, it confirms Pro tier is worth building.
  - Pro requires billing infrastructure, usage metering, and embedding service ops — all significant work that BYOK doesn't need.

---

## Consequences

### Positive

- **Immediate retrieval quality improvement** for BYOK users — from degenerate feature hashing to production-grade embeddings.
- **Zero-config entry point preserved** — new users can explore MimoNotes without provisioning API keys.
- **Zero new infrastructure** — reuses `workspace_settings`, `lib/crypto.ts`, and existing provider abstraction.
- **Clean upgrade path** — workspace owners opt in to higher quality by adding a key; no re-deployment needed.
- **Future-proof** — adding Pro tier requires only a new case in the resolver, not an architecture change.
- **Security by default** — API keys are encrypted at rest and never exposed to the frontend.

### Negative

- **Mixed vector spaces during transitions** — when upgrading or downgrading, chunks may have embeddings from different models with incompatible vector spaces. Mitigation: re-embedding background job + UI warning.
- **Feature hashing remains the default** — new workspaces get low-quality retrieval until they configure a key. Mitigation: clear UI indication of tier status and upgrade prompt.
- **Provider dependency** — BYOK tier relies on external API availability. Mitigation: graceful fallback to feature hashing on provider error.
- **Re-embedding cost** — upgrading a workspace with many chunks triggers re-embedding via the user's API key, which costs them money. Mitigation: show chunk count and estimated cost before triggering.

---

## References

- `lib/crypto.ts` — AES-256-GCM encryption implementation
- `lib/settings.ts` — workspace_settings and getWorkspaceAIConfig()
- `lib/rag/embedder.ts` — Current feature hashing embedder
- pgvector documentation — https://github.com/pgvector/pgvector
