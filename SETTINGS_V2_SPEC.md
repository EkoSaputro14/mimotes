# Settings V2 Specification — MimoNotes

**Date:** June 14, 2026
**Status:** Design spec — no implementation
**Based on:** SETTINGS_UX_AUDIT.md (score 4.5/10)
**Target score:** 7.5/10

---

## Design Principles

1. **Unified navigation** — Sidebar or tabs for all settings sections
2. **Progressive disclosure** — Overview → Details → Actions
3. **Accessible first** — Keyboard navigation, aria-live, skip links
4. **Mobile-first** — Card layout on mobile, table on desktop
5. **Design tokens** — Use V2 warm-purple system, no hardcoded colors

---

## V2 Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Settings Sidebar (Desktop) / Tabs (Mobile)               │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 👤 Account                                          │ │
│ │    Profile, Email, Password, Avatar                 │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🏢 Workspace                                        │ │
│ │    Name, Description, Members, Roles                │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🔒 Security                                         │ │
│ │    Password, 2FA, Sessions, Login History           │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🔔 Notifications                                    │ │
│ │    Email, In-app, Digest, Quiet Hours               │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🎨 Preferences                                      │ │
│ │    Theme, Language, Timezone, Shortcuts             │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🤖 AI Settings                                      │ │
│ │    Provider, Model, API Key                         │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ 🔧 Advanced                                         │ │
│ │    MCP, Widget, API Keys, Audit Logs                │ │
│ └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│ Settings Content                                        │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Current section content                             │ │
│ │                                                     │ │
│ │ [Save] [Cancel]                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Settings Layout (NEW)

**Desktop:** Left sidebar (240px) + content area
**Mobile:** Horizontal scrollable tabs + content

**Sidebar items:**
- 👤 Account (profile, email, password, avatar)
- 🏢 Workspace (name, description, members, roles)
- 🔒 Security (password, 2FA, sessions)
- 🔔 Notifications (email, in-app, digest)
- 🎨 Preferences (theme, language, timezone)
- 🤖 AI Settings (provider, model, API key)
- 🔧 Advanced (MCP, Widget, API Keys, Audit Logs)

**Active state:** Highlighted with primary color, left border indicator
**Icons:** lucide-react icons, consistent size

### 2. Account Settings (NEW)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 👤 Account Settings                              │
├─────────────────────────────────────────────────┤
│                                                 │
│ Avatar                                          │
│ ┌─────────┐                                     │
│ │  👤 JD  │  [Change Avatar]  [Remove]          │
│ └─────────┘                                     │
│                                                 │
│ Name                                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ John Doe                                   │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Email                                           │
│ ┌─────────────────────────────────────────────┐ │
│ │ john@example.com  ✓ Verified               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Save Changes]                                  │
└─────────────────────────────────────────────────┘
```

**Fields:**
- Avatar: Upload or URL, preview, remove button
- Name: Text input, 100 char limit
- Email: Read-only with verification status
- Timezone: Select dropdown
- Language: Select dropdown (ID/EN)

### 3. Security Settings (NEW)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔒 Security Settings                             │
├─────────────────────────────────────────────────┤
│                                                 │
│ Change Password                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Current Password                           │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ ••••••••                               │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ New Password                               │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ ••••••••                               │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ Confirm Password                           │ │
│ │ ┌─────────────────────────────────────────┐ │ │
│ │ │ ••••••••                               │ │ │
│ │ └─────────────────────────────────────────┘ │ │
│ │ [Update Password]                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Two-Factor Authentication                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ Status: Disabled                           │ │
│ │ [Enable 2FA]                               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Active Sessions                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 🖥️ Windows · Chrome · Jakarta              │ │
│ │    Last active: 2 jam lalu · [Revoke]      │ │
│ │ 📱 iPhone · Safari · Jakarta               │ │
│ │    Last active: 1 hari lalu · [Revoke]     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 4. Notification Settings (NEW)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔔 Notification Settings                         │
├─────────────────────────────────────────────────┤
│                                                 │
│ Email Notifications                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☑ Chat replies                            │ │
│ │ ☑ Document processing complete             │ │
│ │ ☑ Team member joined                       │ │
│ │ ☐ Weekly digest                            │ │
│ │ ☐ Marketing emails                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ In-App Notifications                            │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☑ New messages                             │ │
│ │ ☑ Mentions                                 │ │
│ │ ☐ System updates                           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Quiet Hours                                     │
│ ┌─────────────────────────────────────────────┐ │
│ │ ☐ Enable quiet hours                       │ │
│ │ From: 22:00  To: 07:00                     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ [Save Preferences]                              │
└─────────────────────────────────────────────────┘
```

### 5. Preferences Settings (NEW)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🎨 Preferences                                   │
├─────────────────────────────────────────────────┤
│                                                 │
│ Appearance                                      │
│ ┌─────────────────────────────────────────────┐ │
│ │ Theme: [System] [Light] [Dark]             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Language                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [Bahasa Indonesia] [English]               │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Timezone                                        │
│ ┌─────────────────────────────────────────────┐ │
│ │ [WIB (UTC+7)]                              │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Keyboard Shortcuts                              │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⌘K  Command Palette                        │ │
│ │ ⌘/  Keyboard Shortcuts                     │ │
│ │ ⌘N  New Chat                               │ │
│ │ Esc Close Modal                             │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 6. API Keys Management (NEW)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│ 🔑 API Keys                                      │
├─────────────────────────────────────────────────┤
│                                                 │
│ [+ Create API Key]                              │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ MimoNotes API Key                          │ │
│ │ mn_live_••••••••••••••••••••               │ │
│ │ Created: 14 Jun 2026 · Last used: 2h ago  │ │
│ │ [View] [Revoke]                            │ │
│ ├─────────────────────────────────────────────┤ │
│ │ Widget API Key                             │ │
│ │ mn_widget_••••••••••••••••••••             │ │
│ │ Created: 10 Jun 2026 · Last used: 1d ago  │ │
│ │ [View] [Revoke]                            │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Responsive Behavior

### Desktop (≥1024px)
- Left sidebar (240px) + content area
- Full forms with labels above inputs
- Tables for sessions, API keys, audit logs

### Tablet (768-1023px)
- Collapsed sidebar (icons only) + content
- Forms stack vertically
- Cards for sessions, API keys

### Mobile (<768px)
- Horizontal scrollable tabs at top
- Full-width forms
- Bottom sheet for actions
- Card layout for all lists

---

## Accessibility Requirements

1. **Skip-to-content** on all settings pages
2. **aria-live="polite"** for save/delete feedback
3. **Keyboard navigation** — Arrow keys for tabs, Enter for actions
4. **Focus management** — After save, focus moves to confirmation
5. **Screen reader announcements** — "Settings saved", "Password updated"
6. **Color + text** — Status indicators use both
7. **Touch targets** — Minimum 44px on mobile

---

## Migration Path

### Phase 1: Quick Wins (1 day)
- Add settings navigation tabs
- Add skip-to-content to all pages
- Add theme toggle (dark/light)
- Add language selector (ID/EN)
- Replace hardcoded colors with tokens
- Add aria-live for feedback
- Add loading skeletons
- Add keyboard shortcut (Cmd+K)

### Phase 2: Account & Security (2 days)
- Create profile settings page
- Create security settings page
- Add password change form
- Add 2FA setup flow
- Add session management

### Phase 3: Notifications & Preferences (2 days)
- Create notification settings page
- Create preferences page
- Add email notification toggles
- Add quiet hours settings
- Add timezone selector

### Phase 4: Advanced & Polish (2 days)
- Create API keys management page
- Unify billing/usage
- Add settings search
- Add mobile bottom sheets
- Add keyboard navigation

---

## Component File Structure

```
components/settings/
├── settings-layout.tsx          (NEW — sidebar + content layout)
├── settings-nav.tsx             (NEW — navigation sidebar/tabs)
├── account-settings.tsx         (NEW — profile, email, avatar)
├── security-settings.tsx        (NEW — password, 2FA, sessions)
├── notification-settings.tsx    (NEW — email, in-app, digest)
├── preferences-settings.tsx     (NEW — theme, language, timezone)
├── api-keys-settings.tsx        (NEW — API key management)
├── ai-settings-form.tsx         (ENHANCED — use tokens, add skip link)
├── mcp-settings-form.tsx        (ENHANCED — use tokens, add skip link)
├── settings-skeleton.tsx        (NEW — loading skeleton component)
└── settings-search.tsx          (NEW — global settings search)

app/(admin)/settings/
├── layout.tsx                   (NEW — shared settings layout)
├── page.tsx                     (REDIRECT to /settings/account)
├── account/page.tsx             (NEW — account settings)
├── workspace/page.tsx           (EXISTING — enhanced)
├── security/page.tsx            (NEW — security settings)
├── notifications/page.tsx       (NEW — notification settings)
├── preferences/page.tsx         (NEW — preferences settings)
├── ai/page.tsx                  (RENAMED from /settings)
├── advanced/page.tsx            (NEW — MCP, Widget, API Keys, Audit)
├── billing/page.tsx             (EXISTING — unified with usage)
└── usage/page.tsx               (MERGED into billing)
```

---

## Summary

| Metric | V1 (Current) | V2 (Target) |
|--------|-------------|-------------|
| Score | 4.5/10 | 7.5/10 |
| Profile settings | ❌ None | ✅ Full |
| Security settings | ❌ None | ✅ Password+2FA+Sessions |
| Notification prefs | ❌ None | ✅ Granular |
| Theme toggle | ❌ System only | ✅ Dark/Light/System |
| Language selector | ❌ ID only | ✅ ID/EN |
| API key management | ❌ None | ✅ Create/Revoke |
| Settings navigation | ❌ Isolated pages | ✅ Sidebar/Tabs |
| Mobile UX | ❌ Poor | ✅ Tabs+Bottom sheets |
| Accessibility | ❌ Low | ✅ WCAG 2.1 AA |
| Components | 8 | 15 |
