# Lead Capture Spec

**Date:** 2026-06-15
**Status:** SPEC — Not yet implemented
**Phase:** 2 (after Widget V1)

---

## Goal

Capture visitor contact information (name, email, WhatsApp) through the chatbot widget before or during conversations, and make leads visible to workspace owners in a dashboard.

---

## Data Model

### Schema Changes

```prisma
model Widget {
  // Existing fields preserved...
  leadCaptureEnabled Boolean @default(false) @map("lead_capture_enabled")
  leadFields         Json    @default("[]") @map("lead_fields")
  leadCaptureMode    String  @default("pre_chat") @map("lead_capture_mode") @db.VarChar(20)
  // "pre_chat" = form before first message
  // "inline" = ask during conversation (AI prompts user)
  // "post_chat" = form after conversation ends
}

model WidgetConversation {
  // Existing fields preserved...
  leadName     String?  @map("lead_name") @db.VarChar(200)
  leadEmail    String?  @map("lead_email") @db.VarChar(300)
  leadWhatsApp String?  @map("lead_whatsapp") @db.VarChar(30)
  leadData     Json?    @map("lead_data")
  leadCapturedAt DateTime? @map("lead_captured_at")
}
```

### leadFields JSON Structure

```json
[
  {
    "name": "name",
    "label": "Nama Lengkap",
    "type": "text",
    "required": true,
    "placeholder": "Masukkan nama Anda"
  },
  {
    "name": "email",
    "label": "Email",
    "type": "email",
    "required": true,
    "placeholder": "email@example.com"
  },
  {
    "name": "whatsapp",
    "label": "WhatsApp",
    "type": "tel",
    "required": false,
    "placeholder": "+628xxx"
  }
]
```

### Default Configuration (SME-Friendly)

When `leadCaptureEnabled = true` and `leadFields = []` (empty), use these defaults:

```json
[
  { "name": "name", "label": "Name", "type": "text", "required": true },
  { "name": "email", "label": "Email", "type": "email", "required": true }
]
```

WhatsApp is optional by default (SMEs may not want to expose it initially).

---

## Capture Modes

### Mode 1: Pre-Chat Form (Default)

```
┌─────────────────────────────┐
│  Welcome! Before we start.. │
│                             │
│  Name: [____________]       │
│  Email: [___________]       │
│  WhatsApp: [________]       │
│                             │
│  [Start Chat]               │
└─────────────────────────────┘
```

- Shown before first message
- Required fields must be filled
- Data stored in sessionStorage (don't re-ask on page refresh)
- Lead data sent with first `/api/widget/chat` request

### Mode 2: Inline Capture (AI-Prompted)

AI detects conversation context and naturally asks for contact info:

```
User: "Do you have this in blue?"
Bot: "Let me check! I can also send you updates via WhatsApp.
      Could you share your name and number?"
User: "John, +628****7890"
Bot: "Thanks John! Here's what I found about blue variants..."
```

Implementation: System prompt includes instruction to ask for contact info after 3+ messages if lead not captured. Extract structured data from user response via regex + AI parsing.

### Mode 3: Post-Chat Form

```
┌─────────────────────────────┐
│  Thanks for chatting!       │
│                             │
│  Want updates? Leave your   │
│  contact:                   │
│                             │
│  Email: [___________]       │
│  WhatsApp: [________]       │
│                             │
│  [Submit] [Skip]            │
└─────────────────────────────┘
```

- Shown when conversation ends (user closes widget or after 5 min idle)
- Optional — "Skip" button always available
- Less intrusive, lower capture rate

---

## API Design

### Submit Lead Data

```
POST /api/widget/chat (existing endpoint, extended)

{
  "publicKey": "pw_pub_xxx",
  "message": "Hello",
  "visitorId": "v_xxx",
  "lead": {
    "name": "John Doe",
    "email": "john@example.com",
    "whatsapp": "+628****7890"
  }
}

// Validation rules:
// - If leadCaptureEnabled + mode=pre_chat: lead required on FIRST message
// - Fields validated against leadFields config
// - required fields must be non-empty
// - email: basic format validation
// - whatsapp: phone format validation (optional country code)
// - lead data stored on WidgetConversation record
```

### Retrieve Leads (Authenticated)

```
GET /api/widget/leads?widgetId=xxx&page=1&per_page=20&has_lead=true
Authorization: Bearer mk_liv_xxx

Response:
{
  "data": [
    {
      "conversationId": "conv_xxx",
      "visitorId": "v_xxx",
      "leadName": "John Doe",
      "leadEmail": "john@example.com",
      "leadWhatsApp": "+628****7890",
      "leadCapturedAt": "2026-06-15T10:30:00Z",
      "firstMessage": "Do you have blue shirts?",
      "messageCount": 5,
      "duration": "4m 32s",
      "startedAt": "2026-06-15T10:29:00Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 20,
    "leads_with_email": 120,
    "leads_with_whatsapp": 45
  }
}
```

### Export Leads (CSV)

```
GET /api/widget/leads/export?widgetId=xxx&format=csv
Authorization: Bearer mk_liv_xxx

Response: CSV file download
name,email,whatsapp,first_message,started_at,duration
John Doe,john@example.com,+628****7890,Do you have blue?,2026-06-15T10:29:00Z,4m 32s
```

---

## Widget UI Implementation

### Pre-Chat Form (widget.js)

```javascript
function showLeadForm(config) {
  const form = createElement('div', 'mimo-lead-form');

  for (const field of config.leadFields) {
    const input = createElement('input');
    input.type = field.type;
    input.name = field.name;
    input.placeholder = field.placeholder || field.label;
    input.required = field.required;
    input.setAttribute('aria-label', field.label);
    form.appendChild(input);
  }

  const submitBtn = createElement('button');
  submitBtn.textContent = 'Start Chat';
  submitBtn.type = 'submit';
  form.appendChild(submitBtn);

  form.onsubmit = (e) => {
    e.preventDefault();
    const leadData = {};
    for (const field of config.leadFields) {
      leadData[field.name] = form.querySelector(`[name="${field.name}"]`).value;
    }
    sessionStorage.setItem(`mimo_lead_${visitorId}`, JSON.stringify(leadData));
    hideLeadForm();
    showChatInput();
  };

  chatWindow.appendChild(form);
}
```

### Accessibility

- Form fields have proper `<label>` elements (not just placeholder)
- `aria-required="true"` on required fields
- Error messages linked via `aria-describedby`
- Focus management: first field auto-focused on form show
- Form submission via Enter key
- Screen reader announcement: "Please fill in your details to start chatting"

---

## Lead Dashboard UI

### Location

New tab in Widget Settings: `/settings/widget?tab=leads`

### Layout

```
┌─────────────────────────────────────────────────┐
│ Widget Leads                          [Export CSV]│
│                                                   │
│ Total: 142  │  With Email: 120  │  With WA: 45   │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │ Name     │ Email           │ WhatsApp │ Date  │ │
│ │ John Doe │ john@email.com  │ +628...  │ Jun 15│ │
│ │ Jane Doe │ jane@email.com  │ —        │ Jun 14│ │
│ │ ...      │ ...             │ ...      │ ...   │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│ [← Prev]  Page 1 of 8  [Next →]                  │
└─────────────────────────────────────────────────┘
```

### Features

- **Search** — filter by name, email, WhatsApp
- **Date range** — filter by capture date
- **Sort** — by date, name, message count
- **Export** — CSV with all visible leads
- **Click-through** — click lead to see full conversation

---

## Privacy & Compliance

### Data Handling

- Lead data stored in PostgreSQL (same as other workspace data)
- RLS-protected (workspace isolation)
- No PII in logs (mask email/WhatsApp in audit logs)
- Data retention: configurable per workspace (default: forever)

### Consent

- Pre-chat form includes optional consent checkbox:
  ```
  [✓] I agree to receive updates via WhatsApp (optional)
  ```
- Configurable per widget: `whatsappConsentRequired: true/false`
- Consent stored in `leadData` JSON field

### GDPR/Privacy

- "Delete my data" request: delete `WidgetConversation` + `WidgetMessage` by visitorId
- Export: visitor can request data export by visitorId
- No third-party data sharing

---

## Implementation Checklist

- [ ] Schema migration: add lead fields to Widget + WidgetConversation
- [ ] API: extend `POST /api/widget/chat` with lead validation
- [ ] API: create `GET /api/widget/leads` endpoint
- [ ] API: create `GET /api/widget/leads/export` CSV endpoint
- [ ] widget.js: pre-chat form UI
- [ ] widget.js: lead data persistence (sessionStorage)
- [ ] widget.js: send lead with first message
- [ ] Admin UI: leads tab in widget settings
- [ ] Admin UI: export button
- [ ] Tests: lead validation, storage, retrieval
- [ ] Accessibility: form labels, ARIA, focus management
