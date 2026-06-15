# Mimotes — AI Chatbot RAG Architecture Plan

## Overview

**Mimotes** adalah aplikasi web chatbot AI berbasis RAG (Retrieval-Augmented Generation) yang memungkinkan user mengupload data pengetahuan dalam berbagai format, yang kemudian diproses dan dijadikan referensi oleh AI saat menjawab pertanyaan.

---

## Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 14+ (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL 16 + pgvector extension |
| ORM | Prisma |
| Autentikasi | NextAuth.js (Credentials + optional OAuth) |
| AI/LLM | OpenAI-compatible API (OpenAI, LM Studio, Ollama, dll.) |
| Streaming | Vercel AI SDK (`ai` package) |
| Embedding | OpenAI-compatible embedding API |
| File Parsing | pdf-parse, mammoth (DOCX), csv-parse, cheerio (URL) |
| Vector Store | pgvector (via Prisma raw query) |
| Rate Limiting | upstash/ratelimit (Redis-backed) atau in-memory sliding window |
| State Management | React Context / Zustand |

---

## Multi AI Provider

Aplikasi mendukung multiple AI provider melalui OpenAI-compatible API format:

| Provider | Base URL | Contoh Model |
|----------|----------|--------------|
| OpenAI | `https://api.openai.com/v1` | gpt-4o, gpt-4o-mini |
| LM Studio | `http://localhost:1234/v1` | Model lokal sesuai instalasi |
| Ollama | `http://localhost:11434/v1` | llama3, mistral, dll. |
| OpenRouter | `https://openrouter.ai/api/v1` | Berbagai model cloud |
| Custom | Sesuai konfigurasi | Model apapun yang OpenAI-compatible |

**Konfigurasi via Environment Variables:**
```env
# Provider Selection
AI_PROVIDER=openai  # openai | lmstudio | ollama | openrouter | custom

# OpenAI Config
OPENAI_API_KEY=sk-your-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# LM Studio Config
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_MODEL=your-local-model

# Ollama Config
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3
```

**Catatan Penting untuk LM Studio / Model Lokal:**
- Model lokal mungkin tidak mendukung embedding — perlu fallback ke OpenAI untuk embedding atau gunakan model embedding terpisah
- Kualitas response tergantung pada model yang digunakan
- Streaming tetap didukung karena menggunakan OpenAI-compatible format

---

## Arsitektur Sistem

```mermaid
graph TB
    subgraph Public - Tanpa Login
        D[Chat Interface]
        D2[Landing Page]
    end

    subgraph Admin - Perlu Login
        A[Halaman Login/Register]
        B[Dashboard Dokumen]
        C[Halaman Upload]
        S[AI Provider Settings]
    end

    subgraph Backend - Next.js API Routes
        E[Auth API - NextAuth]
        F[Document Upload API - Protected]
        G[Document Processing Pipeline]
        H[Chat API - RAG Pipeline - Public]
        P[AI Provider Abstraction Layer]
    end

    subgraph Database - PostgreSQL
        I[(Users Table)]
        J[(Documents Table)]
        K[(Document Chunks + pgvector)]
        L[(Chat History)]
    end

    subgraph AI Providers
        M1[OpenAI API]
        M2[LM Studio]
        M3[Ollama]
        M4[Other OpenAI-compatible]
    end

    A --> E
    B --> F
    C --> F
    D --> H
    D2 --> D
    S --> P

    E --> I
    F --> G
    G --> P
    G --> J
    G --> K
    H --> K
    H --> P
    H --> L

    P --> M1
    P --> M2
    P --> M3
    P --> M4
```

**Catatan Akses:**
- **Public** (tanpa login): Chat interface dan landing page bisa diakses siapa saja
- **Admin** (perlu login): Upload, edit, dan hapus dokumen hanya untuk user terotentikasi
- **AI Provider**: Dikonfigurasi via environment variable oleh admin

---

## Alur Kerja RAG

```mermaid
flowchart LR
    subgraph Upload Flow
        U1[User Upload File] --> U2[Parse File Content]
        U2 --> U3[Chunk Text - 500 tokens]
        U3 --> U4[Generate Embedding - OpenAI]
        U4 --> U5[Store in pgvector]
    end

    subgraph Chat Flow
        C1[User Kirim Pertanyaan] --> C2[Generate Query Embedding]
        C2 --> C3[Vector Similarity Search - Top 5]
        C3 --> C4[Retrieve Relevant Chunks]
        C4 --> C5[Build Context + System Prompt]
        C5 --> C6[Stream ke OpenAI GPT via Vercel AI SDK]
        C6 --> C7[Stream Token ke Frontend Realtime]
        C7 --> C8[Simpan Pesan + Sources ke DB]
    end
```

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Documents Table
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,  -- pdf, docx, txt, csv, url
    file_url TEXT,                    -- path file atau URL asli
    status VARCHAR(50) DEFAULT 'processing',  -- processing, ready, error
    chunk_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Document Chunks Table (pgvector)
```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding vector(1536),  -- dimensi untuk text-embedding-3-small
    chunk_index INTEGER NOT NULL,
    metadata JSONB,          -- halaman, section, dll.
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops);
```

### Chat History Table
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- nullable untuk anonymous chat
    title VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- user, assistant
    content TEXT NOT NULL,
    sources JSONB,              -- referensi dokumen yang digunakan
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Struktur Direktori Proyek

```
mimotes/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (admin)/                        # Protected - perlu login
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard utama
│   │   └── documents/
│   │       ├── page.tsx                # List dokumen
│   │       └── upload/page.tsx         # Upload dokumen
│   ├── chat/                           # Public - tanpa login
│   │   ├── page.tsx                    # Chat baru
│   │   └── [sessionId]/page.tsx        # Chat berlanjut
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── documents/
│   │   │   ├── route.ts                # GET list, POST upload
│   │   │   └── [id]/route.ts           # GET detail, DELETE
│   │   ├── chat/
│   │   │   ├── route.ts                # POST kirim pesan
│   │   │   └── sessions/route.ts       # GET list session
│   │   └── upload/route.ts             # Upload file handler
│   ├── layout.tsx
│   └── page.tsx                        # Landing page
├── components/
│   ├── ui/                             # shadcn/ui components
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── MessageBubble.tsx
│   │   └── SourceCard.tsx
│   ├── documents/
│   │   ├── DocumentList.tsx
│   │   ├── UploadForm.tsx
│   │   └── DocumentCard.tsx
│   └── auth/
│       ├── LoginForm.tsx
│       └── RegisterForm.tsx
├── lib/
│   ├── prisma.ts                       # Prisma client
│   ├── auth.ts                         # NextAuth config
│   ├── ai-provider.ts                  # Multi AI provider abstraction layer
│   ├── streaming.ts                    # Vercel AI SDK streaming helpers
│   ├── ratelimit.ts                    # Rate limiting config - upstash/ratelimit
│   ├── rag/
│   │   ├── parser.ts                   # File parser (PDF, DOCX, etc.)
│   │   ├── chunker.ts                  # Text chunking logic
│   │   ├── embedder.ts                 # Embedding generation
│   │   ├── vectorstore.ts              # pgvector operations
│   │   └── chain.ts                    # RAG chain logic
│   └── utils.ts
├── prisma/
│   └── schema.prisma                   # Database schema
├── public/
│   └── uploads/                        # Uploaded files storage
├── .env.local                          # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mimotes

# NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# AI Provider (pilih salah satu)
AI_PROVIDER=openai  # openai | lmstudio | ollama | openrouter | custom

# OpenAI Config
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# LM Studio Config (gunakan jika AI_PROVIDER=lmstudio)
LMSTUDIO_BASE_URL=http://localhost:1234/v1
LMSTUDIO_MODEL=your-local-model-name

# Ollama Config (gunakan jika AI_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434/v1
OLLAMA_MODEL=llama3

# Upstash Redis (untuk rate limiting)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# App
MAX_FILE_SIZE=10485760  # 10MB
CHUNK_SIZE=500
CHUNK_OVERLAP=50
TOP_K_RESULTS=5
```

---

## Fitur Utama

### 1. Autentikasi User (Admin Only)
- Register dengan email + password
- Login dengan credentials
- Protected routes hanya untuk dashboard admin dan manajemen dokumen
- Chat interface bersifat public, tidak perlu login

### 2. Rate Limiting untuk Chat Public
- Batasi jumlah request chat per IP address
- Rekomendasi: 20 pesan per menit per IP
- Menggunakan library `upstash/ratelimit` dengan Upstash Redis (gratis tier tersedia)
- Alternatif: in-memory sliding window counter jika tidak ingin setup Redis
- Response `429 Too Many Requests` jika melebihi batas
- Tampilkan pesan error yang user-friendly di frontend

### 3. Upload & Manajemen Dokumen
- Upload PDF, DOCX, TXT, CSV
- Scrape URL website
- Status proses: processing → ready / error
- List, detail, dan hapus dokumen

### 4. Pipeline Pemrosesan Dokumen
- **Parsing**: Ekstrak teks dari berbagai format file
- **Chunking**: Pecah teks menjadi potongan ~500 token dengan overlap
- **Embedding**: Generate vector embedding via OpenAI
- **Storage**: Simpan embedding di PostgreSQL pgvector

### 5. Chat RAG dengan Streaming Response
- Input pertanyaan user
- Generate embedding query
- Cari 5 chunk paling relevan (cosine similarity)
- Bangun context dari chunk yang ditemukan
- Kirim ke OpenAI dengan system prompt + context
- **Streaming**: Response di-stream token-by-token ke frontend menggunakan Vercel AI SDK
- User melihat jawaban muncul secara realtime (seperti mengetik)
- Setelah selesai, simpan pesan lengkap + sumber referensi ke database

### Detail Streaming Response

**Backend (API Route `/api/chat`):**
- Menggunakan `openai.streamText()` dari Vercel AI SDK
- Menggunakan `StreamingTextResponse` untuk mengirim stream ke client
- System prompt berisi context dari hasil vector search
- Metadata sumber dikirim sebagai bagian stream menggunakan `appendMessageAnnotation`

**Frontend (Chat Component):**
- Menggunakan `useChat()` hook dari Vercel AI SDK
- Otomatis menangani streaming, loading state, dan error
- Token muncul satu per satu di UI
- Setelah stream selesai, tampilkan card sumber referensi

**Alur Streaming:**
1. Frontend kirim POST ke `/api/chat` dengan pesan user
2. Backend generate embedding query → vector search → bangun context
3. Backend panggil OpenAI dengan `streamText()` → dapat stream
4. Backend kirim stream balik ke frontend via `StreamingTextResponse`
5. Frontend `useChat()` hook menerima token satu per satu
6. Token ditampilkan real-time di chat window
7. Setelah stream selesai, backend simpan pesan + sources ke DB

### 6. Riwayat Chat
- Simpan session chat
- Riwayat percakapan per session
- Navigasi antar session

---

## Langkah Implementasi

| # | Task | Detail |
|---|------|--------|
| 1 | Setup proyek Next.js | Inisialisasi dengan TypeScript, Tailwind, shadcn/ui |
| 2 | Setup PostgreSQL + Prisma | Install pgvector, buat schema, jalankan migrate |
| 3 | Implementasi autentikasi | NextAuth.js dengan credentials provider - admin only |
| 4 | AI Provider abstraction layer | Multi provider support: OpenAI, LM Studio, Ollama |
| 5 | API upload dokumen | Handle upload file dan URL scraping |
| 6 | Pipeline parsing | Parser untuk PDF, DOCX, TXT, CSV, URL |
| 7 | Pipeline chunking & embedding | Chunk text dan generate embedding via AI provider |
| 8 | Halaman manajemen dokumen | UI upload, list, dan hapus dokumen |
| 9 | RAG pipeline | Vector search + LLM response generation via AI provider |
| 10 | Rate limiting | Implementasi upstash/ratelimit untuk chat public |
| 11 | Antarmuka chat | Chat window dengan streaming response dan sumber |
| 12 | Riwayat chat | Session management dan navigasi |
| 13 | Testing | Test semua fitur secara manual dan otomatis |
| 14 | Dokumentasi | README dan panduan penggunaan |

---

## Catatan Teknis

- **Streaming Response**: Menggunakan Vercel AI SDK (`ai` package) — fitur inti, bukan opsional
- **Error Handling**: Setiap pipeline step perlu error handling yang robust
- **Rate Limiting Chat Public**: Menggunakan upstash/ratelimit — 20 req/menit per IP
- **Rate Limiting OpenAI**: Pertimbangkan rate limiting untuk API OpenAI calls
- **File Size Limit**: Maksimal 10MB per file upload
- **Token Budget**: Pastikan total context tidak melebihi batas token model yang digunakan
- **Abort Controller**: Gunakan AbortController untuk membatalkan streaming jika user mengirim pesan baru
- **Source Citations**: Sumber referensi ditampilkan setelah streaming selesai, bukan saat streaming berlangsung
