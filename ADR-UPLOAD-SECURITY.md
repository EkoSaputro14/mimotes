# ADR-UPLOAD-SECURITY: Upload Security & SSRF Hardening

**Status:** Accepted  
**Date:** 2026-06-13  
**Deciders:** Security Sprint 2  
**Technical Story:** Sprint 2 of Mimotes Security Hardening

## Context

The `parseURL()` function in `lib/rag/parser.ts` directly calls `fetch(url)` with **no validation whatsoever**. An attacker can exploit this to:

1. **SSRF (Server-Side Request Forgery):** Fetch internal services (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`)
2. **Cloud metadata theft:** Access `169.254.169.254` to steal AWS/GCP/Azure credentials
3. **Protocol smuggling:** Use `file://`, `gopher://`, `ftp://` to read local files or interact with internal services
4. **DNS rebinding:** Resolve a domain to an internal IP after passing validation

The upload endpoint (`app/api/upload/route.ts`) also lacks:
- URL format validation before passing to `parseURL()`
- Filename sanitization beyond `basename()`
- MIME type verification (relies solely on extension)
- Response body size limits on URL fetches

## Decision

Implement a **defense-in-depth** URL security layer with multiple validation stages:

### Architecture

```
┌─────────────────────────────────────────────┐
│           Upload API (POST /api/upload)      │
│  1. Auth + RBAC check                        │
│  2. File size validation (10MB)              │
│  3. Extension whitelist                      │
│  4. Filename sanitization                    │
│  5. URL validation (if URL upload)           │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         lib/url-security.ts                  │
│  1. Protocol validation (http/https only)    │
│  2. URL format validation                    │
│  3. DNS resolution                           │
│  4. Private IP blocking (RFC 1918 + more)   │
│  5. Cloud metadata endpoint blocking         │
│  6. Redirect validation                      │
│  7. Response size limiting                   │
│  8. Timeout enforcement                      │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         lib/rag/parser.ts                    │
│  parseURL() calls validateUrl() first        │
│  Uses safeFetch() with size limits           │
└─────────────────────────────────────────────┘
```

### Design Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Validation location** | `lib/url-security.ts` (separate module) | Single responsibility, testable, reusable |
| **Protocol allowlist** | `http:` and `https:` only | Block `file://`, `gopher://`, `ftp://`, `data:` |
| **IP blocking** | RFC 1918 + link-local + metadata + loopback | Prevent all internal network access |
| **DNS resolution** | Resolve before fetch, validate IPs | Prevent DNS rebinding attacks |
| **Cloud metadata** | Block `169.254.169.254/16` range | AWS/GCP/Azure instance metadata |
| **Fetch timeout** | 10 seconds | Prevent resource exhaustion |
| **Response size limit** | 5MB max | Prevent memory exhaustion |
| **Redirect handling** | Manual redirect validation | Don't follow redirects to internal IPs |
| **Filename sanitization** | Strip path separators + special chars | Prevent path traversal and injection |

## Alternatives Considered

### 1. Use a headless browser for URL fetching
- **Rejected:** Over-engineered, adds Puppeteer dependency, still needs SSRF protection

### 2. Proxy through external service (e.g., Cloudflare Workers)
- **Rejected:** Adds latency and external dependency. Application-level protection is sufficient.

### 3. Disable URL upload entirely
- **Rejected:** Core feature of the product. Must secure, not remove.

### 4. URL allowlist only (no blocklist)
- **Rejected:** Too restrictive for a knowledge base tool. Users need to fetch arbitrary public URLs.

## Consequences

### Positive
- SSRF attacks blocked at multiple layers
- Cloud metadata endpoints protected
- Protocol smuggling prevented
- DNS rebinding mitigated via pre-resolution validation
- Response size limits prevent memory exhaustion
- Timeout prevents connection hanging
- Filename sanitization prevents path traversal

### Negative
- Slight latency increase for URL uploads (DNS resolution + validation)
- Some legitimate URLs on unusual ports may be blocked
- DNS rebinding protection requires `dns.lookup()` which is async

### Risks
- **False positives:** Legitimate URLs resolving to private IPs (e.g., local dev) will be blocked. Mitigation: document behavior.
- **IPv6 bypass:** Must validate IPv6 equivalents of loopback/link-local. Mitigation: comprehensive IP checks.
- **TOCTOU race:** DNS resolution and fetch are separate operations. Mitigation: accept this as acceptable risk (industry standard approach).

## Migration Plan

1. Deploy `lib/url-security.ts` (new module, no breaking changes)
2. Update `lib/rag/parser.ts` to use `validateUrl()` + `safeFetch()`
3. Update `app/api/upload/route.ts` with filename sanitization
4. Test with various URL types (public, internal, metadata, protocol)
5. Monitor logs for `[url-security]` rejections

## Rollback Plan

1. Revert `lib/rag/parser.ts` to direct `fetch()` (remove validation calls)
2. Remove `lib/url-security.ts`
3. No database changes needed — pure application-layer fix

## References

- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CWE-918: Server-Side Request Forgery](https://cwe.mitre.org/data/definitions/918.html)
- [AWS IMDS Security](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
- [RFC 1918 - Private IP Addresses](https://datatracker.ietf.org/doc/html/rfc1918)
