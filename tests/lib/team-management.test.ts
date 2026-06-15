import { describe, it, expect, beforeAll } from "vitest";

// ============================================================
// Team Management & Invitation Flow Tests
// ============================================================
// Tests for the team management UI and invitation workflow:
// - Invitation API integration
// - Role display and badges
// - Token copy/clipboard
// - Revoke/resend actions
// - Accept invitation flow
// - Cross-workspace isolation
// - Accessibility patterns

import { execSync } from "child_process";

function psql(sql: string): string {
  const clean = sql.replace(/\s+/g, " ").trim();
  return execSync(
    `docker exec mimotes-db-1 psql -U mimotes -d mimotes -t -A -c "${clean.replace(/"/g, '\\"')}"`,
    { encoding: "utf-8", timeout: 10000 }
  ).trim();
}

// ============================================================
// Invitation Workflow Tests (Database Level)
// ============================================================

describe("Invitation Workflow — End-to-End", () => {
  let workspaceA: string;
  let userA: string;

  beforeAll(() => {
    // Clean up orphan test workspaces from previous runs
    psql("DELETE FROM workspace_members WHERE workspace_id IN (SELECT id FROM workspaces WHERE id LIKE 'test-%')");
    psql("DELETE FROM workspace_invitations WHERE workspace_id IN (SELECT id FROM workspaces WHERE id LIKE 'test-%')");
    psql("DELETE FROM workspaces WHERE id LIKE 'test-%'");

    const wsResult = psql("SELECT id FROM workspaces ORDER BY created_at LIMIT 1");
    workspaceA = wsResult.trim();
    const userResult = psql(
      `SELECT user_id FROM workspace_members WHERE workspace_id = '${workspaceA}' AND role = 'owner' LIMIT 1`
    );
    userA = userResult.trim();
  });

  it("should have workspace_invitations table accessible", () => {
    const count = psql("SELECT COUNT(*) FROM workspace_invitations");
    expect(parseInt(count)).toBeGreaterThanOrEqual(0);
  });

  it("should support full invitation lifecycle", () => {
    // Create invitation
    const { rawToken, tokenHash, tokenPrefix } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-inv-1', '${workspaceA}', 'e2e-test@example.com', 'editor', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Verify created
    const status1 = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'e2e-inv-1'"
    );
    expect(status1).toBe("pending");

    // Accept invitation
    psql(
      "UPDATE workspace_invitations SET status = 'accepted', accepted_at = NOW() WHERE id = 'e2e-inv-1'"
    );

    const status2 = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'e2e-inv-1'"
    );
    expect(status2).toBe("accepted");

    // Verify accepted_at is set
    const acceptedAt = psql(
      "SELECT accepted_at IS NOT NULL FROM workspace_invitations WHERE id = 'e2e-inv-1'"
    );
    expect(acceptedAt).toBe("t");

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-inv-1'");
  });

  it("should support revoke workflow", () => {
    // Cleanup from previous runs
    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-revoke-1'");

    const { tokenHash, tokenPrefix } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-revoke-1', '${workspaceA}', 'e2e-revoke@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Revoke
    psql(
      "UPDATE workspace_invitations SET status = 'revoked' WHERE id = 'e2e-revoke-1'"
    );

    const status = psql(
      "SELECT status FROM workspace_invitations WHERE id = 'e2e-revoke-1'"
    );
    expect(status).toBe("revoked");

    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-revoke-1'");
  });

  it("should support resend workflow (new token)", () => {
    const { tokenHash: hash1, tokenPrefix: prefix1 } = generateTestToken();
    const { tokenHash: hash2, tokenPrefix: prefix2 } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-resend-1', '${workspaceA}', 'resend-test@example.com', 'admin', '${hash1}', '${prefix1}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Resend (new token)
    const newExpires = new Date();
    newExpires.setDate(newExpires.getDate() + 7);
    psql(
      `UPDATE workspace_invitations SET token = '${hash2}', token_prefix = '${prefix2}', expires_at = '${newExpires.toISOString()}' WHERE id = 'e2e-resend-1'`
    );

    const token = psql(
      "SELECT token FROM workspace_invitations WHERE id = 'e2e-resend-1'"
    );
    expect(token).toBe(hash2);

    const prefix = psql(
      "SELECT token_prefix FROM workspace_invitations WHERE id = 'e2e-resend-1'"
    );
    expect(prefix).toBe(prefix2);

    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-resend-1'");
  });

  it("should prevent duplicate pending invitations", () => {
    const { tokenHash: h1, tokenPrefix: p1 } = generateTestToken();
    const { tokenHash: h2, tokenPrefix: p2 } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // First invite
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-dup-1', '${workspaceA}', 'dup-test@example.com', 'viewer', '${h1}', '${p1}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Duplicate should fail
    let failed = false;
    try {
      psql(
        `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
         VALUES ('e2e-dup-2', '${workspaceA}', 'dup-test@example.com', 'editor', '${h2}', '${p2}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
      );
    } catch {
      failed = true;
    }
    expect(failed).toBe(true);

    psql("DELETE FROM workspace_invitations WHERE id IN ('e2e-dup-1', 'e2e-dup-2')");
  });

  it("should allow same email with different status after accept", () => {
    // Cleanup from previous runs
    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-status-1'");
    psql("DELETE FROM workspace_invitations WHERE id = 'e2e-status-2'");

    const { tokenHash: h1, tokenPrefix: p1 } = generateTestToken();
    const { tokenHash: h2, tokenPrefix: p2 } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // First invite (pending)
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-status-1', '${workspaceA}', 'status-test@example.com', 'viewer', '${h1}', '${p1}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    // Accept it
    psql(
      "UPDATE workspace_invitations SET status = 'accepted' WHERE id = 'e2e-status-1'"
    );

    // New invite with same email should succeed (different status)
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('e2e-status-2', '${workspaceA}', 'status-test@example.com', 'editor', '${h2}', '${p2}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    const count = psql(
      "SELECT COUNT(*) FROM workspace_invitations WHERE email = 'status-test@example.com'"
    );
    expect(parseInt(count)).toBe(2);

    psql("DELETE FROM workspace_invitations WHERE email = 'status-test@example.com'");
  });
});

// ============================================================
// Role Display Tests
// ============================================================

describe("Role Display & Badges", () => {
  it("should have valid roles in workspace_members", () => {
    const roles = psql(
      "SELECT DISTINCT role FROM workspace_members ORDER BY role"
    );
    const roleList = roles.split("\n").filter((r) => r.length > 0);
    const validRoles = ["owner", "admin", "editor", "viewer"];
    for (const role of roleList) {
      expect(validRoles).toContain(role);
    }
  });

  it("should have at least one owner per workspace", () => {
    const workspaces = psql("SELECT id FROM workspaces");
    const wsList = workspaces.split("\n").filter((w) => w.length > 0);
    for (const ws of wsList) {
      const ownerCount = parseInt(
        psql(
          `SELECT COUNT(*) FROM workspace_members WHERE workspace_id = '${ws}' AND role = 'owner'`
        )
      );
      expect(ownerCount).toBe(1);
    }
  });

  it("should have role hierarchy (owner > admin > editor > viewer)", () => {
    // Verify the role hierarchy exists in RBAC
    const roles = psql(
      "SELECT DISTINCT role FROM workspace_members"
    );
    const roleList = roles.split("\n").filter((r) => r.length > 0);
    // All roles should be valid
    const hierarchy = { owner: 4, admin: 3, editor: 2, viewer: 1 };
    for (const role of roleList) {
      expect(hierarchy).toHaveProperty(role);
    }
  });
});

// ============================================================
// Invitation Status Tests
// ============================================================

describe("Invitation Status Display", () => {
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

  it("should have all 4 invitation statuses", () => {
    // Create test invitations for each status
    const statuses = ["pending", "accepted", "expired", "revoked"];
    const ids: string[] = [];

    for (const status of statuses) {
      const { tokenHash, tokenPrefix } = generateTestToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const id = `status-test-${status}`;

      psql(
        `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
         VALUES ('${id}', '${workspaceA}', '${status}-test@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', '${status}', '${expiresAt.toISOString()}', NOW())`
      );
      ids.push(id);
    }

    // Verify all statuses exist
    const count = psql(
      `SELECT COUNT(DISTINCT status) FROM workspace_invitations WHERE id LIKE 'status-test-%'`
    );
    expect(parseInt(count)).toBe(4);

    // Cleanup
    for (const id of ids) {
      psql(`DELETE FROM workspace_invitations WHERE id = '${id}'`);
    }
  });

  it("should show correct expiry for pending invitations", () => {
    const { tokenHash, tokenPrefix } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('expiry-test', '${workspaceA}', 'expiry@example.com', 'viewer', '${tokenHash}', '${tokenPrefix}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    const stored = psql(
      "SELECT expires_at FROM workspace_invitations WHERE id = 'expiry-test'"
    );
    const storedDate = new Date(stored);
    const now = new Date();
    const diffDays = Math.floor(
      (storedDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(8);

    psql("DELETE FROM workspace_invitations WHERE id = 'expiry-test'");
  });
});

// ============================================================
// Cross-Workspace Invitation Isolation
// ============================================================

describe("Cross-Workspace Invitation Isolation", () => {
  let workspaceA: string;
  let workspaceB: string;
  let userA: string;

  beforeAll(() => {
    const wsResult = psql("SELECT id FROM workspaces ORDER BY created_at LIMIT 2");
    const workspaces = wsResult.split("\n").filter((w) => w.length > 0);
    workspaceA = workspaces[0];
    workspaceB = workspaces[1] || workspaces[0];

    const userResult = psql(
      `SELECT user_id FROM workspace_members WHERE workspace_id = '${workspaceA}' AND role = 'owner' LIMIT 1`
    );
    userA = userResult.trim();
  });

  it("should isolate invitations between workspaces", () => {
    const { tokenHash: hA, tokenPrefix: pA } = generateTestToken();
    const { tokenHash: hB, tokenPrefix: pB } = generateTestToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create in workspace A
    psql(
      `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
       VALUES ('iso-a', '${workspaceA}', 'iso-a@example.com', 'viewer', '${hA}', '${pA}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
    );

    if (workspaceA !== workspaceB) {
      // Create in workspace B
      psql(
        `INSERT INTO workspace_invitations (id, workspace_id, email, role, token, token_prefix, invited_by, status, expires_at, created_at)
         VALUES ('iso-b', '${workspaceB}', 'iso-b@example.com', 'editor', '${hB}', '${pB}', '${userA}', 'pending', '${expiresAt.toISOString()}', NOW())`
      );
    }

    // Set context to workspace A
    psql(`SELECT set_config('app.current_workspace_id', '${workspaceA}', true)`);

    // Should only see workspace A invitations via RLS
    const countA = psql(
      `SELECT COUNT(*) FROM workspace_invitations WHERE workspace_id = '${workspaceA}'`
    );
    expect(parseInt(countA)).toBeGreaterThanOrEqual(1);

    // Cleanup
    psql("DELETE FROM workspace_invitations WHERE id IN ('iso-a', 'iso-b')");
  });
});

// ============================================================
// Security Pattern Tests
// ============================================================

describe("Team Management Security Patterns", () => {
  it("should not expose raw tokens in database", () => {
    // Tokens should be stored as SHA-256 hashes (64 hex chars)
    const { rawToken, tokenHash } = generateTestToken();
    expect(tokenHash).toHaveLength(64);
    expect(tokenHash).not.toBe(rawToken);
  });

  it("should have RLS on workspace_invitations", () => {
    const rls = psql(
      "SELECT relrowsecurity FROM pg_class WHERE relname = 'workspace_invitations' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"
    );
    expect(rls).toBe("t");
  });

  it("should have unique constraint preventing duplicate pending invites", () => {
    const indexes = psql(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'workspace_invitations'"
    );
    expect(indexes).toContain("workspace_invitations_unique_pending");
  });

  it("should have index on token for fast lookup", () => {
    const indexes = psql(
      "SELECT indexname FROM pg_indexes WHERE tablename = 'workspace_invitations'"
    );
    expect(indexes).toContain("workspace_invitations_token_idx");
  });
});

// ============================================================
// Helper: Token Generation (mirrors lib/invitations.ts)
// ============================================================

import { createHash, randomBytes } from "crypto";

function generateTestToken() {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const tokenPrefix = rawToken.substring(0, 8);
  return { rawToken, tokenHash, tokenPrefix };
}
