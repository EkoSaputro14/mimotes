# 🤖 Mimotes - AI Chatbot Berbasis Pengetahuan

Mimotes adalah chatbot AI berbasis web yang menggunakan teknologi **RAG (Retrieval-Augmented Generation)** untuk menjawab pertanyaan berdasarkan dokumen yang diupload. Siapa pun dapat mengakses chatbot tanpa login, sementara manajemen dokumen dilindungi autentikasi admin.

## ✨ Fitur

- **Public Chat** - Siapa saja bisa bertanya tanpa perlu login
- **RAG Pipeline** - Jawaban berdasarkan dokumen yang diupload dengan referensi sumber
- **Streaming Response** - Jawaban ditampilkan secara real-time (token-by-token)
- **Multi Format** - Mendukung PDF, DOCX, TXT, CSV, dan URL website
- **Multi AI Provider** - OpenAI, LM Studio, Ollama, OpenRouter, atau API OpenAI-compatible lainnya
- **Rate Limiting** - 20 request/menit per IP untuk chat public
- **Admin Panel** - Kelola dokumen dengan autentikasi yang aman

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | PostgreSQL + pgvector |
| ORM | Prisma 6 |
| AI SDK | Vercel AI SDK + OpenAI |
| Auth | NextAuth.js v5 (beta) |
| Rate Limiting | @upstash/ratelimit (in-memory fallback) |
| Styling | Tailwind CSS v4 |

## 🚀 Quick Start

### Opsi 1: Docker Compose (Recommended)

Cara paling mudah untuk menjalankan Mimotes:

```bash
# 1. Clone repo
git clone <repo-url>
cd mimotes

# 2. Copy dan edit environment file
cp .env.example .env
# Edit .env - minimal isi OPENAI_API_KEY

# 3. Jalankan dengan Docker Compose
docker compose up -d

# 4. Buka http://localhost:3000
```

Docker Compose akan otomatis:
- Menjalankan PostgreSQL dengan pgvector extension
- Menjalankan migrasi database
- Seed admin user default (`admin@mimotes.com` / `admin123`)
- Menjalankan aplikasi Next.js

Perintah berguna:
```bash
docker compose logs -f app    # Lihat log aplikasi
docker compose down            # Stop semua container
docker compose down -v         # Stop dan hapus data
docker compose build --no-cache  # Rebuild tanpa cache
```

### Opsi 2: Manual Setup

#### 1. Clone & Install

```bash
git clone <repo-url>
cd mimotes
npm install
```

#### 2. Setup Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` dengan konfigurasi Anda:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mimotes"

# NextAuth
NEXTAUTH_SECRET="random-secret-string"
NEXTAUTH_URL="http://localhost:3000"

# AI Provider (pilih salah satu)
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-key"
OPENAI_MODEL="gpt-4o-mini"
```

#### 3. Setup Database

Pastikan PostgreSQL sudah terinstall dan pgvector extension sudah tersedia:

```bash
# Buat database
createdb mimotes

# Jalankan migrasi & seed admin user
bash scripts/setup-db.sh
```

Atau manual:

```bash
npx prisma migrate dev --name init
npx tsx scripts/seed-admin.ts
```

#### 4. Jalankan Aplikasi

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## 📁 Struktur Proyek

```
mimotes/
├── app/
│   ├── (admin)/documents/      # Halaman admin (protected)
│   ├── (auth)/login/           # Halaman login
│   ├── (auth)/register/        # Halaman register
│   ├── api/
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── chat/               # Chat API (public, rate-limited)
│   │   ├── documents/          # Document CRUD (protected)
│   │   └── upload/             # File upload (protected)
│   ├── chat/                   # Halaman chat public
│   └── page.tsx                # Landing page
├── components/
│   ├── auth/                   # Login & register forms
│   ├── chat/                   # Chat window, message bubble, source card
│   └── documents/              # Document list & upload form
├── lib/
│   ├── rag/                    # RAG pipeline
│   │   ├── parser.ts           # Document parsers (PDF, DOCX, TXT, CSV, URL)
│   │   ├── chunker.ts          # Text chunking with overlap
│   │   ├── embedder.ts         # Embedding generation
│   │   ├── vectorstore.ts      # pgvector operations
│   │   └── chain.ts            # RAG chain (search + generate)
│   ├── ai-provider.ts          # Multi AI provider abstraction
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client singleton
│   ├── ratelimit.ts            # Rate limiter
│   └── streaming.ts            # Streaming helpers
├── prisma/
│   └── schema.prisma           # Database schema
└── scripts/
    ├── setup-db.sh             # Database setup script
    └── seed-admin.ts           # Admin user seeder
```

## 🔧 Multi AI Provider Configuration

Ubah `AI_PROVIDER` di `.env.local` untuk switch provider:

### Mimo Pro (Default)
```env
AI_PROVIDER="mimo"
MIMO_API_KEY="your-mimo-api-key"
MIMO_BASE_URL="https://token-plan-sgp.xiaomimimo.com/v1"
MIMO_MODEL="mimo-v2.5-pro"
```
> **Note:** Mimo Pro is a reasoning model and does not support embeddings API. Embeddings are generated locally using feature hashing for the RAG pipeline.

### OpenAI
```env
AI_PROVIDER="openai"
OPENAI_API_KEY="sk-your-key"
OPENAI_MODEL="gpt-4o-mini"
OPENAI_EMBEDDING_MODEL="text-embedding-3-small"
```

### LM Studio (Local)
```env
AI_PROVIDER="lmstudio"
LMSTUDIO_BASE_URL="http://localhost:1234/v1"
LMSTUDIO_MODEL="your-model"
```

### Ollama (Local)
```env
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://localhost:11434/v1"
OLLAMA_MODEL="llama3"
```

### OpenRouter
```env
AI_PROVIDER="openrouter"
OPENROUTER_API_KEY="sk-or-your-key"
OPENROUTER_MODEL="anthropic/claude-3-haiku"
```

## 📋 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Public | Kirim pesan chat (rate-limited) |
| GET | `/api/chat/sessions` | Public | List sesi chat |
| POST | `/api/upload` | Admin | Upload dokumen |
| GET | `/api/documents` | Admin | List dokumen |
| GET | `/api/documents/[id]` | Admin | Detail dokumen |
| DELETE | `/api/documents/[id]` | Admin | Hapus dokumen |
| POST | `/api/auth/register` | Public | Registrasi admin |
| POST | `/api/auth/[...nextauth]` | Public | NextAuth endpoints |

## 🗄️ Database Schema

- **users** - Admin users
- **documents** - Uploaded documents metadata
- **document_chunks** - Text chunks with vector embeddings (pgvector)
- **chat_sessions** - Chat conversation sessions
- **chat_messages** - Individual chat messages with sources

## 📝 License

MIT
