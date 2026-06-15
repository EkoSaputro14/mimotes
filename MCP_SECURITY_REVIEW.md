# MCP_SECURITY_REVIEW.md

**Date:** 2026-06-06
**Scope:** All MCP endpoints + MCP tools + MCP server management
**Severity:** CRITICAL — Multiple data isolation and auth issues

---

## Architecture Overview

Mimotes has TWO distinct MCP subsystems:

### 1. MCP Server (Outbound) — Mimotes as MCP Provider
Exposes Mimotes tools to external MCP clients (e.g., Hermes, OpenCode).

```
External Client → POST /api/mcp → createMimotesMCPServer() → Tools
```

### 2. MCP Client (Inbound) — Mimotes as MCP Consumer
Connects to external MCP servers configured by admins.

```
Admin → POST /api/mcp/servers → MCPManager → SSE Transport → External Server
```

---

## Finding 1: `/api/mcp` Was Listed as Public in Middleware

**Severity:** MEDIUM (mitigated by route-level auth)

**Before Security Sprint:**
The middleware listed `/api/mcp` as a public route, meaning NO cookie check was performed. The route handler had NO `auth()` call. **Anyone could invoke MCP tools without authentication.**

**After Security Sprint (current state):**
- Middleware: `/api/mcp` is still listed as public (line 41 of `middleware.ts`)
- Route handler: All 3 methods (POST/GET/DELETE) now call `auth()` ✅

**Current behavior:**
1. Middleware sees `/api/mcp` is public → passes through without cookie check
2. Route handler calls `auth()` → verifies JWT cryptographically
3. If no valid session → returns 401

**This is safe** because the route handler is the real security boundary. But the middleware public listing is misleading and should be removed.

**Fix required:** Remove `/api/mcp` from `publicRoutes` in middleware.ts.

---

## Finding 2: MCP Tools Have Zero User Context Filtering

**Severity:** CRITICAL — Cross-user data exposure

Every MCP tool operates on the ENTIRE knowledge base with no user isolation.

### `handleAskQuestion` — Reads ALL documents
```typescript
// lib/mcp/tools.ts line 72
const result = await generateRAGResponse(args.question, args.topK);
```
Calls `generateRAGResponse` → `searchSimilarChunks` → queries ALL `document_chunks` with no `userId` filter. **Any authenticated user can ask questions about documents uploaded by other users.**

### `handleSearchDocuments` — Searches ALL chunks
```typescript
// lib/mcp/tools.ts line 88
let results = await searchSimilarChunks(embedding, args.topK);
```
`searchSimilarChunks` in `vectorstore.ts` has no user filter:
```sql
SELECT id, content, document_id, ...
FROM document_chunks
ORDER BY embedding <=> $1::vector
LIMIT $2
```
**Returns chunks from ALL users' documents.**

### `handleListDocuments` — Lists ALL documents
```typescript
// lib/mcp/tools.ts line 111
const where: Record<string, unknown> = {};
// No userId filter!
const [documents, total] = await Promise.all([
  prisma.document.findMany({ where, ... }),
  prisma.document.count({ where }),
]);
```
**Lists every document in the system regardless of who uploaded it.**

### `handleGetDocumentDetail` — Reads ANY document
```typescript
// lib/mcp/tools.ts line 141
const document = await prisma.document.findUnique({
  where: { id: args.documentId },
  include: { chunks: { ... } },
});
```
No userId verification. **Any user can read any document's full content and all chunks by knowing/guessing the UUID.**

### `handleDeleteDocument` — Deletes ANY document
```typescript
// lib/mcp/tools.ts line 170
const document = await prisma.document.findUnique({
  where: { id: args.documentId },
});
await prisma.document.delete({ where: { id: args.documentId } });
```
No ownership check. **Any authenticated user can delete any other user's documents.**

### `handleUploadDocument` — Hardcoded fake userId
```typescript
// lib/mcp/tools.ts line 123
const document = await prisma.document.create({
  data: {
    title,
    fileType,
    fileUrl: args.url,
    status: "processing",
    userId: "system",  // ← FAKE ID — no such user in DB
  },
});
```
Creates documents with `userId: "system"` which doesn't exist in the `users` table. This violates the foreign key constraint and will either:
- Fail with a Prisma FK error (if enforced)
- Create an orphan document with no owner (if not enforced at DB level)

---

## Finding 3: MCP Server Management Has No Ownership Validation

**Severity:** HIGH

`/api/mcp/servers/route.ts` and `/api/mcp/servers/[id]/route.ts` have `auth()` checks but NO ownership validation:

```typescript
// GET /api/mcp/servers
const servers = await prisma.mcpServer.findMany({
  orderBy: { createdAt: "desc" },
  // ← No userId filter! Lists ALL servers
});
```

```typescript
// GET /api/mcp/servers/[id]
const server = await prisma.mcpServer.findUnique({
  where: { id },
  // ← No userId check! Returns ANY server
});
```

```typescript
// DELETE /api/mcp/servers/[id]
await prisma.mcpServer.delete({
  where: { id },
  // ← No ownership check! Deletes ANY server
});
```

**Any authenticated user can:**
- List all MCP servers (including API keys)
- Read any MCP server's configuration
- Delete any MCP server
- Update any MCP server's URL/API key

---

## Finding 4: MCP Tool Execution Has No Authorization

**Severity:** HIGH

`/api/mcp/call/route.ts` allows any authenticated user to call any MCP tool:

```typescript
const manager = getMCPManager();
const result = await manager.callTool(toolName, args || {});
```

`MCPManager.callTool` iterates ALL connected external MCP servers and executes the tool on whichever server has it. No user context is passed. **An authenticated user can execute tools on external MCP servers configured by other admins.**

---

## Finding 5: MCP Tools Bypass All Upload Security

**Severity:** HIGH

The `handleUploadDocument` MCP tool bypasses:
- ❌ File size limits (MAX_FILE_SIZE)
- ❌ File type validation
- ❌ Filename sanitization
- ❌ Proper user association
- ❌ Analytics tracking

It directly calls `parseFile` → `chunkText` → `generateEmbeddings` → `storeChunks` without any of the security checks present in `POST /api/upload`.

---

## Summary Table

| Endpoint | Auth? | User Isolation? | Safe? |
|----------|-------|-----------------|-------|
| `POST /api/mcp` | ✅ auth() | ❌ No user context in tools | ⚠️ CRITICAL |
| `GET /api/mcp` | ✅ auth() | N/A | ✅ |
| `DELETE /api/mcp` | ✅ auth() | N/A | ✅ |
| `GET /api/mcp/servers` | ✅ auth() | ❌ No userId filter | 🔴 HIGH |
| `POST /api/mcp/servers` | ✅ auth() | ⚠️ Sets userId correctly | ✅ |
| `GET /api/mcp/servers/[id]` | ✅ auth() | ❌ No ownership check | 🔴 HIGH |
| `PUT /api/mcp/servers/[id]` | ✅ auth() | ❌ No ownership check | 🔴 HIGH |
| `DELETE /api/mcp/servers/[id]` | ✅ auth() | ❌ No ownership check | 🔴 HIGH |
| `POST /api/mcp/call` | ✅ auth() | ❌ No user context | 🔴 HIGH |
| `POST /api/mcp/connect` | ✅ auth() | N/A (admin action) | ✅ |
| `DELETE /api/mcp/connect` | ✅ auth() | N/A (admin action) | ✅ |
| `GET /api/mcp/tools` | ✅ auth() | N/A (list only) | ✅ |

### MCP Tool-Level Isolation

| Tool | Reads User Data? | User Filter? | Safe? |
|------|------------------|-------------|-------|
| `ask_question` | ✅ ALL documents | ❌ None | 🔴 CRITICAL |
| `search_documents` | ✅ ALL chunks | ❌ None | 🔴 CRITICAL |
| `list_documents` | ✅ ALL documents | ❌ None | 🔴 CRITICAL |
| `get_document_detail` | ✅ ANY document | ❌ None | 🔴 CRITICAL |
| `delete_document` | ✅ ANY document | ❌ None | 🔴 CRITICAL |
| `upload_document` | Creates doc | ❌ userId="system" | 🔴 CRITICAL |
| `get_system_health` | Stats only | N/A | ✅ |

---

## Attack Scenarios

### Scenario 1: Cross-User Data Theft via MCP
1. User A uploads confidential HR documents
2. User B authenticates
3. User B calls `ask_question` via MCP: "What are User A's salary details?"
4. MCP tool searches ALL chunks → finds HR document → returns answer
5. **Result:** User B exfiltrates User A's confidential data

### Scenario 2: Document Deletion via MCP
1. User A uploads important knowledge base
2. User B authenticates
3. User B calls `list_documents` → gets all document IDs
4. User B calls `delete_document` for each ID
5. **Result:** All documents destroyed

### Scenario 3: API Key Theft via MCP Server List
1. Admin configures external MCP server with API key
2. User B authenticates
3. User B calls `GET /api/mcp/servers` → sees all servers including API keys
4. **Result:** API key exfiltrated

### Scenario 4: Orphan Document Creation
1. Any user calls `upload_document` via MCP
2. Document created with `userId: "system"` (non-existent user)
3. Document is orphaned — no user can see it in their document list
4. But it IS searchable via MCP tools and the chat RAG pipeline
5. **Result:** Phantom documents polluting the knowledge base

---

## Required Fixes

### Fix 1: Remove `/api/mcp` from Public Routes
**File:** `middleware.ts`
**Change:** Remove `"/api/mcp"` from `publicRoutes` array

### Fix 2: Add User Context to All MCP Tools
**File:** `lib/mcp/tools.ts`

Each tool handler needs to receive and use the authenticated user's ID:

```typescript
// Current: no user parameter
export async function handleAskQuestion(args: ...) { ... }

// Required: pass user context
export async function handleAskQuestion(
  args: ...,
  userId: string
) { ... }
```

And filter queries by userId:
```typescript
// searchSimilarChunks needs userId filter
// list_documents needs: where: { userId }
// get_document_detail needs: where: { id, userId }
// delete_document needs: where: { id, userId }
```

### Fix 3: Add User Filter to `searchSimilarChunks`
**File:** `lib/rag/vectorstore.ts`

```typescript
// Current: no user filter
FROM document_chunks
ORDER BY embedding <=> $1::vector

// Required: join through documents to filter by userId
FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
WHERE d.user_id = $userId
ORDER BY dc.embedding <=> $1::vector
```

**Note:** This requires a signature change to `searchSimilarChunks` and `generateRAGResponse` to accept an optional `userId` parameter. The public chat endpoint (`/api/chat`) uses anonymous sessions and should search ALL documents (current behavior). The MCP tools should filter by the authenticated user.

### Fix 4: Add Ownership to MCP Server Management
**File:** `app/api/mcp/servers/route.ts`, `app/api/mcp/servers/[id]/route.ts`

```typescript
// GET /api/mcp/servers — filter by userId
const servers = await prisma.mcpServer.findMany({
  where: { userId: session.user.id as string },
});

// GET/PUT/DELETE /api/mcp/servers/[id] — verify ownership
const server = await prisma.mcpServer.findFirst({
  where: { id, userId: session.user.id as string },
});
```

### Fix 5: Fix `upload_document` userId
**File:** `lib/mcp/tools.ts`

```typescript
// Current: hardcoded fake ID
userId: "system",

// Required: use authenticated user ID
userId: userId,  // passed from route handler
```

---

## Risk Assessment

| Risk | Current State | Impact |
|------|--------------|--------|
| Cross-user data theft | MCP tools search ALL documents | 🔴 CRITICAL — Data breach |
| Cross-user document deletion | No ownership check | 🔴 CRITICAL — Data loss |
| API key exposure | No ownership on server list | 🔴 HIGH — Credential theft |
| Orphan documents | userId="system" | 🟡 MEDIUM — Data integrity |
| Middleware bypass | /api/mcp is public | 🟢 LOW — Mitigated by route auth |

---

*End of MCP_SECURITY_REVIEW.md*
