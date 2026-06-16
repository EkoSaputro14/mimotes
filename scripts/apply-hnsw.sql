\set AUTOCOMMIT on
SET maintenance_work_mem = '32MB';
CREATE INDEX CONCURRENTLY IF NOT EXISTS document_chunks_embedding_hnsw
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
