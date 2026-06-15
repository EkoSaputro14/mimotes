# VISUAL PARITY REPORT — Stitch vs Mimotes

> Date: 2026-06-11
> Method: Browser screenshots at 1440×900, compared against Stitch reference PNGs
> Stitch Assets: `.design/stitch/dashboard.png`, `documents.png`, `upload.png`
> Mimotes Screenshots: `.ui-audit/screenshots/dashboard.png`, `documents.png`, `upload.png`

---

## Scoring Methodology

Each page scored on 6 dimensions (0-100%):
- **Visual Parity**: Colors, backgrounds, borders, shadows — does it *look* the same?
- **Layout Parity**: Grid structure, column split, component placement — same arrangement?
- **Typography Parity**: Font family, sizes, weights, hierarchy — same text treatment?
- **Spacing Parity**: Padding, margins, gaps, density — same whitespace rhythm?
- **Color Parity**: Background, foreground, accent, status colors — exact hex match?
- **Interaction Parity**: Hover states, transitions, active states — same behavior?

**Overall page score = weighted average (Visual 25%, Layout 25%, Typography 15%, Spacing 15%, Color 15%, Interaction 5%)**

---

## 1. DASHBOARD

### Side-by-Side Comparison

| Element | Stitch Design | Mimotes Actual | Match? |
|---------|--------------|----------------|--------|
| Page background | Pure black `#000000` | Pure black `oklch(0.05 0 0)` ≈ `#0d0d0d` | ⚠️ Near-black, not pure black |
| Card background | `#131313` (surface) | `oklch(0.08 0 0)` ≈ `#141414` | ✅ Very close |
| 2-column layout | 60/40 split (Quick Actions left, Activity+Health right) | 50/50 `lg:grid-cols-2` | ⚠️ Column ratio differs |
| KPI row | 4 cards: Documents, Tokens, Chat Sessions, Messages | 4 cards: Documents, Knowledge Chunks, Chat Sessions, Total Messages | ⚠️ Different metrics |
| KPI card style | Outline icon left, value right, secondary metric below | Icon in colored circle, value right, trend below | ⚠️ Different card treatment |
| Quick Actions | 3×2 grid, icon + title + description, borderless cards | 3×2 grid, icon + title + description, bordered cards | ✅ Structure matches, border style differs |
| Activity Feed | Right column, colored outline icons (blue/green/yellow/red) | Right column, colored icons | ✅ Placement matches |
| System Health | Below Activity Feed, "All systems operational" badge, Vector Storage progress bar | Below Activity Feed, health checks + Vector Storage | ✅ Matches |
| Header search bar | Present, centered in header | Present in TopNav | ✅ Present |
| "All systems operational" | Green badge in header | Green badge in header | ✅ Matches |
| Sidebar "+ New Chat" button | Prominent purple CTA at top | Not present | ❌ Missing |
| Sidebar structure | Flat list: Dashboard, Chat, Documents, Upload, Analytics, Widgets, API, Settings | Collapsible grouped sections | ⚠️ Different organization |
| Font family | Inter + Geist | Geist Sans (via next/font) | ⚠️ Geist primary, not Inter |
| Card borders | `#2a3a47` subtle borders | `border-border/20` ≈ white 8% opacity | ⚠️ Different border color |
| Icon style | Material Symbols Outlined, outline stroke | Lucide React, outline stroke | ⚠️ Different icon set |
| Typography scale | 24px title, 32px KPI numbers, 14px body, 12px meta | Similar hierarchy but different exact sizes | ⚠️ Close but not exact |
| Spacing density | Tight, 16px gaps, 20px card padding | 24px gaps, 20-24px card padding | ⚠️ Slightly looser |

### Dashboard Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Visual** | 72% | Pure black bg ✅, card style close ✅, but card borders and icon style differ |
| **Layout** | 85% | 2-column ✅, KPI row ✅, Quick Actions grid ✅, Activity+Health right ✅ |
| **Typography** | 60% | Geist instead of Inter, hierarchy similar but not exact match |
| **Spacing** | 65% | Slightly looser than Stitch, 24px vs 16px gaps |
| **Color** | 70% | Near-black ✅, indigo accent ✅, but card borders and some accents differ |
| **Interaction** | 55% | Hover states present but simpler than Stitch; no pulse animation on status |

**Dashboard Weighted Score: 72%**

---

## 2. DOCUMENTS PAGE

### Side-by-Side Comparison

| Element | Stitch Design | Mimotes Actual | Match? |
|---------|--------------|----------------|--------|
| Page background | Pure black `#000000` | Near-black | ⚠️ Close |
| Overview stats row | 4 cards: Total Documents (34), Total Chunks (107k), PDF Ratio (95%), Image Assets (13) | 4 cards: Total Documents, Total Chunks, PDF Ratio, Image Assets | ✅ Same metrics |
| Stats card style | Dark card, large bold number, secondary metric below | Dark card, large bold number, secondary metric | ✅ Matches |
| Status tabs | All (active/purple), Ready (green dot), Processing (yellow dot), Failed (red dot) | All, Ready, Processing, Failed with colored badges | ✅ Matches |
| Tab style | Pill-shaped, purple fill for active | Pill-shaped, primary color for active | ✅ Matches |
| Table columns | DOCUMENT NAME (with size), TYPE, CHUNKS, STATUS, DATE ADDED, ACTIONS | Name, Type, Status, Chunks, Uploaded, Actions | ⚠️ Missing file size in Name column, Status column order differs |
| Table density | Dense, tight rows | Dense, tight rows | ✅ Matches |
| Status badges | Green/Yellow/Red filled text with dot | Emerald/Amber/Red filled badges | ✅ Similar, slightly different colors |
| Header search bar | Present with "Search files, contents, or tags..." | Present in TopNav | ✅ Present |
| File Type + Status dropdowns | Present to right of search | Present | ✅ Matches |
| Sort dropdown | "Latest First" dropdown | Sort buttons in table headers | ⚠️ Different UI pattern |
| Bottom CTAs | "Automate Ingestion" + "Smart Chunking" panels | Present | ✅ Matches |
| Pagination | "Showing 1-10 of 34" with arrows | Present | ✅ Matches |
| Font family | Inter | Geist | ⚠️ Different |
| Icon style | Material Symbols Outlined | Lucide React | ⚠️ Different set |
| "+ New Chat" sidebar button | Present | Missing | ❌ Missing |

### Documents Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Visual** | 75% | Dark theme ✅, cards ✅, table ✅, but icon set and border details differ |
| **Layout** | 88% | Stats row ✅, tabs ✅, table ✅, bottom CTAs ✅, search ✅ |
| **Typography** | 60% | Geist instead of Inter, hierarchy similar |
| **Spacing** | 70% | Dense layout achieved, slight padding differences |
| **Color** | 72% | Near-black ✅, status colors close ✅, accent color matches |
| **Interaction** | 55% | Tabs work, sort works, but no hover animations on rows |

**Documents Weighted Score: 75%**

---

## 3. UPLOAD PAGE

### Side-by-Side Comparison

| Element | Stitch Design | Mimotes Actual | Match? |
|---------|--------------|----------------|--------|
| Page background | Pure black `#000000` | **WHITE `bg-white`** | ❌ **CRITICAL: Light theme, not dark** |
| Card style | Dark card on dark bg | `bg-white rounded-2xl shadow-xl` | ❌ **Light mode card** |
| Tab style | Underline tabs (File Upload / URL Import) | Toggle buttons (📁 Upload File / 🔗 Dari URL) | ❌ Different pattern |
| Active tab | Blue underline | `bg-blue-600 text-white` filled button | ❌ Different style |
| Upload zone | Large dashed indigo border, cloud icon, "Drop files here or click to browse" | Basic file input, dashed border, no cloud icon | ⚠️ Simplified |
| Supported formats | Listed below upload zone: "PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, WEBP" | Listed below upload zone | ✅ Present |
| Max size | "Maximum 100MB" | Not shown | ❌ Missing |
| Processing queue | 5-stage pipeline: Upload → Parse → Chunk → Embed → Store with status icons | **Not present** | ❌ **Missing entirely** |
| File preview | Shows file name, size, time in queue | Not present | ❌ Missing |
| "2 active processes" header | Present with green Upload button | Not present | ❌ Missing |
| URL Import tab | Tabbed interface with URL input | Toggle-based URL input | ⚠️ Different pattern |
| Sidebar highlight | "Upload" highlighted in sidebar | "Upload" highlighted | ✅ Matches |
| Font family | Inter | System font (no Geist on upload page) | ❌ Different |
| Text language | English | Indonesian ("Pilih File", "Dari URL") | ⚠️ Different locale |
| Overall feel | Dark, dense, professional SaaS | Light, basic form | ❌ **Fundamentally different** |

### Upload Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Visual** | 15% | **WHITE BACKGROUND** — fundamentally different from dark Stitch design |
| **Layout** | 30% | Basic form layout, no processing pipeline, no queue |
| **Typography** | 25% | System font, different hierarchy, different language |
| **Spacing** | 30% | Generous but different rhythm, not dense SaaS |
| **Color** | 10% | **Light mode vs dark mode** — opposite color scheme |
| **Interaction** | 20% | Basic form submit, no drag-drop visual feedback, no pipeline |

**Upload Weighted Score: 20%**

---

## OVERALL SCORES

| Page | Visual | Layout | Typography | Spacing | Color | Interaction | **Weighted** |
|------|--------|--------|------------|---------|-------|-------------|-------------|
| Dashboard | 72% | 85% | 60% | 65% | 70% | 55% | **72%** |
| Documents | 75% | 88% | 60% | 70% | 72% | 55% | **75%** |
| Upload | 15% | 30% | 25% | 30% | 10% | 20% | **20%** |

### **OVERALL STITCH PARITY: 56%**

---

## CRITICAL GAPS (Blocking 70%+)

### 1. Upload Page — Light Mode (CRITICAL)
- **Issue**: Upload page uses `bg-white rounded-2xl shadow-xl` — completely light theme
- **Stitch**: Pure black background, dark cards, matching dashboard/documents
- **Fix**: Rewrite upload-form.tsx with dark theme classes matching dashboard
- **Effort**: 3h

### 2. Upload Processing Pipeline (CRITICAL)
- **Issue**: No processing queue, no 5-stage pipeline visualization
- **Stitch**: Upload → Parse → Chunk → Embed → Store with status indicators
- **Fix**: Add processing queue component with stage visualization
- **Effort**: 6h (requires SSE endpoint for real-time status)

### 3. Sidebar "+ New Chat" Button (HIGH)
- **Issue**: Missing prominent CTA at top of sidebar
- **Stitch**: Purple/blue gradient button "New Chat" at top of nav
- **Fix**: Add to app-sidebar.tsx
- **Effort**: 0.5h

### 4. Upload Tab Style (MEDIUM)
- **Issue**: Toggle buttons instead of underline tabs
- **Stitch**: Tabbed interface with underline indicator
- **Fix**: Replace toggle with shadcn Tabs component
- **Effort**: 1h

### 5. Font Family (MEDIUM)
- **Issue**: Geist primary instead of Inter
- **Stitch**: Inter primary, Geist secondary
- **Note**: Decision was to KEEP Geist — this is a known deviation
- **Status**: Accepted deviation, no fix needed

### 6. Icon Set (MEDIUM)
- **Issue**: Lucide React instead of Material Symbols Outlined
- **Stitch**: Material Symbols with outline stroke
- **Note**: Lucide is functionally equivalent, migration not recommended
- **Status**: Accepted deviation, no fix needed

---

## REMAINING GAPS (Non-blocking)

| Gap | Page | Impact | Effort |
|-----|------|--------|--------|
| Card border color (`#2a3a47` vs `border-border/20`) | Dashboard, Documents | Low | 0.5h |
| KPI card icon style (circle vs outline) | Dashboard | Low | 1h |
| Column ratio (50/50 vs 60/40) | Dashboard | Low | 0.5h |
| Table file size column | Documents | Low | 0.5h |
| Sort dropdown vs header sort | Documents | Low | 1h |
| Max size label on upload zone | Upload | Low | 0.5h |
| Row hover animations | Documents | Low | 1h |
| Pulse animation on status dot | Dashboard | Low | 0.5h |

---

## EFFORT TO 70% PARITY

| Priority | Task | Effort |
|----------|------|--------|
| P0 | Dark theme for Upload page | 3h |
| P0 | Upload tab style (underline tabs) | 1h |
| P1 | "+ New Chat" sidebar button | 0.5h |
| P1 | Upload zone cloud icon + max size label | 0.5h |
| P1 | Card border color alignment | 0.5h |
| P2 | Processing pipeline visualization | 6h (blocked on SSE endpoint) |
| **Total (without pipeline)** | | **5.5h** |
| **Total (with pipeline)** | | **11.5h** |

**Estimated score after P0+P1 fixes: 68-72%**
**Estimated score with pipeline: 78-82%**

---

## SCREENSHOT PATHS

- **Dashboard (actual)**: `.ui-audit/screenshots/dashboard.png`
- **Documents (actual)**: `.ui-audit/screenshots/documents.png`
- **Upload (actual)**: `.ui-audit/screenshots/upload.png`
- **Dashboard (Stitch)**: `.ui-audit/screenshots/stitch-dashboard.png`
- **Documents (Stitch)**: `.ui-audit/screenshots/stitch-documents.png`
- **Upload (Stitch)**: `.ui-audit/screenshots/stitch-upload.png`

---

## VERDICT

**Dashboard and Documents are at 72-75% parity** — close to target with minor gaps in typography, spacing, and icon details.

**Upload page is at 20% parity** — critically broken. Uses light theme (`bg-white`) instead of dark, missing processing pipeline, missing tabbed interface. This drags the overall score to **56%**.

**To reach 70% overall**: Fix Upload page dark theme + tab style + sidebar "+ New Chat" button. **5.5h estimated.**

**To reach 80% overall**: Also add processing pipeline visualization. **11.5h estimated.**
