# Execution Brief: Optimization & Debt Reduction

> Generated from: `.ai/current-sprint.md`
> For: Implementation Agent (RooCode)
> NOT for human review — see current-sprint.md for scope/risks

---

## Context

- Project root: /home/ekolepi/proyek/mimotes
- Framework: Next.js 16 App Router, TypeScript, Prisma, Tailwind
- Path alias: `@/*` → `./`
- Server components: default. Client: `"use client"` directive.
- Auth: `await auth()` in protected API routes, return 401 if null.
- Error handling: try-catch + `Response.json({error: "..."}, {status: N})`
- Prisma: singleton from `@/lib/prisma`, raw SQL for vector ops only.
- All API routes: `NextRequest` + `Response.json()`.

---

## Pre-flight Checklist

Before starting implementation:

1. Read `.ai/current-sprint.md` for scope and acceptance criteria.
2. Read `AGENTS.md` for project conventions and constraints.
3. Check current Prisma schema: `cat prisma/schema.prisma`
4. Check existing routes: `grep -r "export async" app/api/ --include="*.ts" -l`
5. Run baseline build: `npm run build` — must pass before changes.

---

## Task List

### T-01: Add File Size Limit to Upload Route [BLOCKS: none]

**What**: Read MAX_FILE_SIZE from env (default 10485760 = 10MB) and reject uploads exceeding it.

**Files to modify**:
- `app/api/upload/route.ts` — Add size check before `file.arrayBuffer()`

**Requirements**:
- Read `process.env.MAX_FILE_SIZE` (default: 10485760)
- Check `file.size` before `arrayBuffer()`
- Return 413 `{ error: "File terlalu besar. Maksimal 10MB." }` if exceeded
- Apply to both file uploads (not URL uploads)
- Add console.warn for audit trail

**Code to add (after line 31, before line 34)**:
```typescript
// File size limit check
if (file) {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || "10485760", 10);
  if (maxSize > 0 && file.size > maxSize) {
    return Response.json(
      { error: `File terlalu besar. Maksimal ${Math.round(maxSize / 1048576)}MB.` },
      { status: 413 }
    );
  }
}
```

**Validation**:
```bash
# Test with small file (should pass)
curl -X POST http://localhost:3000/api/upload -H "Authorization: Bearer $TOKEN" -F "file=@test.txt"
# Should return 200 with document id
```

**Done when**:
- [ ] Files > MAX_FILE_SIZE are rejected with 413
- [ ] MAX_FILE_SIZE=0 disables the check
- [ ] Small files still upload normally

---

### T-02: Add Rate Limiting to Upload Endpoint [REQUIRES: none]

**What**: Add rate limiting to POST /api/upload using existing ratelimit utility.

**Files to modify**:
- `app/api/upload/route.ts` — Add rate limit check after auth

**Requirements**:
- Import `ratelimit` from `@/lib/ratelimit` and `getClientIP` from `@/lib/utils`
- Add rate limit check after auth, before file processing
- Use different rate limit key prefix: `upload:${ip}` to avoid counting against chat limit
- Return 429 with Indonesian message

**Code to add (after line 21, before line 23)**:
```typescript
// Rate limiting (10 per minute per IP for uploads)
const ip = getClientIP(request);
const { success } = await ratelimit.limit(`upload:${ip}`);
if (!success) {
  return Response.json(
    { error: "Terlalu banyak upload. Silakan coba lagi nanti." },
    { status: 429 }
  );
}
```

**Validation**:
```bash
# Rapid uploads should hit rate limit after 10
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/upload -H "Authorization: Bearer $TOKEN" -F "file=@test.txt"; done
# Should see 200s then 429s
```

**Done when**:
- [ ] 11th upload within 1 minute returns 429
- [ ] Rate limit resets after window

---

### T-03: Fix SQL Injection in getDailyEventCounts [REQUIRES: none]

**What**: Replace string interpolation with parameterized query for eventTypes filter.

**Files to modify**:
- `lib/analytics.ts` — Fix getDailyEventCounts function (lines 82-98)

**Current code (INSECURE)**:
```typescript
const whereType = eventTypes?.length
  ? `AND event_type IN (${eventTypes.map((t) => `'${t}'`).join(",")})`
  : "";
```

**Replacement (SECURE)**:
```typescript
// Build parameterized query for event types
let eventTypeFilter = "";
const queryParams: (Date | string)[] = [startDate, endDate];
if (eventTypes?.length) {
  const placeholders = eventTypes.map((_, i) => `$${3 + i}`).join(", ");
  eventTypeFilter = `AND event_type IN (${placeholders})`;
  queryParams.push(...eventTypes);
}

const rows = await prisma.$queryRawUnsafe<
  { date: string; event_type: string; count: bigint }[]
>(`
  SELECT
    TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
    event_type,
    COUNT(*) as count
  FROM analytics_events
  WHERE created_at >= $1 AND created_at <= $2
  ${eventTypeFilter}
  GROUP BY DATE(created_at), event_type
  ORDER BY DATE(created_at)
`, ...queryParams);
```

**Validation**:
```bash
# Call analytics endpoint with event type filter
curl -s http://localhost:3000/api/analytics/usage | head -c 200
# Should return valid JSON with daily activity data
```

**Done when**:
- [ ] Event types are passed as parameters, not interpolated
- [ ] All analytics endpoints still return correct data

---

### T-04: Optimize getUniqueActiveUsers [REQUIRES: none]

**What**: Replace findMany+distinct with SQL COUNT(DISTINCT) for better performance.

**Files to modify**:
- `lib/analytics.ts` — Replace getUniqueActiveUsers function (lines 115-128)

**Current code (SLOW)**:
```typescript
export async function getUniqueActiveUsers(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.analyticsEvent.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      userId: { not: null },
    },
    distinct: ["userId"],
    select: { userId: true },
  });
  return result.length;
}
```

**Replacement (FAST)**:
```typescript
export async function getUniqueActiveUsers(
  startDate: Date,
  endDate: Date
): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(DISTINCT user_id) as count
     FROM analytics_events
     WHERE created_at >= $1 AND created_at <= $2
       AND user_id IS NOT NULL`,
    startDate,
    endDate
  );
  return Number(result[0]?.count || 0);
}
```

**Validation**:
```bash
curl -s http://localhost:3000/api/analytics/usage | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['kpis'])"
# Should return kpis with activeUsers number
```

**Done when**:
- [ ] Response shape unchanged
- [ ] No full table scan (check with EXPLAIN if possible)

---

### T-05: Optimize getCostAnalytics Memory Usage [REQUIRES: none]

**What**: Replace full message loading with SQL-based token estimation.

**Files to modify**:
- `lib/analytics.ts` — Replace getCostAnalytics function (lines 435-580)

**Current problem**: Lines 443-462 load ALL messages from both current and previous periods into memory, then iterate to estimate tokens.

**Replacement approach**: Use SQL to compute SUM(LENGTH(content)) grouped by role and date.

**Replace lines 443-497 with**:
```typescript
// SQL-based token estimation (avoids loading all messages into memory)
const tokenEstimates = await prisma.$queryRawUnsafe<
  { role: string; total_chars: bigint; date: string }[]
>(`
  SELECT
    role,
    SUM(LENGTH(content)) as total_chars,
    TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date
  FROM chat_messages
  WHERE created_at >= $1 AND created_at <= $2
  GROUP BY role, DATE(created_at)
  ORDER BY DATE(created_at)
`, startDate, endDate);

const prevTokenEstimates = await prisma.$queryRawUnsafe<
  { role: string; total_chars: bigint }[]
>(`
  SELECT
    role,
    SUM(LENGTH(content)) as total_chars
  FROM chat_messages
  WHERE created_at >= $3 AND created_at < $1
  GROUP BY role
`, startDate, endDate);

// Aggregate current period
let inputTokens = 0;
let outputTokens = 0;
const dailyCosts = new Map<string, { inputTokens: number; outputTokens: number }>();

for (const row of tokenEstimates) {
  const tokens = Math.ceil(Number(row.total_chars) / 4);
  const date = row.date;
  if (!dailyCosts.has(date)) {
    dailyCosts.set(date, { inputTokens: 0, outputTokens: 0 });
  }
  const day = dailyCosts.get(date)!;
  if (row.role === "user") {
    inputTokens += tokens;
    day.inputTokens += tokens;
  } else {
    outputTokens += tokens;
    day.outputTokens += tokens;
  }
}

// Aggregate previous period
let prevInputTokens = 0;
let prevOutputTokens = 0;
for (const row of prevTokenEstimates) {
  const tokens = Math.ceil(Number(row.total_chars) / 4);
  if (row.role === "user") {
    prevInputTokens += tokens;
  } else {
    prevOutputTokens += tokens;
  }
}
```

**Also replace lines 508-543** (the for-loop that builds dailyCosts from messages) — this is now handled above.

**Keep the rest** (costOverTime, tokenBreakdown, etc.) but use the pre-computed dailyCosts map.

**Validation**:
```bash
curl -s http://localhost:3000/api/analytics/cost | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('KPIs:', d['kpis'])
print('Daily entries:', len(d['costOverTime']))
print('Token breakdown:', d['tokenBreakdown'])
"
# Should return same structure, same approximate values
```

**Done when**:
- [ ] No `findMany` on chat_messages in getCostAnalytics
- [ ] Response structure unchanged
- [ ] Cost values are approximately the same (character-based estimation)

---

### T-06: Optimize getChatAnalytics Source Counting [REQUIRES: none]

**What**: Replace full assistant message loading with JSONB query for source counting.

**Files to modify**:
- `lib/analytics.ts` — Replace lines 168-277 in getChatAnalytics

**Current problem**: Lines 168-178 load ALL assistant messages to count sources. Lines 248-277 iterate all messages to build document reference counts.

**Replacement approach for source rate** (lines 168-190):
```typescript
// Source rate using JSONB query
const sourceStats = await prisma.$queryRawUnsafe<
  { with_sources: bigint; total: bigint }[]
>(`
  SELECT
    COUNT(*) FILTER (WHERE sources IS NOT NULL AND sources != '[]'::jsonb AND jsonb_array_length(sources) > 0) as with_sources,
    COUNT(*) as total
  FROM chat_messages
  WHERE created_at >= $1 AND created_at <= $2
    AND role = 'assistant'
`, startDate, endDate);

const withSources = Number(sourceStats[0]?.with_sources || 0);
const totalAssistant = Number(sourceStats[0]?.total || 0);
const sourceRate = totalAssistant > 0 ? (withSources / totalAssistant) * 100 : 0;

// Average sources per message using JSONB
const avgSourceResult = await prisma.$queryRawUnsafe<
  { avg_sources: number }[]
>(`
  SELECT AVG(jsonb_array_length(sources)) as avg_sources
  FROM chat_messages
  WHERE created_at >= $1 AND created_at <= $2
    AND role = 'assistant'
    AND sources IS NOT NULL
    AND sources != '[]'::jsonb
`, startDate, endDate);

const avgSources = Number(avgSourceResult[0]?.avg_sources || 0);
```

**Replacement approach for top documents** (lines 248-277):
```typescript
// Top referenced documents using JSONB
const docRefStats = await prisma.$queryRawUnsafe<
  { document_id: string; refs: bigint }[]
>(`
  SELECT
    (source->>'documentId') as document_id,
    COUNT(*) as refs
  FROM chat_messages,
       jsonb_array_elements(sources) as source
  WHERE created_at >= $1 AND created_at <= $2
    AND role = 'assistant'
    AND sources IS NOT NULL
    AND sources != '[]'::jsonb
    AND source->>'documentId' IS NOT NULL
  GROUP BY source->>'documentId'
  ORDER BY refs DESC
  LIMIT 10
`, startDate, endDate);

const topDocuments = await Promise.all(
  docRefStats.map(async (ref) => {
    const doc = await prisma.document.findUnique({
      where: { id: ref.document_id },
      select: { id: true, title: true, fileType: true },
    });
    return {
      id: ref.document_id,
      title: doc?.title || "Unknown",
      fileType: doc?.fileType || "unknown",
      references: Number(ref.refs),
    };
  })
);
```

**Remove**: The old for-loops that iterate `assistantMessages` (lines 168-178, 184-190, 248-277).

**Keep**: The userMessages query for topQuestions (lines 193-213) — this is bounded by `take: 200` and needs text processing.

**Validation**:
```bash
curl -s http://localhost:3000/api/analytics/chat | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('KPIs:', d['kpis'])
print('Response quality:', d['responseQuality'])
print('Top docs:', len(d['topDocuments']))
"
```

**Done when**:
- [ ] No `findMany` on chat_messages for source counting
- [ ] Response structure unchanged
- [ ] Top documents list populated correctly

---

### T-07: Add Pagination to /api/documents [REQUIRES: none]

**What**: Add cursor-based pagination to the legacy document list endpoint.

**Files to modify**:
- `app/api/documents/route.ts` — Add pagination params

**Requirements**:
- Accept `?page=1&limit=20` query params (defaults: page=1, limit=20, max limit=100)
- Return `{ documents: [...], pagination: { page, limit, total, totalPages } }`
- Keep backward compatibility: if no params, return first 20

**Replace the entire GET handler**:
```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;
    const userId = session.user.id as string;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          fileType: true,
          status: true,
          chunkCount: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.document.count({ where: { userId } }),
    ]);

    return Response.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Documents API error:", error);
    return Response.json(
      { error: "Gagal mengambil dokumen" },
      { status: 500 }
    );
  }
}
```

**Validation**:
```bash
# First page
curl -s http://localhost:3000/api/documents?page=1\&limit=5 -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Page {d[\"pagination\"][\"page\"]}/{d[\"pagination\"][\"totalPages\"]}, {len(d[\"documents\"])} docs')"

# Second page
curl -s http://localhost:3000/api/documents?page=2\&limit=5 -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Page {d[\"pagination\"][\"page\"]}/{d[\"pagination\"][\"totalPages\"]}, {len(d[\"documents\"])} docs')"
```

**Done when**:
- [ ] ?page=1&limit=5 returns 5 documents max
- [ ] Response includes pagination metadata
- [ ] Default behavior (no params) returns first 20

---

### T-08: Extract Shared Streaming Helper [REQUIRES: none]

**What**: Extract duplicate streaming logic from playground and test endpoints into a shared helper.

**Files to create**:
- `lib/stream-helpers.ts` — Shared streaming helper

**Files to modify**:
- `app/api/ai/playground/route.ts` — Use shared helper
- `app/api/ai/prompts/[id]/test/route.ts` — Use shared helper

**Create lib/stream-helpers.ts**:
```typescript
import { OpenAI } from "openai";
import { createTextStreamResponse } from "ai";

interface StreamChatOptions {
  systemPrompt: string;
  userMessage: string;
  model?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  /** Additional headers to include in the response */
  headers?: Record<string, string>;
}

interface StreamChatResult {
  response: Response;
  stats: {
    chunks: number;
    model: string;
  };
}

/**
 * Stream a chat completion and return the response with stats.
 * Used by both playground and test endpoints.
 */
export async function streamChatCompletion(
  openai: OpenAI,
  options: StreamChatOptions
): Promise<StreamChatResult> {
  const {
    systemPrompt,
    userMessage,
    model = "gpt-4o-mini",
    temperature = 0.7,
    topP = 1,
    maxTokens = 2048,
    headers = {},
  } = options;

  const stream = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
    stream: true,
  });

  let chunkCount = 0;

  const readableStream = new ReadableStream<string>({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          chunkCount++;
          controller.enqueue(content);
        }
      }
      controller.close();
    },
  });

  // Append stats as HTML comment at end
  const statsStream = readableStream.pipeThrough(
    new TransformStream<string, string>({
      transform(chunk, controller) {
        controller.enqueue(chunk);
      },
      async flush(controller) {
        controller.enqueue(`\n<!-- stats:chunks=${chunkCount},model=${model} -->`);
      },
    })
  );

  const response = createTextStreamResponse({
    textStream: statsStream,
    headers,
  });

  return { response, stats: { chunks: chunkCount, model } };
}
```

**Modify playground route**: Replace streaming logic with:
```typescript
import { streamChatCompletion } from "@/lib/stream-helpers";
// ... (after validation)
const { getAIProvider } = await import("@/lib/ai-provider");
const openai = await getAIProvider();

const { response } = await streamChatCompletion(openai, {
  systemPrompt,
  userMessage: context ? `Context:\n${context}\n\nQuestion: ${message}` : message,
  model,
  temperature,
  topP,
  maxTokens,
  headers: { "X-Model": model },
});

return response;
```

**Modify test route**: Similar replacement.

**Validation**:
```bash
# Both endpoints should still stream correctly
curl -N -X POST http://localhost:3000/api/ai/playground \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"systemPrompt":"You are helpful.","userMessage":"Hello"}'
# Should stream response

curl -N -X POST http://localhost:3000/api/ai/prompts/TEST_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello"}'
# Should stream response (or return 404 if no prompt)
```

**Done when**:
- [ ] No duplicate streaming code in playground and test routes
- [ ] Both endpoints still stream correctly
- [ ] Stats comment still appended

---

### T-09: Initialize Vitest + Add Basic Tests [REQUIRES: none]

**What**: Set up Vitest test framework and add unit tests for RAG chunker and parser.

**Files to create**:
- `vitest.config.ts` — Vitest configuration
- `lib/rag/__tests__/chunker.test.ts` — Chunker unit tests
- `lib/rag/__tests__/parser.test.ts` — Parser unit tests (txt only, no file I/O)

**Files to modify**:
- `package.json` — Add vitest dev dependency and test script

**Step 1: Install Vitest**
```bash
cd /home/ekolepi/proyek/mimotes
npm install -D vitest @vitejs/plugin-react
```

**Step 2: Create vitest.config.ts**:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

**Step 3: Add test script to package.json**:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

**Step 4: Create lib/rag/__tests__/chunker.test.ts**:
```typescript
import { describe, it, expect } from "vitest";
import { chunkText } from "../chunker";

describe("chunkText", () => {
  it("should chunk plain text into multiple chunks", () => {
    const text = "This is paragraph one.\n\nThis is paragraph two.\n\nThis is paragraph three.";
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].content).toBeTruthy();
    expect(chunks[0].index).toBe(0);
  });

  it("should handle empty text", () => {
    const chunks = chunkText("");
    expect(chunks.length).toBe(0);
  });

  it("should handle single paragraph", () => {
    const text = "Just one paragraph of text.";
    const chunks = chunkText(text);
    expect(chunks.length).toBe(1);
    expect(chunks[0].content).toContain("Just one paragraph");
  });

  it("should preserve chunk metadata", () => {
    const text = "First paragraph.\n\nSecond paragraph.";
    const chunks = chunkText(text);
    chunks.forEach((chunk) => {
      expect(chunk).toHaveProperty("content");
      expect(chunk).toHaveProperty("index");
      expect(chunk).toHaveProperty("metadata");
    });
  });
});
```

**Step 5: Create lib/rag/__tests__/parser.test.ts**:
```typescript
import { describe, it, expect } from "vitest";

describe("parser", () => {
  it("should export parseFile function", async () => {
    const { parseFile } = await import("../parser");
    expect(typeof parseFile).toBe("function");
  });

  it("should parse plain text content", async () => {
    const { parseFile } = await import("../parser");
    const buffer = Buffer.from("Hello world, this is test content.");
    const result = await parseFile(buffer, "txt");
    expect(result.content).toContain("Hello world");
    expect(result.content.length).toBeGreaterThan(0);
  });

  it("should handle empty text file", async () => {
    const { parseFile } = await import("../parser");
    const buffer = Buffer.from("");
    const result = await parseFile(buffer, "txt");
    expect(result.content).toBeDefined();
  });
});
```

**Step 6: Run tests**:
```bash
npx vitest run
# Expected: All tests pass
```

**Validation**:
```bash
npx vitest run --reporter=verbose
# Expected: 7+ tests passing, 0 failing
```

**Done when**:
- [ ] `npx vitest run` exits with 0 failures
- [ ] At least 7 test cases exist
- [ ] `npm run build` still passes (vitest doesn't affect build)

---

## Schema Changes

**None.** This sprint does not modify the database schema.

---

## Validation Sequence

Run these commands in order after ALL tasks are complete:

```bash
# 1. TypeScript compilation
npm run build
# Expected: 0 errors

# 2. Unit tests
npx vitest run
# Expected: All tests pass

# 3. Manual smoke tests
# Upload with size limit
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test-small.txt"
# Expected: 200

# Documents pagination
curl -s http://localhost:3000/api/documents?page=1\&limit=5 \
  -H "Authorization: Bearer $TOKEN"
# Expected: { documents: [...], pagination: {...} }

# Analytics still works
curl -s http://localhost:3000/api/analytics/usage \
  -H "Authorization: Bearer $TOKEN" | head -c 200
# Expected: valid JSON with kpis
```

**Expected final output**:
```
Build: 0 errors
Tests: 7+ passed, 0 failed
All endpoints responding correctly
```

---

## Constraints

1. DO NOT modify prisma/schema.prisma
2. DO NOT add new API routes
3. DO NOT modify Phase 5 AI playground/prompts components
4. DO NOT change existing response formats (additive only)
5. All new files must use path alias `@/` for imports
6. All API routes must keep existing auth checks
7. Tests must not depend on database or network

---

## Completion Checklist

When ALL tasks are done, verify:

- [ ] All "Done when" items checked in every task above
- [ ] `npm run build` — 0 errors
- [ ] `npx vitest run` — all tests pass
- [ ] All existing routes return correct responses
- [ ] No files modified outside the task list above
- [ ] Write implementation report to `.ai/implementation-report.md`

**Implementation report must include**:
- List of files created/modified (with line counts)
- Test results
- Any deviations from this brief (with justification)
- Remaining TODOs or known issues

---

*This document is for implementation agents. See `.ai/current-sprint.md` for scope, risks, and acceptance criteria.*
