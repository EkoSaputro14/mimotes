-- Sprint 9A: Add RLS to 6 unprotected tables
-- All tables use workspace_id for tenant isolation

-- ============================================================
-- 1. api_keys
-- ============================================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;

CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================================
-- 2. api_usage_logs
-- ============================================================
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY api_usage_logs_tenant_isolation ON api_usage_logs
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================================
-- 3. audit_logs
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================================
-- 4. widgets
-- ============================================================
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets FORCE ROW LEVEL SECURITY;

CREATE POLICY widgets_tenant_isolation ON widgets
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================================
-- 5. widget_conversations
-- ============================================================
ALTER TABLE widget_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_conversations FORCE ROW LEVEL SECURITY;

CREATE POLICY widget_conversations_tenant_isolation ON widget_conversations
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);

-- ============================================================
-- 6. widget_messages
-- ============================================================
ALTER TABLE widget_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_messages FORCE ROW LEVEL SECURITY;

CREATE POLICY widget_messages_tenant_isolation ON widget_messages
  USING (workspace_id = current_setting('app.current_workspace_id', true)::text)
  WITH CHECK (workspace_id = current_setting('app.current_workspace_id', true)::text);
