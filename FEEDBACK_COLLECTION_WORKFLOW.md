# 📝 FEEDBACK COLLECTION WORKFLOW — MimoNotes Beta

**Purpose:** Systematic collection, categorization, and prioritization of user feedback during beta  
**Channels:** In-app, email, GitHub, social media  
**Response SLA:** Acknowledge within 24 hours, categorize within 48 hours

---

## 1. Feedback Channels

### Channel 1: In-App Feedback Button

**Implementation:** Floating button on all pages (bottom-right corner)  
**Flow:**
1. User clicks "Feedback" button
2. Modal opens with:
   - Type: Bug Report | Feature Request | General Feedback
   - Description: Textarea (required)
   - Email: Auto-filled from session (optional)
   - Screenshot: Auto-capture (optional)
3. Submit → Stored in `feedback` table
4. User sees: "Thanks! We'll review this."

**Data stored:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "type": "bug|feature|general",
  "description": "text",
  "screenshot_url": "url",
  "page_url": "/chat",
  "browser": "Chrome 120",
  "created_at": "2026-06-13T00:00:00Z",
  "status": "new",
  "priority": null,
  "response": null
}
```

### Channel 2: Email

**Address:** `feedback@mimotes.com` (or `support@mimotes.com`)  
**Auto-response:**
```
Subject: Re: Your feedback on MimoNotes

Hi [Name],

Thanks for your feedback! We've received it and will review within 48 hours.

Your feedback ID: [ID]
Current status: Under review

If this is urgent, please reply with "URGENT" in the subject line.

— MimoNotes Team
```

### Channel 3: GitHub Issues

**Repository:** `[your-org]/mimotes`  
**Labels:**
- `bug` — Something broken
- `enhancement` — Feature request
- `question` — How-to question
- `feedback` — General feedback
- `P0-critical` — Blocks core workflow
- `P1-high` — Major feature broken
- `P2-medium` — Minor issue
- `P3-low` — Cosmetic / nice-to-have

### Channel 4: Social Media Monitoring

**Platforms:** Twitter/X, Reddit, Product Hunt  
**Action:** Search for "MimoNotes" weekly  
**Response:** Thank positive feedback, address negative publicly

---

## 2. Feedback Processing Pipeline

### Step 1: Acknowledge (Within 24 hours)

For each new feedback:
1. Assign status: `acknowledged`
2. Send acknowledgment (email or in-app message)
3. Assign to triage team (or self for solo founder)

### Step 2: Categorize (Within 48 hours)

| Category | Description | Example |
|----------|-------------|---------|
| **Bug** | Something doesn't work | "Upload button doesn't respond" |
| **Feature Request** | Want new functionality | "Can I export chat history?" |
| **UX Issue** | Confusing or hard to use | "I couldn't find the settings" |
| **Performance** | Slow or resource-heavy | "Chat takes 10 seconds to respond" |
| **Data Issue** | Wrong or missing data | "Dashboard shows 0 docs but I have 3" |
| **Security** | Potential security concern | "I can see another user's documents" |
| **Praise** | Positive feedback | "Love this app! Great work!" |
| **Question** | How-to or clarification | "How do I connect OpenAI?" |

### Step 3: Prioritize

**Priority Matrix:**

| Impact → | Low (1 user) | Medium (10 users) | High (50+ users) |
|----------|--------------|-------------------|-------------------|
| **Urgency: Critical** | P1 | P0 | P0 |
| **Urgency: High** | P2 | P1 | P0 |
| **Urgency: Medium** | P3 | P2 | P1 |
| **Urgency: Low** | P3 | P3 | P2 |

**Definitions:**
- **P0 (Critical):** Data loss, security breach, core workflow broken → Fix in 4 hours
- **P1 (High):** Major feature broken, significant UX problem → Fix in 48 hours
- **P2 (Medium):** Minor feature broken, confusing UX → Fix in 1 week
- **P3 (Low):** Cosmetic, nice-to-have → Fix in next sprint

### Step 4: Respond

| Priority | Response Template |
|----------|-------------------|
| P0 | "We've identified this as a critical issue and are working on a fix. ETA: [time]. We'll update you when it's resolved." |
| P1 | "Thanks for reporting this! We've confirmed the issue and have it scheduled for our next fix. ETA: [date]." |
| P2 | "Good catch! We've added this to our backlog and will address it soon." |
| P3 | "Thanks for the suggestion! We've noted this for future consideration." |

### Step 5: Resolve

1. Fix the issue (if P0-P2)
2. Verify fix works
3. Update status to `resolved`
4. Notify user: "Fixed! Thanks for reporting."
5. Close GitHub issue (if applicable)

---

## 3. Feedback Dashboard

### Weekly Metrics (Every Friday)

| Metric | Week 1 | Week 2 | Trend |
|--------|--------|--------|-------|
| Total feedback received | | | |
| Bugs reported | | | |
| Feature requests | | | |
| P0/P1 bugs | | | |
| P0 bugs fixed | | | |
| Average response time | | | |
| User satisfaction (thumbs up) | | | |

### Top Issues (This Week)

1. [Issue title] — P[X] — [Status]
2. [Issue title] — P[X] — [Status]
3. [Issue title] — P[X] — [Status]

### User Quotes (Positive)

> "[Positive feedback quote 1]"

> "[Positive feedback quote 2]"

### User Quotes (Negative)

> "[Negative feedback quote 1]"

> "[Negative feedback quote 2]"

---

## 4. RAG Quality Feedback

### In-Chat Feedback

**Implementation:** 👍 / 👎 button on each AI response  
**Data stored:**
```json
{
  "message_id": "uuid",
  "rating": "positive|negative",
  "comment": "optional text",
  "created_at": "2026-06-13T00:00:00Z"
}
```

### Analysis (Weekly)

| Metric | Value | Target |
|--------|-------|--------|
| Positive ratings | | >60% |
| Negative ratings | | <20% |
| No rating | | <20% |
| Average relevance score | | >3.5/5 |

### Common RAG Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Wrong answer | Answer contradicts source doc | Review chunk quality, improve prompt |
| No answer (should have) | "I don't know" when info exists | Lower threshold, improve retrieval |
| Hallucination | Answer includes info not in docs | Strengthen grounding prompt |
| Outdated answer | Uses old version of doc | Re-embed after doc update |
| Wrong source | Source card doesn't match answer | Review source attribution logic |

---

## 5. User Segmentation

### Power Users (Use daily, many docs)

**Actions:**
- Invite to private Slack/Discord channel
- Give early access to new features
- Ask for detailed feedback

### Casual Users (Use weekly, few docs)

**Actions:**
- Send weekly digest of new features
- Ask for NPS score monthly

### Churned Users (Registered but inactive)

**Actions:**
- After 7 days: Send "We miss you!" email
- After 14 days: Ask why they stopped
- After 30 days: Mark as churned

---

## 6. Feedback Response Templates

### Bug Report Acknowledgment

```
Subject: Bug Report #[ID] — Acknowledged

Hi [Name],

Thanks for reporting this bug! We've logged it as #[ID].

Current status: Under investigation
Priority: [P0/P1/P2/P3]
Expected fix: [date or "We'll update you"]

If you have additional details (screenshots, steps to reproduce),
please reply to this email.

— MimoNotes Team
```

### Feature Request Acknowledgment

```
Subject: Feature Request #[ID] — Logged

Hi [Name],

Thanks for the feature idea: "[feature description]"

We've added it to our roadmap. Here's how we prioritize:
- P0-P1: Critical bugs and major features (days)
- P2-P3: Improvements and nice-to-haves (weeks-months)

We'll notify you if/when this is implemented!

— MimoNotes Team
```

### Resolution Notification

```
Subject: Fixed! — [Issue title]

Hi [Name],

Good news! We've fixed the issue you reported:

Issue: [title]
Fix: [brief description of what was changed]
Released: [date]

Thanks for helping us improve MimoNotes!

— MimoNotes Team
```

### NPS Survey (Monthly)

```
Subject: How's MimoNotes working for you?

Hi [Name],

Quick question: On a scale of 0-10, how likely are you to recommend
MimoNotes to a colleague?

[0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]

- 9-10: Promoters — What do you love most?
- 7-8: Passives — What would make it a 9?
- 0-6: Detractors — What can we improve?

Thanks for your feedback!

— MimoNotes Team
```

---

## 7. Feedback Automation

### Auto-Classification (Rule-Based)

```python
# Pseudo-code for auto-classifying feedback
def classify_feedback(text):
    if any(word in text.lower() for word in ['crash', 'error', 'broken', 'fail']):
        return 'bug'
    elif any(word in text.lower() for word in ['add', 'feature', 'wish', 'would be nice']):
        return 'feature_request'
    elif any(word in text.lower() for word in ['slow', 'lag', 'timeout']):
        return 'performance'
    elif any(word in text.lower() for word in ['confusing', 'hard to find', 'unclear']):
        return 'ux_issue'
    else:
        return 'general'
```

### Auto-Priority (Severity + Impact)

```python
# Pseudo-code for auto-prioritizing bugs
def prioritize_bug(bug):
    severity = bug.severity  # data_loss, security, broken_feature, cosmetic
    impact = bug.user_count   # 1, 10, 50+
    
    if severity == 'data_loss' or severity == 'security':
        return 'P0'
    elif severity == 'broken_feature' and impact >= 50:
        return 'P0'
    elif severity == 'broken_feature' and impact >= 10:
        return 'P1'
    elif severity == 'broken_feature':
        return 'P2'
    else:
        return 'P3'
```

---

**Document generated:** 2026-06-13  
**Sprint:** 14 (Staging Validation Complete)  
**Next step:** Set up feedback channels → Configure auto-classification → Launch beta
