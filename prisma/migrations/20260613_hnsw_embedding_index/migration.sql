-- HNSW Index Migration for document_chunks embedding column
-- This creates an HNSW index for faster approximate nearest neighbor search
-- using cosine distance similarity.
--
-- HNSW parameters:
--   m = 16: number of bi-directional links per node (good balance of speed/accuracy)
--   ef_construction = 64: size of dynamic candidate list during construction
--
-- Note: CONCURRENTLY avoids blocking writes during index creation.
-- The index is only created if it doesn't already exist.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'document_chunks_embedding_hnsw'
  ) THEN
    EXECUTE 'CREATE INDEX CONCURRENTLY document_chunks_embedding_hnsw
             ON document_chunks
             USING hnsw (embedding vector_cosine_ops)
             WITH (m = 16, ef_construction = 64)';
  END IF;
END
$$;
