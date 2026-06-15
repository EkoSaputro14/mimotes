-- ============================================
-- RLS Hardening: Align policies with workspace_id
-- Date: 2026-06-07
-- Purpose: Replace user_id-based RLS with workspace_id-based RLS
-- ============================================

-- ============================================
-- 1. Drop old user_id-based policies
-- ============================================

DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
DROP POLICY IF EXISTS document_chunks_tenant_isolation ON document_chunks;
DROP POLICY IF EXISTS chat_sessions_tenant_isolation ON chat_sessions;
DROP POLICY IF EXISTS chat_messages_tenant_isolation ON chat_messages;
DROP POLICY IF EXISTS analytics_events_tenant_isolation ON analytics_events;
DROP POLICY IF EXISTS prompt_templates_tenant_isolation ON prompt_templates;
DROP POLICY IF EXISTS prompt_versions_tenant_isolation ON prompt_versions;
DROP POLICY IF EXISTS mcp_servers_tenant_isolation ON mcp_servers;

-- ============================================
-- 2. Create workspace_id-based policies
-- ============================================
-- Uses app.current_workspace_id set by setWorkspaceContext()

-- documents: workspace-scoped
CREATE POLICY documents_workspace_isolation ON documents
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- document_chunks: direct workspace_id filter (no subquery needed)
CREATE POLICY document_chunks_workspace_isolation ON document_chunks
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- chat_sessions: workspace-scoped
CREATE POLICY chat_sessions_workspace_isolation ON chat_sessions
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- chat_messages: via session ownership (no direct workspace_id on messages)
CREATE POLICY chat_messages_workspace_isolation ON chat_messages
  FOR ALL
  USING (session_id IN (
    SELECT id FROM chat_sessions
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ))
  WITH CHECK (session_id IN (
    SELECT id FROM chat_sessions
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ));

-- analytics_events: workspace-scoped (via user's workspace)
CREATE POLICY analytics_events_workspace_isolation ON analytics_events
  FOR ALL
  USING (user_id IN (
    SELECT user_id FROM workspace_members
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ))
  WITH CHECK (user_id IN (
    SELECT user_id FROM workspace_members
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ));

-- prompt_templates: workspace-scoped
CREATE POLICY prompt_templates_workspace_isolation ON prompt_templates
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- prompt_versions: via template ownership
CREATE POLICY prompt_versions_workspace_isolation ON prompt_versions
  FOR ALL
  USING (prompt_id IN (
    SELECT id FROM prompt_templates
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ))
  WITH CHECK (prompt_id IN (
    SELECT id FROM prompt_templates
    WHERE workspace_id = current_setting('app.current_workspace_id', true)::text
  ));

-- mcp_servers: workspace-scoped
CREATE POLICY mcp_servers_workspace_isolation ON mcp_servers
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================
-- 3. Add HNSW vector index for fast similarity search
-- ============================================

CREATE INDEX document_chunks_embedding_hnsw
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ============================================
-- 4. Add composite index for workspace_id + embedding
-- ============================================

CREATE INDEX document_chunks_workspace_embedding_idx
ON document_chunks (workspace_id, embedding);
