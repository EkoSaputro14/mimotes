# ADR-SECRET-ENCRYPTION: Secret Encryption at Rest

**Status:** Accepted  
**Date:** 2026-06-12  
**Deciders:** Security Sprint 1  
**Technical Story:** Sprint 1 of Mimotes Security Hardening

## Context

API keys and sensitive credentials (AI provider keys, MCP server keys, etc.) are currently stored as plaintext in the PostgreSQL database. This presents a security risk: if the database is compromised, all secrets are immediately exposed. The security review identified this as a HIGH-priority finding.

## Decision

Implement **AES-256-GCM encryption** for all sensitive settings at the application layer, using Node.js built-in `crypto` module with no additional dependencies.

### Design Choices

| Choice | Decision | Rationale |
|--------|----------|-----------|
| **Encryption algorithm** | AES-256-GCM | Industry standard, provides both confidentiality and integrity (authenticated encryption) |
| **Key source** | `process.env.ENCRYPTION_KEY` | No hardcoded secrets; environment variable management is standard |
| **Key format** | 64-char hex string (32 bytes) | Easy to generate, inspect, and back up |
| **IV generation** | Random 12-byte per encryption | NIST-recommended for GCM; ensures unique ciphertexts |
| **Auth tag** | 16 bytes (128 bits) | Maximum GCM tag length for strongest integrity |
| **Encrypted format** | `enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>` | Self-describing, version-tagged for future migration |
| **Application layer** | Encrypt in `lib/settings.ts` | Transparent to callers; no schema changes needed |
| **Backward compatibility** | Try decrypt → fallback to plaintext | Existing unencrypted data continues to work during migration |
| **Missing key behavior** | Return plaintext with warning | App remains functional without ENCRYPTION_KEY (graceful degradation) |

### Architecture

```
┌─────────────────────────────────────┐
│           API Routes                 │
│  (mask keys in GET responses)        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         lib/settings.ts              │
│  encrypt() on write                  │
│  decrypt() on read                   │
│  isSecretKey() to filter             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          lib/crypto.ts               │
│  AES-256-GCM (Node.js crypto)       │
│  enc:v1: prefix format              │
│  Graceful degradation               │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│       PostgreSQL Database            │
│  Setting.value (encrypted)           │
│  WorkspaceSetting.value (encrypted)  │
└─────────────────────────────────────┘
```

### What Gets Encrypted

Settings whose key matches secret patterns:
- `*_api_key`, `*_apikey`
- `*_secret`, `*_token`
- `*_password`, `*_credential`
- `*_private_key`

Examples: `ai_api_key`, `ai_base_url` (when containing auth), MCP server API keys.

### What Does NOT Get Encrypted

- Non-secret settings: `ai_provider`, `ai_model`, `ai_embedding_model`
- Environment variable values (managed externally)
- Data in other models (out of scope for Sprint 1)

## Alternatives Considered

### 1. Database-level encryption (pgcrypto)
- **Rejected:** Requires schema migration, SQL-level encrypt/decrypt calls, and key management at DB level. Harder to rotate keys.

### 2. Transparent Data Encryption (TDE)
- **Rejected:** PostgreSQL TDE is not production-ready. Doesn't protect against application-level compromise.

### 3. External secret manager (HashiCorp Vault, AWS Secrets Manager)
- **Rejected:** Adds infrastructure dependency and latency. Over-engineered for current scale. Consider for future.

### 4. Client-side encryption (encrypt before API call)
- **Rejected:** Key would need to be in the browser. Doesn't protect against API-level attacks.

## Consequences

### Positive
- Secrets encrypted at rest in database
- Authenticated encryption (GCM) prevents tampering
- Transparent to existing code (encrypt/decrypt in settings layer)
- Backward compatible with existing plaintext data
- No new npm dependencies
- Migration scripts provided (encrypt + emergency rollback)

### Negative
- Encryption key must be backed up separately from database backups
- Slight performance overhead (~0.1ms per encrypt/decrypt)
- Cannot search/filter encrypted values by content
- Key rotation requires re-encrypting all values

### Risks
- **Lost ENCRYPTION_KEY:** All encrypted data becomes unrecoverable. Mitigation: backup key in secure vault.
- **Key compromise:** Attacker can decrypt all values. Mitigation: rotate key + re-encrypt.

## Migration Plan

1. Generate ENCRYPTION_KEY and add to environment
2. Deploy code (backward compatible — works without key)
3. Run `npx tsx scripts/encrypt-existing-keys.ts --dry-run` to preview
4. Run `npx tsx scripts/encrypt-existing-keys.ts` to encrypt
5. Verify application still works
6. Back up ENCRYPTION_KEY to secure location

## Rollback Plan

1. Run `npx tsx scripts/decrypt-emergency.ts --dry-run` to preview
2. Run `npx tsx scripts/decrypt-emergency.ts` to decrypt all values
3. Optionally remove ENCRYPTION_KEY from environment

## References

- [NIST SP 800-38D — GCM](https://csrc.nist.gov/publications/detail/sp/800-38d/final)
- [Node.js crypto module](https://nodejs.org/api/crypto.html)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
