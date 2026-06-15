
EXPLAIN ANALYZE SELECT dc.id, 1 - (dc.embedding <=> (SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1)::vector) as similarity
FROM document_chunks dc
WHERE dc.embedding IS NOT NULL
ORDER BY dc.embedding <=> (SELECT embedding FROM document_chunks WHERE embedding IS NOT NULL LIMIT 1)::vector
LIMIT 5;
