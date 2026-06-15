# Settings UX Audit — MimoNotes

**Date:** June 14, 2026
**Auditor:** Principal Product Designer + Staff UX Engineer
**Scope:** All settings pages, profile, account, workspace, preferences, security, billing
**Status:** Read-only audit — no code changes

---

## Current Score: 4.5 / 10

The settings system is functional but fragmented. Seven isolated pages with no shared navigation, no profile management, no security settings, and inconsistent design tokens. Users must know the exact URL to find each setting. The AI settings form is the most polished, but everything else feels like a developer admin panel.

---

## 1. Account Settings

### Score: 1/10

**Issues:**
1. **No account settings page** — Users cannot change their name, email, or password
2. **No profile page** — No `/profile` or `/account` route exists
3. **No avatar upload** — Users see initials only, no way to personalize
4. **No email verification status** — No indication of email verification
5. **No account deletion** — No way to delete account

**Comparison:**
- **Notion**: Profile page with name, email, avatar, timezone, language
- **Linear**: Account settings with profile, security, notifications
- **GitHub**: Profile with avatar, bio, email, SSH keys, 2FA
- **Vercel**: Account settings with profile, billing, security, tokens
- **Slack**: Profile with avatar, status, timezone, notifications

---

## 2. Profile Settings

### Score: 1/10

**Issues:**
6. **No profile editing** — Cannot update name or display name
7. **No timezone setting** — Dates show in browser timezone, no override
8. **No language preference** — UI is Indonesian, no language switcher
9. **No theme preference** — No dark/light mode toggle (system only)
10. **No notification preferences** — No email/notification settings

**Comparison:**
- **Notion**: Timezone, language, theme, notification preferences
- **Linear**: Profile, notifications, appearance, keyboard shortcuts
- **GitHub**: Profile, theme, notification email, timezone

---

## 3. Workspace Settings

### Score: 6/10

**Issues:**
11. **No navigation between settings sections** — Workspace settings is one long scrollable page with all sections stacked
12. **No tabbed interface** — Permission matrix, members, activity all on same page
13. **Hardcoded colors in some components** — Widget settings uses `bg-blue-600`, `text-white`
14. **No workspace deletion** — Owner cannot delete workspace
15. **No workspace transfer** — Cannot transfer ownership

**What works well:**
- Workspace name/description/avatar editing
- Member management with search and role filters
- Permission matrix display
- Activity log
- Leave workspace action

---

## 4. Preferences

### Score: 2/10

**Issues:**
16. **No preferences page** — No `/settings/preferences` route
17. **No theme toggle** — Dark/light mode is system-only
18. **No language selector** — Hardcoded Indonesian
19. **No timezone selector** — No override
20. **No keyboard shortcut customization** — Cmd+K is hardcoded

**Comparison:**
- **Notion**: Appearance (theme, sidebar), Language, Timezone
- **Linear**: Appearance, Keyboard shortcuts, Notifications
- **Slack**: Theme, Sidebar, Messages, Notifications

---

## 5. Notifications

### Score: 1/10

**Issues:**
21. **No notification settings** — No email/notification preferences
22. **No notification center** — No in-app notification bell
23. **No email digest settings** — No weekly digest, no real-time alerts
24. **No workspace notification settings** — No way to control what notifications are sent
25. **No quiet hours** — No do-not-disturb settings

**Comparison:**
- **Notion**: Email notifications, mentions, page updates, database changes
- **Linear**: Email, Slack, in-app notifications, digest settings
- **Slack**: Desktop, mobile, email, channel-specific, quiet hours

---

## 6. Security

### Score: 1/10

**Issues:**
26. **No security settings page** — No `/settings/security` route
27. **No password change** — Users cannot change their password
28. **No 2FA/TOTP** — No two-factor authentication
29. **No session management** — No way to view/revoke active sessions
30. **No login history** — No way to see where account is logged in

**Comparison:**
- **Notion**: Password, 2FA, sessions, login history
- **Linear**: Password, 2FA, sessions, API tokens
- **GitHub**: Password, 2FA, SSH keys, sessions, authorized apps
- **Vercel**: Password, 2FA, sessions, API tokens, Git access

---

## 7. API Keys

### Score: 3/10

**Issues:**
31. **Only AI API key visible** — Settings shows `ai_api_key` but it's masked
32. **No workspace API keys UI** — `api_keys` table exists but no management UI
33. **No key creation/deletion** — Cannot create or revoke API keys
34. **No key permissions** — No scope-based API key permissions
35. **No usage tracking per key** — Cannot see which key made which request

**Comparison:**
- **Vercel**: Create/revoke tokens, scope permissions, usage per token
- **GitHub**: Personal access tokens, fine-grained permissions, usage
- **Linear**: API keys with scopes, usage tracking

---

## 8. Billing

### Score: 5/10

**Issues:**
36. **Billing and usage are separate pages** — Could be unified
37. **No upgrade flow** — Shows plan but no upgrade button
38. **No invoice download** — Shows invoices but no download link
39. **No payment method display** — No card on file shown
40. **Hardcoded colors** — Uses `bg-green-500`, `bg-amber-500` instead of tokens

**What works well:**
- Plan display with status
- Usage breakdown with progress bars
- Invoice list with status icons

---

## 9. Mobile UX

### Score: 3/10

**Issues:**
41. **Forms are desktop-centric** — Input fields are full-width but not optimized
42. **No bottom sheet for actions** — Delete/save actions need bottom sheet
43. **Table layouts overflow** — Permission matrix, audit logs overflow on mobile
44. **No touch-optimized controls** — Select dropdowns are native (small)
45. **No swipe gestures** — Cannot swipe to delete or archive

---

## 10. Accessibility

### Score: 3/10

**Issues:**
46. **No skip-to-content** on most settings pages (only workspace has it)
47. **No aria-live** for save/delete feedback
48. **No focus management** — After save, focus doesn't move to confirmation
49. **No keyboard navigation** for settings tabs
50. **No screen reader announcements** — Status changes not announced

---

## 11. Visual Design Issues

### Score: 4/10

**Issues:**
51. **Hardcoded colors throughout** — `bg-blue-600`, `text-white`, `bg-gray-100`, `text-gray-700`
52. **Inconsistent card styles** — Some use `bg-card`, others use `bg-white`
53. **No consistent empty states** — Different patterns across components
54. **No loading skeletons** — Only spinners, no skeleton UI
55. **No consistent form layout** — Different spacing, different label styles

---

## 12. Competitive Comparison

| Dimension | MimoNotes | Notion | Linear | GitHub | Vercel | Slack |
|-----------|-----------|--------|--------|--------|--------|-------|
| **Profile settings** | ❌ None | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **Security settings** | ❌ None | ✅ Password+2FA | ✅ Password+2FA | ✅ Full | ✅ Full | ✅ Password |
| **Notification prefs** | ❌ None | ✅ Granular | ✅ Granular | ✅ Granular | ✅ Basic | ✅ Granular |
| **Theme toggle** | ❌ System only | ✅ Dark/Light | ✅ Dark/Light | ✅ Dark/Light | ✅ Dark/Light | ✅ Custom themes |
| **Language selector** | ❌ ID only | ✅ Multi | ✅ Multi | ✅ Multi | ✅ Multi | ✅ Multi |
| **API key management** | ❌ None | ❌ None | ✅ Tokens | ✅ PAT | ✅ Tokens | ❌ None |
| **Settings navigation** | ❌ Isolated pages | ✅ Sidebar | ✅ Tabs | ✅ Tabs | ✅ Tabs | ✅ Tabs |
| **Mobile UX** | ❌ Poor | ✅ Good | ✅ Good | ✅ Good | ✅ Good | ✅ Good |
| **Accessibility** | ❌ Low | ✅ Medium | ✅ High | ✅ High | ✅ Medium | ✅ Medium |
| **Score** | 4.5/10 | 8.0/10 | 8.5/10 | 9.0/10 | 8.0/10 | 7.5/10 |

---

## 13. Top 20 UX Issues (Ranked by Impact)

| # | Issue | Severity | Category | Effort |
|---|-------|----------|----------|--------|
| 1 | No profile/account settings | Critical | Account | Medium |
| 2 | No security settings (password, 2FA) | Critical | Security | Medium |
| 3 | No settings navigation (tabs/sidebar) | High | IA | Quick win |
| 4 | No notification preferences | High | Notifications | Medium |
| 5 | No theme toggle (dark/light) | High | Preferences | Quick win |
| 6 | No language selector | Medium | Preferences | Quick win |
| 7 | No skip-to-content on most pages | Medium | Accessibility | Quick win |
| 8 | Hardcoded colors throughout | Medium | Visual | Quick win |
| 9 | No API key management UI | Medium | API Keys | Medium |
| 10 | No password change | Medium | Security | Quick win |
| 11 | No workspace deletion | Medium | Workspace | Medium |
| 12 | No workspace transfer | Medium | Workspace | Medium |
| 13 | No settings search | Medium | IA | Medium |
| 14 | No loading skeletons | Low | Visual | Quick win |
| 15 | No keyboard shortcuts for settings | Low | Accessibility | Quick win |
| 16 | Billing/usage split | Low | IA | Medium |
| 17 | No invoice download | Low | Billing | Quick win |
| 18 | No session management | Low | Security | Medium |
| 19 | No aria-live for feedback | Low | Accessibility | Quick win |
| 20 | No mobile bottom sheets | Low | Mobile | Medium |

---

## 14. Quick Wins (< 1 hour each)

1. **Add settings navigation tabs** — Horizontal tab bar on settings pages
2. **Add skip-to-content** — Same pattern as workspace settings
3. **Add theme toggle** — Dark/light mode switch in settings
4. **Add language selector** — Indonesian/English toggle
5. **Replace hardcoded colors** — `bg-blue-600` → `bg-primary`, etc.
6. **Add aria-live** — For save/delete feedback
7. **Add password change form** — Simple change password modal
8. **Add loading skeletons** — Replace spinners with skeleton UI
9. **Add invoice download links** — PDF download for invoices
10. **Add keyboard shortcut** — Cmd+K for settings search

---

## 15. Medium Wins (< 1 day each)

1. **Create profile settings page** — Name, email, avatar, timezone
2. **Create security settings page** — Password, 2FA, sessions
3. **Create notification settings page** — Email, in-app, digest
4. **Create API keys management page** — Create, revoke, permissions
5. **Add workspace deletion** — Owner can delete workspace
6. **Add workspace transfer** — Transfer ownership workflow
7. **Add settings search** — Search across all settings
8. **Unify billing/usage** — Single billing page with usage tab
9. **Add mobile bottom sheets** — For settings actions
10. **Add keyboard navigation** — Arrow keys for settings tabs

---

## 16. Full Redesign Opportunities

1. **Unified settings layout** — Sidebar navigation with sections (Account, Workspace, Security, Billing, Advanced)
2. **Settings search** — Global search across all settings (Cmd+K)
3. **Settings export/import** — Backup and restore settings
4. **Settings audit trail** — Who changed what, when
5. **Settings templates** — Pre-configured settings for common use cases
6. **Settings wizard** — Guided setup for new workspaces
7. **Settings API** — Programmatic settings management
8. **Settings webhooks** — Notify on settings changes
9. **Settings versioning** — Rollback to previous settings
10. **Settings permissions** — Granular control over who can change what

---

## Summary

| Dimension | Score | Key Fix |
|-----------|-------|---------|
| Account settings | 1/10 | Create profile page |
| Profile settings | 1/10 | Add profile editing |
| Workspace settings | 6/10 | Add tabs navigation |
| Preferences | 2/10 | Add theme/language/timezone |
| Notifications | 1/10 | Create notification settings |
| Security | 1/10 | Create security page |
| API Keys | 3/10 | Add key management UI |
| Billing | 5/10 | Unify with usage |
| Mobile UX | 3/10 | Add bottom sheets |
| Accessibility | 3/10 | Add skip links, aria-live |
| Visual design | 4/10 | Replace hardcoded colors |
| **Overall** | **4.5/10** | |

**Highest ROI fixes:** Settings navigation tabs + profile page + security page + theme toggle → immediately raises score to ~6.5/10.
