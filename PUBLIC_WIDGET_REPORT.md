# Public Widget Platform — Implementation Report

**Date:** 2026-06-07
**Status:** ✅ Complete
**Build:** ✅ Clean (0 new errors)

---

## Overview

Embeddable chat widget platform for Mimotes. Allows customers to add an AI-powered chatbot to any external website with a single `<script>` tag. Includes full customization, analytics, and cross-tenant isolation.

---

## Schema Changes

### `widgets` table
```sql
id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()
workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
name            VARCHAR(100) NOT NULL
slug            VARCHAR(100) UNIQUE NOT NULL
public_key      VARCHAR(64) UNIQUE NOT NULL
secret_key      VARCHAR(64) UNIQUE NOT NULL
allowed_domains TEXT[] DEFAULT '{}'
is_active       BOOLEAN DEFAULT true
primary_color   VARCHAR(7) DEFAULT '#3B82F6'
background_color VARCHAR(7) DEFAULT '#FFFFFF'
text_color      VARCHAR(7) DEFAULT '#1F2937'
logo_url        TEXT
avatar_url      TEXT
welcome_message VARCHAR(500) DEFAULT 'Hi! How can I help you?'
position        VARCHAR(20) DEFAULT 'bottom-right'
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()

INDEX: widgets_workspace_id_idx, widgets_slug_idx, widgets_public_key_idx
```

### `widget_conversations` table
```sql
id          TEXT PRIMARY KEY
widget_id   TEXT NOT NULL REFERENCES widgets(id) ON DELETE CASCADE
workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
visitor_id  VARCHAR(100)
ip_address  VARCHAR(45)
user_agent  VARCHAR(500)
status      VARCHAR(20) DEFAULT 'active'
started_at  TIMESTAMP DEFAULT NOW()
ended_at    TIMESTAMP

INDEX: widget_conversations_widget_id_idx, workspace_id_idx, started_at_idx
```

### `widget_messages` table
```sql
id              TEXT PRIMARY KEY
conversation_id TEXT NOT NULL REFERENCES widget_conversations(id) ON DELETE CASCADE
workspace_id    TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE
role            VARCHAR(20) NOT NULL  -- 'user' | 'assistant'
content         TEXT NOT NULL
tokens_used     INT DEFAULT 0
created_at      TIMESTAMP DEFAULT NOW()

INDEX: widget_messages_conversation_id_idx, workspace_id_idx
```

---

## Files Created

| File | Purpose |
|------|---------|
| `lib/widget.ts` | Widget CRUD, key generation, origin validation, theme defaults |
| `app/api/widget/config/route.ts` | GET — Public widget config (no auth) |
| `app/api/widget/chat/route.ts` | POST — Widget chat (public, with rate limit + origin check) |
| `app/api/widget/analytics/route.ts` | GET — Widget analytics (API auth required) |
| `app/api/v1/widget/list/route.ts` | GET — List workspace widgets |
| `app/api/v1/widget/create/route.ts` | POST — Create new widget |
| `app/api/v1/widget/update/route.ts` | PUT — Update widget settings |
| `public/widget.js` | Embeddable chat widget script |
| `app/(admin)/settings/widget/page.tsx` | Widget settings page |
| `components/widget/widget-settings-form.tsx` | Widget management UI |

---

## Widget Embed Script

### Usage
```html
<script src="https://your-domain.com/widget.js" data-key="pw_pub_xxx"></script>
```

### Features
- Floating chat bubble (bottom-right or bottom-left)
- Expandable chat window
- Welcome message
- Real-time messaging
- Conversation persistence
- Mobile responsive
- Theme customization (colors, position)

### Script Flow
```
1. Read data-key from <script> tag
2. Fetch widget config from /api/widget/config
3. Render chat UI with theme colors
4. On message → POST /api/widget/chat
5. Display response
```

---

## API Endpoints

### Public (no auth)

**GET /api/widget/config?publicKey=xxx**
- Returns widget theme and configuration
- Used by embed script on load

**POST /api/widget/chat**
- Send a chat message
- Rate limited: 20 requests/min per IP
- Origin validation against allowed domains
- Body: `{ publicKey, message, conversationId?, visitorId? }`

### Protected (API key required)

**GET /api/v1/widget/list**
- List all widgets for workspace

**POST /api/v1/widget/create**
- Create new widget
- Body: `{ name, slug }`

**PUT /api/v1/widget/update**
- Update widget settings
- Body: `{ widgetId, ...updates }`

**GET /api/widget/analytics?widgetId=xxx**
- Get widget analytics (conversations, messages, daily stats)

---

## Security

### Cross-Tenant Isolation

| Layer | Implementation |
|-------|---------------|
| **Widget lookup** | `publicKey` → `workspaceId` (unique index) |
| **Conversation scope** | `widgetId` → `workspaceId` (FK cascade) |
| **Message scope** | `conversationId` → `widgetId` → `workspaceId` |
| **API queries** | Always filtered by `workspaceId` from auth |
| **Origin validation** | `allowedDomains` checked on every chat request |

### Origin Validation

```
allowedDomains = ["example.com", "*.api.example.com"]

✅ https://example.com/page     → allowed
✅ https://sub.example.com      → allowed (*.example.com)
✅ https://api.example.com/path → allowed (*.api.example.com)
❌ https://evil.com             → denied
❌ https://example.com.evil.com → denied
```

### Rate Limiting

| Scope | Limit |
|-------|-------|
| Widget chat | 20 requests/min per IP |
| API routes | Per-workspace (from api-rate-limit.ts) |

### Key Types

| Key | Purpose | Shown |
|-----|---------|-------|
| `pw_pub_` | Client-side (embed script) | Always |
| `pw_sec_` | Server-side (admin) | Once on creation |

---

## Widget Customization

| Option | Default | Description |
|--------|---------|-------------|
| `primaryColor` | `#3B82F6` | Header, buttons, launcher |
| `backgroundColor` | `#FFFFFF` | Chat window background |
| `textColor` | `#1F2937` | Message text color |
| `logoUrl` | `null` | Header logo |
| `avatarUrl` | `null` | Bot avatar |
| `welcomeMessage` | `Hi! How can I help you?` | First message |
| `position` | `bottom-right` | Launcher position |
| `allowedDomains` | `[]` | Allowed origins (empty = all) |

---

## Widget Analytics

Tracked metrics:
- **Conversations** — Total and active
- **Messages** — User + assistant messages
- **Visitors** — Unique visitor IDs
- **Daily stats** — Conversations and messages per day (30 days)

---

## Dashboard UI

**/settings/widget** page with:

1. **Widget List** — View all widgets with conversation counts
2. **Create Widget** — Name + slug
3. **Embed Code** — Copy-paste `<script>` tag
4. **API Keys** — Public + secret keys
5. **Theme Editor** — Color pickers, welcome message, position
6. **Allowed Domains** — Comma-separated domain list
7. **Analytics** — Conversation count, status, domain count

---

## Entitlement Protection

- Widget CRUD routes require `api_access` feature (via `requireApiAuth`)
- Widget settings page is behind admin layout (checks entitlements)
- `public_widget` feature mapped to Pro and Enterprise plans
- Free plan: ❌ not included
- Pro plan: ✅ included
- Enterprise plan: ✅ included

---

## Build Verification

```
✓ Compiled successfully
✓ TypeScript type check passed
✓ Prisma schema applied (3 new tables)
✓ Prisma client regenerated
✓ All routes registered:
  ├ ƒ /api/widget/config
  ├ ƒ /api/widget/chat
  ├ ƒ /api/widget/analytics
  ├ ƒ /api/v1/widget/list
  ├ ƒ /api/v1/widget/create
  ├ ƒ /api/v1/widget/update
  └ ƒ /settings/widget
✓ Static asset: /widget.js
```

---

## Integration Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome to my site</h1>

  <!-- Add Mimotes chat widget -->
  <script
    src="https://your-mimotes-domain.com/widget.js"
    data-key="pw_pub_abc123..."
  ></script>
</body>
</html>
```

The widget will appear as a floating chat bubble in the bottom-right corner. Visitors can click it to start a conversation with your AI assistant.

---

*Generated: 2026-06-07 | Build: Clean | 10 files created*
