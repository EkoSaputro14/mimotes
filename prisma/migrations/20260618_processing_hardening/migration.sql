-- Add error tracking and processing metrics to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS processing_metrics JSONB;
