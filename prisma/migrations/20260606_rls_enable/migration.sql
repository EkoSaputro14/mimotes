-- ============================================
-- Row Level Security (RLS) Migration
-- Date: 2026-06-06
-- Purpose: Enforce tenant isolation at database level
-- ============================================

-- ============================================
-- 1. Enable RLS on all tenant-scoped tables
-- ============================================

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_servers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. Create tenant isolation policies
-- ============================================

-- documents: Users can only access their own documents
CREATE POLICY documents_tenant_isolation ON documents
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::text)
  WITH CHECK (user_id = current_setting('app.current_user_id')::text);

-- document_chunks: Isolated via document ownership
CREATE POLICY document_chunks_tenant_isolation ON document_chunks
  FOR ALL
  USING (document_id IN (
    SELECT id FROM documents
    WHERE user_id = current_setting('app.current_user_id')::text
  ))
  WITH CHECK (document_id IN (
    SELECT id FROM documents
    WHERE user_id = current_setting('app.current_user_id')::text
  ));

-- chat_sessions: Users can only access their own sessions
CREATE POLICY chat_sessions_tenant_isolation ON chat_sessions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::text)
  WITH CHECK (user_id = current_setting('app.current_user_id')::text);

-- chat_messages: Isolated via session ownership
CREATE POLICY chat_messages_tenant_isolation ON chat_messages
  FOR ALL
  USING (session_id IN (
    SELECT id FROM chat_sessions
    WHERE user_id = current_setting('app.current_user_id')::text
  ))
  WITH CHECK (session_id IN (
    SELECT id FROM chat_sessions
    WHERE user_id = current_setting('app.current_user_id')::text
  ));

-- analytics_events: Users can only access their own events
CREATE POLICY analytics_events_tenant_isolation ON analytics_events
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::text)
  WITH CHECK (user_id = current_setting('app.current_user_id')::text);

-- prompt_templates: Users can only access their own templates
CREATE POLICY prompt_templates_tenant_isolation ON prompt_templates
  FOR ALL
  USING (created_by = current_setting('app.current_user_id')::text)
  WITH CHECK (created_by = current_setting('app.current_user_id')::text);

-- prompt_versions: Isolated via template ownership
CREATE POLICY prompt_versions_tenant_isolation ON prompt_versions
  FOR ALL
  USING (prompt_id IN (
    SELECT id FROM prompt_templates
    WHERE created_by = current_setting('app.current_user_id')::text
  ))
  WITH CHECK (prompt_id IN (
    SELECT id FROM prompt_templates
    WHERE created_by = current_setting('app.current_user_id')::text
  ));

-- mcp_servers: Users can only access their own servers
CREATE POLICY mcp_servers_tenant_isolation ON mcp_servers
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::text)
  WITH CHECK (user_id = current_setting('app.current_user_id')::text);

-- ============================================
-- 3. Admin bypass policy (for migrations, seeds, etc.)
-- The app sets app.current_user_id before every request.
-- If not set (e.g., during migrations), RLS blocks ALL access.
-- Use SET LOCAL in migration scripts to bypass.
-- ============================================

-- Note: The 'users' table does NOT have RLS because it contains
-- the tenant identity itself. User isolation is handled by NextAuth JWT.
