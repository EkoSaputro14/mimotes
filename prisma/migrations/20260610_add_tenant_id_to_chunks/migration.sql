-- Migration: Add tenant_id to document_chunks
-- Denormalizes userId from parent document into each chunk
-- for direct RLS enforcement and O(1) vector search without JOIN.

-- 1. Add nullable column (TEXT to match existing ID types in DB)
ALTER TABLE document_chunks ADD COLUMN tenant_id TEXT;

-- 2. Backfill from parent documents
UPDATE document_chunks dc
SET tenant_id = d.user_id
FROM documents d
WHERE dc.document_id = d.id;

-- 3. Make NOT NULL after backfill
ALTER TABLE document_chunks ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Add foreign key constraint
ALTER TABLE document_chunks
  ADD CONSTRAINT document_chunks_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES users(id) ON DELETE CASCADE;

-- 5. Create index for RLS policy lookups
CREATE INDEX document_chunks_tenant_id_idx ON document_chunks(tenant_id);

-- 6. Verify backfill (should return 0)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM document_chunks WHERE tenant_id IS NULL) THEN
    RAISE EXCEPTION 'Backfill incomplete: some chunks have NULL tenant_id';
  END IF;
  RAISE NOTICE 'Backfill verified: all chunks have tenant_id';
END $$;

-- 7. Update RLS policy for document_chunks (direct tenant_id match, no JOIN needed)
DROP POLICY IF EXISTS tenant_isolation ON document_chunks;

CREATE POLICY tenant_isolation ON document_chunks
  USING (tenant_id = current_setting('app.current_user_id'))
  WITH CHECK (tenant_id = current_setting('app.current_user_id'));

-- 8. Force RLS for table owner (superuser bypass)
ALTER TABLE document_chunks FORCE ROW LEVEL SECURITY;
