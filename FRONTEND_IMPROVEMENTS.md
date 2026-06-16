# FRONTEND_IMPROVEMENTS.md — Analisis & Rencana Perbaikan UI/UX

> Analisis komprehensif kualitas frontend Mimotes, dibandingkan dengan ChatGPT, Claude, dan Vercel. Diurutkan berdasarkan dampak (impact) dari tertinggi ke terendah.

---

## Executive Summary

Mimotes saat ini berfungsi dengan baik secara teknis, namun UI/UX masih di level **"functional prototype"**. Dibandingkan ChatGPT, Claude, dan Vercel, ada gap signifikan di: chat experience, mobile responsiveness, accessibility, dan visual polish. Dokumen ini mengidentifikasi **42 perbaikan** dalam 5 kategori, diurutkan berdasarkan dampak.

### Skor Saat Ini vs Target

| Aspek | Saat Ini | Target | ChatGPT | Claude | Vercel |
|-------|---------|--------|---------|--------|--------|
| **UI Quality** | 4/10 | 8/10 | 9/10 | 9/10 | 10/10 |
| **UX Quality** | 5/10 | 8/10 | 9/10 | 9/10 | 9/10 |
| **Mobile** | 3/10 | 7/10 | 8/10 | 8/10 | 9/10 |
| **Accessibility** | 2/10 | 7/10 | 7/10 | 8/10 | 9/10 |
| **Chat Experience** | 4/10 | 8/10 | 10/10 | 9/10 | N/A |

---

## 1. Chat Experience (Dampak: TERTINGGI)

Chat adalah fitur inti Mimotes. Perbandingan langsung dengan ChatGPT dan Claude.

### 1.1 ❌ Tidak Ada Markdown Rendering

**Saat ini**: [`message-bubble.tsx`](components/chat/message-bubble.tsx:40) menampilkan teks mentah dengan `whitespace-pre-wrap`.

```tsx
// Current: plain text only
<div className="whitespace-pre-wrap break-words">
  {message.content}
</div>
```

**ChatGPT/Claude**: Render markdown lengkap — headings, bold, italic, code blocks dengan syntax highlighting, tables, lists, links.

**Perbaikan**: Tambahkan `react-markdown` + `remark-gfm` + `rehype-highlight`.

```tsx
// Target
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

<ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
```

**Dampak**: 🔴 KRITIS — Tanpa markdown, jawaban AI yang berisi kode, list, atau formatting akan sulit dibaca.

**File**: [`components/chat/message-bubble.tsx`](components/chat/message-bubble.tsx)

---

### 1.2 ❌ Tidak Ada Copy Button pada Pesan

**Saat ini**: User harus manual select-all + copy.

**ChatGPT/Claude**: Tombol copy di setiap message bubble (ikon clipboard).

**Perbaikan**: Tambahkan tombol copy yang muncul on-hover di setiap message.

```tsx
<button
  onClick={() => navigator.clipboard.writeText(message.content)}
  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-200 transition-all"
  aria-label="Salin pesan"
>
  <ClipboardIcon className="w-4 h-4 text-gray-500" />
</button>
```

**Dampak**: 🔴 TINGGI — Sering digunakan, UX standar yang user harapkan.

---

### 1.3 ❌ Tidak Ada Session History Sidebar

**Saat ini**: [`chat-window.tsx`](components/chat/chat-window.tsx:143) hanya punya tombol "Chat Baru". Tidak ada cara kembali ke percakapan sebelumnya.

**ChatGPT/Claude**: Sidebar kiri dengan daftar semua percakapan, bisa dicari, bisa di-rename, bisa dihapus.

**Perbaikan**: Tambahkan collapsible sidebar dengan:
- List chat sessions dari `GET /api/chat/sessions`
- Click untuk load session
- Delete button
- Search/filter sessions
- Rename session title

**Dampak**: 🔴 KRITIS — Tanpa ini, user kehilangan semua riwayat chat saat refresh halaman.

---

### 1.4 ❌ Streaming Tidak Ada Visual Indicator

**Saat ini**: Saat AI sedang mengetik, tidak ada cursor berkedip atau animasi typing.

**ChatGPT/Claude**: Cursor berkedip di akhir teks saat streaming. Setelah selesai, cursor hilang.

**Perbaikan**: Tambahkan blinking cursor CSS saat `isLoading`:

```css
.streaming-cursor::after {
  content: "▊";
  animation: blink 1s step-end infinite;
}
```

**Dampak**: 🟡 SEDANG — User tidak tahu apakah AI masih mengetik atau sudah selesai.

---

### 1.5 ❌ Tidak Ada Retry Button

**Saat ini**: Jika request gagal, user harus mengetik ulang pertanyaan.

**ChatGPT/Claude**: Tombol retry (ikon refresh) di message yang gagal.

**Perbaikan**: Simpan original user message, tampilkan tombol retry di error message.

**Dampak**: 🟡 SEDANG — Mengurangi frustration saat error.

---

### 1.6 ❌ Input Tidak Auto-Resize

**Saat ini**: [`chat-window.tsx`](components/chat/chat-window.tsx:227) menggunakan `<input type="text">` — single line, tidak bisa multi-line.

**ChatGPT/Claude**: `<textarea>` yang otomatis membesar saat user mengetik pesan panjang (hingga batas max).

**Perbaikan**: Ganti `<input>` dengan auto-resizing `<textarea>`:

```tsx
<textarea
  value={input}
  onChange={(e) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
  }}
  onKeyDown={(e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }}
  rows={1}
/>
```

**Dampak**: 🔴 TINGGI — Pertanyaan sering multi-line. Shift+Enter untuk newline, Enter untuk submit.

---

### 1.7 ❌ Tidak Ada Suggested Questions

**Saat ini**: Empty state hanya menampilkan "Selamat datang" ([`chat-window.tsx`](components/chat/chat-window.tsx:169)).

**ChatGPT/Claude**: Menampilkan suggested prompts/questions saat chat kosong.

**Perbaikan**: Tampilkan 3-4 suggested questions berdasarkan dokumen yang tersedia:

```tsx
const suggestions = [
  "Apa ringkasan dokumen yang tersedia?",
  "Jelaskan poin-poin utama dalam dokumen",
  "Apa kesimpulan dari dokumen ini?",
];
```

**Dampak**: 🟡 SEDANG — Membantu user memulai percakapan.

---

### 1.8 ❌ Sources Tidak Inline dengan Jawaban

**Saat ini**: Sources ditampilkan di bagian bawah chat ([`chat-window.tsx`](components/chat/chat-window.tsx:211)), terpisah dari jawaban.

**ChatGPT/Claude**: Citations inline di dalam teks jawaban (superscript numbers yang bisa diklik).

**Perbaikan**: 
1. Render sources inline sebagai clickable superscript `[1]` `[2]`
2. Tooltip/popover saat hover menunjukkan snippet
3. Tetap tampilkan summary cards di bawah

**Dampak**: 🟡 SEDANG — Memudahkan user melihat sumber tanpa scroll.

---

## 2. UI Quality (Dampak: TINGGI)

### 2.1 ❌ Tidak Ada Dark Mode

**Saat ini**: Semua halaman menggunakan warna hardcoded (`bg-white`, `text-gray-900`, `bg-gray-50`).

**Vercel/Claude**: Dark mode sebagai default atau toggle.

**Perbaikan**: Implementasi dark mode dengan Tailwind `dark:` prefix + `next-themes`:

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

<ThemeProvider attribute="class" defaultTheme="light">
  {children}
</ThemeProvider>
```

**Dampak**: 🔴 TINGGI — Standar industri modern, banyak user lebih suka dark mode.

---

### 2.2 ❌ Tidak Ada Loading Skeletons

**Saat ini**: Loading states menggunakan spinner ([`document-list.tsx`](components/documents/document-list.tsx:57), [`ai-settings-form.tsx`](components/settings/ai-settings-form.tsx:211)).

**Vercel**: Skeleton screens yang menyerupai layout konten.

**Perbaikan**: Ganti spinner dengan skeleton placeholders:

```tsx
function DocumentSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Dampak**: 🟡 SEDANG — Perceived performance lebih baik.

---

### 2.3 ❌ Tidak Ada Toast Notifications

**Saat ini**: Error/success messages inline di dalam form ([`upload-form.tsx`](components/documents/upload-form.tsx:130), [`ai-settings-form.tsx`](components/settings/ai-settings-form.tsx:232)).

**Vercel**: Toast notifications yang muncul di sudut, auto-dismiss.

**Perbaikan**: Gunakan library seperti `sonner` (dari Vercel):

```tsx
import { toast } from "sonner";
toast.success("Pengaturan berhasil disimpan!");
toast.error("Gagal mengupload dokumen");
```

**Dampak**: 🟡 SEDANG — Lebih clean, tidak menggeser layout.

---

### 2.4 ❌ Tidak Ada Confirmation Modal

**Saat ini**: [`document-list.tsx`](components/documents/document-list.tsx:41) menggunakan native `confirm()`:

```tsx
if (!confirm("Yakin ingin menghapus dokumen ini?")) return;
```

**Vercel**: Custom modal dialog yang konsisten dengan design system.

**Perbaikan**: Buat reusable `<ConfirmDialog>` component.

**Dampak**: 🟢 RENDAH — Native confirm berfungsi, tapi tidak konsisten dengan desain.

---

### 2.5 ❌ Tidak Ada Favicon/Brand yang Proper

**Saat ini**: Menggunakan default Next.js favicon.

**Perbaikan**: Buat custom favicon dengan emoji 🤖 atau logo sederhana.

**Dampak**: 🟢 RENDAH — Professional touch.

---

### 2.6 ❌ File Upload Tidak Ada Drag & Drop

**Saat ini**: [`upload-form.tsx`](components/documents/upload-form.tsx:116) menggunakan native `<input type="file">`.

**Vercel**: Drag & drop zone yang visual.

**Perbaikan**: Tambahkan drag & drop dengan visual feedback:

```tsx
<div
  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={(e) => { e.preventDefault(); setDragging(false); handleDrop(e); }}
  className={`border-2 border-dashed rounded-xl p-8 transition-colors ${
    dragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
  }`}
>
  <p>Drag & drop file di sini, atau klik untuk memilih</p>
  <input type="file" className="hidden" ref={fileInputRef} />
</div>
```

**Dampak**: 🟡 SEDANG — UX upload yang lebih baik.

---

### 2.7 ❌ Tidak Ada Document Processing Progress

**Saat ini**: Status badge "Memproses..." di [`document-list.tsx`](components/documents/document-list.tsx:108) — user harus refresh manual.

**Perbaikan**: 
1. Auto-refresh document list setiap 5 detik saat ada document berstatus `processing`
2. Progress bar atau step indicator (Parsing → Chunking → Embedding → Done)

**Dampak**: 🟡 SEDANG — User tahu progress tanpa manual refresh.

---

### 2.8 ❌ Tidak Ada Responsive Navigation (Hamburger Menu)

**Saat ini**: Header di semua halaman admin ([`documents/page.tsx`](app/(admin)/documents/page.tsx:17)) menggunakan flex row. Di mobile, tombol-tombol akan overflow atau terpotong.

**Perbaikan**: Tambahkan hamburger menu untuk mobile:

```tsx
// Di mobile: tampilkan hamburger icon
// Di desktop: tampilkan full nav
<div className="hidden md:flex items-center gap-4">...</div>
<MobileMenu className="md:hidden" />
```

**Dampak**: 🔴 TINGGI — Navigasi admin tidak bisa digunakan di mobile saat ini.

---

## 3. Mobile Responsiveness (Dampak: TINGGI)

### 3.1 ❌ Chat Tidak Full-Height di Mobile

**Saat ini**: [`chat-window.tsx`](components/chat/chat-window.tsx:150) menggunakan `flex flex-col h-full` — butuh parent dengan height yang terdefinisi.

**Di mobile**: Chat mungkin tidak mengisi viewport, input bisa tersembunyi di bawah keyboard.

**Perbaikan**:
```tsx
<div className="flex flex-col h-[100dvh]"> {/* dvh = dynamic viewport height */}
```

**Dampak**: 🔴 TINGGI — Chat unusable di beberapa mobile browser.

---

### 3.2 ❌ Admin Header Overflow di Mobile

**Saat ini**: Header di [`documents/page.tsx`](app/(admin)/documents/page.tsx:17) punya 5+ tombol di satu baris. Di mobile (< 640px), ini akan overflow.

**Perbaikan**: 
- Collapse navigasi ke hamburger menu di mobile
- Hanya tampilkan logo + hamburger di mobile

**Dampak**: 🔴 TINGGI — Admin area tidak usable di mobile.

---

### 3.3 ❌ Settings Grid Tidak Responsive

**Saat ini**: [`ai-settings-form.tsx`](components/settings/ai-settings-form.tsx:250) `grid grid-cols-2 md:grid-cols-3` — ini sudah cukup baik, tapi di mobile sangat kecil.

**Perbaikan**: `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3` untuk mobile yang lebih lega.

**Dampak**: 🟡 SEDANG — Bisa digunakan tapi kurang nyaman.

---

### 3.4 ❌ Source Cards Horizontal Scroll di Mobile

**Saat ini**: [`chat-window.tsx`](components/chat/chat-window.tsx:216) `flex gap-2 overflow-x-auto` — berfungsi tapi tidak ada scroll indicator.

**Perbaikan**: Tambahkan scroll hint / pagination dots, atau wrap ke grid di mobile.

**Dampak**: 🟢 RENDAH — Berfungsi tapi UX kurang.

---

### 3.5 ❌ Touch Targets Terlalu Kecil

**Saat ini**: Banyak tombol dan link memiliki padding kecil yang sulit diklik di mobile (standar minimum: 44x44px).

**Contoh**: Delete button di [`document-list.tsx`](components/documents/document-list.tsx:128) hanya `p-2` (32px).

**Perbaikan**: Pastikan semua interactive elements minimal 44x44px.

**Dampak**: 🟡 SEDANG — Accessibility + mobile UX.

---

## 4. Accessibility (Dampak: SEDANG-TINGGI)

### 4.1 ❌ Tidak Ada ARIA Labels

**Saat ini**: Hampir semua interaktif elements tidak punya `aria-label` atau `aria-labelledby`.

**Contoh**:
- Chat input ([`chat-window.tsx`](components/chat/chat-window.tsx:227)) — no `aria-label`
- Send button ([`chat-window.tsx`](components/chat/chat-window.tsx:235)) — hanya SVG, no text
- Delete button ([`document-list.tsx`](components/documents/document-list.tsx:128)) — punya `title` tapi tidak `aria-label`
- Provider selection buttons ([`ai-settings-form.tsx`](components/settings/ai-settings-form.tsx:252)) — no `role="radio"` atau `aria-checked`

**Perbaikan**: Tambahkan ARIA attributes pada semua interactive elements:

```tsx
<button aria-label="Kirim pesan" type="submit">...</button>
<input aria-label="Ketik pertanyaan Anda" ... />
<button aria-label="Hapus dokumen" ... />
<div role="radiogroup" aria-label="Pilih AI Provider">
  <button role="radio" aria-checked={provider === key} ... />
</div>
```

**Dampak**: 🔴 TINGGI — Screen reader users tidak bisa menggunakan aplikasi.

---

### 4.2 ❌ Tidak Ada Focus Management

**Saat ini**: Tidak ada `focus` management setelah navigasi atau aksi.

**Contoh**:
- Setelah submit chat, fokus tidak kembali ke input
- Setelah delete document, fokus hilang
- Setelah redirect ke login, fokus tidak ke email input

**Perbaikan**: 
```tsx
// Setelah submit chat
inputRef.current?.focus();

// Setelah delete
document.querySelector('[data-next-doc]')?.focus();
```

**Dampak**: 🟡 SEDANG — Keyboard users mengalami kesulitan.

---

### 4.3 ❌ Tidak Ada Skip Navigation

**Saat ini**: Tidak ada "Skip to content" link.

**Perbaikan**: Tambahkan visually hidden skip link:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white">
  Skip to main content
</a>
```

**Dampak**: 🟡 SEDANG — WCAG 2.1 requirement.

---

### 4.4 ❌ Color Contrast Issues

**Saat ini**: Beberapa kombinasi warna mungkin tidak memenuhi WCAG AA:
- `text-gray-500` on `bg-gray-50` — contrast ratio ~3.9:1 (minimum 4.5:1)
- `text-gray-400` on `bg-white` — contrast ratio ~3.4:1

**Perbaikan**: Gunakan `text-gray-600` minimum untuk body text, `text-gray-500` hanya untuk decorative.

**Dampak**: 🟡 SEDANG — WCAG compliance.

---

### 4.5 ❌ Tidak Ada Keyboard Shortcuts

**Saat ini**: Tidak ada keyboard shortcuts.

**ChatGPT/Claude**: 
- `Enter` untuk submit, `Shift+Enter` untuk newline
- `Ctrl+K` atau `/` untuk search
- `Esc` untuk close modals

**Perbaikan**: 
- `Enter` submit, `Shift+Enter` newline (sudah perlu textarea)
- `Ctrl+Shift+N` untuk new chat
- `Esc` untuk clear input

**Dampak**: 🟡 SEDANG — Power user UX.

---

### 4.6 ❌ Tidak Ada `lang` Attribute yang Konsisten

**Saat ini**: [`layout.tsx`](app/layout.tsx:28) sudah `lang="id"` — ini benar. Tapi konten AI bisa bahasa Inggris.

**Perbaikan**: Tambahkan `lang` attribute pada message bubble berdasarkan deteksi bahasa (opsional).

**Dampak**: 🟢 RENDAH — Nice-to-have.

---

## 5. UX Quality (Dampak: SEDANG)

### 5.1 ❌ Tidak Ada Breadcrumb Navigation

**Saat ini**: Navigasi admin hanya link di header. User tidak tahu posisi mereka di hierarki.

**Vercel**: Breadcrumb yang jelas.

**Perbaikan**:
```
Home > Documents > Upload
Home > Settings
```

**Dampak**: 🟡 SEDANG — Wayfinding yang lebih baik.

---

### 5.2 ❌ Error Handling Kurang Informatif

**Saat ini**: Error messages generic:
- "Terjadi kesalahan saat mengupload" ([`upload-form.tsx`](components/documents/upload-form.tsx:44))
- "Gagal mengirim pesan" ([`chat-window.tsx`](components/chat/chat-window.tsx:70))

**Perbaikan**: 
- Tampilkan error spesifik dari server
- Tambahkan tombol "Coba Lagi"
- Untuk rate limit, tampilkan countdown

**Dampak**: 🟡 SEDANG — User tahu apa yang salah dan apa yang harus dilakukan.

---

### 5.3 ❌ Tidak Ada Empty States yang Informatif

**Saat ini**: Empty state di chat ([`chat-window.tsx`](components/chat/chat-window.tsx:170)) cukup baik. Tapi document list empty state ([`document-list.tsx`](components/documents/document-list.tsx:64)) kurang guided.

**Perbaikan**: Tambahkan step-by-step guide di empty state:

```
1. 📄 Upload dokumen pertama Anda
2. ⏳ Tunggu proses selesai
3. 💬 Mulai bertanya di chat
```

**Dampak**: 🟢 RENDAH — Onboarding yang lebih baik.

---

### 5.4 ❌ Tidak Ada Keyboard Navigation untuk Document List

**Saat ini**: Document list items tidak focusable, tidak ada keyboard navigation.

**Perbaikan**: Tambahkan `tabIndex={0}` dan keyboard handlers untuk Enter (view) dan Delete (hapus).

**Dampak**: 🟢 RENDAH — Accessibility improvement.

---

### 5.5 ❌ Tidak Ada Unsaved Changes Warning

**Saat ini**: Di settings page, user bisa mengubah form lalu navigasi away tanpa warning.

**Perbaikan**: Tambahkan `beforeunload` event listener saat form dirty.

**Dampak**: 🟢 RENDAH — Mencegah kehilangan perubahan.

---

### 5.6 ❌ Chat Tidak Simpan Draft

**Saat ini**: Jika user mengetik di chat lalu navigasi away, input hilang.

**Perbaikan**: Simpan draft ke `localStorage`.

**Dampak**: 🟢 RENDAH — Minor UX improvement.

---

## Rangking Perbaikan Berdasarkan Dampak

### Tier 1: KRITIS (Lakukan dulu)

| # | Perbaikan | File | Effort |
|---|-----------|------|--------|
| 1 | **Markdown rendering di chat** | `message-bubble.tsx` | 2-3 jam |
| 2 | **Session history sidebar** | `chat-window.tsx`, new API | 4-6 jam |
| 3 | **Mobile responsive navigation** | all admin pages | 2-3 jam |
| 4 | **Chat full-height di mobile** | `chat-window.tsx`, `chat/page.tsx` | 1 jam |
| 5 | **Auto-resize textarea + Enter/Shift+Enter** | `chat-window.tsx` | 1 jam |

### Tier 2: TINGGI (Lakukan berikutnya)

| # | Perbaikan | File | Effort |
|---|-----------|------|--------|
| 6 | **Copy button per message** | `message-bubble.tsx` | 1 jam |
| 7 | **ARRIA labels** | semua components | 2-3 jam |
| 8 | **Dark mode** | `layout.tsx`, `globals.css`, semua components | 4-6 jam |
| 9 | **Drag & drop upload** | `upload-form.tsx` | 2-3 jam |
| 10 | **Suggested questions** | `chat-window.tsx` | 1-2 jam |
| 11 | **Toast notifications** | semua forms + new lib | 2-3 jam |
| 12 | **Loading skeletons** | `document-list.tsx`, `ai-settings-form.tsx` | 2-3 jam |

### Tier 3: SEDANG (Nice to have)

| # | Perbaikan | File | Effort |
|---|-----------|------|--------|
| 13 | **Streaming cursor animation** | `message-bubble.tsx` | 30 menit |
| 14 | **Retry button on error** | `chat-window.tsx` | 1-2 jam |
| 15 | **Inline source citations** | `message-bubble.tsx`, `chain.ts` | 3-4 jam |
| 16 | **Document processing auto-refresh** | `document-list.tsx` | 1-2 jam |
| 17 | **Focus management** | semua components | 2-3 jam |
| 18 | **Color contrast fixes** | `globals.css`, Tailwind config | 1-2 jam |
| 19 | **Confirmation modal** | new component | 1-2 jam |
| 20 | **Keyboard shortcuts** | `chat-window.tsx` | 1-2 jam |
| 21 | **Breadcrumb navigation** | admin pages | 2-3 jam |
| 22 | **Error messages yang lebih informatif** | semua forms | 2-3 jam |
| 23 | **Touch target sizing** | semua components | 1-2 jam |
| 24 | **Skip navigation link** | `layout.tsx` | 15 menit |

### Tier 4: RENDAH (Polish)

| # | Perbaikan | File | Effort |
|---|-----------|------|--------|
| 25 | **Custom favicon** | `app/favicon.ico` | 15 menit |
| 26 | **Empty state improvements** | `document-list.tsx` | 30 menit |
| 27 | **Scroll indicator source cards** | `chat-window.tsx` | 30 menit |
| 28 | **Unsaved changes warning** | `ai-settings-form.tsx` | 30 menit |
| 29 | **Chat draft persistence** | `chat-window.tsx` | 30 menit |
| 30 | **Provider grid responsive fix** | `ai-settings-form.tsx` | 15 menit |

---

## Perbandingan Detail dengan Kompetitor

### vs ChatGPT

| Fitur | Mimotes | ChatGPT | Gap |
|-------|---------|---------|-----|
| Markdown rendering | ❌ | ✅ (full) | 🔴 |
| Code syntax highlighting | ❌ | ✅ | 🔴 |
| Session sidebar | ❌ | ✅ (searchable) | 🔴 |
| Copy button | ❌ | ✅ | 🟡 |
| Message editing | ❌ | ✅ | 🟡 |
| Regenerate response | ❌ | ✅ | 🟡 |
| Streaming cursor | ❌ | ✅ | 🟡 |
| File upload in chat | ❌ | ✅ | 🟡 |
| Dark mode | ❌ | ✅ | 🟡 |
| Mobile app | ❌ | ✅ | 🟡 |
| **RAG dari dokumen sendiri** | ✅ | ❌ (GPTs) | 🟢 |
| **Multi-provider** | ✅ | ❌ | 🟢 |
| **Self-hosted** | ✅ | ❌ | 🟢 |

### vs Claude

| Fitur | Mimotes | Claude | Gap |
|-------|---------|--------|-----|
| Markdown rendering | ❌ | ✅ (full) | 🔴 |
| Artifacts/code preview | ❌ | ✅ | 🟡 |
| Conversation search | ❌ | ✅ | 🟡 |
| Projects (persistent context) | ❌ | ✅ | 🟡 |
| Copy button | ❌ | ✅ | 🟡 |
| Dark mode | ❌ | ✅ | 🟡 |
| Accessibility | ❌ | ✅ (excellent) | 🟡 |
| **RAG dari dokumen sendiri** | ✅ | ❌ | 🟢 |
| **Self-hosted** | ✅ | ❌ | 🟢 |
| **Multi-provider** | ✅ | ❌ | 🟢 |

### vs Vercel

| Fitur | Mimotes | Vercel | Gap |
|-------|---------|--------|-----|
| Design system consistency | ❌ | ✅ (Geist) | 🔴 |
| Loading skeletons | ❌ | ✅ | 🟡 |
| Toast notifications | ❌ | ✅ (sonner) | 🟡 |
| Dark mode | ❌ | ✅ | 🟡 |
| Responsive design | ❌ | ✅ (excellent) | 🟡 |
| Animation/transitions | Basic | ✅ (polished) | 🟡 |
| **AI chatbot** | ✅ | ❌ | 🟢 |
| **RAG pipeline** | ✅ | ❌ | 🟢 |

---

## Dependencies yang Dibutuhkan

```json
{
  "react-markdown": "^9.0.0",
  "remark-gfm": "^4.0.0",
  "rehype-highlight": "^7.0.0",
  "next-themes": "^0.4.0",
  "sonner": "^1.0.0"
}
```

---

## Prioritas Implementasi

```
Minggu 1: Tier 1 (Kritis)
  ├── Markdown rendering
  ├── Auto-resize textarea + keyboard
  ├── Mobile responsive nav
  └── Chat full-height mobile

Minggu 2: Tier 2 (Tinggi)
  ├── Session sidebar
  ├── Copy button
  ├── ARIA labels
  └── Toast notifications

Minggu 3: Tier 2-3 (Tinggi-Sedang)
  ├── Dark mode
  ├── Drag & drop upload
  ├── Loading skeletons
  └── Streaming cursor + retry

Minggu 4: Tier 3-4 (Sedang-Rendah)
  ├── Inline citations
  ├── Focus management
  ├── Breadcrumbs
  └── Polish & fixes
```
