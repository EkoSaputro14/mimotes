# MimoNotes — Screen-by-Screen UI Critique

> **Date:** June 2026  
> **Purpose:** Pre-beta UI audit. Each screen is evaluated against competitor benchmarks and given specific, actionable fix recommendations.  
> **Priority Guide:** P0 = blocks beta launch · P1 = needed for polish · P2 = nice-to-have for v2

---

## Table of Contents

1. [Landing Page (/)](#1-landing-page-)
2. [Login Page (/login)](#2-login-page-login)
3. [Dashboard (/dashboard)](#3-dashboard-dashboard)
4. [Chat Interface (/chat)](#4-chat-interface-chat)
5. [Document List (/knowledge/documents)](#5-document-list-knowledgedocuments)
6. [Document Upload (/documents/upload)](#6-document-upload-documentsupload)
7. [Workspace Switcher (sidebar)](#7-workspace-switcher-sidebar)
8. [Team Management (/settings/workspace)](#8-team-management-settingsworkspace)
9. [Analytics (/analytics)](#9-analytics-analytics)
10. [Settings (/settings)](#10-settings-settings)
11. [Widget Configuration (/settings/widget)](#11-widget-configuration-settingswidget)
12. [Knowledge Search (/knowledge/search)](#12-knowledge-search-knowledgesearch)
13. [Empty States (cross-cutting)](#13-empty-states-cross-cutting)
14. [Loading States (cross-cutting)](#14-loading-states-cross-cutting)
15. [Error States (cross-cutting)](#15-error-states-cross-cutting)

---

## 1. Landing Page (`/`)

**File:** `app/page.tsx`

### Current State
- Light blue gradient background (`bg-gradient-to-br from-blue-50 via-white to-indigo-50`)
- Emoji icons (🤖, 📚, 🔍, ⚡) as hero and feature icons
- Title: "Mimotes AI Chatbot" — `text-5xl font-bold text-gray-900`
- Two CTAs: "Mulai Chat" + "Admin Login" — emoji inside buttons (💬, 📄)
- 3 feature cards: Upload Dokumen, RAG Technology, Streaming Response
- Single-line footer: "Powered by RAG Technology"
- No hero image, no animation, no social proof, no pricing

### Issues
1. **Hardcoded `text-gray-900` / `text-gray-600` / `bg-white`** — bypasses oklch theme system; breaks in dark mode
2. **Emoji-only visual language** — looks like a student project, not a SaaS product. Emoji render differently across platforms
3. **No hero product screenshot/animation** — visitors can't see what the product looks like before signing up
4. **No social proof** — no testimonials, logos, usage stats, or trust signals
5. **No pricing section** — SaaS landing pages universally include pricing or a "Get Started" tier
6. **CTA buttons embed emoji inline** — inconsistent with the rest of the design system
7. **No animated gradient or motion** — static page feels flat compared to modern SaaS
8. **"Mimotes AI Chatbot"** — generic title; "AI Chatbot" is descriptive, not branded
9. **Footer is one line** — missing links (Docs, Status, Changelog, Twitter, etc.)
10. **No responsive mobile polish** — `text-5xl` hero and `text-8xl` emoji will overflow on small screens

### Competitor Reference
- **Notion:** Full-width hero with product screenshot, "New AI features" badge, clean typography, social proof logos
- **Linear:** Dark, minimal, animated gradient hero, subtle motion on scroll
- **Stripe:** Animated gradient background, code snippets, live product demo
- **Perplexity:** Shows a live search demo in the hero, minimal text, bold typography

### Recommended Fix
1. **Replace all `text-gray-*` / `bg-white` with theme tokens:** `text-foreground`, `text-muted-foreground`, `bg-background`, `bg-card`
2. **Replace emoji with Lucide icons or custom SVG logo** — Use `Bot`, `FileText`, `Search`, `Zap` from lucide-react with styled icon containers (e.g., `rounded-xl bg-primary/10 p-3`)
3. **Add hero product screenshot** — Use `next/image` with a mockup frame (browser chrome), or embed an animated GIF/video of the chat UI
4. **Add social proof bar:** Logo cloud of "Trusted by X teams" or beta waitlist count
5. **Add pricing section** before footer (3 tiers: Free, Pro, Enterprise)
6. **Animate the hero:** Use CSS `@keyframes` or framer-motion for subtle fade-in/slide-up on scroll
7. **Upgrade footer** to 4-column layout: Product, Resources, Company, Legal
8. **Add metadata/SEO:** `<title>`, `<meta description>`, Open Graph tags
9. **Fix mobile:** Change hero text to `text-3xl sm:text-4xl lg:text-5xl`, emoji/icon to `text-5xl sm:text-7xl lg:text-8xl`
10. **Rename hero** from "Mimotes AI Chatbot" to something like "Mimotes — AI that knows your documents" or "Chat with your knowledge base"

**Priority:** P0 — This is the first impression for all visitors.

---

## 2. Login Page (`/login`)

**File:** `app/(auth)/login/page.tsx` + `components/auth/login-form.tsx`

### Current State
- Page: Full-screen centered `bg-gradient-to-br from-blue-50 via-white to-indigo-50` wrapper
- Form: White card (`bg-white rounded-2xl shadow-xl p-8`), max-width `max-w-md`
- Title: "Login Admin" — `text-2xl font-bold text-center`
- Subtitle: "Masuk untuk mengelola dokumen" — `text-gray-500`
- Two fields: email + password — `border-gray-300 focus:ring-2 focus:ring-blue-500`
- Button: `bg-blue-600` with `hover:bg-blue-700`
- Footer link: "Belum punya akun? Daftar"
- No branding logo, no illustration, no "remember me", no "forgot password"

### Issues
1. **Hardcoded colors everywhere** — `bg-white`, `text-gray-500`, `border-gray-300`, `focus:ring-blue-500` — completely bypasses the oklch theme
2. **No Mimotes logo/branding** — just text "Login Admin"; users have no visual brand reinforcement
3. **"Login Admin" is confusing** — implies only admins can log in; should say "Sign in" or "Log in"
4. **No illustration or product context** — empty gradient background vs. competitors who show what you're logging into
5. **No "forgot password" link** — dead end if user forgets credentials
6. **No "remember me" checkbox** — standard SaaS login feature
7. **No OAuth/SSO options** — modern SaaS expects Google, GitHub, etc.
8. **Redirect goes to `/documents`** instead of `/dashboard` — documents page isn't the natural home
9. **No loading spinner on button** — just text change "Masuk..." — should show a spinner
10. **No password visibility toggle** — standard UX expectation

### Competitor Reference
- **Notion:** Split layout — left illustration, right form. Logo at top. "Continue with Google" + email option.
- **Linear:** Dark themed, minimal. Logo + email field only (magic link). No password at all.
- **Superhuman:** Premium feel, illustration, "Welcome back" headline, subtle animation.

### Recommended Fix
1. **Convert all colors to theme tokens:** `bg-background` instead of gradient, `text-foreground`, `border-border`, `focus:ring-ring`
2. **Add Mimotes logo** at top of form card using the `<Bot>` icon + "Mimotes" text
3. **Rename to "Sign in to Mimotes"** — friendly, branded, not admin-only
4. **Add split layout:** Left side = product illustration/mockup, right side = form (use `grid grid-cols-1 lg:grid-cols-2`)
5. **Add "Forgot password?" link** below password field
6. **Add "Remember me" checkbox**
7. **Add spinner** to button during loading: replace text with `<Loader2 className="size-4 animate-spin mr-2" />`
8. **Add password visibility toggle** (eye icon)
9. **Change redirect** from `/documents` to `/dashboard`
10. **Add meta title:** "Sign In — Mimotes"

**Priority:** P0 — Every user hits this screen. Branding and usability matter.

---

## 3. Dashboard (`/dashboard`)

**File:** `app/dashboard/page.tsx`

### Current State
- Wrapped in `DashboardShell` with title "Dashboard"
- **Stat Cards Row:** 4 cards (Documents, Knowledge Chunks, Chat Sessions, Total Messages) in `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- **Two-column grid** (3:2 ratio): Quick Actions (6 items) + Activity Feed + System Health
- Quick Actions: New Chat, Upload File, Manage API, Optimization, Connect Apps, Reports — all `Link` cards with Lucide icons
- Activity Feed + System Health: separate components

### Issues
1. **Quick Actions labels are vague** — "Optimization" points to Chunks (developer concept), "Connect Apps" points to Widget config — users won't understand these
2. **"Manage API" at `/developers`** — not a standard path name; should be `/settings/api` or `/developers/api-keys`
3. **No recent conversations** — the most common dashboard action (continue a chat) is buried in Quick Actions
4. **No document processing status overview** — users can't see if uploads are still processing
5. **System Health is developer-only** — regular users don't care about system health; should be collapsible or behind a "Developer" section
6. **Stat cards show raw counts** — "247 Knowledge Chunks" means nothing to a non-technical user; needs context ("Covering 12 documents")
7. **Activity Feed is generic** — no timestamps relative to "now" (just absolute dates)
8. **No onboarding state** — new users see all zeros with no guidance
9. **Missing workspace name/context** — should show "Workspace: Acme Corp" or similar
10. **No search/command palette** — power users expect Cmd+K

### Competitor Reference
- **Linear:** Shows "Assigned to me" issues, recent activity timeline, team workload, upcoming deadlines
- **Notion:** "Favorites" section, "Recent" pages, templates, team space
- **ChatGPT:** Conversation history is the homepage; recent chats prominently displayed
- **Vercel:** Deployment status, recent projects, usage graphs, quick deploy button

### Recommended Fix
1. **Add "Recent Chats" section** at the top — 5 most recent sessions with titles and timestamps, one click to resume
2. **Replace Quick Actions with contextual widgets:**
   - "Continue Chat" (latest session)
   - "Upload Document" (prominent CTA)
   - "Documents Being Processed" (if any)
   - "Ask a Question" (links to chat with pre-filled context)
3. **Rename quick actions:** "Optimization" → "View Chunks", "Connect Apps" → "Widget Settings", "Manage API" → "API Keys"
4. **Add onboarding cards** for empty states: "Upload your first document", "Start your first chat", "Configure your AI provider"
5. **Add relative timestamps** to Activity Feed ("2 minutes ago", "Yesterday")
6. **Show workspace context** in header: workspace name + role badge
7. **Move System Health** to a developer-only tab or behind a "Developer" sidebar section
8. **Add Cmd+K command palette** for search and quick navigation
9. **Add trend arrows** to stat cards (up/down from last 7 days, not just absolute values)
10. **Color-code stat cards** — Documents = blue, Chunks = green, Sessions = purple, Messages = orange

**Priority:** P0 — Dashboard is the primary landing page after login.

---

## 4. Chat Interface (`/chat`)

**File:** `app/chat/page.tsx` + `components/chat/chat-window.tsx`

### Current State
- Full-height flex layout (`h-screen flex flex-col`)
- Session sidebar (mobile: sheet, desktop: collapsible sidebar)
- Header: "Mimotes AI" title + subtitle + "Chat Baru" button
- Message list with auto-scroll
- User avatar: gray circle with "U" (`bg-gray-600`)
- AI avatar: blue circle with "AI" (`bg-blue-600`)
- Loading: bouncing dots animation
- Sources: horizontal scrollable SourceCards at bottom
- Input: auto-resize textarea + send button (SVG arrow icon)
- Empty state: 🤖 emoji + "Selamat datang di Mimotes" + description text

### Issues
1. **Hardcoded `bg-gray-600` for user avatar** — bypasses theme
2. **No suggested prompts** on empty state — ChatGPT shows 4 starter prompts; users stare at blank screen
3. **No file attachment** — can't upload images or files inline during chat
4. **No model selector** — users can't choose which AI model to use
5. **Sources are at the bottom, separate from messages** — Perplexity inlines sources next to each claim; current UX hides them
6. **"Chat Baru" text is Indonesian mixed with English UI** — inconsistent language; product should pick one
7. **No message reactions/feedback** — can't mark responses as helpful/unhelpful
8. **No regeneration** — can't ask the AI to try again
9. **"🤖" emoji in empty state** — same emoji branding issue as landing page
10. **Send button uses inline SVG** — should use `<Send>` or `<ArrowUp>` from lucide-react
11. **No conversation title auto-generation** — sessions appear as untitled in sidebar
12. **Sources section always takes space** even when there are no sources for the current conversation
13. **No keyboard shortcuts** visible — no Cmd+K, no / commands
14. **Streaming works** (good!) but there's no cursor/typing indicator during streaming

### Competitor Reference
- **ChatGPT:** Suggested prompts on empty state, model selector, file upload, regenerate button, thumbs up/down, share conversation
- **Claude:** Clean centered chat, project context sidebar, file upload, "Stop generating" button
- **Perplexity:** Search-first UI, inline numbered sources next to each claim, source cards with previews, "Pro Search" toggle
- **Gemini:** Multi-model selector, image generation inline, conversation branching

### Recommended Fix
1. **Add suggested prompts** to empty state: 4 clickable cards like "What documents do I have?", "Summarize [latest doc]", "Explain RAG technology", "Help me draft..."
2. **Replace hardcoded colors:** `bg-gray-600` → `bg-muted`, `bg-blue-600` → `bg-primary`
3. **Add regenerate button** on assistant messages (show on hover)
4. **Add thumbs up/down feedback** buttons on assistant messages
5. **Inline sources** — show `¹` superscript in message text linking to source cards below the message
6. **Add model selector** dropdown in header (e.g., "GPT-4o" / "Claude" / "Local")
7. **Add file upload** button next to textarea (paperclip icon)
8. **Fix language consistency** — use English throughout or Indonesian throughout, not mixed
9. **Replace inline SVG** send button with `<ArrowUp className="size-5" />` from lucide-react
10. **Auto-generate session title** from first message (call API after first exchange)
11. **Add markdown rendering enhancements:** styled tables, callouts, collapsible sections
12. **Add "Stop generating" button** during streaming
13. **Add Cmd+K command palette** for switching sessions, searching messages

**Priority:** P0 — Chat is the core product experience.

---

## 5. Document List (`/knowledge/documents`)

**File:** `app/knowledge/documents/page.tsx` + `components/knowledge/document-explorer.tsx`

### Current State
- DashboardShell with "Documents" title
- Overview stats row: Total Documents, Total Chunks, PDF Ratio, Image Assets
- Quick Status Tabs: All, Ready, Processing, Failed
- Search bar + type filter `<select>` + status filter `<select>` + table/grid toggle
- Active filter badges with clear buttons
- Table view: sortable columns (Name, Type, Status, Chunks, Uploaded, Actions)
- Grid view: card layout with emoji file type icons
- Pagination at bottom
- Bottom CTA panels: "Automate Ingestion" + "Smart Chunking"
- `confirm()` dialog for delete (native browser)
- Empty state with SVG icon + text + CTA

### Issues
1. **`confirm()` for delete** — ugly native browser dialog; breaks the design system
2. **Emoji file type icons** (`📕📘📄📊📗🌐`) — same cross-platform rendering issues
3. **"PDF Ratio" stat** — meaningless to most users; what does 73% PDF ratio tell you?
4. **"Image Assets" stat** — misleading; documents with images aren't really "image assets"
5. **No bulk selection** — can't select multiple documents and delete/move them
6. **No drag-to-reorder** — can't organize documents
7. **No document preview** on hover or in grid view — users can't see content without clicking in
8. **CTA panels at bottom are always shown** — "Automate Ingestion" and "Smart Chunking" feel like ads, not actions
9. **Table has hardcoded `w-[300px]` for Name column** — will clip long titles
10. **No "last accessed" or "used in chat" indicator** — can't tell which docs are actually being used

### Competitor Reference
- **Notion:** Grid/list toggle, page previews on hover, favorites, recent, filters, breadcrumbs, drag-to-reorder
- **Google Drive:** Search + sort + view options, bulk select with checkboxes, right-click context menu, file previews
- **Dropbox:** File previews, shared links, version history, activity log per file

### Recommended Fix
1. **Replace `confirm()` with shadcn AlertDialog** — styled confirmation modal with document name shown
2. **Replace emoji icons** with Lucide icons in styled containers: `<FileText className="size-5 text-blue-500" />` inside `bg-blue-500/10 rounded-lg p-2`
3. **Replace "PDF Ratio"** with "Storage Used" or "Total File Size" — more actionable
4. **Add bulk selection:** checkboxes on each row, bulk actions bar (delete, move, export)
5. **Add document preview** — hover card or click-to-expand showing first 200 chars + chunk count
6. **Replace CTA panels** with contextual suggestions that appear only when relevant
7. **Use `min-w-0` + `truncate`** instead of fixed `w-[300px]` for name column
8. **Add "last used in chat" badge** to document cards
9. **Add keyboard navigation** — arrow keys to move between documents, Enter to open
10. **Add "Import from URL"** button alongside "Upload" button in header

**Priority:** P1 — Works but feels rough around the edges.

---

## 6. Document Upload (`/documents/upload`)

**File:** `app/(admin)/documents/upload/page.tsx` + `components/documents/upload-form.tsx`

### Current State
- DashboardShell with "Upload" title, maxWidth="4xl"
- Header: "Ingest Information" with subtitle
- Tab-style toggle: "File Upload" / "URL Import" (underline active style)
- Drag-and-drop zone with CloudUpload icon, "Drop files here or click to browse"
- File input: `accept=".pdf,.docx,.txt,.csv,.xlsx,.xls,.png,.jpg,.jpeg,.webp"`
- "Select Files" button + "Upload Dokumen" submit button
- URL form: input + "Tambahkan URL" button
- Processing Queue: shows items with 5-stage pipeline (Upload → Parse → Chunk → Embed → Store)
- Queue items have status badges: uploading, processing, complete, pending
- **BUG: Queue has hardcoded demo data** — 3 fake items (`Q3_Financial_Analysis.pdf`, `Client_Dataset_v2.xlsx`, `Architecture_Overview.txt`) always shown

### Issues
1. **Hardcoded demo data in queue** — `Q3_Financial_Analysis.pdf` etc. appear for every user on every visit. This is a serious bug, not a UX issue
2. **"Upload Dokumen"** — mixed Indonesian/English again
3. **No file size validation client-side** — only server-side check at 100MB
4. **No drag-and-drop visual feedback beyond border color** — competitors animate the entire zone
5. **No upload progress bar** — just a spinner; users can't tell how far along the upload is
6. **Single file upload button** — `<input type="file" required>` without `multiple` attribute
7. **Processing pipeline shows stages but no real progress** — stage just jumps from one to next
8. **No "Upload more" button after completing** — users have to manually select again
9. **No file type icons** in the queue — just generic `FileText` icon for all
10. **URL tab lacks validation** — no check if URL is accessible before submitting

### Competitor Reference
- **Notion:** Clean upload with file type cards, progress bar per file, multi-file queue with remove buttons
- **Google Drive:** Drag entire folders, progress bar, file type preview thumbnails
- **Notion AI:** Upload → "Processing..." with estimated time remaining

### Recommended Fix
1. **Remove hardcoded demo data** — initialize queue as empty array `[]`
2. **Add `multiple` attribute** to file input for multi-file upload
3. **Add client-side validation:** check file size (< 100MB), file type, show toast warning before upload
4. **Add real upload progress bar** using `XMLHttpRequest` `onprogress` event
5. **Add file type icons** using lucide-react: `<FileText>` for PDF, `<FileSpreadsheet>` for CSV/XLSX, `<FileImage>` for images
6. **Add drag-and-drop animation:** scale up the zone (`scale-105`), change background to `bg-primary/5`, add a subtle pulse
7. **Add "Upload more files" CTA** after queue clears
8. **Add URL validation:** ping the URL first, show preview of the page title
9. **Add estimated processing time** based on file size
10. **Fix language consistency:** "Upload Dokumen" → "Upload Document", "Menambahkan..." → "Adding..."

**Priority:** P0 — Hardcoded demo data is a bug; upload is a core workflow.

---

## 7. Workspace Switcher (Sidebar)

**File:** `components/workspace/workspace-switcher.tsx`

### Current State
- DropdownMenu triggered by a Button in the sidebar
- Shows: Building2 icon + workspace name + member count
- Dropdown: list of workspaces with role badges (owner/admin/editor/viewer)
- Checkmark on selected workspace, spinner during switching
- Switch triggers `window.location.reload()` — full page refresh
- Footer text: "Manage workspace in Settings → Workspace"
- Loading state: pulse skeleton

### Issues
1. **`window.location.reload()`** — jarring full page refresh; should use Next.js router + React state update
2. **No "Create workspace" option** — users must navigate to Settings → Workspace to create one
3. **No workspace icon/avatar** — just a generic Building2 icon for all workspaces
4. **Role badge colors** use hardcoded light theme colors (`bg-purple-100 text-purple-700`) — will look wrong in dark mode
5. **No workspace description** — users with similar workspace names can't tell them apart
6. **Dropdown width** is fixed at `w-72` — may truncate long workspace names
7. **No confirmation** when switching away from unsaved work (e.g., chat in progress)
8. **"Manage workspace in Settings → Workspace"** at bottom is text-only, not clickable

### Competitor Reference
- **Notion:** Sidebar workspace switcher with icon + name, "Create a new workspace" option, recent pages, search
- **Linear:** Team switcher at top of sidebar, shows team icon + name + member avatars, switch is instant

### Recommended Fix
1. **Replace `window.location.reload()`** with `router.refresh()` + server-side revalidation
2. **Add "Create workspace" option** at bottom of dropdown with Plus icon
3. **Add workspace avatar/icon** — allow users to set a custom icon/emoji per workspace
4. **Convert role badge colors to theme tokens** or use CSS custom properties: `bg-purple-500/10 text-purple-500` works better in dark mode
5. **Add workspace description** on hover or in dropdown
6. **Make "Manage workspace" text a clickable link** to `/settings/workspace`
7. **Add confirmation dialog** if user has unsaved chat in progress
8. **Show member avatars** (first 3-4) next to member count

**Priority:** P1 — Core navigation element but works functionally.

---

## 8. Team Management (`/settings/workspace`)

**File:** `app/settings/workspace/` (implied from sidebar nav)

### Current State
- DashboardShell with workspace settings
- Member list with roles
- Invitation system for adding new members

### Issues (inferred from sidebar nav + AGENTS.md architecture)
1. **No audit trail visibility** — can't see who invited whom or when
2. **No role change confirmation** — changing someone from Admin to Viewer should require confirmation
3. **No "remove from workspace"** with reassignment prompt
4. **No bulk invite** — can only invite one person at a time
5. **No invite link** — must know email addresses
6. **No pending invites section** — can't see or revoke outstanding invitations
7. **No workspace deletion** option (owner-only dangerous action)
8. **Settings layout** is likely a flat form — should be sectioned tabs

### Competitor Reference
- **Notion:** Team page with member list, role dropdowns, pending invites section, "Invite members" modal with email + role selector, bulk invite
- **Linear:** Team settings with members, invitations, role management, SSO configuration

### Recommended Fix
1. **Section the page into tabs:** Members | Invitations | Roles | Danger Zone
2. **Add pending invitations list** with revoke button
3. **Add bulk invite** via comma-separated emails or CSV upload
4. **Add invite link generation** (expiring token-based)
5. **Add role change confirmation dialog** — "Are you sure you want to change X's role from Admin to Viewer?"
6. **Add member activity** — last active timestamp, documents created, chats started
7. **Add workspace deletion** in Danger Zone with double-confirmation
8. **Add audit log viewer** showing role changes, invites, workspace settings changes

**Priority:** P1 — Needed for multi-user launch but can ship basic version first.

---

## 9. Analytics (`/analytics`)

**Files:** `app/analytics/usage/page.tsx`, `app/analytics/chat/page.tsx`, `app/analytics/cost/page.tsx`

### Current State
- Three separate pages: Usage, Chat, Cost analytics
- Each wraps a component in DashboardShell
- Components: `UsageAnalytics`, `ChatAnalytics`, `CostAnalytics`
- Uses `ChartCard`, `KPICard`, `DateRangeSelector` components

### Issues (inferred from architecture + component names)
1. **Three separate pages** — analytics should be a single dashboard with tabs, not three separate routes
2. **No date range comparison** — can't compare this week vs last week
3. **Likely no export/share** — can't export charts or share analytics with team
4. **No real-time updates** — data likely requires page refresh
5. **No anomaly alerts** — can't set alerts for unusual usage spikes
6. **KPICards likely show raw numbers** without context (vs. previous period)

### Competitor Reference
- **PostHog:** Single analytics dashboard with tabs, date range picker, funnel analysis, cohort analysis, session replay
- **Sentry:** Error analytics with trends, release tracking, user impact
- **Stripe:** Revenue analytics with charts, date range comparison, export to CSV/PDF

### Recommended Fix
1. **Merge into single Analytics page** with tabs: Overview | Usage | Chat | Cost
2. **Add date range comparison** — "This week vs last week" toggle
3. **Add export buttons** — CSV, PNG chart export
4. **Add insight cards** — "Usage increased 23% this week" with trend arrows
5. **Add top questions asked** chart — most common user queries
6. **Add document utilization** — which docs are referenced most/least in RAG
7. **Add cost breakdown by provider** — pie chart showing OpenAI vs local model costs
8. **Add real-time refresh** with polling or WebSocket for live data

**Priority:** P2 — Useful but not blocking beta launch.

---

## 10. Settings (`/settings`)

**File:** `app/(admin)/settings/page.tsx` (implied)

### Current State
- DashboardShell with settings sections
- AI provider settings, billing, usage, workspace, audit, widget, MCP
- All accessible from sidebar bottom nav

### Issues
1. **7+ separate settings pages** — too many routes; should be a single page with tabbed/sectioned navigation
2. **No search in settings** — can't quickly find a specific setting
3. **AI provider settings likely has raw API key input** — should have test/verify button
4. **No settings import/export** — can't back up or migrate settings
5. **MCP settings** are developer-only; should be hidden from regular users
6. **Audit log** is in settings but should be its own section
7. **No "Reset to defaults"** per section

### Competitor Reference
- **Notion:** Single Settings page with left sidebar navigation (My Account, Notifications, Connections, etc.), search bar
- **Linear:** Minimal settings — Account, Notifications, API, Workspace — all on one page

### Recommended Fix
1. **Consolidate into single Settings page** with left sidebar:
   - **General:** Profile, account, password
   - **AI:** Provider, model, API keys, system prompt
   - **Knowledge:** Embedding settings, chunk config
   - **Workspace:** Members, roles, invitations
   - **Integrations:** Widget, API keys, MCP
   - **Billing:** Plan, usage, invoices
   - **Advanced:** Audit log, data export, danger zone
2. **Add settings search bar** at top
3. **Add "Test connection" button** next to API key fields
4. **Add "Reset to defaults"** per section
5. **Hide MCP settings** behind developer/admin role check
6. **Add settings import/export** as JSON file

**Priority:** P1 — Settings UX impacts admin productivity.

---

## 11. Widget Configuration (`/settings/widget`)

**File:** `app/settings/widget/` (implied from sidebar)

### Current State
- DashboardShell with widget configuration form
- Settings form for embedding widget on external sites

### Issues
1. **No live preview** — users configure widget without seeing what it looks like
2. **No embed code generation** — users likely have to manually construct the embed script
3. **No test mode** — can't test widget on own site before deploying
4. **No customization options visible** — likely just basic enable/disable

### Competitor Reference
- **Intercom:** Live widget preview on right side, customize colors/position/greeting, generate embed code, test on your domain
- **Drift:** Widget builder with live preview, color picker, welcome message editor, deployment checklist
- **Crisp:** Real-time preview, customization panel, embed code with copy button

### Recommended Fix
1. **Add live preview panel** — split layout: settings on left, live widget preview on right (use `next/script` to render widget in sandboxed iframe)
2. **Add color picker** for widget theme (primary color, background)
3. **Add position selector** (bottom-right, bottom-left)
4. **Add greeting message** editor with character count
5. **Add embed code generator** with syntax-highlighted code block + copy button
6. **Add "Test on your site"** input — enter URL to see widget preview
7. **Add deployment checklist** — "Is API configured?", "Is widget enabled?", "Is CORS configured?"
8. **Add analytics preview** — "You'll see X conversations per week based on your traffic"

**Priority:** P2 — Nice to have for launch, core widget functionality works.

---

## 12. Knowledge Search (`/knowledge/search`)

**File:** `app/knowledge/search/page.tsx` + `components/knowledge/similarity-search.tsx`

### Current State
- DashboardShell with "Similarity Search" title
- Description: "Test and debug RAG retrieval"
- Search input: 3-row textarea with example queries
- Controls: Top-K (3-20), Threshold (0.3-0.8), Document filter
- Results: numbered list with similarity bar, content preview, chunk/document links
- Metrics: embed time, search time, total time
- Loading: skeleton loaders
- Empty state: dashed border, example query buttons
- Pre-search state: "Test your knowledge base retrieval"

### Issues
1. **Framed as a developer debug tool** — "Test and debug RAG retrieval" — regular users won't understand this
2. **No semantic highlighting** — query terms aren't highlighted in results
3. **No result ranking explanation** — why was result #1 ranked higher than #3?
4. **Fixed-width similarity bar** (`w-32`) — may not fit all screen sizes
5. **"Similarity Search" title** is technical jargon — should be "Search your knowledge" or "Find in documents"
6. **No "Ask AI" button** — after seeing search results, user can't immediately ask the AI about them
7. **Example queries are generic** — "What is the pricing model?" won't match user's actual documents
8. **No search history** — can't revisit previous searches
9. **Threshold control** is confusing — most users don't know what cosine similarity threshold means

### Competitor Reference
- **Perplexity:** Clean search-first UI, "Ask follow-up" button, inline sources with previews, "Pro Search" toggle
- **Algolia:** Instant search with highlighted terms, faceted filtering, search analytics
- **Elasticsearch Kibana:** Dev tools for search debugging with request/response views

### Recommended Fix
1. **Rename to "Search Knowledge"** — user-friendly, no jargon
2. **Add highlighted terms** in search results — wrap matching terms in `<mark>` tags
3. **Add "Ask AI about this"** button on each result — opens chat with context pre-filled
4. **Add search history** — save last 10 searches in localStorage
5. **Simplify controls** — hide Top-K and Threshold behind an "Advanced" toggle; default to sensible values
6. **Auto-generate example queries** from actual document titles/content
7. **Add relevance explanation** — "This chunk matched because it contains keywords: pricing, monthly, plan"
8. **Replace fixed-width similarity bar** with responsive width: `w-full max-w-32`
9. **Add "Compare with AI response"** mode — run the same query through the chat and show AI answer vs raw chunks
10. **Add search analytics** — "Top queries this week", "Queries with no results"

**Priority:** P1 — Important for knowledge base quality assurance.

---

## 13. Empty States (Cross-Cutting)

### Current State
- **Chat empty:** 🤖 emoji + "Selamat datang di Mimotes" + description text
- **Document list empty:** SVG file icon + "No documents yet" + CTA
- **Document list (filtered):** SVG icon + "No documents match your filters" + clear button
- **Knowledge search (pre-search):** SVG search icon + "Test your knowledge base retrieval" + example queries
- **Knowledge search (no results):** SVG face icon + "No results found" + suggestion

### Issues
1. **Inconsistent icon language** — Chat uses emoji (🤖), Document Explorer uses SVG inline, Search uses SVG inline — all different sizes and styles
2. **No visual illustrations** — all empty states are just text + simple icon; no custom artwork
3. **Chat empty state is unhelpful** — just says "ask questions" but doesn't suggest what to ask
4. **No progressive empty states** — "No documents yet" should feel different from "No search results"
5. **Mixed languages** — "Selamat datang di Mimotes" (Indonesian) vs "No documents yet" (English)
6. **No onboarding flow** — empty dashboard should guide user through first steps
7. **Empty states don't match brand** — generic SVG icons, no Mimotes personality

### Competitor Reference
- **Linear:** Custom illustrations for each empty state, helpful text, contextual CTAs
- **Notion:** "Press / for commands" hints, template suggestions, onboarding checklist
- **Slack:** "Start a conversation" with suggested topics and recent channels

### Recommended Fix
1. **Create unified empty state component** with props: `icon`, `title`, `description`, `cta`, `illustration?`
2. **Replace emoji with Lucide icons** in styled containers: `rounded-2xl bg-primary/10 p-4`
3. **Add custom SVG illustrations** — simple line art showing the concept (document going into AI, chat bubbles, search magnifying glass)
4. **Make chat empty state interactive** — suggested prompts + "Try uploading a document first" hint if no docs
5. **Add onboarding checklist** on empty dashboard: ☐ Upload document → ☐ Configure AI → ☐ Start first chat
6. **Standardize language** — pick English or Indonesian for all UI
7. **Add animations** — empty state icons should have subtle animation (float, pulse)
8. **Differentiate empty states** by intent: onboarding (first time) vs. filtered (active search) vs. error (no data)

**Priority:** P0 — Empty states are the first experience for new users.

---

## 14. Loading States (Cross-Cutting)

### Current State
- **Chat typing:** Bouncing dots (`animate-bounce` with `w-2 h-2 bg-muted-foreground/40 rounded-full`)
- **Document list:** Skeleton loaders using shadcn `<Skeleton>` component (correct approach)
- **Stat cards:** Suspense fallback with `StatCard loading` prop
- **Search:** Skeleton card placeholders during search
- **Dashboard stats:** Suspense with `StatCard loading` prop
- **Upload:** Spinner (`Loader2 animate-spin`)
- **Various:** `animate-spin rounded-full h-8 w-8` spinner

### Issues
1. **Inconsistent loading language** — bouncing dots in chat, skeletons in documents, spinners in upload — no unified pattern
2. **Bouncing dots in chat** look cheap — just 3 small circles; competitors have more polished animations
3. **No shimmer/pulse animation on skeletons** — just the default shadcn skeleton which may not match theme
4. **Full page spinners** — when switching pages, there's likely a blank screen or basic spinner
5. **No loading progress** for long operations — upload just shows spinner, no percentage
6. **No optimistic updates** — chat messages aren't shown immediately while saving
7. **No skeleton for sidebar/workspace switcher** — loading state is just a pulse div

### Competitor Reference
- **Linear:** Consistent skeleton loaders everywhere, shimmer effect, progress bars for file operations
- **Vercel:** Shimmer skeletons, smooth page transitions, partial loading states
- **Notion:** Content skeleton matches exact layout of loaded content

### Recommended Fix
1. **Standardize on skeleton loaders** — replace all spinners with skeletons that match the loaded content shape
2. **Add shimmer animation** to skeletons: `animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted`
3. **Chat typing indicator:** Replace bouncing dots with a pulsing avatar + "Mimotes is thinking..." or a more polished waveform animation
4. **Add page transition loading** — use `loading.tsx` files in Next.js App Router for instant page skeletons
5. **Add upload progress** — percentage bar with file name and bytes uploaded
6. **Add skeleton for sidebar** — skeleton workspace switcher, skeleton nav items
7. **Add optimistic UI** for chat — show user message immediately before server confirms
8. **Add `loading.tsx`** for all major routes: `/dashboard`, `/chat`, `/knowledge/documents`, `/analytics`

**Priority:** P1 — Loading states significantly impact perceived performance.

---

## 15. Error States (Cross-Cutting)

### Current State
- **Toast notifications** via `sonner` — `toast.error("Gagal memuat percakapan")`
- **Inline error divs** in search: `border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive`
- **Chat errors:** Shows "Maaf, terjadi kesalahan. Silakan coba lagi." as an assistant message
- **Network errors:** Generic toast with "Gagal mengirim pesan"
- **404/500 pages:** Likely default Next.js error pages (not customized)

### Issues
1. **No custom 404 page** — users hitting a wrong URL see generic Next.js 404
2. **No custom 500 page** — server errors show generic error
3. **Error messages are in Indonesian only** — "Gagal memuat percakapan" — inconsistent with English UI elsewhere
4. **No retry mechanism** — errors just show toast and die; no "Try again" button
5. **Chat error handling** adds an assistant message with error text — this pollutes the conversation
6. **No error boundary** — if a component crashes, the entire page may go white
7. **No network status indicator** — users don't know if they're offline
8. **No error logging visibility** — users can't report errors
9. **No "Rate limited" feedback** — if API rate limit is hit, user just sees a generic error
10. **Toast auto-dismiss** — errors disappear after a few seconds; user might miss them

### Competitor Reference
- **GitHub:** Custom 404 with Octocat illustration, "Take me home" link, search bar
- **Vercel:** Beautiful error pages with illustrations, "Go home" button, status page link
- **Notion:** Friendly error illustrations, "Try refreshing" CTA, "Contact support" link

### Recommended Fix
1. **Create custom `not-found.tsx`** — branded 404 page with Mimotes illustration, "Take me home" button, search bar
2. **Create custom `error.tsx`** — error boundary component with retry button, error details, "Contact support" link
3. **Standardize error language** — pick English for all error messages
4. **Add retry buttons** on all error states — "Try again", "Refresh page"
5. **Add network status indicator** — subtle "You're offline" banner when `navigator.onLine` is false
6. **Don't pollute chat with error messages** — show error in a toast + inline error banner, not as an assistant message
7. **Add rate limit feedback** — "Too many requests. Please wait X seconds." with countdown
8. **Add error toast with actions** — "Copy error details" button on error toasts
9. **Add global error boundary** — wrap `_layout.tsx` with ErrorBoundary component
10. **Add "Report issue" link** — opens email or GitHub issue with pre-filled context

**Priority:** P0 — Broken error states lose user trust. Custom 404/500 are essential for public beta.

---

## Cross-Cutting Themes

### Theme Consistency
- **Mixed hardcoded colors vs. theme tokens** — Landing, Login, Chat all use hardcoded `bg-white`, `text-gray-*`, `bg-blue-600` instead of `bg-background`, `text-foreground`, `bg-primary`. This must be fixed across all screens.
- **Mixed Indonesian/English** — UI strings alternate between languages. Pick one for public beta.

### Component Architecture
- **Inline SVGs everywhere** — message bubble, upload form, search. Standardize on lucide-react icons.
- **No shared empty state component** — each screen reinvents its own.
- **No shared error boundary** — each page handles errors differently.
- **No shared loading skeleton** — spinners vs. skeletons vs. pulses.

### Accessibility
- **No focus indicators visible** on many interactive elements
- **No aria-labels** on icon-only buttons
- **No skip-to-content link** on dashboard pages
- **No keyboard navigation** for chat (arrow keys between messages)
- **Color-only status indicators** — status badges should also use icons, not just color

### Responsive Design
- **Mobile-first gaps** — chat sidebar uses a sheet but the hamburger button position varies
- **Dashboard stat cards** stack well but Quick Actions grid doesn't adapt
- **Upload form** drag zone may not work well on mobile (no drag event)
- **Settings pages** likely need mobile-specific layouts

---

## Summary: Priority Matrix

| Priority | Screen | Key Action |
|----------|--------|------------|
| **P0** | Landing Page | Replace emoji, add theme tokens, add hero screenshot, add social proof |
| **P0** | Login Page | Brand the login, fix theme tokens, add forgot password |
| **P0** | Dashboard | Add recent chats, fix quick action labels, add onboarding |
| **P0** | Chat | Add suggested prompts, fix avatars, add regenerate/feedback |
| **P0** | Upload | Remove hardcoded demo data, add multi-file, add progress bar |
| **P0** | Empty States | Create unified component, replace emoji, add illustrations |
| **P0** | Error States | Custom 404/500, retry buttons, error boundaries |
| **P1** | Document List | Replace confirm(), add bulk actions, fix icon system |
| **P1** | Workspace Switcher | Fix reload, add create workspace, theme role badges |
| **P1** | Team Management | Add tabs, bulk invite, invite links |
| **P1** | Knowledge Search | Rename, add highlighting, simplify controls |
| **P1** | Loading States | Standardize skeletons, add shimmer, add page skeletons |
| **P2** | Analytics | Merge into single page, add comparisons, add export |
| **P2** | Settings | Consolidate into single page with tabs, add search |
| **P2** | Widget Config | Add live preview, embed code generator, color picker |
