# MimoNotes n8n Workflows

This directory contains n8n workflow JSON files for migrating MimoNotes AI features to n8n.

## Workflows

### 1. mimotes-chat.json
RAG chat workflow - handles user queries, generates embeddings, searches vector store, and streams AI responses.

**Webhook URL:** `POST /webhook/mimotes-chat`

**Request Body:**
```json
{
  "message": "User question",
  "sessionId": "optional-session-id",
  "mode": "knowledge_base",
  "workspaceId": "workspace-uuid",
  "userId": "user-uuid"
}
```

### 2. mimotes-upload.json
Document processing workflow - parses documents, chunks text, generates embeddings, and stores in pgvector.

**Webhook URL:** `POST /webhook/mimotes-upload`

**Request Body:**
```json
{
  "documentId": "document-uuid",
  "fileUrl": "https://...",
  "fileType": "pdf",
  "workspaceId": "workspace-uuid",
  "userId": "user-uuid"
}
```

### 3. mimotes-search.json
Knowledge search workflow - performs vector similarity search across documents.

**Webhook URL:** `POST /webhook/mimotes-search`

**Request Body:**
```json
{
  "query": "search query",
  "topK": 5,
  "threshold": 0.30,
  "workspaceId": "workspace-uuid",
  "documentId": "optional-document-id"
}
```

### 4. mimotes-ocr.json
Image OCR workflow - extracts text from images using PaddleOCR and generates captions using vision AI.

**Webhook URL:** `POST /webhook/mimotes-ocr`

**Request Body:**
```json
{
  "imageUrl": "https://...",
  "documentId": "document-uuid",
  "workspaceId": "workspace-uuid"
}
```

## Setup Instructions

1. Import workflow JSON files into n8n
2. Configure PostgreSQL credentials in n8n
3. Set environment variables in n8n:
   - `N8N_BASE_URL` - n8n base URL (default: http://localhost:5678)
   - `N8N_API_KEY` - n8n API key

4. Update MimoNotes `.env` file:
```env
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_API_KEY=your-n8n-api-key
```

5. Activate workflows in n8n

## Database Requirements

Make sure PostgreSQL has pgvector extension enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `N8N_WEBHOOK_URL` | n8n webhook base URL | `http://localhost:5678/webhook` |
| `N8N_API_KEY` | n8n API key | - |
| `AI_BASE_URL` | AI provider base URL | `http://localhost:11434` |
| `AI_API_KEY` | AI provider API key | - |
| `AI_MODEL` | Chat model name | `gpt-3.5-turbo` |
| `AI_EMBEDDING_MODEL` | Embedding model name | `text-embedding-3-small` |
