-- AlterTable: Add multimodal columns to document_chunks
ALTER TABLE document_chunks ADD COLUMN chunk_type VARCHAR(50) DEFAULT 'text';
ALTER TABLE document_chunks ADD COLUMN ocr_text TEXT;
ALTER TABLE document_chunks ADD COLUMN caption TEXT;
ALTER TABLE document_chunks ADD COLUMN image_summary TEXT;
ALTER TABLE document_chunks ADD COLUMN image_url TEXT;

-- CreateIndex: Index on chunk_type for filtering image chunks
CREATE INDEX document_chunks_chunk_type_idx ON document_chunks(chunk_type);
