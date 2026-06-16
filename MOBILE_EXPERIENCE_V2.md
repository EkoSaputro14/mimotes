# MimoNotes Mobile Experience V2 — Complete Specification

**Version:** 2.0.0
**Author:** Staff UX Designer + Mobile Specialist
**Date:** June 2026
**Status:** Implementation-Ready Specification
**Target Devices:** iPhone 14–16, Samsung Galaxy S23–24, iPad (10th gen+)
**Design System:** Warm-purple 265°, Geist fonts, 4px grid

---

## Table of Contents

1. [Mobile Design Principles](#1-mobile-design-principles)
2. [Mobile Navigation](#2-mobile-navigation)
3. [Mobile Chat](#3-mobile-chat)
4. [Mobile Dashboard](#4-mobile-dashboard)
5. [Mobile Documents](#5-mobile-documents)
6. [Mobile Upload](#6-mobile-upload)
7. [Mobile Settings](#7-mobile-settings)
8. [Mobile Workspace](#8-mobile-workspace)
9. [Touch Interactions](#9-touch-interactions)
10. [Haptic Feedback](#10-haptic-feedback)
11. [Mobile Keyboard](#11-mobile-keyboard)
12. [Offline Support](#12-offline-support)
13. [Mobile Performance](#13-mobile-performance)
14. [Mobile Accessibility](#14-mobile-accessibility)
15. [Platform-Specific](#15-platform-specific)
16. [Mobile Components](#16-mobile-components)

---

## 1. Mobile Design Principles

### 1.1 Core Principles

| Principle | Definition | Implementation |
|-----------|-----------|----------------|
| **Touch-First** | Every interactive element is designed for touch, not hover | 44px minimum touch targets; 48px for primary actions |
| **Thumb-Friendly** | Primary actions reachable with one hand | Critical CTAs in bottom 40% of screen; bottom tab bar |
| **Progressive Disclosure** | Show essentials first, reveal detail on demand | Collapsed sections, bottom sheets, expandable cards |
| **Offline-Aware** | Graceful degradation without connectivity | Cached data, queued actions, offline indicator |
| **Performance** | Fast load, smooth 60fps animations | Lazy load, virtual scroll, optimized assets |

### 1.2 Spacing System (4px Grid)

```
Spacing Token    Value    Use Case
─────────────────────────────────────
$space-xxs       4px      Inline icon gaps
$space-xs        8px      Tight padding (input fields)
$space-sm        12px     List item padding
$space-md        16px     Standard padding
$space-lg        24px     Section spacing
$space-xl        32px     Page margins
$space-xxl       48px     Major section breaks
```

### 1.3 Touch Target Minimums

```
Element              Min Size    Recommended
────────────────────────────────────────────
Icon button          44×44px     48×48px
Text link            44×44px     48×48px (hit area)
Toggle switch        51×31px     51×31px (iOS default)
Tab bar item         48×48px     64×64px (full tab)
List item            auto×48px   auto×56px
FAB                  56×56px     56×56px
Swipe action         auto×72px   auto×80px
```

### 1.4 Typography Scale (Mobile)

```
Token          Size    Weight    Line-Height    Use
──────────────────────────────────────────────────────────
$font-display  28px    700       36px           Hero titles
$font-h1       24px    600       32px           Page titles
$font-h2       20px    600       28px           Section headings
$font-h3       17px    600       24px           Card titles
$body-lg       17px    400       24px           Chat messages
$body          16px    400       24px           Body text (prevents iOS zoom)
$body-sm       14px    400       20px           Captions, timestamps
$caption       12px    400       16px           Labels, badges
$legal         11px    400       14px           Fine print
```

> **Critical:** All `<input>` and `<textarea>` elements use `font-size: 16px` minimum to prevent iOS auto-zoom on focus.

### 1.5 Color Usage (Mobile Adaptations)

```
Color                    Hex          Mobile Use
──────────────────────────────────────────────────
$purple-500 (primary)    #8B5CF6      Active tabs, primary buttons
$purple-600 (hover)      #7C3AED      Pressed state
$purple-50 (bg)          #F5F3FF      Active tab background tint
$gray-50 (surface)       #F9FAFB      Card backgrounds
$gray-100 (border)       #F3F4F6      Dividers, borders
$gray-400 (muted)        #9CA3AF      Inactive icons, captions
$gray-900 (text)         #111827      Primary text
$white                   #FFFFFF      Chat bubbles (assistant)
$green-500               #22C55E      Online indicator
$red-500                 #EF4444      Error states, destructive actions
$overlay                 rgba(0,0,0,0.5)  Drawer/scrim
```

---

## 2. Mobile Navigation

### 2.1 Architecture Overview

```
┌─────────────────────────────────┐
│         MOBILE SHELL            │
│                                 │
│  ┌───────────────────────────┐  │
│  │     Mobile Header         │  │
│  │  (title + back + actions) │  │
│  ├───────────────────────────┤  │
│  │                           │  │
│  │     Page Content          │  │
│  │     (scrollable)          │  │
│  │                           │  │
│  │                           │  │
│  ├───────────────────────────┤  │
│  │     Bottom Tab Bar        │  │
│  │  (Home|Chat|Docs|Know|+) │  │
│  ├───────────────────────────┤  │
│  │     Safe Area (iOS)       │  │
│  └───────────────────────────┘  │
│                                 │
│  Overlays:                      │
│  - Sidebar drawer (right)       │
│  - Bottom sheets                │
│  - Context menus                │
│  - Modal dialogs                │
└─────────────────────────────────┘
```

### 2.2 Bottom Tab Bar

#### Wireframe — Tab Bar

```
┌─────────────────────────────────────────────┐
│                                             │
│  Page content here...                       │
│                                             │
├─────────────────────────────────────────────┤
│ ┌──────┬──────┬──────┬──────┬──────┐       │
│ │  🏠  │  💬  │  📄  │  🧠  │  ⋯   │ 48px │
│ │ Home │ Chat │ Docs │ Know │ More │       │
│ └──────┴──────┴──────┴──────┴──────┘       │
├─────────────────────────────────────────────┤
│          Safe Area Bottom (34px)             │
└─────────────────────────────────────────────┘

Active tab: icon filled + purple-500 + label purple-500
Inactive:   icon outline + gray-400 + label gray-400
```

#### Tab Bar Spec

```
Property                    Value
─────────────────────────────────────────
Height (content)            48px
Height (with safe area)     48px + safe-area-inset-bottom
Background                  $white / rgba(255,255,255,0.95)
Backdrop filter             blur(20px) saturate(180%)
Border top                  0.5px solid $gray-100
Z-index                     100
Position                    fixed bottom
Icon size                   24×24px
Active icon                 Filled variant, $purple-500
Inactive icon               Outline variant, $gray-400
Label font                  $caption (11px, 500 weight)
Active label                $purple-500
Inactive label              $gray-400
Item gap                    0 (flex: 1, equal distribution)
Padding (horizontal)        16px outer
Tab change animation        Scale 1→0.9→1, 150ms ease
Badge                       6px circle, red-500, top-right offset
```

#### Tab Definitions

```
Tab       Icon          Route              Badge Logic
──────────────────────────────────────────────────────
Home      house         /                  —
Chat      message       /chat              Unread message count
Documents file-text     /documents         —
Knowledge brain         /knowledge         —
More      ellipsis      (bottom sheet)     —
```

### 2.3 'More' Tab — Bottom Sheet

```
┌─────────────────────────────────┐
│  ─── (drag handle) ───          │
│                                 │
│  ⚙️  Settings                   │
│  ─────────────────────────      │
│  👥  Team Management            │
│  ─────────────────────────      │
│  🏢  Workspaces                 │
│  ─────────────────────────      │
│  📊  Usage & Billing            │
│  ─────────────────────────      │
│  ❓  Help & Support             │
│  ─────────────────────────      │
│  📝  What's New                 │
│  ─────────────────────────      │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Version 2.0.0          │    │
│  └─────────────────────────┘    │
│                                 │
│          Safe Area (34px)       │
└─────────────────────────────────┘

Height: Auto (max 60% of screen)
Background: $white
Border-radius: 16px 16px 0 0
Scrim: $overlay, tap to dismiss
Animation: Slide up 300ms spring(1, 80, 10)
Drag handle: 36px × 4px, $gray-300, rounded
Item height: 56px
Item padding: 16px horizontal
Icon: 24px, left-aligned
Label: $body (16px), left-aligned after icon
```

### 2.4 Sidebar Drawer

```
┌───────────────┬────────────────────┐
│               │                    │
│  Sidebar      │   Content          │
│  (280px)      │   (dimmed scrim)   │
│               │                    │
│  ┌─────────┐  │   rgba(0,0,0,0.5) │
│  │ MimoNotes│  │                    │
│  │ Logo     │  │   Tap scrim to    │
│  ├─────────┤  │   close            │
│  │         │  │                    │
│  │ 📋 New   │  │                    │
│  │    Chat  │  │                    │
│  │         │  │                    │
│  │ Recent   │  │                    │
│  │ ─────── │  │                    │
│  │ Chat 1   │  │                    │
│  │ Chat 2   │  │                    │
│  │ Chat 3   │  │                    │
│  │ ...      │  │                    │
│  │         │  │                    │
│  ├─────────┤  │                    │
│  │ 👤 User  │  │                    │
│  │ Menu     │  │                    │
│  └─────────┘  │                    │
│               │                    │
└───────────────┴────────────────────┘

Width: 280px (max 80% screen width)
Background: $white
Shadow: 0 0 40px rgba(0,0,0,0.15)
Animation: Slide from left 300ms spring
Scrim: rgba(0,0,0,0.5), fade in 200ms
Drag gesture: Pan left-to-right from screen edge (20px threshold)
Close: Swipe left, tap scrim, or back button
```

### 2.5 Navigation Hierarchy

```
Tab: Home
  └── Dashboard (default)

Tab: Chat
  ├── Session List (default — bottom sheet)
  │   └── Chat Session (full-screen)
  │       └── Source Panel (slide-up)
  └── New Chat (FAB)

Tab: Documents
  ├── Document List (default)
  │   └── Document Detail
  │       └── Document Viewer
  └── Upload Flow (bottom sheet)

Tab: Knowledge
  ├── Knowledge Base List
  │   └── Knowledge Detail
  │       └── Source Management

Tab: More (bottom sheet)
  ├── Settings
  │   ├── Profile
  │   ├── Notifications
  │   ├── Appearance
  │   ├── Data & Privacy
  │   └── About
  ├── Team Management
  ├── Workspaces
  └── Help & Support
```

---

## 3. Mobile Chat

### 3.1 Chat Screen Layout

#### Wireframe — Full Chat Screen

```
┌─────────────────────────────────┐
│ ← MimoNotes Chat    📋  ⋮     │ 44px header
├─────────────────────────────────┤
│                                 │
│  Suggested prompts (horiz)      │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │Summar│ │Explain│ │List  │   │
│  │ize.. │ │ this │ │ key..│   │
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  ┌─────────────────────────┐    │
│  │ You: What is RAG?       │    │  User bubble
│  │            10:23 AM ────│─── │  (right-aligned)
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 🤖 RAG (Retrieval-      │    │  Assistant bubble
│  │ Augmented Generation)   │    │  (left-aligned)
│  │ is a technique that...  │    │
│  │                         │    │
│  │ Sources:                │    │
│  │ 📄 [Document 1]    [↗]  │    │
│  │ 📄 [Document 2]    [↗]  │    │
│  │            10:23 AM     │    │
│  └─────────────────────────┘    │
│                                 │
│           ...                   │
│                                 │
├─────────────────────────────────┤
│ ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│ │ Type a message...      📎🎤│  │ Input area
│ │                            │  │ auto-growing
│ └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
├─────────────────────────────────┤
│          Safe Area (34px)       │
└─────────────────────────────────┘
```

### 3.2 Chat Header

```
Property                    Value
─────────────────────────────────────────
Height                      44px (+ status bar)
Background                  $white
Border-bottom              0.5px solid $gray-100
Back button                 24px, left: 16px, tap area: 44px
Title                       $font-h3 (17px, 600), centered
Menu button                 24px, right: 16px (opens session list)
Session list icon           clipboard or list icon
```

### 3.3 Message Bubbles

#### User Bubble

```
                    ┌─────────────────────┐
                    │ What is RAG?        │
                    │              10:23  │
                    └─────────────────────┘
                    ← right-aligned

Background:          $purple-500
Text color:          $white
Font:                $body-lg (17px)
Padding:             12px horizontal, 10px vertical
Border-radius:       18px 18px 4px 18px
Max width:           80% of screen
Margin-bottom:       8px
Margin-right:        16px (screen edge)
Margin-left:         48px
Timestamp:           $caption (11px), 40% opacity, below bubble
```

#### Assistant Bubble

```
┌─────────────────────────────┐
│ 🤖  RAG (Retrieval-Augmented│
│ Generation) is a technique  │
│ that combines retrieval...  │
│                             │
│ Sources:                    │
│ ┌───────────────────────┐   │
│ │ 📄 Research Paper  [↗]│   │
│ └───────────────────────┘   │
│ ┌───────────────────────┐   │
│ │ 📄 Tech Blog      [↗]│   │
│ └───────────────────────┘   │
│                  10:23 AM   │
└─────────────────────────────┘
← left-aligned

Background:          $white
Border:              1px solid $gray-100
Text color:          $gray-900
Font:                $body-lg (17px)
Padding:             12px horizontal, 12px vertical
Border-radius:       18px 18px 18px 4px
Max width:           85% of screen
Margin-bottom:       8px
Margin-left:         16px (screen edge)
Margin-right:        48px
Avatar:              32×32px circle, left of bubble, top-aligned
```

#### Source Card (inside assistant bubble)

```
┌───────────────────────────────┐
│ 📄  Research Paper Title      │
│     Source · 2.3s ago    [↗] │
└───────────────────────────────┘

Height:       52px
Background:   $gray-50
Border:       1px solid $gray-100
Border-radius: 8px
Padding:      8px 12px
Icon:         16px, $gray-400, left
Title:        $body-sm (14px), 500 weight, single line, ellipsis
Subtitle:     $caption (11px), $gray-400
External link: 16px icon, right side
```

### 3.4 Input Area

#### Wireframe — Input Area

```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ Type a message...           │ │  textarea
│ │                             │ │  min-height: 44px
│ └─────────────────────────────┘ │  max-height: 120px
│ ┌──┐ ┌──┐              ┌──┐   │
│ │📎│ │😊│              │ ➤│   │  40×40px buttons
│ └──┘ └──┘              └──┘   │
├─────────────────────────────────┤
│          Safe Area (34px)       │
└─────────────────────────────────┘
```

#### Input Spec

```
Property                    Value
─────────────────────────────────────────
Container background        $gray-50
Container border            1px solid $gray-200
Container border-radius     24px
Container padding           8px 8px 8px 16px
Container margin            8px 16px
Font-size                   16px (CRITICAL: prevents iOS zoom)
Font-family                 Geist Sans
Line-height                 20px
Color                       $gray-900
Placeholder color           $gray-400
Min-height                  44px
Max-height                  120px
Auto-grow                   Yes (on input)
Scrollbar                   Hidden
Send button size            40×40px
Send button background      $purple-500 (when text present)
                            $gray-200 (when empty)
Send button icon            Arrow-up, 20px, $white
Attachment button size      40×40px
Attachment button icon      Paperclip, 20px, $gray-500
```

### 3.5 Suggested Prompts

```
┌─────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────┐ ┌────────┐ ┌─────┐ │
│ │Summariz│ │Explain   │ │List    │ │Compa│→ │  scrollable
│ │e this  │ │like I'm  │ │key     │ │re & │ │  horizontal
│ │document│ │5 years   │ │points  │ │contr│ │
│ └────────┘ └──────────┘ └────────┘ └─────┘ │
└─────────────────────────────────────────────┘

Display:        Only shown when chat is empty (no messages)
Position:       Below header, above messages
Scroll:         Horizontal, snap-to-item
Card width:     160px (fixed)
Card height:    56px
Card background: $white
Card border:    1px solid $gray-200
Card border-radius: 12px
Card padding:   12px
Text:           $body-sm (14px), 2–3 lines, ellipsis
Text color:     $gray-700
Gap:            8px horizontal
Margin:         0 16px horizontal
Fade edges:     Right edge gradient mask (optional)
```

### 3.6 Streaming Animation

```
Behavior:
- Characters appear one-by-one (typewriter effect)
- Cursor blinking at end during stream
- Auto-scroll to bottom during stream
- Smooth scroll (not jump)
- Stop auto-scroll when user scrolls up
- "Stop generating" button appears during stream

Animation spec:
- Character interval: 20ms (fast) to 50ms (slow, depending on length)
- Auto-scroll speed: 30px/frame max
- Scroll threshold: 100px from bottom = auto-scroll ON
- Cursor: 2px wide, $purple-500, blink 1s infinite

Stop button:
- Position: Centered above input area
- Background: $gray-800
- Text: $white, "Stop generating", 14px
- Border-radius: 20px
- Padding: 8px 20px
- Appears: When streaming starts
- Disappears: When stream completes
```

### 3.7 Session List (Bottom Sheet)

```
┌─────────────────────────────────┐
│  ─── (drag handle) ───          │
│                                 │
│  Recent Conversations     [New] │
│  ─────────────────────────      │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 💬 What is RAG?         │    │
│  │    2 min ago        [⋯] │    │
│  ├─────────────────────────┤    │
│  │ 💬 Explain this code    │    │
│  │    1 hour ago       [⋯] │    │
│  ├─────────────────────────┤    │
│  │ 💬 Summarize document   │    │
│  │    Yesterday        [⋯] │    │
│  └─────────────────────────┘    │
│                                 │
│          Safe Area (34px)       │
└─────────────────────────────────┘

Height: 60% of screen (max)
Each item:
  Height: 64px
  Padding: 12px 16px
  Icon: 20px chat bubble, $gray-400
  Title: $body (16px), single line, ellipsis
  Subtitle: $caption (11px), $gray-400
  Menu button: 24×24px, right side
  Separator: 0.5px $gray-100
  Swipe left: Delete (red background)
```

---

## 4. Mobile Dashboard

### 4.1 Dashboard Layout

#### Wireframe — Dashboard

```
┌─────────────────────────────────┐
│  Home                   🔔  👤  │ 44px header
├─────────────────────────────────┤
│  ↓ Pull to refresh              │
│                                 │
│  ┌─────────────────────────┐    │
│  │  Good morning, User! 👋 │    │  Hero card
│  │  What would you like    │    │  24px padding
│  │  to work on today?      │    │
│  └─────────────────────────┘    │
│                                 │
│  Quick Actions                  │
│  ┌──────────┐ ┌──────────┐     │
│  │ 💬 New   │ │ 📄 Upload │     │  2×2 grid
│  │ Chat     │ │ Document │     │
│  └──────────┘ └──────────┘     │
│  ┌──────────┐ ┌──────────┐     │
│  │ 🔍 Search│ │ 🧠 Browse │     │
│  │ Docs     │ │ Knowledge│     │
│  └──────────┘ └──────────┘     │
│                                 │
│  Recent Activity                │
│  ┌─────────────────────────┐    │
│  │ 📄 Updated "API docs"   │    │
│  │    5 min ago            │    │
│  ├─────────────────────────┤    │
│  │ 💬 Chat about RAG       │    │
│  │    1 hour ago           │    │
│  ├─────────────────────────┤    │
│  │ 📄 Uploaded "report.pdf"│    │
│  │    Yesterday            │    │
│  └─────────────────────────┘    │
│                                 │
│  Usage This Month               │
│  ┌──────────┐ ┌──────────┐     │
│  │ 📊 42    │ │ 💬 128   │     │  compact cards
│  │ Queries  │ │ Messages │     │
│  └──────────┘ └──────────┘     │
│                                 │
├─────────────────────────────────┤
│  🏠  💬  📄  🧠  ⋯             │  Tab bar
│  Home Chat Docs Know More      │
└─────────────────────────────────┘
```

### 4.2 Dashboard Component Specs

#### Hero Card

```
Background:           Linear gradient $purple-500 → $purple-600
Text color:           $white
Border-radius:        16px
Padding:              24px
Margin:               16px horizontal
Font (greeting):      $font-h1 (24px, 600)
Font (subtitle):      $body-lg (17px), 80% opacity
```

#### Quick Action Grid

```
Layout:               CSS Grid, 2 columns
Gap:                  12px
Margin:               16px horizontal, 24px vertical
Each card:
  Background:         $white
  Border:             1px solid $gray-100
  Border-radius:      12px
  Padding:            16px
  Min-height:         80px
  Icon:               28px, top-left
  Label:              $body-sm (14px, 500), below icon
  Tap:                Navigate to feature
```

#### Activity Feed

```
Margin:               16px horizontal
Each item:
  Height:             56px
  Padding:            12px 0
  Icon:               20px circle, $gray-50 bg, left
  Title:              $body-sm (14px), single line
  Subtitle:           $caption (11px), $gray-400
  Separator:          0.5px $gray-100, bottom
Infinite scroll:      Load more at bottom
Skeleton:             3 placeholder items while loading
```

#### Usage Stats

```
Layout:               2-column grid
Gap:                  12px
Margin:               16px horizontal
Each card:
  Background:         $white
  Border:             1px solid $gray-100
  Border-radius:      12px
  Padding:            16px
  Icon:               24px, top
  Number:             $font-h1 (24px, 700)
  Label:              $caption (11px), $gray-400
```

---

## 5. Mobile Documents

### 5.1 Document List

#### Wireframe — Document List (List View)

```
┌─────────────────────────────────┐
│  Documents       🔍  ⊞/☰       │ 44px header
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔍  Search documents...    │ │  search bar
│ └─────────────────────────────┘ │
│                                 │
│  Sort: Recent ▼  Filter: All ▼ │  filter bar
│  ─────────────────────────      │
│                                 │
│  ┌─────────────────────────┐    │
│  │ 📄  API Documentation    │←──│  Swipe left reveals
│  │     Updated 2h ago      │───→│  red DELETE panel
│  │     2.4 MB · PDF        │    │
│  └─────────────────────────┘    │
│  ─────────────────────────      │
│  ┌─────────────────────────┐    │
│  │ 📊  Q4 Report           │    │
│  │     Updated yesterday   │    │
│  │     1.1 MB · DOCX       │    │
│  └─────────────────────────┘    │
│  ─────────────────────────      │
│  ┌─────────────────────────┐    │
│  │ 📝  Meeting Notes        │    │
│  │     Updated 3 days ago  │    │
│  │     128 KB · TXT         │    │
│  └─────────────────────────┘    │
│                                 │
│                   ┌──────┐      │
│                   │  +   │      │  FAB
│                   └──────┘      │
│                                 │
├─────────────────────────────────┤
│  🏠  💬  📄  🧠  ⋯             │  Tab bar
└─────────────────────────────────┘
```

#### Document Item — List View

```
Height:               72px
Padding:              12px 16px
Layout:               Row (icon | content | menu)
Icon area:
  Width:              40px
  Icon:               24px, file type colored
  Background:         Colored bg by type
  Border-radius:      8px
Content area:
  Flex:               1
  Title:              $body (16px, 500), single line, ellipsis
  Subtitle 1:         $body-sm (14px), $gray-500, "Updated 2h ago"
  Subtitle 2:         $caption (11px), $gray-400, "2.4 MB · PDF"
Menu button:
  Width:              40px
  Icon:               vertical dots, 20px
  Tap area:           44×44px
Separator:            0.5px $gray-100, inset 16px left
```

### 5.2 Document Item — Grid View

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│          │  │          │  │          │
│  📄      │  │  📊      │  │  📝      │
│          │  │          │  │          │
│ API Docs │  │ Q4 Report│  │ Notes    │
│ 2.4 MB   │  │ 1.1 MB   │  │ 128 KB   │
│ PDF      │  │ DOCX     │  │ TXT      │
└──────────┘  └──────────┘  └──────────┘

Card width:          (screen - 48px) / 2
Card height:         140px
Background:          $white
Border:              1px solid $gray-100
Border-radius:       12px
Padding:             12px
Icon (center):       32px
Title:               $body-sm (14px, 500), single line
Meta:                $caption (11px), $gray-400
Gap:                 12px
```

### 5.3 Swipe Actions

```
Left swipe reveals:
┌─────────────────────────────────┐
│              │  📤  │  🗃️  │  🗑️ │
│  Document    │Share │Archive│ Delete│
│  title       │      │       │       │
│              │ 80px │ 80px  │ 80px  │
└─────────────────────────────────┘

Share:    Background $purple-500, icon $white
Archive:  Background $gray-600, icon $white
Delete:   Background $red-500, icon $white

Each action button:
  Width: 80px
  Full height of item
  Icon: 20px, centered
  Label: $caption (11px), below icon, centered
  Tap: Execute action + haptic feedback
```

### 5.4 Long Press Context Menu

```
┌─────────────────────────┐
│ 📄  Open                │
│ ───────────────────     │
│ 📋  Rename              │
│ 📤  Share               │
│ 🗃️  Archive             │
│ ───────────────────     │
│ 🗑️  Delete  (red)       │
└─────────────────────────┘

Background:     $white
Border-radius:  12px
Shadow:         0 4px 24px rgba(0,0,0,0.15)
Padding:        4px 0
Item height:    44px
Item padding:   0 16px
Icon:           20px, left
Label:          $body (16px)
Separator:      0.5px $gray-100, inset 12px
Position:       Anchor to pressed item
Animation:      Scale from 0.9 → 1, 150ms ease
```

### 5.5 Search Bar

```
┌───────────────────────────────┐
│ 🔍  Search documents...    ✕  │
└───────────────────────────────┘

Height:           40px
Background:       $gray-50
Border:           1px solid $gray-200
Border-radius:    20px
Padding:          0 12px
Font:             $body (16px)
Icon:             16px, $gray-400, left
Clear button:     20px, $gray-400, right
Margin:           16px horizontal, 12px vertical
```

---

## 6. Mobile Upload

### 6.1 Upload Trigger

```
FAB (Floating Action Button):
  Size:       56×56px
  Position:   Bottom-right, 16px above tab bar
  Background: $purple-500
  Icon:       Plus, 24px, $white
  Shadow:     0 4px 12px rgba(139,92,246,0.4)
  Tap:        Opens upload bottom sheet

FAB animation:
  - Idle:     Scale 1
  - Press:    Scale 0.9
  - Tap:      Scale 1 + ripple
```

### 6.2 Upload Bottom Sheet

```
┌─────────────────────────────────┐
│  ─── (drag handle) ───          │
│                                 │
│  Upload Document                │
│                                 │
│  ┌─────────────────────────┐    │
│  │  📷  Take Photo          │    │
│  │  Capture with camera     │    │
│  ├─────────────────────────┤    │
│  │  🖼️  Photo Library       │    │
│  │  Choose from gallery     │    │
│  ├─────────────────────────┤    │
│  │  📁  Browse Files        │    │
│  │  PDF, DOCX, TXT, CSV    │    │
│  ├─────────────────────────┤    │
│  │  📋  Paste from Clipboard│    │
│  │  Paste text content      │    │
│  └─────────────────────────┘    │
│                                 │
│          Safe Area (34px)       │
└─────────────────────────────────┘

Height: Auto
Each option:
  Height: 64px
  Padding: 12px 16px
  Icon: 24px, left, $purple-500
  Title: $body (16px, 500)
  Subtitle: $body-sm (14px), $gray-400
  Separator: 0.5px $gray-100
```

### 6.3 Upload Progress

```
┌─────────────────────────────────┐
│  Uploading... 2/5 files         │
│  ┌───────────────────────────┐  │
│  │ ████████████░░░░░  67%    │  │  progress bar
│  └───────────────────────────┘  │
│  📄 report.pdf          1.2 MB  │
│  📄 api-docs.pdf        2.4 MB  │
│  ⏳ notes.txt           128 KB  │
│  ✓  summary.docx        89 KB   │  (completed)
│                                 │
│         [ Cancel All ]          │
│                                 │
└─────────────────────────────────┘

Progress bar:
  Height:           4px
  Background:       $gray-100
  Fill:             $purple-500
  Border-radius:    2px
  Animation:        Width transition 300ms ease

File list item:
  Height:           44px
  Padding:          8px 16px
  Icon:             20px (spinner for uploading, check for done)
  Name:             $body-sm (14px), single line
  Size:             $caption (11px), $gray-400, right
```

### 6.4 Camera Capture (iOS)

```
Use native camera API:
  - navigator.mediaDevices.getUserMedia()
  - Or <input type="file" accept="image/*" capture="environment">
  - Front/back camera selection
  - Flash toggle
  - Image quality: 80% JPEG
  - Max resolution: 2048px on longest side
  - Auto-rotate based on EXIF
```

### 6.5 File Picker

```
Accepted formats:
  - PDF  (.pdf)
  - Word (.docx)
  - Text (.txt)
  - CSV  (.csv)
  - Markdown (.md)
  - Images (.jpg, .png, .webp)

Max file size:     50MB
Multi-select:      Yes (up to 10 files)
Use: <input type="file" multiple>

iPad drag-and-drop:
  - Support UIDropInteractionDelegate
  - Accept UTType.pdf, UTType.plainText, UTType.commaSeparatedValues
  - Visual drop zone overlay
```

---

## 7. Mobile Settings

### 7.1 Settings List

#### Wireframe — Settings

```
┌─────────────────────────────────┐
│  ← Settings                     │ 44px header
├─────────────────────────────────┤
│                                 │
│  ACCOUNT                        │  section header
│  ┌─────────────────────────┐    │
│  │ 👤  Profile           → │    │
│  ├─────────────────────────┤    │
│  │ 🔔  Notifications     → │    │
│  ├─────────────────────────┤    │
│  │ 🔒  Privacy & Security→ │    │
│  └─────────────────────────┘    │
│                                 │
│  APPEARANCE                     │
│  ┌─────────────────────────┐    │
│  │ 🌙  Dark Mode       ──○│    │  toggle
│  ├─────────────────────────┤    │
│  │ 🔤  Text Size        → │    │  sub-page
│  ├─────────────────────────┤    │
│  │ 🌐  Language          │    │
│  │     English          ▼ │    │  inline picker
│  └─────────────────────────┘    │
│                                 │
│  DATA                           │
│  ┌─────────────────────────┐    │
│  │ 📊  Usage & Billing   → │    │
│  ├─────────────────────────┤    │
│  │ 💾  Storage            │    │
│  │     1.2 GB of 5 GB    │    │  progress
│  ├─────────────────────────┤    │
│  │ 🗑️  Clear Cache       │    │  destructive
│  ├─────────────────────────┤    │
│  │ 📤  Export Data       → │    │
│  └─────────────────────────┘    │
│                                 │
│  ABOUT                          │
│  ┌─────────────────────────┐    │
│  │ ℹ️  Version 2.0.0       │    │
│  ├─────────────────────────┤    │
│  │ 📝  Terms of Service  → │    │
│  ├─────────────────────────┤    │
│  │ 🔐  Privacy Policy    → │    │
│  └─────────────────────────┘    │
│                                 │
│       [ Sign Out ]              │  red text button
│                                 │
└─────────────────────────────────┘
```

### 7.2 Settings Item Specs

#### List Item (Navigation)

```
Height:             48px
Padding:            0 16px
Layout:             Icon | Label | Chevron
Icon:               20px, $gray-500, left (24px from edge)
Label:              $body (16px), after icon
Chevron:            16px, $gray-300, right (16px from edge)
Background:         $white
Separator:          0.5px $gray-100, inset 56px left
```

#### List Item (Toggle)

```
Height:             48px
Padding:            0 16px
Layout:             Icon | Label | Toggle
Icon:               20px, $gray-500, left
Label:              $body (16px)
Toggle:             Standard iOS/Android toggle
Toggle ON:          $purple-500 background, white thumb
Toggle OFF:         $gray-200 background, white thumb
```

#### List Item (Value)

```
Height:             48px
Layout:             Icon | Label | Value | Chevron
Value:              $body (16px), $gray-400, before chevron
Example:            "English ▼"
```

#### Section Header

```
Font:               $caption (11px), 600 weight, uppercase
Color:              $gray-400
Padding:            24px 16px 8px
```

### 7.3 Sub-Page Pattern

```
┌─────────────────────────────────┐
│  ← Setting Name                 │ 44px header with back
├─────────────────────────────────┤
│                                 │
│  Grouped content                │
│  ┌─────────────────────────┐    │
│  │ Option 1            ──○│    │
│  ├─────────────────────────┤    │
│  │ Option 2            ──●│    │  purple when ON
│  ├─────────────────────────┤    │
│  │ Option 3            ──○│    │
│  └─────────────────────────┘    │
│                                 │
│  Description text at bottom     │
│  $caption (11px), $gray-400     │
│  centered, 16px horizontal      │
│                                 │
└─────────────────────────────────┘
```

---

## 8. Mobile Workspace

### 8.1 Workspace Switcher

```
Trigger: Tap workspace name in header or sidebar
UI: Bottom sheet

┌─────────────────────────────────┐
│  ─── (drag handle) ───          │
│                                 │
│  Switch Workspace               │
│  ─────────────────────────      │
│  ┌─────────────────────────┐    │
│  │ ✅  Personal             │    │  checkmark = active
│  ├─────────────────────────┤    │
│  │     🏢  Work Team        │    │
│  ├─────────────────────────┤    │
│  │     🎓  Study Group      │    │
│  └─────────────────────────┘    │
│                                 │
│  ┌─────────────────────────┐    │
│  │  + Create Workspace      │    │
│  └─────────────────────────┘    │
│                                 │
│          Safe Area (34px)       │
└─────────────────────────────────┘

Item height: 56px
Icon: 24px (checkmark or workspace icon)
Label: $body (16px)
Active indicator: $purple-500 checkmark, left
```

### 8.2 Team Management

```
┌─────────────────────────────────┐
│  ← Team Management    + Invite  │
├─────────────────────────────────┤
│                                 │
│  MEMBERS (3)                    │
│  ┌─────────────────────────┐    │
│  │ 👤  John Doe             │    │
│  │     Owner · john@co.com │    │
│  ├─────────────────────────┤    │
│  │ 👤  Jane Smith           │    │
│  │     Admin · jane@co.com │    │
│  ├─────────────────────────┤    │
│  │ 👤  Bob Wilson           │    │
│  │     Member · bob@co.com │    │
│  └─────────────────────────┘    │
│                                 │
│  PENDING INVITES (1)            │
│  ┌─────────────────────────┐    │
│  │ 📧  alice@co.com        │    │
│  │     Invited · Resend    │    │
│  └─────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

### 8.3 Invite Flow

```
Option 1: Share Sheet (native)
  - Share link via iOS/Android share sheet
  - Copy link to clipboard
  - Send via Messages, Mail, etc.

Option 2: Email invite
  ┌─────────────────────────────┐
  │  Invite by Email            │
  │                             │
  │  ┌───────────────────────┐  │
  │  │ Enter email address   │  │
  │  └───────────────────────┘  │
  │                             │
  │  Role: [Member ▼]           │
  │                             │
  │  ┌───────────────────────┐  │
  │  │     Send Invite       │  │
  │  └───────────────────────┘  │
  └─────────────────────────────┘
```

---

## 9. Touch Interactions

### 9.1 Gesture Map

```
Gesture             Area              Action                    Haptic
──────────────────────────────────────────────────────────────────────
Tap                 Anywhere          Select/activate           Light
Long press (500ms)  List items        Context menu              Medium
Swipe left          Document list     Reveal actions            Light
Swipe right         Screen edge (20px) Back / open sidebar     Light
Pinch               Images, docs      Zoom in/out               None
Pull down           Top of list       Refresh                   Medium
Double tap          Message bubble    Like/favorite             Success
Swipe up            Bottom sheet      Expand/dismiss            None
Swipe down          Bottom sheet      Dismiss                   None
Swipe               Chat messages     Reply to (future)         Light
```

### 9.2 Gesture Implementation

```
Tap detection:
  - Pointer events (pointerdown/pointerup)
  - Max movement threshold: 10px
  - Max duration: 300ms
  - Cancel if movement > 10px or duration > 300ms

Long press:
  - Start timer on pointerdown (500ms)
  - Cancel if movement > 10px
  - Cancel on pointerup before timer
  - Visual feedback: scale 0.98 after 200ms

Swipe left (document list):
  - Track horizontal movement
  - Threshold: 50px to trigger
  - Spring animation to 80px reveal
  - Tap elsewhere to close
  - Only one item open at a time

Swipe right (back):
  - Only from left edge (20px zone)
  - Track horizontal movement
  - Content follows finger 1:1
  - At 30% screen width: commit to navigate back
  - Spring back if < 30%

Pull to refresh:
  - Only at top of scroll container
  - Overscroll: content moves down
  - At 60px: trigger threshold (haptic)
  - Release: animate to 60px, show spinner
  - Complete: animate to 0, hide spinner

Pinch zoom:
  - Two-finger gesture
  - Scale range: 0.5x to 3x
  - Smooth transform with transform-origin at pinch center
  - Double-tap to reset to 1x
```

### 9.3 Scroll Behavior

```
Scroll container:
  - Native scroll (momentum)
  - Overscroll bounce (iOS rubber band)
  - Hide keyboard on scroll down
  - Show tab bar on scroll down (auto-hide in chat)
  - Pull-to-refresh at top

Chat-specific scroll:
  - Auto-scroll during streaming (if at bottom)
  - Stop auto-scroll on user scroll up
  - "Jump to bottom" button when scrolled up
  - Smooth scroll to new messages
```

---

## 10. Haptic Feedback

### 10.1 Haptic Types

```
Type          Trigger                    API (iOS)              API (Android)
──────────────────────────────────────────────────────────────────────────────
Light         Button press               UIImpactFeedback       VibrationEffect
              Tab switch                  (.light)               .createOneShot(10, 40)
              Toggle switch
              Checkbox

Medium        Swipe action reveal        UIImpactFeedback       VibrationEffect
              Pull-to-refresh trigger     (.medium)              .createOneShot(20, 60)
              Sheet drag
              Slider change

Heavy         Delete confirmation        UIImpactFeedback       VibrationEffect
              Destructive action          (.heavy)               .createOneShot(40, 100)
              Long press start

Success       Upload complete            UINotification         VibrationEffect
              Message sent                (.success)             .createPredefined(SUCCESS)
              Task completed
              Connection restored

Error         Invalid action             UINotification         VibrationEffect
              Form validation fail        (.error)               .createPredefined(ERROR)
              Network error
              Action denied

Selection     Picker change              UISelectionFeedback    VibrationEffect
              Scroll snap                 (.changed)             .createOneShot(5, 30)
              Tab bar indicator move
```

### 10.2 Haptic Implementation

```typescript
// Pseudocode
enum HapticType {
  LIGHT = 'light',
  MEDIUM = 'medium',
  HEAVY = 'heavy',
  SUCCESS = 'success',
  ERROR = 'error',
  SELECTION = 'selection'
}

function triggerHaptic(type: HapticType): void {
  // Feature detect
  if (!navigator.vibrate && !window.UIImpactFeedbackGenerator) return;

  // iOS
  if ('UIImpactFeedbackGenerator' in window) {
    const feedback = new UIImpactFeedbackGenerator(type);
    feedback.impactOccurred();
  }

  // Android / Web
  if ('vibrate' in navigator) {
    switch (type) {
      case 'light':    navigator.vibrate(10); break;
      case 'medium':   navigator.vibrate(20); break;
      case 'heavy':    navigator.vibrate(40); break;
      case 'success':  navigator.vibrate([10, 50, 10]); break;
      case 'error':    navigator.vibrate([50, 100, 50]); break;
      case 'selection': navigator.vibrate(5); break;
    }
  }
}

// Allow user to disable in settings
function isHapticEnabled(): boolean {
  return localStorage.getItem('haptic_enabled') !== 'false';
}
```

### 10.3 Haptic Placement Map

```
Screen/Action                     Haptic Type
──────────────────────────────────────────────
Tab bar tap                       Light
Sidebar item tap                  Light
Button press                      Light
Toggle switch                     Light
Chat send button                  Light
Pull-to-refresh threshold         Medium
Swipe action reveal               Medium
Bottom sheet drag                 Medium
Long press start                  Heavy
Delete confirmation               Heavy
Message sent                      Success
Upload complete                   Success
Document saved                    Success
Connection restored               Success
Form validation error             Error
Network error                     Error
File too large                    Error
Picker value change               Selection
Scroll snap                       Selection
```

---

## 11. Mobile Keyboard

### 11.1 Keyboard Handling

```
Problem: iOS auto-zooms when font-size < 16px on input focus
Solution: All inputs use font-size >= 16px

Problem: Keyboard covers input area
Solution:
  1. VisualViewport API to detect keyboard
  2. Scroll input into view when keyboard opens
  3. Adjust container height to account for keyboard

Problem: Keyboard stays open when scrolling
Solution: Dismiss keyboard on scroll down (not up)
```

### 11.2 Keyboard-Aware Layout

```
When keyboard is CLOSED:
┌─────────────────────────────────┐
│  Page Header                    │
├─────────────────────────────────┤
│                                 │
│  Page Content                   │
│  (full height available)        │
│                                 │
├─────────────────────────────────┤
│  [Input Area]                   │
├─────────────────────────────────┤
│  Tab Bar                        │
├─────────────────────────────────┤
│  Safe Area                      │
└─────────────────────────────────┘

When keyboard is OPEN:
┌─────────────────────────────────┐
│  Page Header (may hide)         │
├─────────────────────────────────┤
│  Page Content                   │
│  (reduced height)               │
│                                 │
├─────────────────────────────────┤
│  [Input Area]                   │  ← stays above keyboard
├─────────────────────────────────┤
│  ┌─────────────────────────┐    │
│  │      Keyboard           │    │
│  │                         │    │
│  └─────────────────────────┘    │
└─────────────────────────────────┘
```

### 11.3 Input Toolbar

```
Future: Formatting toolbar above keyboard
┌─────────────────────────────────┐
│  B   I   U   🔗   📋   ⋯       │  formatting bar
├─────────────────────────────────┤
│  Keyboard...                    │
└─────────────────────────────────┘

Bar height: 40px
Background: $gray-50
Border-top: 0.5px solid $gray-200
Button: 36×36px, centered
Icon: 18px, $gray-600
```

### 11.4 Chat Input Specifics

```
Chat input behavior:
  - Font-size: 16px (prevents iOS zoom)
  - Line-height: 20px
  - Max-height: 120px (about 5 lines)
  - Auto-grow: Yes, up to max-height
  - Scroll: Internal overflow-y when > max-height
  - Placeholder: "Type a message..."
  - Return key: New line (shift+return for new line on some keyboards)
  - Send: Via send button (not return key, to avoid accidental sends)
  - Return key type: "default" (not "send")
  - Keyboard type: "text" (not "email" or "url")

Single-line inputs (search, rename, etc.):
  - Font-size: 16px
  - Return key: "done"
  - Dismisses keyboard on return
  - No auto-grow
```

---

## 12. Offline Support

### 12.1 Offline Architecture

```
┌─────────────────────────────────┐
│         OFFLINE MANAGER         │
│                                 │
│  ┌─────────────┐ ┌───────────┐ │
│  │  Network     │ │  Cache    │ │
│  │  Monitor     │ │  Manager  │ │
│  │             │ │           │ │
│  │ online/off  │ │ IndexedDB │ │
│  │ reconnect   │ │ + SW cache│ │
│  └─────────────┘ └───────────┘ │
│                                 │
│  ┌─────────────┐ ┌───────────┐ │
│  │  Action      │ │  Sync     │ │
│  │  Queue       │ │  Engine   │ │
│  │             │ │           │ │
│  │ pending     │ │ retry     │ │
│  │ actions     │ │ merge     │ │
│  └─────────────┘ └───────────┘ │
└─────────────────────────────────┘
```

### 12.2 Caching Strategy

```
Data              Cache Duration    Max Size    Strategy
──────────────────────────────────────────────────────────
Conversations     7 days            10 recent   Cache-first
Messages          7 days            Per conv    Cache-first
Documents list    24 hours          100 items   Stale-while-revalidate
Document content  7 days            20 recent   Cache-first
User profile      24 hours          1           Stale-while-revalidate
Settings          Session           1           Network-first
Knowledge bases   24 hours          50 items    Stale-while-revalidate
```

### 12.3 Offline Indicators

```
┌─────────────────────────────────┐
│  ⚠️  You're offline             │  offline banner
│  Some features may be limited   │
├─────────────────────────────────┤
│  ...content...                  │
├─────────────────────────────────┤
│  🏠  💬  📄  🧠  ⋯             │  tab bar
└─────────────────────────────────┘

Offline banner:
  Height: 44px
  Background: $gray-800
  Text: $white, $body-sm (14px)
  Icon: warning triangle, 16px
  Position: Below header, above content
  Animation: Slide down 200ms
  Dismissible: No (auto-hides when online)

Online restored banner:
  Height: 44px
  Background: $green-500
  Text: $white, $body-sm (14px)
  Icon: checkmark, 16px
  Auto-hide: 2 seconds after showing
```

### 12.4 Message Queue

```
When user sends message while offline:
  1. Show message in chat with "⏳" indicator
  2. Add to IndexedDB queue
  3. Show offline banner
  4. When online: process queue in order
  5. Update message status: ⏳ → ✅
  6. Handle conflicts (last-write-wins)

Queue structure:
{
  id: string,
  type: 'message' | 'reaction' | 'edit' | 'delete',
  payload: any,
  timestamp: number,
  retryCount: number,
  maxRetries: 3
}
```

### 12.5 Service Worker

```
Cache strategy by request type:

API requests:
  - GET: Cache-first with network fallback
  - POST/PUT/DELETE: Network-first, queue if offline

Static assets:
  - Cache-first (pre-cached on install)
  - Versioned URLs for cache busting

Images:
  - Cache-first with network fallback
  - Max 50MB cache

Offline page:
  - Fallback for navigation requests
  - Shows cached content with offline banner
```

---

## 13. Mobile Performance

### 13.1 Performance Targets

```
Metric              Target (3G)    Target (4G)    Target (WiFi)
──────────────────────────────────────────────────────────────
FCP                 < 1.5s         < 1.0s         < 0.8s
LCP                 < 2.5s         < 1.5s         < 1.0s
FID                 < 100ms        < 50ms         < 30ms
CLS                 < 0.1          < 0.1          < 0.1
TTI                 < 3.0s         < 2.0s         < 1.5s
INP                 < 200ms        < 150ms        < 100ms
Bundle size (initial)< 150KB        < 150KB        < 150KB
```

### 13.2 Loading Strategy

```
1. Shell (app frame) → 200ms
   - Tab bar + header + skeleton
   - Pre-critical CSS inlined

2. Core (current tab content) → 800ms
   - Route-specific bundle
   - Data fetch parallel

3. Below fold → 1500ms
   - Lazy load images
   - Virtual scroll for long lists

4. Prefetch → On idle
   - Next likely routes
   - Recent document thumbnails
```

### 13.3 Image Optimization

```
Format priority: WebP > AVIF > JPEG > PNG

Sizes served:
  Thumbnail:  64×64px   (document icons)
  Card:       320×240px (document previews)
  Full:       750px wide (max mobile width)
  Retina:     2x versions for 3x displays

Lazy loading:
  - IntersectionObserver
  - Root margin: 200px (preload before visible)
  - Placeholder: solid $gray-100, 4px border-radius
  - Fade in: opacity 0→1, 200ms

Srcset:
  <img srcset="thumb-64.webp 64w, thumb-128.webp 128w"
       sizes="64px"
       loading="lazy"
       decoding="async" />
```

### 13.4 Virtual Scrolling

```
Implementation: Virtualized list (react-window or similar)

For lists > 50 items:
  - Render only visible items + buffer (5 items above/below)
  - Item height: Fixed (72px for documents, 56px for settings)
  - Scroll container: overflow-y: auto
  - Spacer div for total height

For chat messages:
  - Dynamic height (variable message length)
  - Use react-virtuoso or similar dynamic virtual list
  - Anchor to bottom during streaming
```

### 13.5 Bundle Optimization

```
Initial bundle:
  - Core app shell: 50KB gzipped
  - Current route chunk: 30KB gzipped
  - Shared components: 40KB gzipped
  - Total: ~120KB gzipped

Code splitting:
  - Route-based: Each tab is a chunk
  - Feature-based: Settings, Upload, etc.
  - Library-based: Markdown renderer, PDF viewer

Tree shaking:
  - Remove unused lodash methods
  - Import only needed date-fns functions
  - SVG icons: individual imports, not full library
```

---

## 14. Mobile Accessibility

### 14.1 Screen Reader Support

```
ARIA requirements:

Tab bar:
  role="tablist" on container
  role="tab" on each tab
  aria-selected="true" on active
  aria-controls panel id

Bottom sheets:
  role="dialog"
  aria-modal="true"
  aria-label="Sheet title"
  Focus trap within sheet
  Return focus to trigger on close

Chat messages:
  role="log" on message container
  aria-live="polite" for new messages
  aria-label="Message from [sender]"

Swipe actions:
  aria-label="Swipe left to reveal actions"
  Provide button alternative for screen readers

Empty states:
  aria-live="polite"
  Describe state: "No documents yet. Tap + to upload."
```

### 14.2 Dynamic Type (iOS)

```
Font scaling support:

100% (Default):   body = 16px
90% (Small):      body = 14px
110% (Large):     body = 17px
120% (xLarge):    body = 19px
130% (xxLarge):   body = 20px
150% (xxxLarge):  body = 23px

Implementation:
  - Use rem units (based on root font-size)
  - @media (prefers-reduced-motion) respect setting
  - Layout adjusts: cards stack, margins compress
  - Minimum touch targets maintained (44px)
  - Max body font: 23px (caps at xxxLarge)

Android:
  - Use sp units for text
  - Respect system font scale setting
```

### 14.3 Color Contrast

```
WCAG AA compliance:

Text on white:
  $gray-900 on $white: 17.4:1 ✓
  $gray-500 on $white: 7.5:1 ✓
  $gray-400 on $white: 4.6:1 ✓ (minimum for large text)

Text on purple:
  $white on $purple-500: 4.8:1 ✓
  $white on $purple-600: 6.2:1 ✓

Interactive elements:
  $purple-500 on $white: 4.8:1 ✓ (meets AA for non-text)
  Focus ring: 3px solid $purple-500, 2px offset
```

### 14.4 Reduced Motion

```
@media (prefers-reduced-motion: reduce) {
  /* Disable animations */
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable parallax */
  .parallax { transform: none !important; }

  /* Disable auto-scroll in chat */
  .chat-scroll { scroll-behavior: auto; }

  /* Keep essential feedback */
  .haptic-feedback { /* keep haptics */ }
  .loading-spinner { animation: spin 1s linear infinite; }
}
```

### 14.5 Focus Management

```
Tab order:
  1. Header actions (left to right)
  2. Content (top to bottom)
  3. Input area
  4. Tab bar (left to right)

Focus styles:
  - Outline: 3px solid $purple-500
  - Outline offset: 2px
  - Border-radius: Match element

Focus on navigation:
  - New page: Focus on page title
  - Bottom sheet open: Focus on first interactive
  - Modal open: Focus trap within modal
  - Sheet close: Return focus to trigger

Skip navigation:
  - "Skip to content" link (screen reader only)
  - Visible on focus
```

---

## 15. Platform-Specific

### 15.1 iOS Specific

```
Safe Areas:
  Top: 47px (notch/Dynamic Island) or 20px (older)
  Bottom: 34px (home indicator) or 0px (older)

Pull-to-refresh:
  - UIRefreshControl style
  - Spinner: $purple-500
  - Overscroll: Rubber band effect

Swipe back:
  - System edge gesture
  - Interactive transition
  - 50% threshold to commit

Status bar:
  - Dark content on light background
  - Light content on purple background
  - Use <meta name="apple-mobile-web-app-status-bar-style">

Touch bar (deprecated but consider):
  - Not supported

Dynamic Island:
  - Show upload progress
  - Show chat typing indicator
  - Future: Live Activities

Home indicator:
  - 34px safe area bottom
  - Background matches content

Haptics:
  - UIImpactFeedbackGenerator
  - UINotificationFeedbackGenerator
  - UISelectionFeedbackGenerator
```

### 15.2 Android Specific

```
Back button:
  - Handle popstate event
  - Navigate back in history
  - Close bottom sheet if open
  - Close sidebar if open
  - Then navigate back

Navigation bar:
  - Transparent, overlay content
  - Bottom safe area: 0px (gesture nav) or 48px (3-button)
  - Use env(safe-area-inset-bottom)

Notification channels:
  - "Messages" (high priority, vibrate, sound)
  - "Uploads" (default priority, no sound)
  - "System" (low priority, silent)

Adaptive icons:
  - Foreground: MimoNotes logo on purple circle
  - Background: $purple-500
  - Shape: Maskable (safe zone 80%)

Splash screen:
  - Android 12+ splash API
  - Center logo on $purple-500 background
  - Duration: Until first paint

Edge-to-edge:
  - Draw behind status bar
  - Draw behind navigation bar
  - Use WindowInsetsController
```

### 15.3 iPad Specific

```
Split View:
  - Primary: Sidebar (320px) | Content (flexible)
  - Or: Two-panel (50/50)
  - Minimum width: 320px per panel
  - Breakpoint: 768px

Drag and drop:
  - UIDropInteraction for files
  - Between apps (Side by Side)
  - Multi-file drag
  - Visual drop zone feedback

Apple Pencil:
  - Double-tap: Undo/Redo (future)
  - Hover detection (future)
  - Pressure sensitivity (future)

Keyboard shortcuts:
  - ⌘N: New chat
  - ⌘F: Search
  - ⌘K: Command palette
  - ⌘/ : Toggle sidebar

Layout adaptation:
  - < 768px: Phone layout (single column, bottom tabs)
  - ≥ 768px: Tablet layout (sidebar + content)
  - ≥ 1024px: Large tablet (sidebar + content + detail)
```

---

## 16. Mobile Components

### 16.1 Bottom Tab Bar

```typescript
interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  badges?: Record<string, number>;
}

interface Tab {
  id: string;
  icon: React.ComponentType;
  label: string;
  route: string;
}

// CSS
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 48px;
  padding-bottom: env(safe-area-inset-bottom);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid #F3F4F6;
  display: flex;
  z-index: 100;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  -webkit-tap-highlight-color: transparent;
}

.tab-icon {
  width: 24px;
  height: 24px;
  color: #9CA3AF;
  transition: color 150ms ease, transform 150ms ease;
}

.tab-item.active .tab-icon {
  color: #8B5CF6;
  transform: scale(1.1);
}

.tab-label {
  font-size: 11px;
  font-weight: 500;
  color: #9CA3AF;
}

.tab-item.active .tab-label {
  color: #8B5CF6;
}
```

### 16.2 Bottom Sheet

```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // [25, 50, 90] (% of screen)
  initialSnap?: number;
  title?: string;
}

// CSS
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  opacity: 0;
  transition: opacity 200ms ease;
}

.bottom-sheet-overlay.open {
  opacity: 1;
}

.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: white;
  border-radius: 16px 16px 0 0;
  z-index: 201;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.bottom-sheet.open {
  transform: translateY(0);
}

.bottom-sheet-handle {
  width: 36px;
  height: 4px;
  background: #D1D5DB;
  border-radius: 2px;
  margin: 8px auto;
}

.bottom-sheet-header {
  padding: 0 16px 12px;
  font-size: 17px;
  font-weight: 600;
}
```

### 16.3 Swipeable List Item

```typescript
interface SwipeableItemProps {
  children: React.ReactNode;
  actions: SwipeAction[];
  onSwipe?: (direction: 'left' | 'right') => void;
}

interface SwipeAction {
  icon: React.ComponentType;
  label: string;
  color: string;
  onAction: () => void;
}

// CSS
.swipeable-container {
  overflow: hidden;
  position: relative;
}

.swipeable-content {
  position: relative;
  z-index: 1;
  background: white;
  transition: transform 200ms ease;
}

.swipeable-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  z-index: 0;
}

.swipe-action {
  width: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: white;
}

.swipe-action-icon {
  width: 20px;
  height: 20px;
}

.swipe-action-label {
  font-size: 11px;
}
```

### 16.4 Pull-to-Refresh

```typescript
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number; // px to trigger (default: 60)
}

// CSS
.pull-to-refresh {
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
}

.ptr-indicator {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 200ms ease, opacity 200ms ease;
}

.ptr-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #F3F4F6;
  border-top-color: #8B5CF6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ptr-indicator.refreshing .ptr-spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

### 16.5 Floating Action Button (FAB)

```typescript
interface FABProps {
  icon: React.ComponentType;
  onClick: () => void;
  label?: string;
  color?: string;
  position?: { bottom: number; right: number };
}

// CSS
.fab {
  position: fixed;
  bottom: calc(56px + env(safe-area-inset-bottom) + 16px);
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: #8B5CF6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  z-index: 90;
  -webkit-tap-highlight-color: transparent;
  transition: transform 150ms ease, box-shadow 150ms ease;
}

.fab:active {
  transform: scale(0.92);
}

.fab-icon {
  width: 24px;
  height: 24px;
}

.fab-label {
  position: absolute;
  right: 64px;
  background: #1F2937;
  color: white;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.fab.show-label .fab-label {
  opacity: 1;
}
```

### 16.6 Toast Notification (Mobile)

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // ms (default: 3000)
  action?: { label: string; onClick: () => void };
}

// CSS
.toast {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 16px);
  left: 16px;
  right: 16px;
  max-width: 400px;
  margin: 0 auto;
  padding: 12px 16px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 300;
  transform: translateY(-100%);
  opacity: 0;
  transition: transform 200ms ease, opacity 200ms ease;
}

.toast.show {
  transform: translateY(0);
  opacity: 1;
}

.toast.success { background: #065F46; color: white; }
.toast.error   { background: #991B1B; color: white; }
.toast.info    { background: #1F2937; color: white; }
.toast.warning { background: #92400E; color: white; }

.toast-icon { width: 20px; height: 20px; flex-shrink: 0; }
.toast-message { flex: 1; font-size: 14px; }
.toast-action {
  font-size: 14px;
  font-weight: 600;
  color: #8B5CF6;
  -webkit-tap-highlight-color: transparent;
}
```

### 16.7 Mobile Header

```typescript
interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  actions?: HeaderAction[];
  transparent?: boolean;
}

interface HeaderAction {
  icon: React.ComponentType;
  label: string;
  onClick: () => void;
  badge?: number;
}

// CSS
.mobile-header {
  position: sticky;
  top: 0;
  height: 44px;
  padding: 0 16px;
  padding-top: env(safe-area-inset-top);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 0.5px solid #F3F4F6;
  z-index: 50;
}

.mobile-header.transparent {
  background: transparent;
  backdrop-filter: none;
  border-bottom: none;
}

.header-back {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -12px;
  -webkit-tap-highlight-color: transparent;
}

.header-back-icon {
  width: 24px;
  height: 24px;
  color: #8B5CF6;
}

.header-title {
  flex: 1;
  font-size: 17px;
  font-weight: 600;
  color: #111827;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.header-action {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
}

.header-action-icon {
  width: 24px;
  height: 24px;
  color: #6B7280;
}
```

---

## Appendix A: Responsive Breakpoints

```
Breakpoint        Width          Layout
──────────────────────────────────────────────────
Mobile S          320px          Minimal (stack everything)
Mobile M          375px          iPhone standard
Mobile L          428px          iPhone Plus/Max
Tablet S          768px          iPad Mini
Tablet M          810px          iPad standard
Tablet L          1024px         iPad Pro 11"
Desktop           1280px         Desktop layout
```

## Appendix B: Animation Specs

```
Animation                  Duration    Easing                    Trigger
──────────────────────────────────────────────────────────────────────
Page transition            300ms       cubic-bezier(0.32,0.72,0,1)  Navigation
Bottom sheet open          300ms       cubic-bezier(0.32,0.72,0,1)  Open
Bottom sheet close         250ms       ease-in                     Close
Tab bar indicator          150ms       ease                        Tab switch
Toast show/hide            200ms       ease                        Message
Swipe reveal               200ms       ease                        Swipe
Pull-to-refresh            200ms       ease                        Pull
Skeleton pulse             1500ms      ease-in-out infinite         Loading
Button press scale         150ms       ease                        Tap
FAB press scale            150ms       ease                        Tap
Context menu open          150ms       cubic-bezier(0.32,0.72,0,1)  Long press
Context menu close         100ms       ease-in                     Dismiss
```

## Appendix C: Z-Index Scale

```
Layer               Z-Index    Use
─────────────────────────────────────
Content             0          Base content
Sticky header       50         Page headers
FAB                 90         Floating action button
Tab bar             100        Bottom tab bar
Sidebar drawer      150        Side navigation
Bottom sheet        200        Sheets, modals
Toast               300        Notifications
Tooltip             400        Tooltips, popovers
```

---

**Document Version History:**

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | June 2026 | Complete mobile experience specification |

---

*This specification is implementation-ready. All dimensions, colors, and behaviors are defined with exact values. Development should follow the 4px grid system, use Geist fonts, and maintain warm-purple 265° as the primary color.*
