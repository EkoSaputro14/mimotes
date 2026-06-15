# 🐛 BUG TRIAGE GUIDE — MimoNotes Beta

**Purpose:** Classify, prioritize, and route bugs efficiently during beta  
**Auditor:** Eko Saputro (solo founder)  
**Tools:** GitHub Issues + labels

---

## 1. Bug Report Template

### GitHub Issue Template

```markdown
## Bug Report

**Title:** [Short description of the bug]

**Severity:** [P0 / P1 / P2 / P3]

**Environment:**
- Browser: [Chrome 120 / Firefox 121 / Safari 17]
- OS: [Windows 11 / macOS 14 / Linux]
- App version: [0.1.0]
- URL: [page where bug occurred]

**Steps to Reproduce:**
1. Go to [page]
2. Click [button]
3. Enter [data]
4. See error

**Expected Result:**
What should happen.

**Actual Result:**
What actually happens.

**Screenshots:**
[Attach screenshots or screen recording]

**Console Errors:**
[Paste any errors from browser DevTools → Console]

**Additional Context:**
[Any other relevant info]
```

---

## 2. Severity Classification

### P0 — CRITICAL (Fix in 4 hours)

**Definition:** Core workflow completely broken, data loss, or security breach.

**Examples:**
- User cannot register or login
- Document upload fails for all users
- Chat returns errors for all users
- Data loss (documents deleted, conversations lost)
- Security breach (user A can see user B's data)
- RLS bypass (cross-workspace data leak)
- Database connection failure

**Response time:** 4 hours  
**Fix time:** Same day  
**Communication:** Direct message to affected users

### P1 — HIGH (Fix in 48 hours)

**Definition:** Major feature broken, but workaround exists.

**Examples:**
- Chat gives wrong answers (hallucination)
- Document processing stuck (but others work)
- Invitation email not sent (but link works)
- Workspace switching fails (but can use default)
- Slow response (>10 seconds) for some queries
- Analytics page shows wrong data
- Rate limiting blocks legitimate users

**Response time:** 24 hours  
**Fix time:** 48 hours  
**Communication:** Acknowledge + ETA

### P2 — MEDIUM (Fix in 1 week)

**Definition:** Minor feature broken, cosmetic issue, or confusing UX.

**Examples:**
- Dashboard shows incorrect stat (but data exists)
- Copy button doesn't work
- Mobile layout broken
- Tooltip text wrong
- Sorting doesn't work in document list
- Export fails for large datasets
- Keyboard shortcuts don't work

**Response time:** 48 hours  
**Fix time:** 1 week  
**Communication:** Acknowledge + added to backlog

### P3 — LOW (Fix in next sprint)

**Definition:** Cosmetic, nice-to-have, or very rare edge case.

**Examples:**
- Typo in UI text
- Color doesn't match design
- Animation glitch
- Rare browser compatibility issue
- Feature works but could be better
- Documentation unclear

**Response time:** 1 week  
**Fix time:** Next sprint  
**Communication:** Acknowledge + noted

---

## 3. Triage Decision Tree

```
Bug reported
  │
  ├─ Is core workflow broken? (register, login, upload, chat)
  │   ├─ YES → Is it affecting ALL users?
  │   │   ├─ YES → P0 (CRITICAL)
  │   │   └─ NO → P1 (HIGH)
  │   └─ NO ↓
  │
  ├─ Is there a security issue? (data leak, auth bypass)
  │   ├─ YES → P0 (CRITICAL)
  │   └─ NO ↓
  │
  ├─ Is data lost or corrupted?
  │   ├─ YES → P0 (CRITICAL)
  │   └─ NO ↓
  │
  ├─ Is a major feature broken? (but workaround exists)
  │   ├─ YES → P1 (HIGH)
  │   └─ NO ↓
  │
  ├─ Is a minor feature broken?
  │   ├─ YES → P2 (MEDIUM)
  │   └─ NO ↓
  │
  └─ Is it cosmetic or nice-to-have?
      └─ YES → P3 (LOW)
```

---

## 4. Bug Classification Matrix

| Category | P0 | P1 | P2 | P3 |
|----------|----|----|----|----|
| **Auth** | Can't register/login | Password reset broken | Remember me doesn't work | Typo in error message |
| **Upload** | All uploads fail | Specific file type fails | Upload slow | Progress bar glitch |
| **Chat** | All chats error | Wrong answers consistently | Slow responses | Typo in AI response |
| **Documents** | All docs deleted | Can't view specific doc | Sort/filter broken | Icon wrong |
| **Workspace** | Can't switch workspace | Can't invite members | Role display wrong | Badge color off |
| **Dashboard** | Stats all wrong | Specific stat wrong | Chart not responsive | Tooltip missing |
| **Email** | No emails sent | Invitation email broken | Welcome email delayed | Email formatting |
| **Security** | Data leak | RLS misconfigured | CORS too permissive | Header missing |
| **Performance** | App unresponsive | >5s response time | >2s response time | Minor lag |

---

## 5. Bug Routing

### Solo Founder Workflow

```
Bug Report
  │
  ├─ Is it P0?
  │   ├─ YES → Drop everything, fix NOW
  │   │   ├── Create hotfix branch
  │   │   ├── Fix + test
  │   │   ├── Deploy immediately
  │   │   └── Notify affected users
  │   └─ NO ↓
  │
  ├─ Is it P1?
  │   ├─ YES → Fix within 48 hours
  │   │   ├── Add to current sprint
  │   │   ├── Fix + test
  │   │   └── Deploy in next release
  │   └─ NO ↓
  │
  └─ Is it P2/P3?
      ├─ YES → Add to backlog
      │   ├── Create GitHub issue
      │   ├── Label appropriately
      │   └── Fix in next sprint
      └─ NO → Close as "not a bug"
```

### Escalation Path

| Level | Trigger | Action |
|-------|---------|--------|
| Level 1 | P3 bug reported | Log in GitHub, fix next sprint |
| Level 2 | P2 bug reported | Log in GitHub, fix this sprint |
| Level 3 | P1 bug reported | Fix within 48 hours, notify user |
| Level 4 | P0 bug reported | Fix immediately, notify all users |
| Level 5 | Security breach | Fix immediately, audit all data, notify users + authorities |

---

## 6. Bug Fix Workflow

### Step 1: Reproduce

1. Follow the reporter's steps exactly
2. Confirm the bug exists
3. Note any additional observations
4. If can't reproduce: ask for more details

### Step 2: Root Cause Analysis

1. Check browser console for errors
2. Check server logs
3. Check database state
4. Identify the broken code path

### Step 3: Fix

1. Create fix on feature branch
2. Write test to prevent regression
3. Verify fix works
4. Verify no regressions

### Step 4: Deploy

1. Merge to main
2. Deploy to production
3. Verify fix in production
4. Close GitHub issue

### Step 5: Communicate

1. Notify affected user(s)
2. Update issue with fix details
3. Add to release notes (if applicable)

---

## 7. Common Bugs & Known Issues

### During Beta — Expected Issues

| Issue | Likely Cause | Quick Fix |
|-------|-------------|-----------|
| "Processing" stuck | Embedding API timeout | Restart document processing |
| Chat slow (>5s) | Cold start or large context | Reduce document count |
| Email not received | Resend not configured | Check RESEND_API_KEY |
| RLS error in logs | GUC not set | Check middleware |
| Rate limit false positive | In-memory limiter reset | Check rate limit config |

### Post-Beta — Watch For

| Issue | Monitoring | Alert Threshold |
|-------|-----------|-----------------|
| Memory leak | RSS > 512MB | Warning at 256MB |
| DB connection pool exhaustion | Active connections > 50 | Warning at 40 |
| Slow queries | Query time > 1s | Warning at 500ms |
| Error rate | 5xx responses > 1% | Warning at 0.5% |

---

## 8. Bug Triage Checklist

For each bug report:

- [ ] Title is clear and descriptive
- [ ] Severity is assigned (P0-P3)
- [ ] Steps to reproduce are provided
- [ ] Expected vs actual behavior documented
- [ ] Screenshots/logs attached
- [ ] Browser/OS/version noted
- [ ] Bug is reproducible
- [ ] Root cause identified (or hypothesis)
- [ ] Assigned to sprint/backlog
- [ ] Communication sent to reporter

---

## 9. Weekly Bug Review

Every Friday during beta:

| Metric | This Week | Last Week | Trend |
|--------|-----------|-----------|-------|
| New bugs reported | | | |
| Bugs fixed | | | |
| Open P0 bugs | | | |
| Open P1 bugs | | | |
| Open P2/P3 bugs | | | |
| Average fix time (P0) | | | |
| Average fix time (P1) | | | |

### Review Questions

1. Are we fixing P0/P1 bugs fast enough?
2. Are new bugs decreasing or increasing?
3. Is there a pattern in reported bugs?
4. Do we need to improve any specific area?
5. Is the beta stable enough for more users?

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Set up GitHub issues → Create labels → Start triage
