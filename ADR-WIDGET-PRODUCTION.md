# ADR-WIDGET-PRODUCTION: Widget Production Readiness

> **Status**: Accepted  
> **Date**: 2026-06-13  
> **Sprint**: 8 — Widget Production Readiness

---

## Context

MimoNotes widget system had several production-readiness gaps:
- **Wildcard CORS**: `Access-Control-Allow-Origin: "*"` on config and chat endpoints
- **No origin validation on CORS**: Origins were validated for access but CORS headers were wildcard
- **Analytics gaps**: No top questions tracking, no refused answers count
- **Customization gaps**: No quick replies support
- **Zero test coverage**: No widget tests existed

## Decision

### 1. Remove Wildcard CORS — Use Origin-Validated CORS

**Choice**: New `buildWidgetCorsHeaders()` function that validates origin against `allowedDomains` and returns specific origin header. NEVER returns `*`.

**Rationale**:
- Wildcard CORS allows any website to make authenticated requests to widget endpoints
- Attacker site could embed the widget and steal conversation data
- Specific origin CORS restricts responses to pre-configured domains only

**Implementation**:
- `buildWidgetCorsHeaders(origin, allowedDomains)` → returns `{ "Access-Control-Allow-Origin": "https://specific.com" }` or empty
- `widgetResponse()` helper for safe JSON responses with CORS
- Config endpoint, chat endpoint both use the new function

**Trade-off**: Widgets with empty `allowedDomains` still allow any origin (open widget). This is intentional for ease of setup but documented as a security consideration.

### 2. Keep Existing Rate Limiting

**Choice**: No changes to rate limiting — already production-ready.

**Existing implementation**:
- Dual-layer: per public key (60/min) + per IP (30/min)
- `resolveClientIp()` handles X-Forwarded-For chains
- Returns 429 with Retry-After header

### 3. Enhanced Analytics

**Choice**: Add `topQuestions` and `refusedAnswers` to analytics endpoint.

**New fields**:
- `topQuestions`: Top 10 most asked questions with counts
- `refusedAnswers`: Count of answers containing refusal keywords
- `days` parameter for configurable time window

### 4. Quick Replies Customization

**Choice**: Add `quickReplies` field (string array) to Widget model.

**Rationale**: Quick replies let widget owners suggest common questions, improving UX and reducing support burden.

**Implementation**:
- New `quick_replies TEXT[] DEFAULT '{}'` column in widgets table
- Added to WidgetTheme interface, config response, update endpoint
- No migration needed — `ALTER TABLE widgets ADD COLUMN IF NOT EXISTS`

### 5. Test Coverage

**Choice**: 24 unit tests covering origin validation, CORS headers, message validation, key generation.

## Consequences

### Positive
- No wildcard CORS on any widget endpoint
- Origin-validated CORS headers with `Vary: Origin`
- Enhanced analytics with top questions and refused answers
- Quick replies customization
- 24 widget tests (was 0)

### Negative
- Widgets with empty allowedDomains still accept any origin (open widget)
- Quick replies requires schema change (column added via direct SQL)
