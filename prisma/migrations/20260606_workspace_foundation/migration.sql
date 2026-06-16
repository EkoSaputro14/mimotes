-- Migration: Workspace Foundation
-- Transitions from User-as-Tenant to Workspace-as-Tenant
-- Date: 2026-06-06

-- ============================================================
-- PHASE 1: Create workspace tables
-- ============================================================

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX workspace_members_user_id_idx ON workspace_members(user_id);
CREATE INDEX workspace_members_workspace_id_idx ON workspace_members(workspace_id);

-- ============================================================
-- PHASE 2: Add workspace_id columns (nullable first)
-- ============================================================

ALTER TABLE documents ADD COLUMN workspace_id TEXT;
ALTER TABLE document_chunks ADD COLUMN workspace_id TEXT;
ALTER TABLE chat_sessions ADD COLUMN workspace_id TEXT;
ALTER TABLE analytics_events ADD COLUMN workspace_id TEXT;
ALTER TABLE mcp_servers ADD COLUMN workspace_id TEXT;
ALTER TABLE prompt_templates ADD COLUMN workspace_id TEXT;

-- ============================================================
-- PHASE 3: Create default workspace for each user
-- ============================================================

-- Create workspace: "User Name's Workspace" (or "Workspace" if no name)
INSERT INTO workspaces (id, name, slug, created_at, updated_at)
SELECT 
  gen_random_uuid()::text,
  COALESCE(u.name || '''s Workspace', 'Workspace'),
  'ws-' || LOWER(REPLACE(COALESCE(u.name, 'user'), ' ', '-')) || '-' || SUBSTRING(u.id FROM 1 FOR 8),
  NOW(),
  NOW()
FROM users u;

-- Add user as Owner of their workspace
INSERT INTO workspace_members (id, workspace_id, user_id, role, created_at)
SELECT 
  gen_random_uuid()::text,
  w.id,
  u.id,
  'owner',
  NOW()
FROM users u
JOIN workspaces w ON w.slug LIKE 'ws-' || LOWER(REPLACE(COALESCE(u.name, 'user'), ' ', '-')) || '-' || SUBSTRING(u.id FROM 1 FOR 8) || '%';

-- ============================================================
-- PHASE 4: Migrate existing resources to default workspaces
-- ============================================================

-- Documents: workspace_id = owner's workspace
UPDATE documents d
SET workspace_id = (
  SELECT wm.workspace_id 
  FROM workspace_members wm 
  WHERE wm.user_id = d.user_id AND wm.role = 'owner'
  LIMIT 1
);

-- Document chunks: workspace_id = document's workspace
UPDATE document_chunks dc
SET workspace_id = (
  SELECT d.workspace_id 
  FROM documents d 
  WHERE d.id = dc.document_id
);

-- Chat sessions: workspace_id = owner's workspace
UPDATE chat_sessions cs
SET workspace_id = (
  SELECT wm.workspace_id 
  FROM workspace_members wm 
  WHERE wm.user_id = cs.user_id AND wm.role = 'owner'
  LIMIT 1
)
WHERE cs.user_id IS NOT NULL;

-- Analytics events: workspace_id = owner's workspace
UPDATE analytics_events ae
SET workspace_id = (
  SELECT wm.workspace_id 
  FROM workspace_members wm 
  WHERE wm.user_id = ae.user_id AND wm.role = 'owner'
  LIMIT 1
)
WHERE ae.user_id IS NOT NULL;

-- MCP servers: workspace_id = owner's workspace
UPDATE mcp_servers ms
SET workspace_id = (
  SELECT wm.workspace_id 
  FROM workspace_members wm 
  WHERE wm.user_id = ms.user_id AND wm.role = 'owner'
  LIMIT 1
);

-- Prompt templates: workspace_id = creator's workspace
UPDATE prompt_templates pt
SET workspace_id = (
  SELECT wm.workspace_id 
  FROM workspace_members wm 
  WHERE wm.user_id = pt.created_by AND wm.role = 'owner'
  LIMIT 1
)
WHERE pt.created_by IS NOT NULL;

-- ============================================================
-- PHASE 5: Handle orphaned rows (no user_id or no matching workspace)
-- ============================================================

-- For chat_sessions with NULL user_id: assign to first workspace
UPDATE chat_sessions cs
SET workspace_id = (SELECT id FROM workspaces ORDER BY created_at LIMIT 1)
WHERE cs.workspace_id IS NULL;

-- For analytics_events with NULL user_id: assign to first workspace
UPDATE analytics_events ae
SET workspace_id = (SELECT id FROM workspaces ORDER BY created_at LIMIT 1)
WHERE ae.workspace_id IS NULL;

-- For prompt_templates with NULL created_by: assign to first workspace
UPDATE prompt_templates pt
SET workspace_id = (SELECT id FROM workspaces ORDER BY created_at LIMIT 1)
WHERE pt.workspace_id IS NULL;

-- ============================================================
-- PHASE 6: Make workspace_id NOT NULL
-- ============================================================

ALTER TABLE documents ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE document_chunks ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE chat_sessions ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE analytics_events ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE mcp_servers ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE prompt_templates ALTER COLUMN workspace_id SET NOT NULL;

-- ============================================================
-- PHASE 7: Add foreign key constraints
-- ============================================================

ALTER TABLE documents
  ADD CONSTRAINT documents_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE document_chunks
  ADD CONSTRAINT document_chunks_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE chat_sessions
  ADD CONSTRAINT chat_sessions_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE analytics_events
  ADD CONSTRAINT analytics_events_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE mcp_servers
  ADD CONSTRAINT mcp_servers_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE prompt_templates
  ADD CONSTRAINT prompt_templates_workspace_id_fkey
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- ============================================================
-- PHASE 8: Create indexes for workspace_id
-- ============================================================

CREATE INDEX documents_workspace_id_idx ON documents(workspace_id);
CREATE INDEX document_chunks_workspace_id_idx ON document_chunks(workspace_id);
CREATE INDEX chat_sessions_workspace_id_idx ON chat_sessions(workspace_id);
CREATE INDEX analytics_events_workspace_id_idx ON analytics_events(workspace_id);
CREATE INDEX mcp_servers_workspace_id_idx ON mcp_servers(workspace_id);
CREATE INDEX prompt_templates_workspace_id_idx ON prompt_templates(workspace_id);

-- ============================================================
-- PHASE 9: Enable RLS on new tables
-- ============================================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces FORCE ROW LEVEL SECURITY;
ALTER TABLE workspace_members FORCE ROW LEVEL SECURITY;

-- Workspace: users can see workspaces they are members of
CREATE POLICY workspaces_member_isolation ON workspaces
  FOR ALL
  USING (id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = current_setting('app.current_user_id')
  ));

-- Workspace members: users can see members of their workspaces
CREATE POLICY workspace_members_isolation ON workspace_members
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM workspace_members 
    WHERE user_id = current_setting('app.current_user_id')
  ));

-- ============================================================
-- PHASE 10: Update existing RLS policies to workspace_id
-- ============================================================

-- Documents: filter by workspace_id
DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- Document chunks: filter by workspace_id
DROP POLICY IF EXISTS tenant_isolation ON document_chunks;
CREATE POLICY tenant_isolation ON document_chunks
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- Chat sessions: filter by workspace_id
DROP POLICY IF EXISTS chat_sessions_tenant_isolation ON chat_sessions;
CREATE POLICY chat_sessions_tenant_isolation ON chat_sessions
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- Chat messages: filter via session's workspace (defense-in-depth)
DROP POLICY IF EXISTS chat_messages_tenant_isolation ON chat_messages;
CREATE POLICY chat_messages_tenant_isolation ON chat_messages
  FOR ALL
  USING (session_id IN (
    SELECT id FROM chat_sessions 
    WHERE workspace_id = current_setting('app.current_workspace_id')
  ));

-- Analytics events: filter by workspace_id
DROP POLICY IF EXISTS analytics_events_tenant_isolation ON analytics_events;
CREATE POLICY analytics_events_tenant_isolation ON analytics_events
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- MCP servers: filter by workspace_id
DROP POLICY IF EXISTS mcp_servers_tenant_isolation ON mcp_servers;
CREATE POLICY mcp_servers_tenant_isolation ON mcp_servers
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- Prompt templates: filter by workspace_id
DROP POLICY IF EXISTS prompt_templates_tenant_isolation ON prompt_templates;
CREATE POLICY prompt_templates_tenant_isolation ON prompt_templates
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id'))
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id'));

-- Prompt versions: filter via template's workspace (defense-in-depth)
DROP POLICY IF EXISTS prompt_versions_tenant_isolation ON prompt_versions;
CREATE POLICY prompt_versions_tenant_isolation ON prompt_versions
  FOR ALL
  USING (prompt_id IN (
    SELECT id FROM prompt_templates 
    WHERE workspace_id = current_setting('app.current_workspace_id')
  ));

-- ============================================================
-- PHASE 11: Verify migration
-- ============================================================

DO $$
DECLARE
  total_users INT;
  total_workspaces INT;
  total_members INT;
  orphans INT;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO total_workspaces FROM workspaces;
  SELECT COUNT(*) INTO total_members FROM workspace_members;
  
  -- Check for orphaned resources (no workspace_id)
  SELECT COUNT(*) INTO orphans FROM documents WHERE workspace_id IS NULL;
  orphans := orphans + (SELECT COUNT(*) FROM document_chunks WHERE workspace_id IS NULL);
  orphans := orphans + (SELECT COUNT(*) FROM chat_sessions WHERE workspace_id IS NULL);
  orphans := orphans + (SELECT COUNT(*) FROM analytics_events WHERE workspace_id IS NULL);
  orphans := orphans + (SELECT COUNT(*) FROM mcp_servers WHERE workspace_id IS NULL);
  orphans := orphans + (SELECT COUNT(*) FROM prompt_templates WHERE workspace_id IS NULL);
  
  RAISE NOTICE 'Migration summary:';
  RAISE NOTICE '  Users: %, Workspaces: %, Members: %', total_users, total_workspaces, total_members;
  RAISE NOTICE '  Orphaned resources: %', orphans;
  
  IF orphans > 0 THEN
    RAISE EXCEPTION 'Migration incomplete: % orphaned resources', orphans;
  END IF;
  
  RAISE NOTICE '✅ Workspace migration complete — no orphans';
END $$;
