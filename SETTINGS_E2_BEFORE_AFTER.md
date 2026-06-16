# Settings E2 Before/After Comparison — MimoNotes

**Date:** June 14, 2026
**Sprint:** Settings E2 — Account & Security

---

## 1. Account Settings

### Before (E1)
```
No account settings page
No way to change name
No profile display
No timezone selector
No avatar/initials
```

### After (E2)
```
Dedicated /settings/account page
Editable name with save button
Initials-based avatar display
Email with verification badge
Timezone selector (10 options)
"Anggota sejak" creation date
Loading skeleton
Unsaved changes detection
```

**Competitive comparison:**
- Notion: Profile with name, email, avatar ✅ → MimoNotes matches (minus avatar upload)
- Linear: Account settings ✅ → MimoNotes matches
- GitHub: Profile with avatar, bio ✅ → MimoNotes simpler but functional
- Vercel: Account settings ✅ → MimoNotes matches

---

## 2. Security Settings

### Before (E1)
```
No security page
No password change
No session visibility
No login history
```

### After (E2)
```
Dedicated /settings/security page
Password change form (current + new + confirm)
Show/hide password toggles
Password validation (min 6, different, match)
Warning: password change invalidates all sessions
Session history from audit logs (last 20)
Device type + browser + IP display
Loading skeleton
```

**Competitive comparison:**
- Notion: Password + 2FA + sessions ✅ → MimoNotes has password + sessions (no 2FA yet)
- Linear: Password + 2FA + sessions ✅ → MimoNotes has password + sessions
- GitHub: Password + 2FA + SSH keys ✅ → MimoNotes simpler
- Vercel: Password + 2FA + tokens ✅ → MimoNotes has password + sessions

---

## 3. Workspace Safety

### Before (E1)
```
No delete workspace
No transfer ownership
Owner cannot leave (blocked)
No danger zone
```

### After (E2)
```
Transfer Ownership: select member → confirm → roles swap
Delete Workspace: type name → confirm → cascade delete
Owner-only visibility (non-owners don't see danger zone)
Warning about permanent data loss
Audit logging for all destructive operations
```

**Competitive comparison:**
- Notion: Transfer ✅, Delete ✅ → MimoNotes matches
- Linear: Transfer ✅, Delete ✅ → MimoNotes matches
- GitHub: Transfer ✅, Delete ✅ → MimoNotes matches

---

## 4. Navigation

### Before (E1)
```
6 items: AI Settings, Workspace, MCP, Widget, Billing, Audit Logs
No Account or Security section
```

### After (E2)
```
8 items: Akun, AI Settings, Workspace, Keamanan, MCP, Widget, Billing, Audit Logs
Account as first item (most common setting)
Security after Workspace (logical grouping)
```

---

## 5. API Coverage

### Before (E1)
```
No user profile API
No password change API
No session history API
No workspace delete API
No workspace transfer API
```

### After (E2)
```
GET  /api/user/profile     — Fetch profile
PATCH /api/user/profile    — Update name
POST  /api/user/password   — Change password
GET  /api/user/sessions    — Login history
POST  /api/workspace/delete  — Delete workspace
POST  /api/workspace/transfer — Transfer ownership
```

---

## 6. Audit Trail

### Before (E1)
```
Workspace update logged
Login/logout logged
```

### After (E2)
```
+ workspace.delete logged
+ workspace.transfer_ownership logged
+ user.profile_update logged
+ user.password_change logged
```

---

## 7. Error Handling

### Before (E1)
```
MCP delete used native window.confirm()
No inline confirmation for destructive ops
```

### After (E2)
```
Password change: inline validation + error toasts
Workspace delete: type-to-confirm pattern
Ownership transfer: dropdown + confirmation
All errors: toast notifications with specific messages
```

---

## Score Progression

| Dimension | Before (E1) | After (E2) | Δ |
|-----------|-------------|------------|---|
| Account settings | 0/10 | 8/10 | +8 |
| Security settings | 0/10 | 7/10 | +7 |
| Profile management | 1/10 | 7/10 | +6 |
| Password management | 0/10 | 7/10 | +7 |
| Session visibility | 0/10 | 6/10 | +6 |
| Workspace safety | 2/10 | 7/10 | +5 |
| Navigation | 8/10 | 8/10 | 0 |
| **Overall** | **6.5/10** | **7.5/10** | **+1.0** |
