# 🚀 BETA LAUNCH PLAN — MimoNotes Public Beta

**Target Date:** TBD (estimated 1-2 weeks after config completion)  
**Status:** Pre-beta checklist  
**Owner:** Eko Saputro

---

## 1. Pre-Launch Checklist

### Infrastructure (P0 — Must Complete)

- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Generate and set `ENCRYPTION_KEY` (`openssl rand -hex 32`)
- [ ] Configure Resend API key for email delivery
- [ ] Set up domain DNS (A record → server IP)
- [ ] Enable HTTPS (Cloudflare Tunnel or reverse proxy)
- [ ] Verify `POST /api/health` returns `{"status":"healthy"}`
- [ ] Run `npx prisma migrate deploy` on production DB
- [ ] Verify RLS enforced: `SELECT current_setting('app.current_user_id', true)` returns empty
- [ ] Test invitation email delivery end-to-end

### Monitoring (P1 — Launch Week)

- [ ] Set up uptime monitoring (UptimeRobot / BetterStack)
  - Monitor: `GET /api/health` every 5 minutes
  - Alert: Telegram notification on downtime
- [ ] Configure error tracking (Sentry free tier)
- [ ] Set up basic logging (app logs → file or stdout)
- [ ] Create admin account: `admin@mimotes.com`

### Security (P1)

- [ ] Verify CSP headers block inline scripts from external origins
- [ ] Verify rate limiting works on production (5 requests to `/api/auth/register`)
- [ ] Verify CORS only allows production domain
- [ ] Test: Upload document with SSRF payload → should be blocked
- [ ] Test: SQL injection in search → should be sanitized

---

## 2. Beta Goals

### Primary Goals

| Goal | Metric | Target | How to Measure |
|------|--------|--------|----------------|
| Users sign up | Registrations | 20-50 users | DB query |
| Users upload docs | Documents uploaded | 50+ docs | DB query |
| Users chat | Chat sessions created | 100+ sessions | DB query |
| Users return | Retention (D7) | >30% | Analytics events |
| Users invite | Invitations sent | 20+ | Invitation count |

### Secondary Goals

| Goal | Metric | Target |
|------|--------|--------|
| Identify critical bugs | P0/P1 bugs found | <5 |
| Understand use cases | Top 3 use cases documented | Yes |
| Measure RAG quality | User satisfaction (thumbs up) | >60% |
| Test scaling | Concurrent users | 10+ without degradation |

### Non-Goals (Explicitly Out of Scope)

- ❌ Billing / payment integration
- ❌ Mobile app
- ❌ API access for third parties
- ❌ White-label / multi-tenant SaaS
- ❌ Advanced analytics dashboard

---

## 3. Beta Audience

### Target Users (20-50 people)

**Persona 1: Small Business Owner**
- Needs: Chatbot for customer support from internal docs
- Pain: No technical skills, can't set up AI tools
- MimoNotes fit: Upload docs → instant chatbot → embed on website

**Persona 2: Knowledge Worker**
- Needs: Search through meeting notes, reports, policies
- Pain: Too many docs, can't find information quickly
- MimoNotes fit: Upload all docs → ask questions → get sourced answers

**Persona 3: Educator / Trainer**
- Needs: Training chatbot from course materials
- Pain: Answering same questions repeatedly
- MimoNotes fit: Upload course materials → students chat with AI tutor

### Recruitment Channels

| Channel | Expected Users | Cost | Effort |
|---------|---------------|------|--------|
| Twitter/X announcement | 10-20 | Free | Low |
| LinkedIn post | 10-15 | Free | Low |
| Reddit r/SaaS, r/artificial | 5-10 | Free | Medium |
| Product Hunt (upcoming) | 20-50 | Free | High |
| Direct outreach | 5-10 | Free | Medium |
| Friends & colleagues | 5-10 | Free | Low |

---

## 4. Beta Timeline

### Week -2: Configuration

| Day | Task | Owner |
|-----|------|-------|
| Mon | Set production env vars | Eko |
| Mon | Set up domain + HTTPS | Eko |
| Tue | Configure email (Resend) | Eko |
| Tue | Test email delivery | Eko |
| Wed | Set up monitoring | Eko |
| Wed | Create admin account | Eko |
| Thu | Final security review | Eko |
| Fri | Create feedback channels | Eko |

### Week -1: Soft Launch

| Day | Task | Owner |
|-----|------|-------|
| Mon | Invite 5 "friendly" users | Eko |
| Mon | Monitor for critical bugs | Eko |
| Tue-Wed | Collect feedback from soft launch | Eko |
| Thu | Fix P0/P1 bugs found | Eko |
| Fri | Prepare launch announcement | Eko |

### Week 0: Public Beta Launch

| Day | Task | Owner |
|-----|------|-------|
| Mon | Publish announcement (Twitter, LinkedIn) | Eko |
| Mon | Post to Reddit communities | Eko |
| Tue-Thu | Active support + bug fixing | Eko |
| Fri | First weekly summary | Eko |

### Week 1-2: Active Beta

| Day | Task | Owner |
|-----|------|-------|
| Daily | Monitor health + errors | Eko |
| Daily | Respond to support requests | Eko |
| Fri | Weekly summary (users, bugs, feedback) | Eko |
| End of Week 2 | Beta retrospective | Eko |

---

## 5. Success Criteria

### Beta is SUCCESSFUL if:

- ✅ 20+ registered users
- ✅ 50+ documents uploaded
- ✅ 100+ chat sessions
- ✅ <5 P0/P1 bugs
- ✅ >60% positive feedback (thumbs up on answers)
- ✅ D7 retention >30%
- ✅ Zero data loss incidents
- ✅ Zero security incidents

### Beta NEEDS MORE WORK if:

- ⚠️ <10 registered users (marketing problem)
- ⚠️ >10 P0/P1 bugs (stability problem)
- ⚠️ <40% positive feedback (RAG quality problem)
- ⚠️ D7 retention <15% (UX problem)

### Beta is CANCELLED if:

- 🛑 Data loss incident
- 🛑 Security breach
- 🛑 >20 P0 bugs in first week

---

## 6. Post-Beta Decision Points

After 2 weeks of beta:

| Metric | Go → Public Launch | Pivot | Stop |
|--------|-------------------|-------|------|
| Users | 50+ | 10-50 | <10 |
| Retention D7 | >30% | 15-30% | <15% |
| P0/P1 bugs | <5 | 5-15 | >15 |
| Feedback sentiment | >60% positive | 40-60% | <40% |

---

## 7. Communication Templates

### Beta Announcement (Twitter/LinkedIn)

> 🚀 **MimoNotes is in Public Beta!**
>
> Turn your documents into an AI chatbot in 3 minutes.
>
> ✅ Upload PDFs, DOCX, TXT, CSV
> ✅ AI answers questions from your docs
> ✅ Source attribution on every answer
> ✅ Free tier — no API key required
>
> 🔗 [your-domain.com]
>
> Looking for beta testers! DM me for early access.
> #AI #RAG #Chatbot #SaaS

### Beta Thank You (Email)

> Subject: Thanks for trying MimoNotes! 🎉
>
> Hi [Name],
>
> Welcome to MimoNotes beta! You're one of our first users.
>
> **Quick start:**
> 1. Upload a document (PDF, DOCX, TXT, CSV)
> 2. Wait for processing (~30 seconds)
> 3. Start chatting with your docs!
>
> **We'd love your feedback:**
> - What worked well?
> - What was confusing?
> - What features are missing?
>
> Reply to this email or use the feedback button in the app.
>
> Thanks,
> Eko

---

## Appendix A: Configuration Checklist

```bash
# 1. Generate encryption key
openssl rand -hex 32

# 2. Set in .env or environment
NEXT_PUBLIC_APP_URL=https://your-domain.com
ENCRYPTION_KEY=<generated-key>
RESEND_API_KEY=re_***
EMAIL_FROM=noreply@your-domain.com

# 3. Apply migrations
npx prisma migrate deploy

# 4. Verify health
curl https://your-domain.com/api/health
# Should return: {"status":"healthy",...}

# 5. Test email
curl -X POST https://your-domain.com/api/workspace/invitations \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"viewer"}'

# 6. Check rate limiting
for i in {1..6}; do curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$i'@example.com","password":"pass","name":"Test"}'; done
# Should show 429 after request #5
```

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Configure production environment → Soft launch → Public beta
