-- ============================================================
-- 003: Add workspace_settings table + RBAC migration
-- ============================================================

-- 1. Create workspace_settings table
CREATE TABLE IF NOT EXISTS workspace_settings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(workspace_id, key)
);

CREATE INDEX IF NOT EXISTS workspace_settings_workspace_id_idx
  ON workspace_settings(workspace_id);

-- 2. Enable RLS
ALTER TABLE workspace_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies — workspace members can read/write settings
CREATE POLICY "workspace_settings_select"
  ON workspace_settings FOR SELECT
  USING (
    workspace_id::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY "workspace_settings_insert"
  ON workspace_settings FOR INSERT
  WITH CHECK (
    workspace_id::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY "workspace_settings_update"
  ON workspace_settings FOR UPDATE
  USING (
    workspace_id::text = current_setting('app.current_workspace_id', true)
  );

CREATE POLICY "workspace_settings_delete"
  ON workspace_settings FOR DELETE
  USING (
    workspace_id::text = current_setting('app.current_workspace_id', true)
  );

-- 4. Force RLS on workspace_settings (applies to table owner too)
ALTER TABLE workspace_settings FORCE ROW LEVEL SECURITY;

-- 5. Migrate existing global AI settings into default workspaces
-- (for each workspace that has an owner, copy global settings)
INSERT INTO workspace_settings (workspace_id, key, value)
SELECT wm.workspace_id, s.key, s.value
FROM settings s
CROSS JOIN workspace_members wm
WHERE wm.role = 'owner'
  AND s.key IN ('ai_provider', 'ai_api_key', 'ai_base_url', 'ai_model', 'ai_embedding_model')
  AND NOT EXISTS (
    SELECT 1 FROM workspace_settings ws
    WHERE ws.workspace_id = wm.workspace_id AND ws.key = s.key
  )
ON CONFLICT (workspace_id, key) DO NOTHING;
