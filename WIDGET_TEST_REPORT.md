# Widget Test Report — Sprint 8

> **Date**: 2026-06-13  
> **Test File**: `tests/lib/widget.test.ts`  
> **Framework**: Vitest

---

## Test Summary

| Metric | Value |
|---|---|
| Total tests | 24 |
| Passed | 24 |
| Failed | 0 |
| Duration | ~700ms |
| Full suite | 181/181 passing |

## Test Coverage by Module

### validateWidgetOrigin (10 tests)

| Test | Input | Expected | Status |
|---|---|---|---|
| Reject null origin | null, ["example.com"] | false | ✅ |
| Reject empty origin | "", ["example.com"] | false | ✅ |
| Accept exact domain | "https://example.com", ["example.com"] | true | ✅ |
| Accept wildcard subdomain | "https://sub.example.com", ["*.example.com"] | true | ✅ |
| Accept base with wildcard | "https://example.com", ["*.example.com"] | true | ✅ |
| Reject non-matching | "https://evil.com", ["example.com"] | false | ✅ |
| Reject wrong subdomain | "https://evil.example.com", ["other.com"] | false | ✅ |
| Reject malformed | "not-a-url", ["example.com"] | false | ✅ |
| Accept empty domains (open) | "https://anything.com", [] | true | ✅ |
| Handle multiple domains | Various, ["example.com", "test.org", "*.demo.io"] | Correct | ✅ |

### buildWidgetCorsHeaders (6 tests)

| Test | Input | Expected | Status |
|---|---|---|---|
| Allowed origin | "https://example.com", ["example.com"] | Specific origin | ✅ |
| Denied origin | "https://evil.com", ["example.com"] | No origin header | ✅ |
| Null origin | null, ["example.com"] | No origin header | ✅ |
| NEVER wildcard | Any input | Not "*" | ✅ |
| Required headers | Any | Methods + Headers present | ✅ |
| Wildcard patterns | "https://sub.example.com", ["*.example.com"] | Specific origin | ✅ |

### validateMessageLength (4 tests)

| Test | Input | Expected | Status |
|---|---|---|---|
| Normal message | "Hello" | true | ✅ |
| At limit (10K) | "a" × 10000 | true | ✅ |
| Over limit (10001) | "a" × 10001 | false | ✅ |
| Empty message | "" | true | ✅ |

### generateWidgetKeys (3 tests)

| Test | Expected | Status |
|---|---|---|
| Correct prefixes | pw_pub_, pw_sec_ | ✅ |
| Uniqueness | Different each call | ✅ |
| Sufficient length | > 40 chars | ✅ |

## Security Test Coverage

| Security Vector | Tested | Status |
|---|---|---|
| Wildcard CORS prevention | ✅ | "NEVER return wildcard *" test |
| Origin validation | ✅ | 10 tests covering all edge cases |
| Message length abuse | ✅ | Over-limit rejection |
| Key entropy | ✅ | Uniqueness + length tests |
| Domain matching | ✅ | Exact, wildcard, multiple, malformed |

## Integration Test Gap

Unit tests cover utility functions. Integration tests (actual HTTP requests to endpoints) require a running database and are not covered here. Recommended additions:
- POST /api/widget/chat with valid/invalid origins
- GET /api/widget/config with CORS header verification
- Rate limit behavior under load
- Conversation visitor isolation
