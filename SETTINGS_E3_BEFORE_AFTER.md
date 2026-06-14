# Settings E3 Before/After Comparison — MimoNotes

**Date:** June 14, 2026
**Sprint:** Settings E3 — Advanced Settings

---

## 1. Notification Settings

### Before (E2)
```
No notification settings page
No email notification preferences
No in-app notification preferences
No digest settings
```

### After (E3)
```
Dedicated /settings/notifications page
5 email preferences with toggle switches
3 in-app preferences with toggle switches
localStorage persistence
Save button with unsaved changes detection
```

---

## 2. API Key Management

### Before (E2)
```
No API key management UI in settings
Only v1/keys route (API auth, not session auth)
No way to create keys from dashboard
```

### After (E3)
```
Dedicated /settings/api-keys page
Create key with name + expiry options
Key shown ONCE with copy button
List all keys with status badges
Revoke with inline confirmation
Audit logging for all operations
Session-auth API route (/api/workspace/api-keys)
```

---

## 3. Settings Search

### Before (E2)
```
Command palette existed but no settings items
Only 1 "Settings" entry in Cmd+K
No way to search specific settings
```

### After (E3)
```
4 new settings items in command palette:
- Account Settings
- Security Settings
- Notification Settings
- API Keys
Standalone settings search component
10 total settings items searchable
```

---

## 4. Billing + Usage

### Before (E2)
```
Billing page: plan, invoices, revenue
Usage page: separate, different component
Two pages to check billing status
```

### After (E3)
```
Single billing page with both components
BillingDashboard (plan, invoices, revenue)
UsageOverview (documents, storage, chat, chunks)
One page for all billing/usage info
```

---

## 5. Mobile UX

### Before (E2)
```
No bottom sheet component
No mobile-optimized overlays
Actions used desktop modals on mobile
```

### After (E3)
```
BottomSheet component available
Slide-in animation from bottom
Backdrop with blur
Handle bar for visual affordance
Body scroll lock
Accessible (role=dialog, aria-modal)
Mobile-only rendering (lg:hidden)
```

---

## 6. Navigation

### Before (E2)
```
8 items: Akun, AI Settings, Workspace, Keamanan, MCP, Widget, Billing, Audit Logs
```

### After (E3)
```
10 items: Akun, AI Settings, Workspace, Keamanan, Notifikasi, API Keys, MCP, Widget, Billing, Audit Logs
```

---

## 7. API Coverage

### Before (E2)
```
No workspace-scoped API key management
No notification preferences API
```

### After (E3)
```
+ GET  /api/workspace/api-keys — List keys
+ POST /api/workspace/api-keys — Create key
+ DELETE /api/workspace/api-keys?id=xxx — Revoke key
```

---

## Score Progression

| Dimension | Before (E2) | After (E3) | Δ |
|-----------|-------------|------------|---|
| Notification settings | 0/10 | 7/10 | +7 |
| API key management | 0/10 | 8/10 | +8 |
| Settings search | 2/10 | 8/10 | +6 |
| Billing/usage | 5/10 | 7/10 | +2 |
| Mobile UX | 3/10 | 6/10 | +3 |
| Navigation | 8/10 | 9/10 | +1 |
| **Overall** | **7.5/10** | **8.0/10** | **+0.5** |
