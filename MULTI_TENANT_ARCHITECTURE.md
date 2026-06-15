# MULTI_TENANT_ARCHITECTURE.md

**Date:** 2026-06-06
**Scope:** Defense-in-depth multi-tenant architecture for Mimotes SaaS
**Principle:** Data from Tenant A must NEVER be accessible by Tenant B, even if a developer makes mistakes.

---

## Current State Analysis

### What Exists Today

| Model | Has userId? | Isolation Level |
|-------|-------------|-----------------|
| `User` | N/A (is the owner) | ✅ Auth-gated |
| `Document` | ✅ `userId` (required) | ⚠️ App-level filter only |
| `DocumentChunk` | ❌ No userId | ⚠️ Via JOIN to Document |
| `ChatSession` | ✅ `userId` (nullable) | ⚠️ App-level filter only |
| `ChatMessage` | ❌ No userId | ⚠️ Via JOIN to ChatSession |
| `AnalyticsEvent` | ✅ `userId` (nullable) | ⚠️ App-level filter only |
| `Setting` | ❌ Global | ❌ Shared across all users |
| `PromptTemplate` | ✅ `createdBy` (nullable) | ⚠️ App-level filter only |
| `McpServer` | ✅ `userId` (required) | ⚠️ App-level filter only |

### Critical Vulnerability: The Optional userId

Every `userId` filter is **application-level only**. The database has no enforcement. A single missed filter = cross-tenant data breach.

**Current attack surface:**

```
40 API routes × manual userId check = 40 places a developer can forget
```

One missed `where: { userId }` = Tenant B reads Tenant A's documents.

---

## 1. Tenant Isolation Model

### Recommended: User-as-Tenant (Phase 1) → Workspace-as-Tenant (Phase 2)

**Phase 1 (Current + Hardening):** User = Tenant
- Each user is an isolated tenant
- `userId` on every table is the tenant boundary
- Add RLS as database-level enforcement

**Phase 2 (SaaS Launch):** Workspace = Tenant
- Add `Workspace` model as the tenant boundary
- Users belong to workspaces
- All data scoped to workspace, not user
- Enables team features, billing per workspace

```
Phase 1:                    Phase 2:
┌──────────┐               ┌──────────────────┐
│  User A  │               │    Workspace A    │
│  (tenant)│               │    (tenant)       │
│  ├─ docs │               │  ├─ User 1 (own) │
│  ├─ chat │               │  ├─ User 2 (edit)│
│  └─ data │               │  ├─ docs         │
└──────────┘               │  ├─ chat         │
                           │  └─ settings     │
┌──────────┐               └──────────────────┘
│  User B  │
│  (tenant)│               ┌──────────────────┐
│  ├─ docs │               │    Workspace B    │
│  ├─ chat │               │    (tenant)       │
│  └─ data │               │  └─ ...           │
└──────────┘               └──────────────────┘
```

---

## 2. Database Isolation Strategy

### Option Evaluation

| Option | Isolation | Complexity | Cost | Scalability | Verdict |
|--------|-----------|------------|------|-------------|---------|
| **A: Shared DB + tenant_id** | App-enforced | Low | Low | Medium | ⚠️ Current state |
| **B: Shared DB + RLS** | DB-enforced | Medium | Low | Medium | ✅ **RECOMMENDED** |
| **C: Schema per tenant** | Schema-enforced | High | Medium | High | Over-engineered |
| **D: Database per tenant** | DB-enforced | Very High | High | Very High | Enterprise only |

### Recommendation: Option B — Row Level Security (RLS)

**Why RLS:**

1. **Database-level enforcement** — Even if every API route forgets `userId`, PostgreSQL blocks cross-tenant reads
2. **Zero application code change required** — RLS policies run transparently
3. **Defense-in-depth** — Application filters + RLS = two independent barriers
4. **Performance** — Same as current (single table scan with policy filter)
5. **Cost** — No additional infrastructure

**Why NOT the others:**

- **Option A** is what we have now — purely app-enforced, one missed filter = breach
- **Option C** adds schema management complexity with no real benefit over RLS
- **Option D** is correct for 10,000+ tenants but premature for launch

### RLS Implementation

```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own documents
CREATE POLICY user_isolation ON documents
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Chunks isolated via document ownership
CREATE POLICY user_isolation ON document_chunks
  USING (document_id IN (
    SELECT id FROM documents
    WHERE user_id = current_setting('app.current_user_id')::uuid
  ));

-- Policy: Sessions isolated by user
CREATE POLICY user_isolation ON chat_sessions
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Messages isolated via session ownership
CREATE POLICY user_isolation ON chat_messages
  USING (session_id IN (
    SELECT id FROM chat_sessions
    WHERE user_id = current_setting('app.current_user_id')::uuid
  ));

-- Policy: Analytics isolated by user
CREATE POLICY user_isolation ON analytics_events
  USING (user_id = current_setting('app.current_user_id')::uuid);

-- Policy: Prompts isolated by creator
CREATE POLICY user_isolation ON prompt_templates
  USING (created_by = current_setting('app.current_user_id')::uuid);

-- Policy: MCP servers isolated by user
CREATE POLICY user_isolation ON mcp_servers
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

### Application Layer: Set Context Before Every Query

```typescript
// lib/prisma.ts — Middleware to set tenant context
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Call this at the start of every request
export async function setTenantContext(userId: string) {
  await prisma.$executeRaw`
    SET LOCAL app.current_user_id = ${userId}
  `;
}

export { prisma };
```

**Usage in API routes:**
```typescript
export async function POST(request: NextRequest) {
  const session = await auth();
  const userId = session.user.id as string;

  // Set RLS context — ALL subsequent queries are filtered
  await setTenantContext(userId);

  // Now even WITHOUT where: { userId }, RLS blocks cross-tenant reads
  const docs = await prisma.document.findMany();
  // ↑ RLS automatically filters to user's documents
}
```

### Migration Strategy

```sql
-- Step 1: Add tenant_id to document_chunks (currently has no userId)
ALTER TABLE document_chunks ADD COLUMN tenant_id UUID;

-- Step 2: Backfill from document ownership
UPDATE document_chunks dc
SET tenant_id = d.user_id
FROM documents d
WHERE dc.document_id = d.id;

-- Step 3: Make NOT NULL after backfill
ALTER TABLE document_chunks ALTER COLUMN tenant_id SET NOT NULL;

-- Step 4: Add index for RLS performance
CREATE INDEX idx_document_chunks_tenant ON document_chunks(tenant_id);
```

---

## 3. Vector Search Isolation Strategy

### Current Risk

```typescript
// lib/rag/vectorstore.ts — Unfiltered path still exists
if (userId) {
  // Filtered: JOIN documents WHERE user_id = $userId
} else {
  // UNFILTERED: searches ALL chunks
  SELECT ... FROM document_chunks WHERE embedding IS NOT NULL
}
```

The `else` branch is dead code after our chat fix, but it's a **landmine** for future developers.

### Defense-in-Depth Strategy

**Layer 1: Remove the unfiltered path entirely**

```typescript
// BEFORE — dangerous fallback
export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK: number = 5,
  userId?: string  // ← optional = danger
)

// AFTER — userId is REQUIRED
export async function searchSimilarChunks(
  queryEmbedding: number[],
  topK: number,
  userId: string  // ← mandatory = safe
)
```

**Layer 2: Add tenant_id directly to document_chunks**

```sql
-- Add tenant_id to chunks table
ALTER TABLE document_chunks ADD COLUMN tenant_id UUID NOT NULL;

-- Index for vector search + tenant filter
CREATE INDEX idx_chunks_tenant_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Layer 3: Workspace-scoped vector search**

```typescript
// BEFORE — JOIN through documents (slow, fragile)
SELECT dc.* FROM document_chunks dc
JOIN documents d ON d.id = dc.document_id
WHERE d.user_id = $userId

// AFTER — direct tenant filter (fast, safe)
SELECT * FROM document_chunks
WHERE tenant_id = $userId
  AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $2
```

**Layer 4: RLS on document_chunks**

Even if the application forgets `tenant_id` filter, RLS blocks cross-tenant reads.

### Migration: Add tenant_id to document_chunks

```sql
-- 1. Add column
ALTER TABLE document_chunks ADD COLUMN tenant_id UUID;

-- 2. Backfill
UPDATE document_chunks dc
SET tenant_id = d.user_id
FROM documents d
WHERE dc.document_id = d.id;

-- 3. Enforce NOT NULL
ALTER TABLE document_chunks ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Add FK
ALTER TABLE document_chunks
  ADD CONSTRAINT fk_chunks_tenant
  FOREIGN KEY (tenant_id) REFERENCES users(id);

-- 5. Add index for vector search
CREATE INDEX idx_chunks_tenant_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Vector Search Safety Matrix

| Scenario | Current | After Fix |
|----------|---------|-----------|
| Developer forgets userId filter | ❌ Cross-tenant leak | ✅ RLS blocks |
| Vector search bug | ❌ Cross-tenant leak | ✅ tenant_id filter |
| New feature skips filter | ❌ Cross-tenant leak | ✅ RLS blocks |
| Direct SQL injection | ❌ Cross-tenant leak | ✅ RLS blocks |
| Database backup restored | ❌ All tenants exposed | ✅ RLS policies included |

---

## 4. API Isolation Strategy

### Tenant Middleware Pattern

```typescript
// lib/middleware/tenant.ts
import { auth } from "@/lib/auth";
import { setTenantContext } from "@/lib/prisma";

export async function withTenant<T>(
  handler: (userId: string) => Promise<T>
): Promise<T> {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const userId = session.user.id as string;

  // Set RLS context — ALL queries are now tenant-scoped
  await setTenantContext(userId);

  // Execute handler — all queries are automatically filtered
  return handler(userId);
}
```

### Usage Pattern

```typescript
// BEFORE — every route manually checks userId
export async function GET() {
  const session = await auth();
  if (!session?.user) return 401;
  const userId = session.user.id as string;
  const docs = await prisma.document.findMany({
    where: { userId },  // ← manual filter, easy to forget
  });
  return Response.json(docs);
}

// AFTER — tenant context handles it automatically
import { withTenant } from "@/lib/middleware/tenant";

export async function GET() {
  return withTenant(async (userId) => {
    const docs = await prisma.document.findMany();
    // ↑ RLS + tenant context = automatically filtered
    return Response.json(docs);
  });
}
```

### Authorization Matrix

| Resource | Owner | Admin | Editor | Viewer |
|----------|-------|-------|--------|--------|
| Documents | CRUD | CRUD | CRU | R |
| Chat Sessions | CRUD | CRUD | CRUD | R |
| AI Settings | CRUD | CRUD | R | R |
| MCP Servers | CRUD | CRUD | R | R |
| Prompts | CRUD | CRUD | CRU | R |
| Analytics | R | R | R | R |
| Billing | CRUD | R | - | - |

### Ownership Validation Pattern

```typescript
// lib/auth/ownership.ts
export async function verifyOwnership(
  resourceType: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  switch (resourceType) {
    case "document":
      const doc = await prisma.document.findFirst({
        where: { id: resourceId, userId },
      });
      return !!doc;
    case "session":
      const session = await prisma.chatSession.findFirst({
        where: { id: resourceId, userId },
      });
      return !!session;
    case "mcp_server":
      const server = await prisma.mcpServer.findFirst({
        where: { id: resourceId, userId },
      });
      return !!server;
    default:
      return false;
  }
}
```

---

## 5. RBAC Strategy

### Role Definitions

| Role | Description | Permissions |
|------|-------------|-------------|
| **Owner** | Workspace creator | Full access + billing + invite/delete members |
| **Admin** | Trusted team member | Manage docs, settings, MCP, prompts. Cannot billing. |
| **Editor** | Regular team member | Upload docs, chat, create prompts. Cannot settings. |
| **Viewer** | Read-only access | View docs, chat (read-only), view analytics |

### Permission Matrix

| Action | Owner | Admin | Editor | Viewer |
|--------|-------|-------|--------|--------|
| **Documents** | ||||
| Upload document | ✅ | ✅ | ✅ | ❌ |
| View document | ✅ | ✅ | ✅ | ✅ |
| Edit document | ✅ | ✅ | ✅ | ❌ |
| Delete document | ✅ | ✅ | ❌ | ❌ |
| **Chat** | ||||
| Send message | ✅ | ✅ | ✅ | ❌ |
| View history | ✅ | ✅ | ✅ | ✅ |
| Delete session | ✅ | ✅ | ✅ | ❌ |
| **Settings** | ||||
| View AI settings | ✅ | ✅ | ❌ | ❌ |
| Edit AI settings | ✅ | ✅ | ❌ | ❌ |
| Manage MCP servers | ✅ | ✅ | ❌ | ❌ |
| **Prompts** | ||||
| Create prompt | ✅ | ✅ | ✅ | ❌ |
| Edit prompt | ✅ | ✅ | ✅ | ❌ |
| Delete prompt | ✅ | ✅ | ❌ | ❌ |
| **Billing** | ||||
| View billing | ✅ | ❌ | ❌ | ❌ |
| Manage plan | ✅ | ❌ | ❌ | ❌ |
| **Team** | ||||
| Invite member | ✅ | ✅ | ❌ | ❌ |
| Remove member | ✅ | ❌ | ❌ | ❌ |
| Change roles | ✅ | ❌ | ❌ | ❌ |

### Database Schema for RBAC

```prisma
model Workspace {
  id        String   @id @default(uuid())
  name      String
  plan      String   @default("free")  // free | pro | enterprise
  createdAt DateTime @default(now()) @map("created_at")

  users       User[]
  documents   Document[]
  chatSessions ChatSession[]
  settings    Setting[]
  mcpServers  McpServer[]

  @@map("workspaces")
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String?
  passwordHash String    @map("password_hash")
  role         String    @default("owner") @db.VarChar(20)  // owner | admin | editor | viewer
  workspaceId  String    @map("workspace_id")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  workspace     Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  documents     Document[]
  chatSessions  ChatSession[]
  analyticsEvents AnalyticsEvent[]
  promptTemplates PromptTemplate[]
  promptVersions  PromptVersion[]
  mcpServers    McpServer[]

  @@map("users")
}
```

### RBAC Enforcement

```typescript
// lib/auth/authorization.ts
type Role = "owner" | "admin" | "editor" | "viewer";

const PERMISSIONS: Record<Role, string[]> = {
  owner: ["*"],  // all permissions
  admin: [
    "documents:create", "documents:read", "documents:update", "documents:delete",
    "chat:send", "chat:read", "chat:delete",
    "settings:read", "settings:update",
    "mcp:read", "mcp:create", "mcp:update", "mcp:delete",
    "prompts:create", "prompts:read", "prompts:update", "prompts:delete",
    "analytics:read",
    "team:invite",
  ],
  editor: [
    "documents:create", "documents:read", "documents:update",
    "chat:send", "chat:read", "chat:delete",
    "prompts:create", "prompts:read", "prompts:update",
    "analytics:read",
  ],
  viewer: [
    "documents:read",
    "chat:read",
    "analytics:read",
  ],
};

export function hasPermission(role: Role, permission: string): boolean {
  const perms = PERMISSIONS[role] || [];
  return perms.includes("*") || perms.includes(permission);
}
```

---

## 6. SaaS Plan Strategy

### Plan Limits

| Limit | Free | Pro | Enterprise |
|-------|------|-----|------------|
| **Documents** | 10 | 500 | Unlimited |
| **Chunks per doc** | 1,000 | 10,000 | Unlimited |
| **Total chunks** | 10,000 | 500,000 | Unlimited |
| **Chat messages/month** | 100 | 10,000 | Unlimited |
| **Storage** | 50 MB | 5 GB | Unlimited |
| **MCP servers** | 1 | 10 | Unlimited |
| **Team members** | 1 | 10 | Unlimited |
| **Prompt templates** | 5 | 100 | Unlimited |
| **AI providers** | 1 | 6 | 6 |
| **Embeddings** | Local fallback | API | API |
| **Support** | Community | Email | Dedicated |
| **SLA** | None | 99.5% | 99.9% |
| **Price** | $0/mo | $29/mo | $199/mo |

### Plan Enforcement

```typescript
// lib/billing/limits.ts
const PLAN_LIMITS = {
  free: { documents: 10, chunks: 10000, messages: 100, storage: 50 * 1024 * 1024, mcpServers: 1, members: 1, prompts: 5 },
  pro: { documents: 500, chunks: 500000, messages: 10000, storage: 5 * 1024 * 1024 * 1024, mcpServers: 10, members: 10, prompts: 100 },
  enterprise: { documents: Infinity, chunks: Infinity, messages: Infinity, storage: Infinity, mcpServers: Infinity, members: Infinity, prompts: Infinity },
};

export async function checkLimit(workspaceId: string, resource: string): Promise<{ allowed: boolean; current: number; limit: number }> {
  const workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  const limits = PLAN_LIMITS[workspace.plan as keyof typeof PLAN_LIMITS];

  const current = await getResourceCount(workspaceId, resource);
  const limit = limits[resource as keyof typeof limits];

  return { allowed: current < limit, current, limit };
}
```

### Usage Tracking

```sql
-- Track usage per workspace per month
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  period VARCHAR(7) NOT NULL,  -- "2026-06"
  documents_count INT DEFAULT 0,
  chunks_count INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, period)
);
```

---

## 7. Security Review

### Remaining Cross-Tenant Risks

| Risk | Severity | Current State | Fix |
|------|----------|---------------|-----|
| RLS not enabled | 🔴 CRITICAL | No RLS policies | Add RLS to all tables |
| `document_chunks` has no `tenant_id` | 🔴 CRITICAL | Filter via JOIN only | Add `tenant_id` column |
| `chat_messages` has no `tenant_id` | 🔴 CRITICAL | Filter via JOIN only | Add `tenant_id` column |
| `Setting` table is global | 🟡 HIGH | Shared AI settings | Add `workspace_id` |
| `PromptTemplate` has nullable `createdBy` | 🟡 HIGH | Can be orphaned | Make required + add workspace_id |
| `AnalyticsEvent` has nullable `userId` | 🟡 LOW | Anonymous events possible | Make required |
| `ChatSession` has nullable `userId` | 🟡 LOW | Anonymous sessions possible | Make required (already fixed in chat route) |
| `searchSimilarChunks` has unfiltered path | 🟡 HIGH | Dead code but dangerous | Remove fallback, make userId required |

### Future Scalability Risks

| Risk | When | Mitigation |
|------|------|------------|
| Single PostgreSQL instance | >10K tenants | Read replicas + connection pooling |
| pgvector index size | >1M chunks | Partition by tenant_id |
| RLS policy performance | >100K rows per tenant | Composite indexes on (tenant_id, ...) |
| Session connection limits | >500 concurrent users | PgBouncer connection pooling |
| Storage per tenant | >10GB per tenant | S3 + presigned URLs |

### Compliance Considerations

| Regulation | Requirement | Implementation |
|------------|-------------|----------------|
| GDPR Art. 17 | Right to deletion | Cascade delete + audit log |
| GDPR Art. 20 | Data portability | Export endpoint per workspace |
| SOC 2 | Access controls | RBAC + audit logging |
| SOC 2 | Data isolation | RLS + tenant_id |
| SOC 2 | Encryption at rest | AES-256 for API keys |
| SOC 2 | Encryption in transit | TLS everywhere (already via Docker) |

---

## 8. Migration Roadmap

### Phase 1: Immediate Hardening (This Sprint)

| Task | Effort | Impact |
|------|--------|--------|
| Make `userId` required in `searchSimilarChunks` | 1 hour | Eliminates unfiltered vector search |
| Add RLS to all tables | 1 day | Database-level tenant isolation |
| Add `tenant_id` to `document_chunks` | 1 day | Direct vector search filtering |
| Add `tenant_id` to `chat_messages` | 1 day | Direct message filtering |
| Remove unfiltered `searchSimilarChunks` path | 1 hour | Eliminate dangerous fallback |

### Phase 2: SaaS Foundation (Next Sprint)

| Task | Effort | Impact |
|------|--------|--------|
| Add `Workspace` model | 2 days | Multi-tenant architecture |
| Add `workspace_id` to all tables | 1 day | Workspace-level isolation |
| Add RBAC roles | 1 day | Team access control |
| Add plan limits | 2 days | Monetization |
| Add usage tracking | 1 day | Billing foundation |

### Phase 3: Enterprise Features (Month 2)

| Task | Effort | Impact |
|------|--------|--------|
| Stripe integration | 3 days | Payment processing |
| SSO/SAML | 5 days | Enterprise auth |
| Audit logging | 2 days | SOC 2 compliance |
| Data export/import | 2 days | GDPR compliance |
| Custom domains | 1 day | White-label |

---

## 9. Priority Summary

| Priority | Item | Why |
|----------|------|-----|
| 🔴 P0 | Enable RLS on all tables | One missed filter = data breach |
| 🔴 P0 | Add `tenant_id` to `document_chunks` | Vector search has no direct filter |
| 🔴 P0 | Add `tenant_id` to `chat_messages` | Message queries have no direct filter |
| 🟡 P1 | Make `userId` required (not optional) in `searchSimilarChunks` | Eliminate unfiltered path |
| 🟡 P1 | Add `workspace_id` to `Setting` table | AI settings are currently global |
| 🟡 P1 | Add RBAC roles to `User` model | No role-based access control |
| 🟡 P1 | Add plan limits | No usage enforcement |
| 🟢 P2 | Add workspace model | Enables team features |
| 🟢 P2 | Add usage tracking | Enables billing |
| 🟢 P2 | Stripe integration | Enables monetization |

---

*End of MULTI_TENANT_ARCHITECTURE.md*
