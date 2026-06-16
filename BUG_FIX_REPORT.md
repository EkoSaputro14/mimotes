# BUG FIX REPORT — MimoNotes TestSprite QA
**Date:** 2026-06-15

---

## Fixes Applied

### Fix 1: Chat Messages RLS — Transaction-Based Context
**Bug:** RLS policy on `chat_messages` blocks INSERT because Prisma connection pool uses different connections  
**Severity:** CRITICAL  
**File:** `app/api/chat/route.ts`  
**Change:** Wrapped all `chatMessage.create` in `prisma.$transaction` with `tx.$executeRaw\`SELECT set_config(...)\``  

```typescript
// Before
await prisma.chatMessage.create({ data: { ... } });

// After
await prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_workspace_id', ${workspaceId}, false)`;
  await tx.chatMessage.create({ data: { ... } });
});
```

### Fix 2: Register Endpoint Error Handling
**Bug:** `POST /api/auth/register` returns 500 when body is JSON instead of form-data  
**Severity:** HIGH  
**File:** `app/api/auth/register/route.ts`  
**Change:** Added try/catch around `request.formData()`  

### Fix 3: Chat Endpoint JSON Parsing
**Bug:** `POST /api/chat` returns 500 on malformed JSON  
**Severity:** HIGH  
**File:** `app/api/chat/route.ts`  
**Change:** Added try/catch around `request.json()`  

### Fix 4: Re-enable RLS on chat_messages
**Bug:** RLS disabled as workaround, tenant-isolation test failing  
**Severity:** HIGH  
**File:** Database (SQL)  
**Change:** `ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY; ALTER TABLE chat_messages FORCE ROW LEVEL SECURITY;` + recreated policy  

### Fix 5: UUID Type Mismatch (Previous Session)
**Bug:** PostgreSQL functions use `uuid` params but columns are `text`  
**Severity:** CRITICAL  
**File:** Database functions  
**Change:** Recreated functions with `text` params  

### Fix 6: $executeRawUnsafe → $executeRaw (Previous Session)
**Bug:** Security audit flagged `$executeRawUnsafe`  
**Severity:** MEDIUM  
**File:** `app/api/chat/route.ts`  
**Change:** Changed to tagged template `$executeRaw`  

---

## Verification

| Fix | Before | After |
|-----|--------|-------|
| Chat RLS | 500 (RLS violation) | 200 ✅ |
| Register invalid input | 500 | 400 ✅ |
| Chat invalid JSON | 500 | 400 ✅ |
| Tenant isolation test | 1 failed | 0 failed ✅ |
| UUID functions | `text = uuid` error | Works ✅ |
| Security audit | $executeRawUnsafe flagged | Clean ✅ |

**All 353 tests passing after fixes.**
