# 🗺️ POST-BETA ROADMAP — MimoNotes

**Purpose:** Decision framework for what to build next based on beta outcomes  
**Created:** 2026-06-13  
**Status:** Planning (pre-beta)  
**Owner:** Eko Saputro

---

## Beta Outcomes (Decision Matrix)

After 2 weeks of beta, evaluate these metrics:

| Metric | 🟢 Go Public | 🟡 Pivot | 🔴 Stop |
|--------|-------------|----------|---------|
| Registered users | 50+ | 10-50 | <10 |
| Documents uploaded | 200+ | 50-200 | <50 |
| Chat sessions | 500+ | 100-500 | <100 |
| D7 retention | >30% | 15-30% | <15% |
| Positive feedback | >60% | 40-60% | <40% |
| P0/P1 bugs | <5 | 5-15 | >15 |
| Data loss incidents | 0 | 0 | >0 |
| Security incidents | 0 | 0 | >0 |

**Decision Rule:** If ANY metric is 🔴, do not proceed to public launch. Fix the root cause first.

---

## 1. If Beta SUCCEEDS (🟢 Go Public)

### Immediate (Week 1-2 Post-Beta)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P0 | Fix any remaining P0/P1 bugs | 1-3 days | Critical |
| P0 | Set up automated backups | 2 hours | Critical |
| P0 | Configure monitoring (UptimeRobot) | 1 hour | High |
| P1 | Write public documentation (README, FAQ) | 1 day | High |
| P1 | Set up Sentry error tracking | 2 hours | Medium |
| P2 | Create landing page / marketing site | 2-3 days | High |
| P2 | Write blog post announcing public launch | 1 day | Medium |

### Short-Term (Month 1-2)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | **Stripe billing integration** | 1 week | Revenue |
| P1 | **Pro tier features** (see Section 5) | 2 weeks | Revenue |
| P1 | User onboarding flow (tooltip tour) | 3 days | Retention |
| P2 | API documentation for power users | 2 days | Growth |
| P2 | Webhook integrations (Slack, Discord) | 3 days | Growth |
| P2 | Bulk document upload | 2 days | UX |
| P3 | Custom branding / white-label | 1 week | Enterprise |

### Medium-Term (Month 3-6)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| P1 | **AI provider marketplace** (see Section 6) | 2-3 weeks | Growth |
| P1 | **Advanced RAG features** (see Section 7) | 2-3 weeks | Quality |
| P2 | Team collaboration features | 2 weeks | Retention |
| P2 | Custom prompt templates | 1 week | UX |
| P2 | Multi-language support | 1 week | Growth |
| P3 | Mobile-responsive PWA | 2 weeks | Growth |
| SaaS analytics dashboard | 2 weeks | Value |

### Revenue Milestones

| Users | Monthly Revenue | Milestone |
|-------|----------------|-----------|
| 50 | $0 | Beta (free) |
| 100 | $500 | First paying customers |
| 500 | $2,500 | Sustainable solo founder |
| 1,000 | $5,000 | Consider hiring |
| 5,000 | $25,000 | Real business |

---

## 2. If Beta PARTIALLY SUCCEEDS (🟡 Pivot)

### Diagnosis Phase (Week 1-2)

Before pivoting, understand WHY it partially succeeded:

| Symptom | Likely Cause | Diagnostic Action |
|---------|-------------|-------------------|
| Low signups | Marketing problem | Survey: "Why didn't you sign up?" |
| High churn | Product problem | Interview 5 churned users |
| Low engagement | Feature problem | Analyze: What features were used? |
| Bad feedback | Quality problem | Review: What feedback was negative? |
| Many bugs | Stability problem | Fix P0/P1 before pivoting |

### Pivot Options

#### Option A: Niche Down (Recommended if specific use case dominates)

**If 70%+ users are from ONE persona:**
- Small business owners → "Customer support chatbot"
- Knowledge workers → "Internal docs search"
- Educators → "Training chatbot"

**Action:**
1. Rebrand for that niche
2. Build niche-specific features
3. Target that audience specifically
4. Remove features irrelevant to niche

**Effort:** 2-4 weeks  
**Risk:** Low (validated use case)

#### Option B: Pivot to API/Developer Tool (If users want integration)

**If users ask for API access or integrations:**
1. Build REST API for document upload + chat
2. Create SDKs (Python, JavaScript)
3. Target developers building chatbots
4. Add webhook support

**Effort:** 4-6 weeks  
**Risk:** Medium (different audience)

#### Option C: Pivot to Managed Service (If users want done-for-you)

**If users say "just set it up for me":**
1. Offer managed onboarding ($99-299 one-time)
2. Build admin dashboard for managing multiple clients
3. Target agencies and consultants
4. White-label option

**Effort:** 2-3 weeks  
**Risk:** Low (services are easier to sell)

#### Option D: Pivot to Open Source (If community interest exists)

**If developers want to self-host:**
1. Open source the codebase
2. Build premium features (SSO, analytics, priority support)
3. Create community (Discord, GitHub)
4. Monetize via support + premium features

**Effort:** 1-2 weeks (already mostly open source friendly)  
**Risk:** Medium (harder to monetize)

### Pivot Decision Framework

| Factor | Weight | Niche Down | API Tool | Managed Service | Open Source |
|--------|--------|------------|----------|-----------------|-------------|
| Technical effort | 25% | ✅ Low | ⚠️ Medium | ✅ Low | ✅ Low |
| Market size | 25% | ⚠️ Medium | ✅ Large | ⚠️ Medium | ✅ Large |
| Revenue potential | 25% | ✅ High | ✅ High | ✅ High | ⚠️ Medium |
| Competition | 15% | ✅ Low | ❌ High | ✅ Low | ⚠️ Medium |
| Founder fit | 10% | ✅ Yes | ⚠️ Maybe | ✅ Yes | ⚠️ Maybe |

---

## 3. If Beta FAILS (🔴 Stop)

### Pre-Mortem Analysis

Before stopping, understand WHY it failed:

| Failure Mode | Diagnostic Question | Evidence |
|-------------|---------------------|----------|
| Nobody signed up | Was the value proposition clear? | Landing page analytics |
| People signed up but left | Was the product confusing? | Onboarding funnel |
| People used it but weren't happy | Was the quality bad? | Feedback sentiment |
| Too many bugs | Was it stable enough? | P0/P1 bug count |
| Competition was better | Was there a better alternative? | Competitor analysis |

### Decision: Pivot or Persevere?

**If the technology works but the market doesn't:**
- Consider pivoting (see Section 2)
- The tech stack is solid (353 tests, security hardened)
- The problem might be positioning, not product

**If the technology doesn't work:**
- RAG quality issues → Consider using a better embedding model
- Performance issues → Consider architecture changes
- Security issues → Consider starting over with lessons learned

### Salvage Options

| Option | Effort | Potential |
|--------|--------|-----------|
| Open source the code | 1 day | Community goodwill |
| Sell as template/starter | 1 day | Some revenue |
| Document lessons learned | 1 day | Personal growth |
| Archive and move on | 0 days | Time savings |

---

## 4. Billing Roadmap

### Phase 1: Free Tier (Beta)

**Current state:** Everything free, no limits

**Limits during beta:**
- 10 documents per workspace
- 100 chat messages per day
- 1 workspace per user
- Feature hashing embeddings (free tier)

### Phase 2: Stripe Integration (Month 1-2)

**Requirements:**
- Stripe account (stripe.com)
- Stripe CLI for webhooks
- Next.js API routes for checkout

**Implementation:**
1. Stripe Checkout for one-time payments
2. Stripe Customer Portal for subscription management
3. Webhook handler for subscription events
4. Feature gating in middleware

### Phase 3: Pricing Tiers (Month 2-3)

| Tier | Price | Features | Limits |
|------|-------|----------|--------|
| **Free** | $0/mo | Basic chat, 1 workspace | 10 docs, 100 msgs/day |
| **Pro** | $19/mo | All features, priority support | 100 docs, 1000 msgs/day |
| **Business** | $49/mo | Team features, API access | Unlimited |
| **Enterprise** | Custom | SSO, SLA, dedicated support | Custom |

### Phase 4: Payment Flow (Month 3-4)

**User Journey:**
1. User hits free limit → "Upgrade to Pro" prompt
2. Click → Stripe Checkout (hosted)
3. Success → Webhook → Activate Pro features
4. Manage → Stripe Customer Portal

**Revenue Projections:**

| Month | Users | Conversion | MRR |
|-------|-------|------------|-----|
| Month 3 | 100 | 5% | $95 |
| Month 6 | 500 | 8% | $760 |
| Month 12 | 2000 | 10% | $3,800 |

---

## 5. AI Provider Roadmap

### Current State

| Provider | Status | Notes |
|----------|--------|-------|
| Feature Hashing | ✅ Free tier | No API key needed |
| OpenAI | ✅ BYOK | text-embedding-3-small |
| Google Gemini | ✅ BYOK | text-embedding-004 |
| Mimo Pro | ✅ BYOK | mimo-embedding |

### Phase 1: Provider Marketplace (Month 2-3)

**Goal:** Users choose their preferred AI provider

**Implementation:**
1. Provider settings page (already exists)
2. Per-workspace provider selection
3. API key management (encrypted, per-workspace)
4. Cost tracking per provider

### Phase 2: More Providers (Month 3-6)

| Provider | Type | Embedding Model | Cost |
|----------|------|-----------------|------|
| Anthropic | BYOK | — (no embedding API) | N/A |
| Cohere | BYOK | embed-english-v3.0 | $0.10/M tokens |
| Jina AI | BYOK | jina-embeddings-v2-base-en | $0.02/M tokens |
| Voyage AI | BYOK | voyage-2 | $0.06/M tokens |
| Local (Ollama) | Free | nomic-embed-text | Free |

### Phase 3: Managed Embeddings (Month 6+)

**Goal:** Users don't need API keys for good quality

**Implementation:**
1. MimoNotes-hosted embedding service
2. Usage-based billing ($0.01/1K embeddings)
3. Fallback to free tier if quota exceeded

### Phase 4: Multi-Model RAG (Month 6+)

**Goal:** Best answer from multiple providers

**Implementation:**
1. Query routing (simple → fast model, complex → powerful model)
2. Ensemble answers (combine multiple providers)
3. Cost optimization (cheapest provider for each task)

---

## 6. RAG Roadmap

### Current State

| Feature | Status | Quality |
|---------|--------|---------|
| Feature Hashing | ✅ Free tier | ⚠️ Low (0.32 avg similarity) |
| HNSW Index | ✅ Active | ✅ Fast (5ms latency) |
| Confidence Refusal | ✅ Working | ⚠️ 40% accuracy |
| Source Attribution | ✅ Working | ✅ Good |
| Chunk Deduplication | ❌ Not implemented | — |

### Phase 1: Quality Improvements (Month 1-2)

| Task | Effort | Impact |
|------|--------|--------|
| Chunk deduplication | 1 day | Better retrieval |
| Hybrid search tuning | 2 days | Better recall |
| Context window packing | 1 day | Better answers |
| Prompt optimization | 2 days | Better quality |

### Phase 2: Neural Embeddings (Month 2-3)

**Goal:** Upgrade from feature hashing to neural embeddings

**Options:**
1. **OpenAI text-embedding-3-small** — $0.02/M tokens, 1536d
2. **Google text-embedding-004** — Free tier, 768d
3. **Local Ollama** — Free, nomic-embed-text

**Migration:**
1. Re-embed all documents with new model
2. Update HNSW index
3. A/B test old vs new quality

### Phase 3: Advanced RAG (Month 3-6)

| Feature | Description | Effort |
|---------|-------------|--------|
| **Re-ranking** | Cross-encoder reranker for top-K results | 1 week |
| **Query expansion** | Generate multiple query variations | 3 days |
| **Multi-hop retrieval** | Chain retrieval for complex questions | 2 weeks |
| **Knowledge graph** | Entity relationships for better context | 3 weeks |
| **Streaming answers** | Real-time streaming responses | 3 days |

### Phase 4: RAG-as-a-Service (Month 6+)

**Goal:** Let developers use MimoNotes RAG pipeline via API

**Implementation:**
1. REST API: `POST /api/v2/embeddings`, `POST /api/v2/search`
2. SDKs: Python, JavaScript, Go
3. Usage-based pricing ($0.001/1K embeddings, $0.01/1K searches)
4. Self-hosted option for enterprise

---

## 7. Growth Roadmap

### Phase 1: Organic Growth (Month 1-3)

**Channels:**

| Channel | Strategy | Cost | Expected Users |
|---------|----------|------|----------------|
| Twitter/X | Daily tips, demos, behind-the-scenes | Free | 50-100 |
| LinkedIn | Professional use cases, case studies | Free | 30-50 |
| Reddit | r/SaaS, r/artificial, r/ChatGPT | Free | 20-40 |
| Product Hunt | Launch event | Free | 100-200 |
| Hacker News | Show HN post | Free | 50-100 |
| SEO | Blog posts targeting long-tail keywords | Free | 30-60 |

**Content Calendar:**

| Week | Content | Channel |
|------|---------|---------|
| Week 1 | "How I built an AI chatbot from my docs" | Twitter, LinkedIn |
| Week 2 | Demo video: 3-minute setup | YouTube, Twitter |
| Week 3 | Case study: Small business use | LinkedIn, Blog |
| Week 4 | "Why free tier matters" | Twitter, Reddit |

### Phase 2: Referral Program (Month 2-4)

**Mechanic:**
- User invites 3 friends → 1 month Pro free
- Friend signs up → Both get 100 extra messages
- Viral coefficient target: 1.3

**Implementation:**
1. Unique referral links
2. Tracking in database
3. Automated reward fulfillment
4. Leaderboard (optional)

### Phase 3: Partnerships (Month 3-6)

| Partner Type | Value Exchange | Effort |
|-------------|----------------|--------|
| Agencies | White-label for clients | Medium |
| Consultants | Bundled with services | Low |
| Course creators | Training chatbot for students | Low |
| Coworking spaces | Member perk | Low |

### Phase 4: Paid Acquisition (Month 6+)

**Budget:** $500-1000/month

| Channel | Target Audience | CPC |
|---------|----------------|-----|
| Google Ads | "AI chatbot from documents" | $1-3 |
| LinkedIn Ads | Business owners, IT managers | $2-5 |
| Twitter Ads | SaaS enthusiasts | $0.50-2 |

**Metrics to Track:**
- CAC (Customer Acquisition Cost)
- LTV (Lifetime Value)
- LTV:CAC ratio (target: 3:1)
- Payback period (target: <3 months)

---

## Appendix: Decision Checklist

### Before Going Public

- [ ] 50+ registered users
- [ ] D7 retention >30%
- [ ] <5 P0/P1 bugs
- [ ] >60% positive feedback
- [ ] Zero data loss incidents
- [ ] Zero security incidents
- [ ] Stripe billing integrated
- [ ] Monitoring + alerting active
- [ ] Documentation complete
- [ ] Landing page live

### Before Pivoting

- [ ] Root cause identified
- [ ] 5+ user interviews conducted
- [ ] Competitive analysis done
- [ ] Pivot option selected
- [ ] MVP scope defined (2-4 weeks)
- [ ] Success metrics defined

### Before Stopping

- [ ] Pre-mortem analysis complete
- [ ] Salvage options evaluated
- [ ] Lessons learned documented
- [ ] Code archived (if open sourcing)
- [ ] Next project brainstormed

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Launch beta → Collect data → Make decision → Execute roadmap
