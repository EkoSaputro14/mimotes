-- Sprint 9A: Standardize GUC parameters
-- Change all current_setting('app.current_workspace_id') to current_setting('app.current_workspace_id', true)
-- This ensures consistent behavior (returns empty string instead of throwing error)

-- Fix policies that use current_setting WITHOUT the true parameter
-- These tables currently use: current_setting('app.current_workspace_id'::text)
-- Change to: current_setting('app.current_workspace_id', true)::text

-- analytics_events
DROP POLICY IF EXISTS analytics_events_tenant_isolation ON analytics_events;
CREATE POLICY analytics_events_tenant_isolation ON analytics_events
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- chat_sessions
DROP POLICY IF EXISTS chat_sessions_tenant_isolation ON chat_sessions;
CREATE POLICY chat_sessions_tenant_isolation ON chat_sessions
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- document_chunks
DROP POLICY IF EXISTS tenant_isolation ON document_chunks;
CREATE POLICY tenant_isolation ON document_chunks
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- documents
DROP POLICY IF EXISTS documents_tenant_isolation ON documents;
CREATE POLICY documents_tenant_isolation ON documents
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- mcp_servers
DROP POLICY IF EXISTS mcp_servers_tenant_isolation ON mcp_servers;
CREATE POLICY mcp_servers_tenant_isolation ON mcp_servers
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- prompt_templates
DROP POLICY IF EXISTS prompt_templates_tenant_isolation ON prompt_templates;
CREATE POLICY prompt_templates_tenant_isolation ON prompt_templates
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- retrieval_logs
DROP POLICY IF EXISTS retrieval_logs_tenant_isolation ON retrieval_logs;
CREATE POLICY retrieval_logs_tenant_isolation ON retrieval_logs
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- workspace_members (uses user_id subquery - keep as is since it uses app.current_user_id)
-- prompt_versions (uses prompt_id subquery - keep as is)
-- chat_messages (uses session_id subquery - keep as is)
-- workspaces (uses user_id subquery - keep as is)
