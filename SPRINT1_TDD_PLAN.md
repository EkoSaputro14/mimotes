# Sprint 1 — TDD Test Plan: Secret Encryption

**Date:** 2026-06-12  
**Sprint:** Sprint 1 — Secret Encryption  
**Approach:** Test-Driven Development (RED → GREEN → REFACTOR)

## Test Strategy

Tests follow the TDD cycle: write failing tests first (RED), implement minimal code to pass (GREEN), then improve structure (REFACTOR).

## Test Cases

### Phase 1: `lib/crypto.ts` — Encryption Module

#### RED Tests (Write First)

```
TEST 1: encrypt/decrypt roundtrip
  GIVEN a plaintext string "my-secret-api-key-12345"
  WHEN encrypt() is called, then decrypt() is called on the result
  THEN the output equals the original plaintext

TEST 2: encrypted output is different from plaintext
  GIVEN a plaintext string "my-secret-api-key-12345"
  WHEN encrypt() is called
  THEN the result starts with "enc:v1:" and is NOT equal to plaintext

TEST 3: isEncrypted detects encrypted values
  GIVEN an encrypted value (from encrypt())
  WHEN isEncrypted() is called
  THEN it returns true

TEST 4: isEncrypted rejects plaintext
  GIVEN a plaintext value "hello"
  WHEN isEncrypted() is called
  THEN it returns false

TEST 5: decrypt returns plaintext as-is (backward compatibility)
  GIVEN a plaintext value "existing-plaintext-value"
  WHEN decrypt() is called
  THEN it returns the same plaintext value unchanged

TEST 6: encrypt is idempotent (no double encryption)
  GIVEN an already-encrypted value
  WHEN encrypt() is called again
  THEN it returns the same encrypted value unchanged

TEST 7: missing ENCRYPTION_KEY — encrypt returns plaintext
  GIVEN ENCRYPTION_KEY is not set
  WHEN encrypt("secret") is called
  THEN it returns "secret" unchanged

TEST 8: missing ENCRYPTION_KEY — decrypt returns value as-is
  GIVEN ENCRYPTION_KEY is not set
  WHEN decrypt("enc:v1:xxx") is called
  THEN it returns "enc:v1:xxx" unchanged

TEST 9: invalid key length — graceful failure
  GIVEN ENCRYPTION_KEY is set to a 16-char hex string (8 bytes, not 32)
  WHEN encrypt("secret") is called
  THEN it returns "secret" unchanged (graceful degradation)

TEST 10: corrupted ciphertext — graceful failure
  GIVEN a value "enc:v1:000000000000:00000000000000000000000000000000:corrupted"
  WHEN decrypt() is called with a valid key
  THEN it returns the corrupted value unchanged (no exception thrown)

TEST 11: different ciphertexts for same plaintext
  GIVEN the plaintext "same-secret"
  WHEN encrypt() is called twice
  THEN the two ciphertexts are different (random IV)

TEST 12: empty string handling
  GIVEN an empty string ""
  WHEN encrypt("") then decrypt("") are called
  THEN the output is ""
```

#### Implementation (GREEN)
- Implement `lib/crypto.ts` with all functions to pass above tests

#### Refactor (REFACTOR)
- Extract constant prefix
- Add JSDoc comments
- Ensure TypeScript strict mode compatibility

### Phase 2: `lib/settings.ts` — Settings Integration

#### RED Tests

```
TEST 13: setSetting encrypts secret keys
  GIVEN a setting key "ai_api_key" and value "sk-abc123"
  WHEN setSetting() is called, then raw DB value is read
  THEN the DB value starts with "enc:v1:" (encrypted)

TEST 14: setSetting does NOT encrypt non-secret keys
  GIVEN a setting key "ai_provider" and value "openai"
  WHEN setSetting() is called, then raw DB value is read
  THEN the DB value is "openai" (plaintext)

TEST 15: getSetting decrypts on read
  GIVEN an encrypted value in DB for key "ai_api_key"
  WHEN getSetting("ai_api_key") is called
  THEN it returns the original plaintext value

TEST 16: getWorkspaceSetting encrypts/decrypts
  GIVEN workspace setting key "ai_api_key" with value "sk-xyz"
  WHEN setWorkspaceSetting() then getWorkspaceSetting() are called
  THEN the returned value is "sk-xyz" (decrypted)

TEST 17: backward compatibility — existing plaintext still works
  GIVEN a plaintext value in DB (pre-encryption data)
  WHEN getSetting() is called
  THEN it returns the plaintext value unchanged
```

#### Implementation (GREEN)
- Modify `lib/settings.ts` to import and use encrypt/decrypt

#### Refactor (REFACTOR)
- Extract `decryptSettings()` helper
- Add comments explaining backward compatibility

### Phase 3: API Route — Key Masking

#### RED Tests

```
TEST 18: maskApiKey masks correctly
  GIVEN value "sk-abc123def456"
  WHEN maskApiKey(value, 4) is called
  THEN it returns "**********f456"

TEST 19: maskApiKey handles short values
  GIVEN value "abc"
  WHEN maskApiKey(value, 4) is called
  THEN it returns "abc" (shorter than visible chars)

TEST 20: maskApiKey handles empty string
  GIVEN value ""
  WHEN maskApiKey(value, 4) is called
  THEN it returns ""

TEST 21: GET /api/admin/settings masks api key
  GIVEN a workspace with ai_api_key = "sk-abc123def456"
  WHEN GET /api/admin/settings is called
  THEN the response has ai_api_key = "**********f456" (masked)
```

#### Implementation (GREEN)
- Modify `app/api/admin/settings/route.ts` to mask keys in GET response

#### Refactor (REFACTOR)
- Ensure audit log never contains raw API keys

### Phase 4: isSecretKey Detection

#### RED Tests

```
TEST 22: isSecretKey detects various patterns
  GIVEN these keys: ["ai_api_key", "stripe_secret", "auth_token", 
                      "db_password", "webhook_credential", "signing_private_key"]
  WHEN isSecretKey() is called on each
  THEN all return true

TEST 23: isSecretKey rejects non-secret keys
  GIVEN these keys: ["ai_provider", "ai_model", "ai_embedding_model",
                      "chunk_size", "theme_color"]
  WHEN isSecretKey() is called on each
  THEN all return false
```

## Test Environment

- **Framework:** Node.js built-in test runner or manual verification
- **Key:** Test key generated via `crypto.randomBytes(32).toString('hex')`
- **Isolation:** Tests set ENCRYPTION_KEY env var directly, no DB required for crypto tests

## Coverage Targets

| Module | Target | Focus |
|--------|--------|-------|
| `lib/crypto.ts` | 100% | All encrypt/decrypt paths, edge cases |
| `lib/settings.ts` | 90% | Encrypt on write, decrypt on read, backward compat |
| `lib/crypto.ts` (maskApiKey) | 100% | Normal, short, empty inputs |
| API route | 80% | Key masking in GET response |

## Manual Verification

After implementation, verify manually:
1. `npm run build` passes without TypeScript errors
2. `npx tsx scripts/encrypt-existing-keys.ts --dry-run` runs without error
3. `npx tsx scripts/decrypt-emergency.ts --dry-run` runs without error
4. Settings page loads and shows masked API key
5. Saving settings encrypts the value in DB
6. Reading settings returns decrypted value
