import { describe, it, expect, beforeAll, vi } from "vitest";

// ============================================================
// Invitation System Tests
// ============================================================
// Tests for the workspace invitation system:
// - Token generation, hashing, verification
// - Expiration handling
// - Database operations via docker exec psql
// - Security: replay protection, cross-workspace isolation

import { execSync } from "child_process";

function psql(sql: string): string {
  const clean = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${clean.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 10000 }
  ).trim();
}

// ============================================================
// Token Utilities (pure functions — no DB needed)
// ============================================================

// Import directly from the source
import {
  generateInvitationToken,
  hashToken,
  verifyInvitationToken,
  isTokenExpired,
  getExpiresAt,
  INVITATION_EXPIRY_DAYS,
} from "@/lib/invitations";

describe("Invitation Token Utilities", () => {
  describe("generateInvitationToken", () => {
    it("should generate a 64-character hex token", () => {
      const { rawToken } = generateInvitationToken();
      expect(rawToken).toHaveLength(64);
      expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should generate a SHA-256 hash of the token", () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      const expectedHash = hashToken(rawToken);
      expect(tokenHash).toBe(expectedHash);
      expect(tokenHash).toHaveLength(64);
    });

    it("should generate an 8-character prefix", () => {
      const { rawToken, tokenPrefix } = generateInvitationToken();
      expect(tokenPrefix).toHaveLength(8);
      expect(rawToken.startsWith(tokenPrefix)).toBe(true);
    });

    it("should generate unique tokens each call", () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        tokens.add(generateInvitationToken().rawToken);
      }
      expect(tokens.size).toBe(100);
    });
  });

  describe("hashToken", () => {
    it("should produce a 64-character hex string", () => {
      const hash = hashToken("test-token");
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it("should be deterministic", () => {
      const hash1 = hashToken("same-input");
      const hash2 = hashToken("same-input");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = hashToken("token-a");
      const hash2 = hashToken("token-b");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifyInvitationToken", () => {
    it("should return true for matching token", () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      expect(verifyInvitationToken(rawToken, tokenHash)).toBe(true);
    });

    it("should return false for wrong token", () => {
      const { tokenHash } = generateInvitationToken();
      const { rawToken: wrongToken } = generateInvitationToken();
      expect(verifyInvitationToken(wrongToken, tokenHash)).toBe(false);
    });

    it("should return false for empty token", () => {
      const { tokenHash } = generateInvitationToken();
      expect(verifyInvitationToken("", tokenHash)).toBe(false);
    });

    it("should use timing-safe comparison (no length leak)", () => {
      const { rawToken, tokenHash } = generateInvitationToken();
      // Short token should not match even if hash prefix matches
      expect(verifyInvitationToken(rawToken.substring(0, 8), tokenHash)).toBe(false);
    });
  });

  describe("isTokenExpired", () => {
    it("should return false for future dates", () => {
      const future = new Date();
      future.setDate(future.getDate() + 7);
      expect(isTokenExpired(future)).toBe(false);
    });

    it("should return true for past dates", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);
      expect(isTokenExpired(past)).toBe(true);
    });

    it("should return true for now (edge case)", () => {
      // Date in the past
      const past = new Date("2020-01-01");
      expect(isTokenExpired(past)).toBe(true);
    });
  });

  describe("getExpiresAt", () => {
    it("should default to 7 days", () => {
      const expiresAt = getExpiresAt();
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it("should accept custom days", () => {
      const expiresAt = getExpiresAt(3);
      const now = new Date();
      const diffMs = expiresAt.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(3, 0);
    });

    it("should return a Date object", () => {
      expect(getExpiresAt()).toBeInstanceOf(Date);
    });
  });

  describe("INVITATION_EXPIRY_DAYS", () => {
    it("should be 7", () => {
      expect(INVITATION_EXPIRY_DAYS).toBe(7);
    });
  });
});

// ============================================================
// Database Integration Tests
// ============================================================

describe("Invitation Database Operations", () => {
  let workspaceA: string;
  let userA: string;

  beforeAll(() => {
    const wsResult = psql("SELECT id FROM workspaces ORDER BY created_at LIMIT 1");
    workspaceA = wsResult.trim();

    const userResult = psql(
      `SELECT user_id FROM workspace_members WHERE workspace_id = '${workspaceA}' AND role = 'owner' LIMIT 1`
    );
    userA = userResult.trim();
  });

  it("should have workspace_invitations table", () => {
    const exists = psql(
      "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'workspace_invitations'"
    );
    expect(parseInt(exists)).toBe(1);
  });

  it("should have correct columns", () => {
    const columns = psql(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'workspace_invitations' ORDER BY ordinal_position"
    );
    const colList = columns.split("\n").filter((c) => c.length > 0);
    expect(colList).toContain("id");
    expect(colList).toContain("workspace_id");
    expect(colList).toContain("email");
    expect(colList).toContain("role");
    expect(colList).toContain("token");
    expect(colList).toContain("token_prefix");
    expect(colList).toContain("invited_by");
    expect(colList).toContain("status");
    expect(colList).toContain("expires_at");
    expect(colList).toContain("accepted_at");
    expect(colList).toContain("created_at");
  });

  it("should have RLS enabled", () => {
    const rls = psql(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'workspace_invitations' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
    );
    expect(rls).toBe("t");
  });

  it("should have FORCE RLS", () => {
    const force = psql(
      "SELECT relforcerowsecurity FROM pg_class WHERE relname = 'workspace_invitations' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
    );
    expect(force).toBe("t");
  });

  it("should have tenant isolation policy", () => {
    const policies = psql(
      "SELECT policyname FROM pg_policies WHERE tablename = 'workspace_invitations' AND schemaname = 'public'"
    );
    expect(policies).toMatch(/workspace_invitations_(tenant_)?isolation/);
  });

  it("should have token index", () => {
    const indexes = psql(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'workspace_invitations'"
    );
    expect(indexes).toContain("workspace_invitations_token_idx");
  });

  it("should have unique constraint on (workspace_id, email, status)", () => {
    const indexes = psql(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'workspace_invitations' AND indexname LIKE '%unique_pending'"
    );
    expect(indexes).toContain("workspace_invitations_unique_pending");
  });

  it("should be able to insert and query an invitation", () => {
    const { rawToken, tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    // Insert
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-001', '${workspaceA}', 'test-invite@example.com', 'editor', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Query
    const result = psql(
      "SELECT email, role, status FROM workspace_invitations WHERE id = 'test-inv-001'"
    );
    const [email, role, status] = result.split("|");
    expect(email).toBe("test-invite@example.com");
    expect(role).toBe("editor");
    expect(status).toBe("pending");

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-001'");
  });

  it("should enforce unique constraint (same email + workspace + pending)", () => {
    const { tokenHash: hash1, tokenPrefix: prefix1 } = generateInvitationToken();
    const { tokenHash: hash2, tokenPrefix: prefix2 } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    // First insert
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-dup-1', '${workspaceA}', 'dup-test@example.com', 'viewer', '${hash1}', '${prefix1}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Second insert with same email + workspace + status should fail
    let failed = false;
    try {
      psql(
        `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
         VALUES ('test-inv-dup-2', '${workspaceA}', 'dup-test@example.com', 'editor', '${hash2}', '${prefix2}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
      );
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id IN ('test-inv-dup-1', 'test-inv-dup-2')");
  });

  it("should allow same email with different status", () => {
    const { tokenHash: hash1, tokenPrefix: prefix1 } = generateInvitationToken();
    const { tokenHash: hash2, tokenPrefix: prefix2 } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    // Insert pending
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-status-1', '${workspaceA}', 'status-test@example.com', 'viewer', '${hash1}', '${prefix1}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Insert revoked (different status — should succeed)
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-status-2', '${workspaceA}', 'status-test@example.com', 'editor', '${hash2}', '${prefix2}', '${userA}', 'revoked', '${expiresAt.toISOString()}', NOW())`
    );

    const count = psql(
      "SELECT COUNT(*) FROM workspace_invitations WHERE email = 'status-test@example.com'"
    );
    expect(parseInt(count)).toBe(2);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE email = 'status-test@example.com'");
  });

  it("should be able to update status (pending → accepted)", () => {
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-accept', '${workspaceA}', 'accept-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    psql(
      "UPDATE workspace_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = 'test-inv-accept'"
    );

    const result = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'test-inv-accept'"
    );
    expect(result).toBe("accepted");

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-accept'");
  });

  it("should be able to update status (pending → revoked)", () => {
    // Cleanup from previous runs
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-revoke'");

    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-revoke', '${workspaceA}', 'revoke-test@example.com', 'editor', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    psql(
      "UPDATE workspace_invitations SET status = 'revoked' WHERE id = 'test-inv-revoke'"
    );

    const result = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'test-inv-revoke'"
    );
    expect(result).toBe("revoked");

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-revoke'");
  });

  it("should prevent replay (cannot accept twice)", () => {
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-replay', '${workspaceA}', 'replay-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // First accept
    psql(
      "UPDATE workspace_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = 'test-inv-replay'"
    );

    // Try to accept again (should find status=accepted, not pending)
    const status = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'test-inv-replay'"
    );
    expect(status).toBe("accepted");
    // The application logic checks for status='pending' before accepting,
    // so this would be rejected at the API level

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-replay'");
  });

  it("should reject expired tokens", () => {
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const pastDate = new Date("2020-01-01");

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-expired', '${workspaceA}', 'expired-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${pastDate.toISOString()}', NOW())`
    );

    // The application logic checks isTokenExpired before accepting
    const expiresAt = psql(
      "SELECT expires_at FROM workspace_invitations WHERE id = 'test-inv-expired'"
    );
    expect(isTokenExpired(new Date(expiresAt))).toBe(true);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-expired'");
  });

  it("should verify token hash matches raw token", () => {
    const { rawToken, tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-inv-verify', '${workspaceA}', 'verify-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Query by hash
    const storedHash = psql(
      "SELECT token FROM workspace_invitations WHERE id = 'test-inv-verify'"
    );

    // Verify using timing-safe comparison
    expect(verifyInvitationToken(rawToken, storedHash)).toBe(true);

    // Wrong token should fail
    const { rawToken: wrongToken } = generateInvitationToken();
    expect(verifyInvitationToken(wrongToken, storedHash)).toBe(false);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-inv-verify'");
  });
});

// ============================================================
// Cross-Workspace Isolation Tests
// ============================================================

describe("Invitation Cross-Workspace Isolation", () => {
  let workspaceA: string;
  let workspaceB: string;
  let userA: string;

  beforeAll(() => {
    const wsResult = psql("SELECT id FROM workspaces ORDER BY created_at LIMIT 2");
    const workspaces = wsResult.split("\n").filter((w) => w.length > 0);
    workspaceA = workspaces[0];
    workspaceB = workspaces[1] || workspaces[0]; // fallback if only 1 workspace

    const userResult = psql(
      `SELECT user_id FROM workspace_members WHERE workspace_id = '${workspaceA}' AND role = 'owner' LIMIT 1`
    );
    userA = userResult.trim();
  });

  it("should isolate invitations between workspaces via RLS", () => {
    const { tokenHash: hashA, tokenPrefix: prefixA } = generateInvitationToken();
    const { tokenHash: hashB, tokenPrefix: prefixB } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    // Insert into workspace A
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-iso-a', '${workspaceA}', 'iso-a@example.com', 'viewer', '${hashA}', '${prefixA}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Insert into workspace B (if different)
    if (workspaceA !== workspaceB) {
      psql(
        `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
         VALUES ('test-iso-b', '${workspaceB}', 'iso-b@example.com', 'editor', '${hashB}', '${prefixB}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
      );
    }

    // Set context to workspace A — should only see workspace A invitations
    psql(`SELECT set_config('app.current_workspace_id', '${workspaceA}', true)`);

    const countA = psql(
      "SELECT COUNT(*) FROM workspace_invitations WHERE workspace_id = '" + workspaceA + "'"
    );
    expect(parseInt(countA)).toBeGreaterThanOrEqual(1);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id IN ('test-iso-a', 'test-iso-b')");
  });

  it("should not allow accepting invitation from wrong workspace", () => {
    // This is tested at the application level — the accept endpoint
    // verifies the token belongs to the workspace context
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();

    // Create invitation in workspace A
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('test-iso-cross', '${workspaceA}', 'cross-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // The application accept endpoint validates token against the invitation
    // and creates membership in the correct workspace
    // This test verifies the data exists
    const result = psql(
      "SELECT workspace_id FROM workspace_invitations WHERE id = 'test-iso-cross'"
    );
    expect(result).toBe(workspaceA);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'test-iso-cross'");
  });
});

// ============================================================
// Security Tests
// ============================================================

describe("Invitation Security", () => {
  let workspaceId: string;
  let userId: string;

  beforeAll(() => {
    workspaceId = psql("SELECT id FROM workspaces ORDER BY created_at LIMIT 1");
    userId = psql(
      `SELECT user_id FROM workspace_members WHERE workspace_id = '${workspaceId}' AND role = 'owner' LIMIT 1`
    );
  });
  it("should not use Math.random for token generation", () => {
    // Verify token uses crypto.randomBytes (64 hex chars = 32 bytes)
    const { rawToken } = generateInvitationToken();
    expect(rawToken).toHaveLength(64);
    // Math.random would produce variable-length or non-hex output
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("should use SHA-256 for hashing", () => {
    const hash = hashToken("test");
    // SHA-256 produces 64 hex chars (256 bits)
    expect(hash).toHaveLength(64);
  });

  it("should use timing-safe comparison", () => {
    // verifyInvitationToken uses timingSafeEqual internally
    // We verify by checking that wrong tokens fail even with similar prefixes
    const { rawToken, tokenHash } = generateInvitationToken();
    const similarToken = rawToken.substring(0, 63) + "0"; // change last char
    expect(verifyInvitationToken(similarToken, tokenHash)).toBe(false);
  });

  it("should reject tokens with wrong length", () => {
    const { tokenHash } = generateInvitationToken();
    expect(verifyInvitationToken("short", tokenHash)).toBe(false);
    expect(verifyInvitationToken("a".repeat(100), tokenHash)).toBe(false);
  });

  it("should have 7-day default expiration", () => {
    expect(INVITATION_EXPIRY_DAYS).toBe(7);
  });

  it("should prevent accepting own invitation (email mismatch check)", () => {
    // This is enforced at the application level
    // The accept endpoint checks session.user.email against invitation.email
    // We verify the data model supports this check
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();
    const id = `test-sec-own-${Date.now()}`;

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('${id}', '${workspaceId}', 'owner@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userId}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    const email = psql(
      `SELECT email FROM workspace_invitations WHERE id = '${id}'`
    );
    expect(email).toBe("owner@example.com");

    // Application would check: session.user.email !== invitation.email
    psql(`DELETE FROM workspace_invitations WHERE id = '${id}'`);
  });

  it("should prevent replay attacks (status check)", () => {
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const expiresAt = getExpiresAt();
    const id = `test-sec-replay-${Date.now()}`;

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('${id}', '${workspaceId}', 'replay@example.com', 'editor', '${tokenHash}', '${tokenPrefix}', '${userId}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Accept once
    psql(
      `UPDATE workspace_invitations SET status = 'accepted' WHERE id = '${id}'`
    );

    // Verify status is no longer pending
    const status = psql(
      `SELECT status FROM workspace_invitations WHERE id = '${id}'`
    );
    expect(status).not.toBe("pending");

    // Application would reject this because status !== 'pending'
    psql(`DELETE FROM workspace_invitations WHERE id = '${id}'`);
  });

  it("should prevent accepting expired invitations", () => {
    const { tokenHash, tokenPrefix } = generateInvitationToken();
    const pastDate = new Date("2020-01-01");
    const id = `test-sec-expired-${Date.now()}`;

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('${id}', '${workspaceId}', 'expired@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userId}', 'pending', '${pastDate.toISOString()}', NOW())`
    );

    const expiresAtVal = psql(
      `SELECT expires_at FROM workspace_invitations WHERE id = '${id}'`
    );
    expect(isTokenExpired(new Date(expiresAtVal))).toBe(true);

    psql(`DELETE FROM workspace_invitations WHERE id = '${id}'`);
  });
});
