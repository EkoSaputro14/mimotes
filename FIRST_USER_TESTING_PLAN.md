# 🧪 FIRST USER TESTING PLAN — MimoNotes Beta

**Purpose:** Validate that a first-time user can successfully complete core workflows without assistance  
**Duration:** 30-60 minutes per tester  
**Audience:** 5-10 "friendly" beta testers (friends, colleagues, early adopters)

---

## 1. Testing Objectives

| Objective | Success Criteria | Failure Indicator |
|-----------|-----------------|-------------------|
| User can register | Account created, lands on dashboard | Can't find register page, error on submit |
| User can upload document | Document shows in list, status "ready" | Upload fails, stuck in "processing" |
| User can chat with docs | Gets a relevant answer with sources | Empty response, unrelated answer, error |
| User can create workspace | Workspace created, can invite others | Can't find workspace settings |
| User can invite teammate | Invitation email sent, teammate can join | Email not received, link broken |
| User understands pricing | Knows free tier vs paid | Confused about limits |

---

## 2. Pre-Test Setup

### For Testers

1. **Create test account:**
   - Go to `[YOUR_DOMAIN]/register`
   - Email: `beta-test-[name]@gmail.com`
   - Password: (anything secure)
   - Name: (real name)

2. **Prepare test documents (2-3 files):**
   - 1 PDF (company policy, manual, or textbook chapter)
   - 1 DOCX (meeting notes or project plan)
   - 1 TXT or CSV (data or FAQ)

3. **Browser:** Chrome or Firefox (latest)

4. **Time:** 30-60 minutes

### For Facilitator

1. Create admin account: `admin@mimotes.com`
2. Monitor health endpoint: `GET /api/health`
3. Watch for error logs during testing
4. Be available for critical issues (not hand-holding)

---

## 3. Testing Scenarios

### Scenario 1: Registration & First Login (5 min)

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 1.1 | Go to `[YOUR_DOMAIN]` | Landing page loads | |
| 1.2 | Click "Register" or "Sign Up" | Registration form appears | |
| 1.3 | Enter email, password, name | Form accepts input | |
| 1.4 | Submit registration | Redirect to dashboard | |
| 1.5 | Check browser DevTools → Application → Cookies | JWT cookie present | |

**Observer notes:**
- Did user find the registration page easily?
- Any confusion about what to enter?
- Error messages clear?

---

### Scenario 2: Upload & Process Document (10 min)

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 2.1 | Navigate to Documents page | Empty document list | |
| 2.2 | Click "Upload" button | Upload dialog/page appears | |
| 2.3 | Drag & drop or select PDF | File accepted, processing starts | |
| 2.4 | Wait for processing | Status changes: processing → ready | ~30 seconds |
| 2.5 | Verify document appears in list | Title, type, status visible | |

**Observer notes:**
- Was upload drag-and-drop intuitive?
- Processing time acceptable?
- Error messages if upload fails?

---

### Scenario 3: Chat with Documents (10 min)

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 3.1 | Navigate to Chat page | Chat interface loads | |
| 3.2 | Type a question about the uploaded doc | Input field accepts text | |
| 3.3 | Send message | AI responds with answer | |
| 3.4 | Verify sources shown | Source cards with document name | |
| 3.5 | Ask a follow-up question | Context maintained | |
| 3.6 | Ask a question NOT in docs | Appropriate "I don't know" or refusal | |

**Observer notes:**
- Response time acceptable (<5 seconds)?
- Answer quality: relevant, accurate, helpful?
- Sources actually match the answer?
- Refusal behavior: polite, helpful?

---

### Scenario 4: Workspace & Team (10 min)

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 4.1 | Navigate to workspace settings | Workspace page loads | |
| 4.2 | Create a new workspace | Workspace created | |
| 4.3 | Switch to new workspace | Dashboard shows new workspace | |
| 4.4 | Navigate to team/members | Member list shows | |
| 4.5 | Click "Invite" button | Invite dialog appears | |
| 4.6 | Enter teammate's email | Email accepted | |
| 4.7 | Submit invite | "Invitation sent" message | |

**Observer notes:**
- Workspace switching intuitive?
- Team management easy to find?
- Invitation flow clear?

---

### Scenario 5: Explore Features (5 min)

| Step | Action | Expected Result | Notes |
|------|--------|----------------|-------|
| 5.1 | Check dashboard | Stats visible (docs, chats, etc.) | |
| 5.2 | Check analytics page | Charts load with data | |
| 5.3 | Check settings page | AI provider settings visible | |
| 5.4 | Check knowledge/documents page | Document explorer works | |

**Observer notes:**
- Navigation intuitive?
- Dashboard stats accurate?
- Any features confusing or broken?

---

## 4. Feedback Collection

### During Testing (Facilitator Observations)

Record for each tester:

| Field | Value |
|-------|-------|
| Tester name | |
| Date | |
| Duration | |
| Browser | |
| Technical level | (1-5, 5 = developer) |

**For each scenario:**
- Time to complete: __ seconds
- Completed without help? Y/N
- Confusion points: ____
- Error encountered: ____
- Tester comment: ____

### After Testing (User Interview — 10 min)

1. **On a scale of 1-10, how easy was MimoNotes to use?**
2. **What was the most confusing part?**
3. **What feature would you use most?**
4. **What's missing that you'd expect?**
5. **Would you recommend this to a colleague? (Y/N)**
6. **Any other feedback?**

---

## 5. Severity Scenarios (Edge Cases)

These are "stress test" scenarios for technically savvy testers:

| Scenario | Expected | Bug If... |
|----------|----------|-----------|
| Upload 100MB file | Rejected or slow processing | Crashes, OOM |
| Upload .exe file | Rejected | Accepted |
| Upload empty PDF | Shows error | Silent failure |
| Chat with no docs | Polite "no documents" message | Error page |
| Rapid-fire 20 messages | Rate limited at #5 | No limit |
| Switch workspace rapidly | No errors | Race conditions |
| Invite with invalid email | Shows validation error | Server error |

---

## 6. Post-Test Actions

### If P0 Bug Found (Blocks core workflow)

1. **Immediate:** Create GitHub issue with label `P0-critical`
2. **Within 4 hours:** Fix and deploy hotfix
3. **Notify:** Message affected tester directly

### If P1 Bug Found (Major feature broken)

1. **Within 24 hours:** Create GitHub issue with label `P1-high`
2. **Within 48 hours:** Fix and include in next deploy
3. **Log:** Add to bug triage queue

### If P2/P3 Bug Found (Minor issue)

1. **Create GitHub issue** with appropriate label
2. **Prioritize:** Add to backlog for next sprint
3. **No immediate action needed**

---

## 7. Sample Test Script (For Facilitator)

```
[START TEST — Date: ___  Tester: ___]

Hi [Name], thanks for helping test MimoNotes!

I'm going to watch you use the app for about 30 minutes.
There are no wrong answers — I'm testing the app, not you.
If something doesn't work, just tell me.

Ready? Let's start.

[1] Please go to [YOUR_DOMAIN] and create an account.
[TIMER START]

[2] Great! Now upload a document. I prepared some test files for you.
[Use: test-docs/sample.pdf]

[3] Wait for it to process. Tell me when it says "ready".

[4] Now go to the chat page and ask a question about that document.

[5] Great! Now try inviting a teammate.

[6] Last, look around — dashboard, settings, analytics.
Tell me what you think.

[TIMER STOP]

[INTERVIEW]
On a scale of 1-10, how easy was this?
What was confusing?
Would you use this? Why / why not?

[END TEST — Total time: ___ minutes]
```

---

## 8. Test Results Template

| Tester | Reg | Upload | Chat | Team | Avg Time | Rating | Bugs |
|--------|-----|--------|------|------|----------|--------|------|
| Name 1 | ✅ 3m | ✅ 5m | ✅ 4m | ✅ 6m | 4.5m | 8/10 | 0 |
| Name 2 | ✅ 2m | ❌ | — | — | — | — | 1 P0 |
| ... | | | | | | | |

**Summary:**
- Registration success rate: __%
- Upload success rate: __%
- Chat success rate: __%
- Team features success rate: __%
- Average rating: __/10
- P0 bugs found: __
- P1 bugs found: __
- P2 bugs found: __

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Recruit 5-10 testers → Run scenarios → Collect feedback
