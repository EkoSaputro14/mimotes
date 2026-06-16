# GROUND_TRUTH_CANDIDATES.md — STEP 5 Ground Truth Builder

> Date: 2026-06-10
> Phase: 3C — Production Corpus Build & Validation
> Status: **CANDIDATE DATASET CREATED**

---

## Important Note

**Current corpus is severely limited** (4 docs, 4 chunks). These 50 queries are CANDIDATE queries based on:
1. Existing OCR content (property auctions, financial report)
2. Expected future content (Mimotes documentation, API docs, billing)
3. Categories needed for production RAG evaluation

**Only queries marked ✅ VERIFIED have ground truth in the current database.**
Queries marked ❌ PENDING require additional documents to be uploaded first.

---

## Category 1: Usage (10 queries)

| # | Query | Category | Source Doc | Expected Answer | Status |
|---|-------|----------|------------|-----------------|--------|
| 1 | "Bagaimana cara upload dokumen ke Mimotes?" | usage | — | Upload via /documents/upload page | ❌ PENDING |
| 2 | "Apa saja format file yang didukung?" | usage | — | PDF, DOC, TXT, CSV, Images | ❌ PENDING |
| 3 | "Bagaimana cara memulai chat dengan AI?" | usage | — | Buka /chat, ketik pertanyaan | ❌ PENDING |
| 4 | "Bagaimana cara melihat riwayat chat?" | usage | — | Sidebar menampilkan semua session | ❌ PENDING |
| 5 | "Bisakah saya upload gambar?" | usage | lelang1.jpg, test_upload.png | Ya, JPG/PNG/WEBP didukung | ✅ VERIFIED |
| 6 | "Bagaimana cara menghapus dokumen?" | usage | — | Klik tombol delete di documents page | ❌ PENDING |
| 7 | "Apa itu Mimotes?" | usage | — | Chatbot AI berbasis pengetahuan | ❌ PENDING |
| 8 | "Bagaimana cara mendaftar akun?" | usage | — | Buka /register, isi email + password | ❌ PENDING |
| 9 | "Bisakah saya mengatur pengaturan AI?" | usage | — | Buka /settings, pilih provider | ❌ PENDING |
| 10 | "Bagaimana cara melihat analytics?" | usage | — | Buka /analytics untuk dashboard | ❌ PENDING |

---

## Category 2: Technical (10 queries)

| # | Query | Category | Source Doc | Expected Answer | Status |
|---|-------|----------|------------|-----------------|--------|
| 11 | "Apa itu RAG dalam konteks Mimotes?" | technical | — | Retrieval-Augmented Generation pipeline | ❌ PENDING |
| 12 | "Bagaimana cara kerja embedding di Mimotes?" | technical | — | Text → vector via AI provider | ❌ PENDING |
| 13 | "Apa itu pgvector?" | technical | — | PostgreSQL extension untuk vector similarity search | ❌ PENDING |
| 14 | "Bagaimana cara mengintegrasikan API Mimotes?" | technical | — | REST API dengan auth token | ❌ PENDING |
| 15 | "Apa itu PaddleOCR?" | technical | — | Engine OCR untuk extract text dari gambar | ✅ VERIFIED |
| 16 | "Apa provider AI yang didukung?" | technical | — | Mimo, OpenAI, Gemini, Ollama, OpenRouter | ❌ PENDING |
| 17 | "Bagaimana hybrid search bekerja?" | technical | — | RRF fusion: 60% vector + 40% BM25 | ❌ PENDING |
| 18 | "Apa itu chunk dalam konteks RAG?" | technical | — | potongan teks dari dokumen untuk embedding | ❌ PENDING |
| 19 | "Bagaimana cara mengatur workspace?" | technical | — | Multi-tenant via workspace isolation | ❌ PENDING |
| 20 | "Apa itu retrieval logging?" | technical | — | Logging setiap search query untuk analytics | ❌ PENDING |

---

## Category 3: Billing (10 queries)

| # | Query | Category | Source Doc | Expected Answer | Status |
|---|-------|----------|------------|-----------------|--------|
| 21 | "Berapa biaya berlangganan Mimotes?" | billing | — | Pricing info dari dokumentasi | ❌ PENDING |
| 22 | "Apakah ada free trial?" | billing | — | Info trial dari pricing page | ❌ PENDING |
| 23 | "Bagaimana cara upgrade plan?" | billing | — | Settings → Billing → Upgrade | ❌ PENDING |
| 24 | "Apa perbedaan plan free dan pro?" | billing | — | Fitur comparison table | ❌ PENDING |
| 25 | "Bagaimana cara cancel subscription?" | billing | — | Settings → Billing → Cancel | ❌ PENDING |
| 26 | "Apakah ada diskon untuk annual plan?" | billing | — | Diskon tahunan dari pricing | ❌ PENDING |
| 27 | "Bagaimana cara invoice?" | billing | — | Auto-generated invoice di billing page | ❌ PENDING |
| 28 | "Metode pembayaran apa yang diterima?" | billing | — | Credit card, bank transfer | ❌ PENDING |
| 29 | "Bagaimana cara mengubah metode pembayaran?" | billing | — | Settings → Billing → Payment Method | ❌ PENDING |
| 30 | "Berapa limit upload per bulan?" | billing | — | Quota info dari plan details | ❌ PENDING |

---

## Category 4: Widget & API (10 queries)

| # | Query | Category | Source Doc | Expected Answer | Status |
|---|-------|----------|------------|-----------------|--------|
| 31 | "Bagaimana cara embed chat widget?" | widget | — | Copy embed code ke website | ❌ PENDING |
| 32 | "Apa itu chat widget Mimotes?" | widget | — | Widget yang bisa di-embed di website | ❌ PENDING |
| 33 | "Bagaimana cara customisasi widget?" | widget | — | Ubah warna, posisi, greeting | ❌ PENDING |
| 34 | "Bagaimana cara authenticate API request?" | api | — | Header Authorization: Bearer token | ❌ PENDING |
| 35 | "Apa endpoint untuk upload dokumen?" | api | — | POST /api/upload | ❌ PENDING |
| 36 | "Apa endpoint untuk chat?" | api | — | POST /api/chat | ❌ PENDING |
| 37 | "Bagaimana cara retrieve chat history?" | api | — | GET /api/sessions/:id/messages | ❌ PENDING |
| 38 | "Bagaimana cara search knowledge base?" | api | — | POST /api/knowledge/search | ❌ PENDING |
| 39 | "Apa rate limit untuk API?" | api | — | 10 request/menit per IP | ❌ PENDING |
| 40 | "Bagaimana cara handle error response?" | api | — | Check status code + error message | ❌ PENDING |

---

## Category 5: RAG & Analytics (10 queries)

| # | Query | Category | Source Doc | Expected Answer | Status |
|---|-------|----------|------------|-----------------|--------|
| 41 | "Berapa jumlah dokumen di knowledge base?" | rag | — | Query documents count | ❌ PENDING |
| 42 | "Bagaimana cara meningkatkan kualitas jawaban?" | rag | — | Upload dokumen berkualitas, gunakan chunk yang tepat | ❌ PENDING |
| 43 | "Apa itu precision dan recall dalam RAG?" | rag | — | Precision: relevansi hasil, Recall: kelengkapan | ❌ PENDING |
| 44 | "Bagaimana cara membaca analytics dashboard?" | analytics | — | Lihat /analytics untuk metrics | ❌ PENDING |
| 45 | "Apa itu cost analytics?" | analytics | — | Tracking biaya AI provider per query | ❌ PENDING |
| 46 | "Berapa rata-rata response time?" | analytics | — | Dari chat analytics dashboard | ❌ PENDING |
| 47 | "Apa top questions yang ditanyakan user?" | analytics | — | Dari chat analytics top questions | ❌ PENDING |
| 48 | "Bagaimana cara export analytics data?" | analytics | — | Klik export CSV di analytics page | ❌ PENDING |
| 49 | "Apa itu source rate dalam analytics?" | analytics | — | Persentase jawaban yang menggunakan sumber | ❌ PENDING |
| 50 | "Bagaimana cara melihat document reference count?" | analytics | — | Dari chat analytics top documents | ❌ PENDING |

---

## Summary

| Category | Total | Verified | Pending |
|----------|-------|----------|---------|
| Usage | 10 | 1 | 9 |
| Technical | 10 | 1 | 9 |
| Billing | 10 | 0 | 10 |
| Widget & API | 10 | 0 | 10 |
| RAG & Analytics | 10 | 0 | 10 |
| **TOTAL** | **50** | **2** | **48** |

**Ground Truth Coverage: 4%** (2/50 verified)

---

## Next Steps

To achieve **>80% coverage (40+ queries)**, the following documents must be uploaded:

1. **Mimotes documentation** (PDF/DOCX) — covers usage, technical, widget, API
2. **Pricing page content** — covers billing queries
3. **Analytics documentation** — covers analytics queries
4. **RAG concepts documentation** — covers RAG queries
5. **API reference documentation** — covers API endpoint queries

---

*Generated by Hermes Agent — Phase 3C STEP 5*
