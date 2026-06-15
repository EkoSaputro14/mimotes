-- ============================================================
-- 004: Subscription Plans + Usage Tracking
-- ============================================================

-- 1. subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Limits (-1 = unlimited)
  max_documents INT NOT NULL DEFAULT 10,
  max_storage_mb INT NOT NULL DEFAULT 100,
  max_chat_messages INT NOT NULL DEFAULT 1000,
  max_chunks INT NOT NULL DEFAULT 5000,
  max_ai_requests INT NOT NULL DEFAULT 500,
  max_embedding_reqs INT NOT NULL DEFAULT 500,
  max_mcp_executions INT NOT NULL DEFAULT 100,
  max_members INT NOT NULL DEFAULT 3,
  max_workspaces INT NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. workspace_subscriptions
CREATE TABLE IF NOT EXISTS workspace_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  trial_starts_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS workspace_subscriptions_workspace_id_idx
  ON workspace_subscriptions(workspace_id);

-- 3. workspace_usage
CREATE TABLE IF NOT EXISTS workspace_usage (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period VARCHAR(7) NOT NULL,  -- "2026-06"

  documents_created INT NOT NULL DEFAULT 0,
  storage_bytes_used BIGINT NOT NULL DEFAULT 0,
  chunks_created INT NOT NULL DEFAULT 0,
  chat_messages INT NOT NULL DEFAULT 0,
  ai_requests INT NOT NULL DEFAULT 0,
  embedding_requests INT NOT NULL DEFAULT 0,
  mcp_executions INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, period)
);

CREATE INDEX IF NOT EXISTS workspace_usage_workspace_id_idx
  ON workspace_usage(workspace_id);

-- 4. Enable RLS on all 3 tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_usage ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- subscription_plans: read-only for all authenticated users (plan definitions)
CREATE POLICY "subscription_plans_select"
  ON subscription_plans FOR SELECT
  USING (true);

-- workspace_subscriptions: workspace-scoped
CREATE POLICY "workspace_subscriptions_select"
  ON workspace_subscriptions FOR SELECT
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "workspace_subscriptions_insert"
  ON workspace_subscriptions FOR INSERT
  WITH CHECK (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "workspace_subscriptions_update"
  ON workspace_subscriptions FOR UPDATE
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

-- workspace_usage: workspace-scoped
CREATE POLICY "workspace_usage_select"
  ON workspace_usage FOR SELECT
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "workspace_usage_insert"
  ON workspace_usage FOR INSERT
  WITH CHECK (workspace_id::text = current_setting('app.current_workspace_id', true));

CREATE POLICY "workspace_usage_update"
  ON workspace_usage FOR UPDATE
  USING (workspace_id::text = current_setting('app.current_workspace_id', true));

-- 6. Force RLS on all tables
ALTER TABLE subscription_plans FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_usage FORCE ROW LEVEL SECURITY;

-- 7. Seed default plans
INSERT INTO subscription_plans (name, display_name, description, max_documents, max_storage_mb, max_chat_messages, max_chunks, max_ai_requests, max_embedding_reqs, max_mcp_executions, max_members, max_workspaces)
VALUES
  ('free', 'Free', 'Basic plan for personal use', 10, 100, 1000, 5000, 500, 500, 100, 3, 1),
  ('pro', 'Pro', 'Professional plan for teams', 100, 10240, 50000, 100000, 10000, 10000, 5000, 20, 5),
  ('enterprise', 'Enterprise', 'Unlimited plan for organizations', -1, -1, -1, -1, -1, -1, -1, -1, -1)
ON CONFLICT (name) DO NOTHING;

-- 8. Assign free plan to existing workspaces
INSERT INTO workspace_subscriptions (id, workspace_id, plan_id, status, created_at, updated_at)
SELECT gen_random_uuid()::text, wm.workspace_id, sp.id, 'active', NOW(), NOW()
FROM workspace_members wm
CROSS JOIN subscription_plans sp
WHERE wm.role = 'owner'
  AND sp.name = 'free'
  AND NOT EXISTS (
    SELECT 1 FROM workspace_subscriptions ws WHERE ws.workspace_id = wm.workspace_id
  )
ON CONFLICT DO NOTHING;
