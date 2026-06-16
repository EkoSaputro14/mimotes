# ADR-SQL-SECURITY: SQL Injection Remediation

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Security Sprint 3  
**Technical Story:** Sprint 3 of Mimotes Security Hardening

## Context

An audit of all raw SQL usage in the Mimotes codebase identified:

1. **1 CRITICAL vulnerability:** String interpolation in `lib/analytics.ts` `getDailyEventCounts()` — user-supplied `eventTypes` array was directly interpolated into a SQL string via template literal, then passed to `$queryRawUnsafe()`.

2. **5 instances of `$queryRawUnsafe`** that, while using parameterized queries (`$1, $2`), used the "unsafe" API surface which provides no compile-time SQL validation.

3. **Multiple safe usages** of `$queryRaw` and `$executeRaw` tagged template literals (Prisma's parameterized query API).

### The Vulnerability

```typescript
// VULNERABLE — direct string interpolation into SQL
const whereType = eventTypes?.length
  ? `AND event_type IN (${eventTypes.map((t) => `'${t}'`).join(",")})`
  : "";

const rows = await prisma.$queryRawUnsafe(`
  SELECT ... WHERE ... ${whereType} ...
`, startDate, endDate);
```

If `eventTypes` contained `["chat_message'; DROP TABLE analytics_events; --"]`, the resulting SQL would be:

```sql
SELECT ... WHERE ... AND event_type IN ('chat_message'; DROP TABLE analytics_events; --') ...
```

**Mitigating factor:** TypeScript's `AnalyticsEventType` union type restricts values at compile time, but this provides NO protection at runtime (e.g., API inputs, deserialized data).

## Decision

### 1. Eliminate all string interpolation in SQL

Replace ALL dynamic SQL construction with Prisma's tagged template literal syntax (`$queryRaw\`...\``), which automatically parameterizes interpolated values.

### 2. Eliminate all `$queryRawUnsafe` usage

Convert all `$queryRawUnsafe(query, param1, param2)` calls to `$queryRaw\`...\`` syntax for:
- Consistency across codebase
- Compile-time SQL validation by Prisma
- Automatic parameterization (no manual `$1, $2` placeholders)

### 3. Use PostgreSQL-native array parameterization

For the `eventTypes` filter, use `ANY()` with a typed array parameter:

```typescript
// SAFE — Prisma tagged template + PostgreSQL ANY()
rows = await prisma.$queryRaw`
  SELECT ... WHERE event_type = ANY(${eventTypes}::text[]) ...
`;
```

## Design Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Primary approach** | `$queryRaw` tagged templates | Compile-time validation, automatic parameterization |
| **Array filtering** | `ANY(${array}::text[])` | PostgreSQL-native, single parameter, no string building |
| **Scope** | All lib/ + app/ files | Defense in depth — no `$queryRawUnsafe` anywhere |
| **Type casting** | `::text[]`, `::int`, `::vector` | Explicit PostgreSQL type annotations in template literals |

## Alternatives Considered

### 1. Whitelist validation of eventTypes
- **Rejected:** Doesn't address the systemic issue. Other callers might bypass validation.

### 2. Keep `$queryRawUnsafe` with manual parameterization
- **Rejected:** Requires developers to remember `$1, `$2` syntax. Tagged templates are safer by default.

### 3. ORM-only (eliminate all raw SQL)
- **Rejected:** Some queries (date truncation, CTEs, pgvector operations) require raw SQL. Prisma's ORM doesn't support these operations.

## Consequences

### Positive
- Zero string interpolation in SQL across entire codebase
- `$queryRawUnsafe` eliminated from application code
- Compile-time SQL validation via Prisma
- Automatic parameterization (developers can't forget)
- Consistent pattern for all raw SQL usage
- PostgreSQL `ANY()` provides clean array filtering

### Negative
- Slightly more verbose for conditional queries (branch vs. template)
- Tagged template literals have some Prisma-specific quirks (type casting)

## References

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Prisma Raw SQL Safety](https://www.prisma.io/docs/orm/prisma-client/queries/raw-database-access)
- [CWE-89: SQL Injection](https://cwe.mitre.org/data/definitions/89.html)
