# MimoNotes Component Library V2

> **Design System Architect Specification**
> Version: 2.0.0 | Date: 2026-06-13
> Stack: React + TypeScript + Tailwind CSS v4 + shadcn/ui
> Design Tokens: warm-purple 265°, Geist fonts, 4px grid

---

## Table of Contents

1. [Design Tokens Reference](#design-tokens-reference)
2. [Component Primitives](#component-primitives)
   - 1. [Button](#1-button)
   - 2. [Input](#2-input)
   - 3. [Textarea](#3-textarea)
   - 4. [Select / Combobox](#4-select--combobox)
   - 5. [Card](#5-card)
   - 6. [Badge / Tag](#6-badge--tag)
   - 7. [Avatar](#7-avatar)
   - 8. [Dialog / Modal](#8-dialog--modal)
   - 9. [Toast / Notification](#9-toast--notification)
   - 10. [Tooltip](#10-tooltip)
   - 11. [Dropdown Menu](#11-dropdown-menu)
   - 12. [Command Palette (Cmd+K)](#12-command-palette)
   - 13. [Sidebar Navigation](#13-sidebar-navigation)
   - 14. [Empty State](#14-empty-state)
   - 15. [Skeleton Loader](#15-skeleton-loader)
   - 16. [Breadcrumb](#16-breadcrumb)
   - 17. [Tabs](#17-tabs)
   - 18. [Table](#18-table)
   - 19. [File Upload](#19-file-upload)
   - 20. [Chat Input](#20-chat-input)
3. [Implementation Notes](#implementation-notes)

---

## Design Tokens Reference

All components consume these tokens. Refer to `DESIGN_SYSTEM_PROPOSAL.md` for full values.

```
Colors:
  brand-50..900  (hue 265°, warm purple)
  success/error/warning/info + subtle variants
  neutral-50..950 (warm neutrals, hue 265°, chroma 0.002–0.005)
  Surface hierarchy: Level 0 (bg) → Level 4 (highlight)

Typography: Geist Sans + Geist Mono
  display-lg/md | heading-lg/md/sm | body-lg/md/sm | label-lg/md/sm | code

Spacing: 4px grid
  xs(4) | sm(8) | md(12) | base(16) | lg(20) | xl(24) | 2xl(32) | 3xl(48)

Radius: sm(6px) | md(8px) | lg(10px) | xl(12px) | 2xl(16px) | full(9999px)

Motion:
  micro(100ms) | fast(150ms) | normal(200ms) | slow(300ms)
  ease: default | in | out | spring
```

### Common Utility Types

```typescript
// Shared across all components
export type VariantOf<T> = T;
export type SizeOf<T> = 'sm' | 'md' | 'lg' | 'xl';

// Standard HTML ref forwarding
import * as React from 'react';
```

---

## Component Primitives

---

## 1. Button

### Visual Description

Buttons are the primary interactive element. They feature clean rectangular shapes with consistent `rounded-lg` (8px) corners, precise padding aligned to the 4px grid, and a subtle glow effect on the primary variant when hovered — a signature MimoNotes interaction.

### Variants

| Variant | Background | Text | Border | Description |
|---------|-----------|------|--------|-------------|
| `primary` | brand-500 | white | none | Main CTA, prominent actions |
| `secondary` | neutral-300 | neutral-950 | neutral-500 | Secondary actions, alternatives |
| `ghost` | transparent | neutral-800 | none | Tertiary actions, toolbar items |
| `destructive` | error | white | none | Delete, remove, dangerous actions |
| `link` | transparent | brand-500 | none | Inline navigation, text links |

### Sizes

| Size | Height | Padding | Font | Icon Size |
|------|--------|---------|------|-----------|
| `sm` | 28px | 6px 10px | label-md (12px/500) | 14px |
| `md` | 34px | 8px 14px | label-lg (14px/500) | 16px |
| `lg` | 40px | 10px 20px | label-lg (14px/500) | 18px |
| `xl` | 48px | 12px 28px | label-lg (14px/600) | 20px |

### States

| State | Visual Change |
|-------|--------------|
| Default | Variant-defined colors |
| Hover | bg darkens 10%, subtle scale(1.01), primary gets `shadow-[0_0_20px_oklch(0.62_0.20_265/30%)]` |
| Active/Pressed | scale(0.98), bg darkens 15% |
| Disabled | opacity 0.5, cursor not-allowed, no hover effects |
| Loading | Text replaced with spinner, button width preserved |

### Icon Support

- **Left icon**: Icon at `mr-2` (8px gap), vertically centered
- **Right icon**: Icon at `ml-2` (8px gap), vertically centered
- **Icon-only**: Square button (height = width), `px-0`, `aria-label` required

### TypeScript Interface

```typescript
import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';
import { VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

// CVA variant config
export const buttonVariants = cva(
  // Base classes
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium ' +
  'transition-all duration-150 ease-default ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-500 text-white shadow-sm ' +
          'hover:bg-brand-600 hover:shadow-[0_0_20px_oklch(0.62_0.20_265/0.3)] ' +
          'active:bg-brand-700',
        secondary:
          'bg-neutral-300 text-neutral-950 border border-neutral-500 ' +
          'hover:bg-neutral-400 hover:border-neutral-600',
        ghost:
          'bg-transparent text-neutral-800 ' +
          'hover:bg-neutral-300 hover:text-neutral-950',
        destructive:
          'bg-error text-white ' +
          'hover:bg-error/80',
        link:
          'bg-transparent text-brand-500 underline-offset-4 ' +
          'hover:underline',
      },
      size: {
        sm: 'h-7 px-2.5 text-[12px]',
        md: 'h-[34px] px-3.5 text-[14px]',
        lg: 'h-10 px-5 text-[14px]',
        xl: 'h-12 px-7 text-[14px] font-semibold',
        'icon-sm': 'h-7 w-7',
        'icon-md': 'h-[34px] w-[34px]',
        'icon-lg': 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Show loading spinner and disable interaction */
  isLoading?: boolean;
  /** Icon element to render before children */
  leftIcon?: ReactNode;
  /** Icon element to render after children */
  rightIcon?: ReactNode;
  /** Render as icon-only button (requires aria-label) */
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, iconOnly, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || isLoading}
        aria-label={iconOnly ? (props['aria-label'] as string) : undefined}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {!iconOnly && children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';
```

### Tailwind Class Patterns

```tsx
// Primary CTA
<Button variant="primary" size="lg">Upload Document</Button>

// With left icon
<Button variant="primary" leftIcon={<Upload className="h-4 w-4" />}>
  Upload
</Button>

// Icon-only (toolbar)
<Button variant="ghost" size="icon-md" iconOnly aria-label="Settings">
  <Settings className="h-4 w-4" />
</Button>

// Loading state
<Button variant="primary" isLoading>Sending...</Button>

// Destructive with confirmation
<Button variant="destructive" size="sm">Delete</Button>
```

### Usage Guidelines

- **primary**: One per view. The main CTA (Save, Submit, Upload, Send).
- **secondary**: Alternative actions alongside primary (Cancel, Skip, Learn More).
- **ghost**: Toolbars, navigation actions, icon buttons. Low visual weight.
- **destructive**: Irreversible actions. Always pair with confirmation dialog.
- **link**: Inline text navigation. Never use as standalone button in forms.

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use `primary` for the single most important action | Stack multiple primary buttons |
| Use `iconOnly` with `aria-label` for accessibility | Use icon-only without labeling |
| Show loading state during async operations | Disable without visual feedback |
| Use `destructive` only for irreversible actions | Use red for non-danger emphasis |
| Keep button labels short (2-3 words) | Use full sentences in buttons |

### Accessibility

- All buttons must have accessible names (text content or `aria-label`)
- Focus ring: `2px brand-500/40` with `ring-offset-background`
- `disabled` prop sets `aria-disabled="true"` and `tabIndex={-1}`
- Loading buttons announce state via `aria-busy="true"`
- Icon-only buttons require `aria-label`

---

## 2. Input

### Visual Description

Inputs are clean rectangular fields with a subtle background (`neutral-200` dark / `neutral-50` light), 1px border, and 8px radius. On focus, the border shifts to `brand-500` with a soft outer glow ring. Error states shift to `error` color with matching ring.

### Types

| Type | Special Behavior |
|------|-----------------|
| `text` | Standard text input |
| `email` | Email validation, autocomplete="email" |
| `password` | Toggle show/hide via right addon |
| `number` | Step controls, min/max |
| `search` | Magnifying glass icon, Cmd+K hint badge |
| `url` | URL validation, autocomplete="url" |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 28px | 6px 10px | body-sm (13px) |
| `md` | 34px | 8px 12px | body-md (14px) |
| `lg` | 40px | 10px 14px | body-md (14px) |

### States

| State | Visual |
|-------|--------|
| Default | neutral-300 bg, neutral-500 border |
| Focus | brand-500 border, 2px brand-500/20 ring |
| Error | error border, 2px error/20 ring, helper text |
| Disabled | opacity 0.5, cursor not-allowed, muted placeholder |
| Readonly | neutral-200 bg, no focus ring, cursor default |

### Addons

- **Left addon**: Icon or text prefix inside the input container, right border separator
- **Right addon**: Icon button (clear, toggle password), left border separator
- **Suffix**: Static text at the end (e.g., unit, domain)

### TypeScript Interface

```typescript
import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state with message */
  error?: string;
  /** Left addon content (icon or text) */
  leftAddon?: ReactNode;
  /** Right addon content (icon button) */
  rightAddon?: ReactNode;
  /** Static suffix text */
  suffix?: string;
  /** Show Cmd+K hint badge (for search type) */
  showCmdK?: boolean;
  /** Loading state for search */
  isLoading?: boolean;
}

const inputSizes = {
  sm: 'h-7 px-2.5 text-[13px]',
  md: 'h-[34px] px-3 text-[14px]',
  lg: 'h-10 px-3.5 text-[14px]',
};

const inputBase =
  'flex w-full rounded-lg bg-neutral-300 border border-neutral-500 text-neutral-900 ' +
  'placeholder:text-neutral-600 ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-200 ' +
  'read-only:cursor-default read-only:bg-neutral-200 ' +
  'transition-all duration-150 ease-default ' +
  'file:border-0 file:bg-transparent file:text-[14px] file:font-medium';

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', error, leftAddon, rightAddon, suffix, showCmdK, isLoading, type, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {leftAddon && (
          <div className="absolute left-0 top-0 flex h-full items-center pl-3 text-neutral-600">
            {leftAddon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            inputBase,
            inputSizes[size],
            leftAddon && 'pl-10',
            (rightAddon || suffix) && 'pr-10',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        {showCmdK && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-500 bg-neutral-200 px-1.5 font-mono text-[10px] font-medium text-neutral-600">
              ⌘K
            </kbd>
          </div>
        )}
        {suffix && !showCmdK && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-neutral-600">
            {suffix}
          </span>
        )}
        {rightAddon && !suffix && !showCmdK && (
          <div className="absolute right-0 top-0 flex h-full items-center pr-2">
            {rightAddon}
          </div>
        )}
        {error && (
          <p id={`${props.id}-error`} className="mt-1.5 text-[12px] text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
```

### Tailwind Class Patterns

```tsx
// Basic input
<Input placeholder="Enter your email..." />

// With error
<Input error="Email is required" type="email" />

// Search with Cmd+K
<Input type="search" placeholder="Search..." showCmdK />

// With left addon (search icon)
<Input leftIcon={<Search className="h-4 w-4" />} placeholder="Search documents..." />

// Password with toggle
<Input type="password" rightAddon={<Eye className="h-4 w-4" />} />

// With suffix
<Input suffix=".mimotes.com" placeholder="workspace" />
```

### Usage Guidelines

- **text**: General purpose — names, titles, descriptions
- **email**: Registration, login, contact forms
- **password**: Always include show/hide toggle
- **number**: Quantities, settings with min/max
- **search**: Global search, document search. Add Cmd+K hint.
- **url**: Website fields, API endpoints

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Always show validation errors inline | Show errors only on submit |
| Use appropriate `type` for browser validation | Use `type="text"` for emails/passwords |
| Add `placeholder` for guidance | Use placeholder as label replacement |
| Show character limits when relevant | Allow inputs to exceed limits silently |
| Use `autocomplete` attributes | Ignore browser autofill behavior |

### Accessibility

- Associate labels with inputs via `htmlFor` / `id`
- Error messages linked via `aria-describedby`
- `aria-invalid="true"` on error state
- `aria-required="true"` for required fields
- Search inputs: `role="searchbox"` or `type="search"`
- Password toggle: `aria-label="Show password"` / `"Hide password"`

---

## 3. Textarea

### Visual Description

Textarea shares Input's visual language. It features auto-resize behavior that grows vertically as content is added, constrained by min/max height. A character count indicator appears at the bottom-right when `maxLength` is set. A code editing variant uses monospace font and dark background.

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard textarea, Geist Sans |
| `code` | Monospace font, darker bg, for code editing |

### TypeScript Interface

```typescript
import { TextareaHTMLAttributes, forwardRef, useState, useRef, useEffect, useCallback } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Error state with message */
  error?: string;
  /** Enable auto-resize behavior */
  autoResize?: boolean;
  /** Minimum height in px (autoResize only) */
  minHeight?: number;
  /** Maximum height in px (autoResize only) */
  maxHeight?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Code editing variant */
  code?: boolean;
  /** Left addon content */
  leftAddon?: React.ReactNode;
}

const textareaSizes = {
  sm: 'min-h-[60px] px-2.5 py-1.5 text-[13px]',
  md: 'min-h-[80px] px-3 py-2 text-[14px]',
  lg: 'min-h-[100px] px-3.5 py-2.5 text-[14px]',
};

const textareaBase =
  'flex w-full rounded-lg bg-neutral-300 border border-neutral-500 text-neutral-900 ' +
  'placeholder:text-neutral-600 ' +
  'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 ' +
  'read-only:cursor-default ' +
  'transition-all duration-150 ease-default ' +
  'resize-none overflow-hidden';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    className, size = 'md', error, autoResize = true, minHeight, maxHeight = 300,
    showCharCount, code, leftAddon, value, onChange, maxLength, ...props
  }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const [charCount, setCharCount] = useState(0);

    const adjustHeight = useCallback(() => {
      const el = internalRef.current;
      if (!el || !autoResize) return;
      el.style.height = 'auto';
      const newHeight = Math.min(Math.max(el.scrollHeight, minHeight || 80), maxHeight);
      el.style.height = `${newHeight}px`;
    }, [autoResize, minHeight, maxHeight]);

    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    const isOverLimit = maxLength ? charCount > maxLength : false;

    return (
      <div className="relative w-full">
        {leftAddon && (
          <div className="absolute left-0 top-0 flex h-8 items-center pl-3 text-neutral-600">
            {leftAddon}
          </div>
        )}
        <textarea
          ref={(node) => {
            internalRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          className={cn(
            textareaBase,
            textareaSizes[size],
            leftAddon && 'pl-10',
            code && 'font-mono bg-neutral-200 text-[13px]',
            error && 'border-error focus:border-error focus:ring-error/20',
            className
          )}
          style={autoResize ? { minHeight: minHeight || 80, maxHeight } : undefined}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${props.id}-error` : undefined}
          {...props}
        />
        <div className="flex items-center justify-between">
          {error && (
            <p id={`${props.id}-error`} className="mt-1.5 text-[12px] text-error" role="alert">
              {error}
            </p>
          )}
          {showCharCount && maxLength && (
            <span className={cn(
              'mt-1.5 text-[11px] ml-auto',
              isOverLimit ? 'text-error' : 'text-neutral-600'
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
```

### Tailwind Class Patterns

```tsx
// Standard auto-resize
<Textarea autoResize placeholder="Write your notes..." />

// With character count
<Textarea showCharCount maxLength={500} placeholder="Description..." />

// Code editing
<Textarea code placeholder="Paste SQL query..." />

// Fixed height (no auto-resize)
<Textarea autoResize={false} className="h-[200px]" />
```

### Usage Guidelines

- **default**: Descriptions, notes, chat messages, comments
- **code**: SQL queries, API payloads, code snippets, prompts

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Enable auto-resize for most uses | Set fixed height that clips content |
| Show character count for limited fields | Allow exceeding limits without feedback |
| Use code variant for monospace content | Mix code and regular textareas |
| Set appropriate minHeight (80px default) | Use minHeight < 60px (too cramped) |

### Accessibility

- Same as Input (labels, aria-describedby, aria-invalid)
- `role="textbox"` is implicit on `<textarea>`
- `aria-multiline="true"` for screen readers
- Auto-resize: announce height changes to screen readers is not required (cosmetic only)

---

## 4. Select / Combobox

### Visual Description

Select appears as an Input-styled trigger with a chevron-down icon. The dropdown is a `neutral-200` popover with 1px border, floating below the trigger. Combobox adds a search input at the top of the dropdown. Supports single and multi-select modes, and grouped options with section headers.

### Variants

| Variant | Description |
|---------|-------------|
| `select` | Standard dropdown, click to select |
| `combobox` | Searchable dropdown with input filter |
| `multi` | Multiple selection with tag display |

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface SelectOption {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Disable this option */
  disabled?: boolean;
}

export interface SelectGroup {
  /** Group label */
  label: string;
  /** Grouped options */
  options: SelectOption[];
}

export interface SelectProps {
  /** Available options or grouped options */
  options: (SelectOption | SelectGroup)[];
  /** Currently selected value(s) */
  value?: string | string[];
  /** Change handler */
  onValueChange?: (value: string | string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Enable search/filter */
  searchable?: boolean;
  /** Enable multi-select */
  multiple?: boolean;
  /** Error state */
  error?: string;
  /** Disable the entire select */
  disabled?: boolean;
  /** Render custom option content */
  renderOption?: (option: SelectOption) => ReactNode;
  /** Label above the select */
  label?: string;
  /** Helper text below */
  helperText?: string;
  /** Left addon content */
  leftAddon?: ReactNode;
}

// Combobox variant — wraps cmdk
export interface ComboboxProps extends Omit<SelectProps, 'onValueChange'> {
  /** Search input placeholder */
  searchPlaceholder?: string;
  /** Empty state when no results */
  emptyText?: string;
  /** Callback when search changes */
  onSearch?: (query: string) => void;
  /** Async loading state */
  isLoading?: boolean;
  /** Callback for selection */
  onSelect?: (value: string) => void;
}
```

### Tailwind Class Patterns

```tsx
// Single select
<Select
  label="Category"
  placeholder="Select category..."
  options={categories}
  value={selected}
  onValueChange={setSelected}
/>

// Multi-select
<Select
  label="Tags"
  placeholder="Select tags..."
  options={tags}
  multiple
  value={selectedTags}
  onValueChange={setSelectedTags}
/>

// Searchable combobox
<Combobox
  options={documents}
  searchable
  searchPlaceholder="Search documents..."
  onSelect={(val) => handleSelect(val)}
/>

// With grouped options
<Select
  options={[
    { label: 'RECENT', options: [{ value: '1', label: 'Doc A' }] },
    { label: 'ARCHIVED', options: [{ value: '2', label: 'Doc B' }] },
  ]}
  placeholder="Select document..."
/>
```

### Usage Guidelines

- **select**: < 10 options, simple choice (status, category, sort order)
- **combobox**: > 10 options, or when search is needed (user picker, document select)
- **multi**: Tag selection, permission assignment, filter application

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use combobox for > 10 options | Use select with 50+ unfiltered options |
| Show selected values as tags in multi | Hide selected count in multi mode |
| Provide clear placeholder text | Leave placeholder empty |
| Group related options with headers | Mix grouped and ungrouped randomly |

### Accessibility

- `role="combobox"` on trigger
- `aria-expanded` reflects open state
- `aria-multiselectable="true"` for multi
- Keyboard: Arrow keys navigate, Enter selects, Escape closes
- `aria-activedescendant` highlights focused option
- Screen reader announces selected option count

---

## 5. Card

### Visual Description

Cards are the primary content containers. They feature a `neutral-200` background (dark mode), 1px `neutral-500` border, 10px radius, and 20px padding. Interactive cards gain a subtle scale(1.01) and border shift on hover. Stat cards use a compact layout with icon + value + label. Feature cards highlight content with optional gradient accents.

### Variants

| Variant | Description |
|---------|-------------|
| `default` | Standard content container |
| `interactive` | Hoverable, cursor pointer, scale animation |
| `stat` | KPI display: icon + value + label + trend |
| `feature` | Highlighted content with optional gradient top border |

### Padding

| Padding | Value | Usage |
|---------|-------|-------|
| `sm` | 12px | Compact lists, inline content |
| `md` | 20px | Default, most use cases |
| `lg` | 28px | Featured content, empty states |

### Border

| Border | Description |
|--------|-------------|
| `subtle` | `oklch(1 0 0 / 4%)` — barely visible |
| `default` | `oklch(1 0 0 / 6%)` — standard |
| `strong` | `oklch(1 0 0 / 12%)` — emphasis |

### TypeScript Interface

```typescript
import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: 'default' | 'interactive' | 'stat' | 'feature';
  /** Internal padding */
  padding?: 'sm' | 'md' | 'lg';
  /** Border emphasis */
  border?: 'subtle' | 'default' | 'strong';
  /** Interactive click handler (sets variant to interactive) */
  onClick?: () => void;
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header title */
  title?: string;
  /** Header description */
  description?: string;
  /** Right-aligned actions */
  actions?: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Footer alignment */
  align?: 'left' | 'center' | 'right' | 'between';
}

// Stat card specific props
export interface StatCardProps {
  /** Stat icon */
  icon: ReactNode;
  /** Stat value */
  value: string | number;
  /** Stat label */
  label: string;
  /** Trend indicator */
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  /** Icon color variant */
  iconVariant?: 'brand' | 'success' | 'warning' | 'error';
}

const cardPadding = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

const cardBorder = {
  subtle: 'border-[oklch(1_0_0/0.04)]',
  default: 'border-[oklch(1_0_0/0.06)]',
  strong: 'border-[oklch(1_0_0/0.12)]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', border = 'default', onClick, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-[10px] border bg-neutral-200',
        cardPadding[padding],
        cardBorder[border],
        variant === 'interactive' && 'cursor-pointer transition-all duration-200 hover:border-neutral-600 hover:scale-[1.01]',
        variant === 'feature' && 'relative overflow-hidden',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      {...props}
    >
      {children}
    </div>
  )
);
Card.displayName = 'Card';

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, description, actions, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-start justify-between pb-4 border-b border-[oklch(1_0_0/0.06)]', className)} {...props}>
      <div>
        {title && <h3 className="text-[15px] font-semibold text-neutral-950 leading-tight">{title}</h3>}
        {description && <p className="mt-1 text-[13px] text-neutral-700">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, align = 'right', children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-4 border-t border-[oklch(1_0_0/0.06)]',
        align === 'right' && 'justify-end',
        align === 'center' && 'justify-center',
        align === 'between' && 'justify-between',
        align === 'left' && 'justify-start',
        'gap-2',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

// Stat Card
export function StatCard({ icon, value, label, trend, iconVariant = 'brand' }: StatCardProps) {
  const iconColors = {
    brand: 'bg-brand-500/10 text-brand-500',
    success: 'bg-success-subtle text-success',
    warning: 'bg-warning-subtle text-warning',
    error: 'bg-error-subtle text-error',
  };

  return (
    <Card variant="default" padding="md">
      <div className="flex items-start gap-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', iconColors[iconVariant])}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">{label}</p>
          <p className="mt-0.5 text-[22px] font-semibold text-neutral-950 leading-tight">{value}</p>
          {trend && (
            <p className={cn(
              'mt-1 text-[12px] font-medium',
              trend.direction === 'up' ? 'text-success' : 'text-error'
            )}>
              {trend.direction === 'up' ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### Tailwind Class Patterns

```tsx
// Default card with header
<Card>
  <CardHeader title="Knowledge Base" description="3 documents indexed" actions={<Button size="sm">Upload</Button>} />
  <div className="pt-4">Card content here</div>
  <CardFooter>
    <Button variant="ghost" size="sm">View All</Button>
  </CardFooter>
</Card>

// Interactive card
<Card variant="interactive" onClick={() => navigate('/doc/1')}>
  <p className="text-[14px] text-neutral-900">Document Title</p>
</Card>

// Stat card
<StatCard icon={<FileText className="h-5 w-5" />} value="1,234" label="Documents" trend={{ value: 12, direction: 'up' }} />
```

### Usage Guidelines

- **default**: Dashboard widgets, settings panels, content containers
- **interactive**: Document list items, navigation cards, clickable content
- **stat**: Dashboard KPIs, analytics summary
- **feature**: Onboarding, feature highlights, empty states with illustrations

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use consistent padding within a view | Mix padding sizes randomly |
| Use interactive variant only for clickable cards | Make non-clickable cards look clickable |
| Keep card content focused on one topic | Overload cards with unrelated content |
| Use StatCard for numeric KPIs only | Put long text in stat cards |

### Accessibility

- Interactive cards: `role="button"`, `tabIndex={0}`, keyboard Enter handler
- Cards are `div` elements (no implicit ARIA role needed)
- CardHeader titles should use semantic heading levels (`h2`, `h3`)
- StatCard values should be readable by screen readers (not just visual)

---

## 6. Badge / Tag

### Visual Description

Badges are small, pill-shaped labels (`rounded-full`) with 22px height and subtle colored backgrounds. Each variant uses a tinted background with matching text color and a faint border at 20% opacity of the text color. The dot indicator variant shows a small 6px circle before the text.

### Variants

| Variant | Background | Text | Border |
|---------|-----------|------|--------|
| `default` | neutral-300 | neutral-900 | neutral-500 |
| `success` | success-subtle | success | success/30% |
| `warning` | warning-subtle | warning | warning/30% |
| `error` | error-subtle | error | error/30% |
| `info` | info-subtle | info | info/30% |
| `brand` | brand-500/15% | brand-400 | brand-500/30% |

### Sizes

| Size | Height | Padding | Font |
|------|--------|---------|------|
| `sm` | 18px | 0 6px | 11px/500 |
| `md` | 22px | 0 8px | 12px/500 |

### TypeScript Interface

```typescript
import { HTMLAttributes, forwardRef, ReactNode } from 'react';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  /** Badge size */
  size?: 'sm' | 'md';
  /** Show dot indicator before text */
  dot?: boolean;
  /** Enable remove button */
  removable?: boolean;
  /** Remove handler (shows X button) */
  onRemove?: () => void;
  /** Badge content */
  children: ReactNode;
}

const badgeVariants = {
  default: 'bg-neutral-300 text-neutral-900 border-neutral-500',
  success: 'bg-success-subtle text-success border-success/30',
  warning: 'bg-warning-subtle text-warning border-warning/30',
  error: 'bg-error-subtle text-error border-error/30',
  info: 'bg-info-subtle text-info border-info/30',
  brand: 'bg-brand-500/15 text-brand-400 border-brand-500/30',
};

const badgeSizes = {
  sm: 'h-[18px] px-1.5 text-[11px]',
  md: 'h-[22px] px-2 text-[12px]',
};

const dotColors = {
  default: 'bg-neutral-900',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
  brand: 'bg-brand-400',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', dot, removable, onRemove, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium leading-none whitespace-nowrap',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColors[variant])} />
      )}
      {children}
      {removable && (
        <button
          type="button"
          className="ml-0.5 -mr-1 h-3.5 w-3.5 rounded-full p-0.5 hover:bg-neutral-400/50 transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          aria-label={`Remove ${children}`}
        >
          <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l6 6M9 3l-6 6" />
          </svg>
        </button>
      )}
    </span>
  )
);
Badge.displayName = 'Badge';
```

### Tailwind Class Patterns

```tsx
// Status badge
<Badge variant="success" dot>Ready</Badge>

// Removable tag
<Badge variant="brand" removable onRemove={() => removeTag(tag)}>React</Badge>

// Small badge for counters
<Badge variant="error" size="sm">3</Badge>

// Info badge
<Badge variant="info">Beta</Badge>
```

### Usage Guidelines

- **success**: Completed states, active status, ready documents
- **warning**: Processing states, pending review, low quota
- **error**: Failed states, errors, expired items
- **info**: New features, beta indicators, informational labels
- **brand**: User-created tags, categories, feature labels
- **default**: Neutral counts, generic labels

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use badges for short status labels | Put long sentences in badges |
| Use dot variant for status indicators | Use dot and removable together |
| Keep badge count text numeric | Use badges as buttons |
| Use removable only in tag inputs | Make non-removable badges look removable |

### Accessibility

- `role="status"` for status badges
- Removable badges: `aria-label="Remove [tag name]"`
- Color is never the sole indicator — always pair with text/dot
- Badge content should be concise and meaningful

---

## 7. Avatar

### Visual Description

Avatars are circular containers that display user images, initials fallbacks, or icon fallbacks. A small status indicator dot (online/offline/away) can be positioned at the bottom-right. Avatar groups stack multiple avatars with negative margin overlap.

### Sizes

| Size | Diameter | Font (initials) | Status Dot |
|------|----------|-----------------|------------|
| `xs` | 24px | 10px | 6px |
| `sm` | 32px | 12px | 8px |
| `md` | 40px | 14px | 10px |
| `lg` | 56px | 18px | 12px |
| `xl` | 80px | 24px | 14px |

### TypeScript Interface

```typescript
import { ImgHTMLAttributes, forwardRef, ReactNode } from 'react';

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Image source URL */
  src?: string;
  /** Alt text */
  alt: string;
  /** Fallback content when image fails */
  fallback?: ReactNode;
  /** Show initials from name */
  initials?: string;
  /** Status indicator */
  status?: 'online' | 'offline' | 'away';
  /** Shape */
  shape?: 'circle' | 'square';
}

export interface AvatarGroupProps {
  /** Array of avatar props */
  avatars: AvatarProps[];
  /** Maximum visible avatars */
  max?: number;
  /** Avatar size for all in group */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const avatarSizes = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-[12px]',
  md: 'h-10 w-10 text-[14px]',
  lg: 'h-14 w-14 text-[18px]',
  xl: 'h-20 w-20 text-[24px]',
};

const statusSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
};

const statusColors = {
  online: 'bg-success',
  offline: 'bg-neutral-600',
  away: 'bg-warning',
};

// Generate color from name string
function stringToColor(name: string): string {
  const colors = [
    'bg-brand-600', 'bg-brand-400', 'bg-success/70', 'bg-info/70',
    'bg-warning/70', 'bg-error/70',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ size = 'md', src, alt, fallback, initials, status, shape = 'circle', className, ...props }, ref) => {
    const [hasError, setHasError] = useState(false);
    const showImage = src && !hasError;
    const showInitials = !showImage && initials;
    const showFallback = !showImage && !showInitials;

    return (
      <span ref={ref} className={cn('relative inline-flex shrink-0', className)}>
        <span
          className={cn(
            'flex items-center justify-center overflow-hidden bg-neutral-300 text-neutral-900 font-medium',
            avatarSizes[size],
            shape === 'circle' ? 'rounded-full' : 'rounded-lg'
          )}
        >
          {showImage && (
            <img
              src={src}
              alt={alt}
              className="h-full w-full object-cover"
              onError={() => setHasError(true)}
              {...props}
            />
          )}
          {showInitials && (
            <span className={cn(stringToColor(alt))}>
              {initials}
            </span>
          )}
          {showFallback && (
            fallback || <User className="h-1/2 w-1/2 text-neutral-600" />
          )}
        </span>
        {status && (
          <span
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-2 border-neutral-200',
              statusSizes[size],
              statusColors[status]
            )}
            aria-label={`Status: ${status}`}
          />
        )}
      </span>
    );
  }
);
Avatar.displayName = 'Avatar';

export function AvatarGroup({ avatars, max = 3, size = 'md' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex items-center">
      {visible.map((avatar, i) => (
        <span
          key={i}
          className={cn(
            'relative inline-flex',
            i > 0 && '-ml-2'
          )}
          style={{ zIndex: max - i }}
        >
          <Avatar {...avatar} size={size} />
        </span>
      ))}
      {remaining > 0 && (
        <span
          className={cn(
            'relative inline-flex -ml-2 items-center justify-center rounded-full bg-neutral-300 text-neutral-900 font-medium border-2 border-neutral-200',
            avatarSizes[size]
          )}
          style={{ zIndex: 0 }}
        >
          +{remaining}
        </span>
      )}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Image avatar
<Avatar src="/avatars/user.jpg" alt="John Doe" size="md" />

// Initials fallback
<Avatar alt="Jane Smith" initials="JS" size="lg" />

// With status
<Avatar src="/avatars/user.jpg" alt="User" status="online" />

// Avatar group
<AvatarGroup
  avatars={[
    { src: '/u1.jpg', alt: 'User 1' },
    { src: '/u2.jpg', alt: 'User 2' },
    { src: '/u3.jpg', alt: 'User 3' },
    { src: '/u4.jpg', alt: 'User 4' },
  ]}
  max={3}
  size="sm"
/>
```

### Usage Guidelines

- **xs-sm**: Inline with text, list items, comments
- **md**: User profiles, card headers, sidebar
- **lg**: Profile pages, chat messages
- **xl**: User profile hero, settings page

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Always provide `alt` text | Use empty alt on avatars |
| Show initials as fallback when image fails | Show broken image icon |
| Use status dots for real-time presence | Use status dots for static info |
| Limit avatar group to 3-4 visible | Show 10+ avatars in a row |

### Accessibility

- `alt` text is required (describes the person)
- Status dot: `aria-label="Status: online"` for screen readers
- Avatar groups: `role="group"` with `aria-label="Team members"`
- `aria-label` on the "+N" overflow indicator

---

## 8. Dialog / Modal

### Visual Description

Dialogs float over a blurred backdrop (`oklch(0 0 0 / 60%)` with `backdrop-blur-sm`). The dialog panel is `neutral-200` with 12px radius, 24px padding, and a `shadow-[0_25px_50px_-12px_oklch(0_0_0/50%)]`. A ghost close button sits at top-right. Focus is trapped within the dialog.

### Sizes

| Size | Width | Usage |
|------|-------|-------|
| `sm` | 400px | Confirmations, simple alerts |
| `md` | 480px | Forms, settings |
| `lg` | 640px | Complex forms, multi-step |
| `xl` | 800px | Detail views, previews |
| `full` | calc(100vw - 48px) | Full-page overlays |

### TypeScript Interface

```typescript
import { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export interface DialogProps {
  /** Control open state */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Dialog content */
  children: ReactNode;
}

export interface DialogTriggerProps {
  /** Trigger element */
  children: ReactNode;
  /** Render as child (no default button wrapper) */
  asChild?: boolean;
}

export interface DialogContentProps {
  /** Dialog size */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Dialog title (also sets aria-label) */
  title?: string;
  /** Description for screen readers */
  description?: string;
  /** Show close button */
  showClose?: boolean;
  /** Close on backdrop click */
  closeOnBackdrop?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
  /** Footer content */
  footer?: ReactNode;
  /** Custom class */
  className?: string;
  /** Content children */
  children: ReactNode;
}

const dialogSizes = {
  sm: 'max-w-[400px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  xl: 'max-w-[800px]',
  full: 'max-w-[calc(100vw-48px)]',
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogTrigger({ children, asChild }: DialogTriggerProps) {
  return (
    <DialogPrimitive.Trigger asChild={asChild}>
      {children}
    </DialogPrimitive.Trigger>
  );
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({
    size = 'md', title, description, showClose = true,
    closeOnBackdrop = true, closeOnEscape = true,
    footer, className, children, ...props
  }, ref) => (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed left-[50%] top-[50%] z-50 w-full translate-x-[-50%] translate-y-[-50%]',
          'rounded-xl bg-neutral-200 border border-[oklch(1_0_0/0.06)] p-6',
          'shadow-[0_25px_50px_-12px_oklch(0_0_0/0.5)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          dialogSizes[size],
          className
        )}
        onPointerDownOutside={closeOnBackdrop ? undefined : (e) => e.preventDefault()}
        onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
        {...props}
      >
        {showClose && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300 transition-colors">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {title && (
          <DialogPrimitive.Title className="text-[18px] font-semibold text-neutral-950 leading-tight pr-8">
            {title}
          </DialogPrimitive.Title>
        )}
        {description && (
          <DialogPrimitive.Description className="mt-1.5 text-[13px] text-neutral-700">
            {description}
          </DialogPrimitive.Description>
        )}
        <div className={cn('mt-4 text-[14px] text-neutral-800', title && 'mt-4')}>
          {children}
        </div>
        {footer && (
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-[oklch(1_0_0/0.06)] pt-4">
            {footer}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
);
DialogContent.displayName = 'DialogContent';

// Convenience compound components
export const DialogHeader = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('space-y-1.5', className)}>{children}</div>
);

export const DialogFooter = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('flex items-center justify-end gap-2 border-t border-[oklch(1_0_0/0.06)] pt-4 mt-6', className)}>
    {children}
  </div>
);
```

### Tailwind Class Patterns

```tsx
// Simple confirmation dialog
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </DialogTrigger>
  <DialogContent size="sm" title="Delete Document" description="This action cannot be undone."
    footer={
      <>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </>
    }
  >
    <p>Are you sure you want to delete this document?</p>
  </DialogContent>
</Dialog>

// Controlled dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent size="lg" title="Upload Document">
    <UploadForm onComplete={() => setIsOpen(false)} />
  </DialogContent>
</Dialog>
```

### Usage Guidelines

- **sm**: Confirmations, simple alerts, quick actions
- **md**: Forms, settings, most interactions
- **lg**: Complex multi-step forms, document previews
- **xl**: Side-by-side comparisons, detailed views
- **full**: Full-screen editors, immersive experiences

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Use appropriate size for content complexity | Use sm for complex forms |
| Provide clear title and description | Open dialogs without purpose |
| Include Cancel + Action in footer | Forget close mechanism |
| Trap focus within dialog | Allow tab to escape dialog |

### Accessibility

- `role="dialog"` and `aria-modal="true"` (from Radix)
- `aria-labelledby` linked to title
- `aria-describedby` linked to description
- Focus trapped within dialog
- Escape key closes (configurable)
- Return focus to trigger on close
- Backdrop click closes (configurable)

---

## 9. Toast / Notification

### Visual Description

Toasts appear in the bottom-right corner (top-center on mobile) as floating cards. They feature a 3px left border accent matching the variant color, a status icon, text content, and optional action button. Toasts stack vertically with 8px gap and auto-dismiss after a configurable duration.

### Variants

| Variant | Icon Color | Left Border | Auto-dismiss |
|---------|-----------|-------------|--------------|
| `success` | success | success | 4000ms |
| `error` | error | error | 6000ms |
| `warning` | warning | warning | 5000ms |
| `info` | info | info | 4000ms |

### Positions

| Position | Description |
|----------|-------------|
| `top-right` | Desktop default |
| `bottom-right` | Alternative desktop |
| `top-center` | Mobile default |

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface Toast {
  /** Unique identifier */
  id: string;
  /** Toast variant */
  variant: 'success' | 'error' | 'warning' | 'info';
  /** Toast title */
  title: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration?: number;
  /** Custom icon override */
  icon?: ReactNode;
}

export interface ToastProps extends Toast {
  /** Called when toast is dismissed */
  onDismiss: (id: string) => void;
  /** Position */
  position?: 'top-right' | 'bottom-right' | 'top-center';
}

export interface ToasterProps {
  /** Active toasts */
  toasts: Toast[];
  /** Dismiss handler */
  onDismiss: (id: string) => void;
  /** Toast position */
  position?: 'top-right' | 'bottom-right' | 'top-center';
}

// Hook for toast management
export interface UseToastReturn {
  toast: (props: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const variantIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const variantIconColors = {
  success: 'text-success',
  error: 'text-error',
  warning: 'text-warning',
  info: 'text-info',
};

const variantBorderColors = {
  success: 'border-l-success',
  error: 'border-l-error',
  warning: 'border-l-warning',
  info: 'border-l-info',
};

export function ToastItem({ id, variant, title, description, action, icon, onDismiss }: ToastProps) {
  const Icon = icon || variantIcons[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto w-full max-w-[380px] rounded-lg border border-[oklch(1_0_0/0.06)] border-l-[3px]',
        'bg-neutral-200 p-3 shadow-[0_8px_24px_oklch(0_0_0/0.4)]',
        'animate-in slide-in-from-right-full fade-in-0 duration-200',
        variantBorderColors[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', variantIconColors[variant])} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-neutral-950">{title}</p>
          {description && (
            <p className="mt-0.5 text-[12px] text-neutral-700">{description}</p>
          )}
        </div>
        <button
          onClick={() => onDismiss(id)}
          className="shrink-0 rounded p-0.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-300 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {action && (
        <div className="mt-2 ml-8">
          <button
            onClick={action.onClick}
            className="text-[12px] font-medium text-brand-500 hover:text-brand-600 transition-colors"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}

export function Toaster({ toasts, onDismiss, position = 'bottom-right' }: ToasterProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={cn('fixed z-[100] flex flex-col gap-2', positionClasses[position])} aria-label="Notifications">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
```

### Usage Guidelines

- **success**: Document uploaded, settings saved, action completed
- **error**: API failures, upload errors, validation errors
- **warning**: Rate limits approaching, processing delays
- **info**: Tips, feature announcements, status updates

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Auto-dismiss success/info after 4s | Auto-dismiss errors (let user read) |
| Show max 3 toasts at once | Stack 10 toasts blocking content |
| Provide action button for reversible actions | Force user to dismiss critical errors |
| Use appropriate variant for severity | Use error for non-critical messages |

### Accessibility

- `role="status"` and `aria-live="polite"` for screen readers
- Toasts announced when they appear
- Dismiss button has `aria-label="Dismiss notification"`
- No auto-focus on toast (non-blocking)
- Keyboard: Tab to action, Escape to dismiss

---

## 10. Tooltip

### Visual Description

Tooltips are small floating cards that appear on hover/focus with a 300ms delay. They use `neutral-300` background, `neutral-950` text, 6px radius, and an optional arrow pointer. Max width is 250px.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export interface TooltipProps {
  /** Tooltip content */
  content: ReactNode;
  /** Tooltip position */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Show arrow pointer */
  arrow?: boolean;
  /** Delay before showing (ms) */
  delayDuration?: number;
  /** Maximum width */
  maxWidth?: number;
  /** Trigger element */
  children: ReactNode;
  /** Disable the tooltip */
  disabled?: boolean;
  /** Force open state */
  open?: boolean;
}

const sideOffset = 6;

export function Tooltip({
  content, side = 'top', arrow = true, delayDuration = 300,
  maxWidth = 250, children, disabled, open
}: TooltipProps) {
  if (disabled) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root open={open}>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className={cn(
              'z-50 overflow-hidden rounded-md bg-neutral-300 px-2.5 py-1.5',
              'text-[13px] text-neutral-950 shadow-[0_4px_12px_oklch(0_0_0/0.3)]',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=top]:slide-in-from-bottom-2',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2'
            )}
            style={{ maxWidth }}
          >
            {content}
            {arrow && (
              <TooltipPrimitive.Arrow className="fill-neutral-300" />
            )}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
```

### Tailwind Class Patterns

```tsx
// Simple tooltip
<Tooltip content="Settings">
  <Button variant="ghost" size="icon-md">
    <Settings className="h-4 w-4" />
  </Button>
</Tooltip>

// Rich content tooltip
<Tooltip content={<div><p className="font-medium">Usage</p><p>1,234 / 5,000 tokens</p></div>}>
  <Badge variant="brand">Pro</Badge>
</Tooltip>

// Bottom tooltip, no arrow
<Tooltip content="Click to expand" side="bottom" arrow={false}>
  <ChevronDown className="h-4 w-4" />
</Tooltip>
```

### Usage Guidelines

- Use tooltips for icon-only buttons to explain their purpose
- Use tooltips for truncated text that may be cut off
- Keep tooltip text concise (1-2 sentences max)
- For rich content, consider a Popover instead

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Keep text short and actionable | Put essential info only in tooltips |
| Use 300ms delay for hover | Show immediately on hover |
| Use `disabled` when parent is interactive | Show tooltips on disabled elements |
| Provide `aria-label` on trigger if no visible text | Use tooltips as primary labels |

### Accessibility

- Trigger: `aria-describedby` linked to tooltip
- Tooltip: `role="tooltip"`
- Shows on focus (keyboard navigation)
- Hidden on Escape key
- Delay prevents accidental triggers

---

## 11. Dropdown Menu

### Visual Description

Dropdown menus are floating panels that appear anchored to a trigger element. They use `neutral-200` background, 1px border, 8px radius, and `shadow-[0_8px_24px_oklch(0_0_0/40%)]`. Items have 8px vertical padding, 12px horizontal, with hover highlighting to `neutral-300`. Separators are 1px lines at `neutral-500`.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';

export interface DropdownMenuProps {
  /** Menu trigger */
  children: ReactNode;
  /** Menu items */
  items: DropdownItem[];
  /** Menu align relative to trigger */
  align?: 'start' | 'center' | 'end';
  /** Menu width */
  width?: number;
}

export interface DropdownItem {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Keyboard shortcut display */
  shortcut?: string;
  /** Disable this item */
  disabled?: boolean;
  /** Destructive item (red text) */
  destructive?: boolean;
  /** Separator before this item */
  separator?: boolean;
  /** Render as checkbox item */
  checkbox?: boolean;
  /** Checkbox checked state */
  checked?: boolean;
  /** Render as radio item */
  radio?: boolean;
  /** Radio group name */
  radioGroup?: string;
  /** Sub-menu items */
  children?: DropdownItem[];
  /** Click handler */
  onClick?: () => void;
}

export function DropdownMenu({ children, items, align = 'start', width = 200 }: DropdownMenuProps) {
  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>
        {children}
      </DropdownMenuPrimitive.Trigger>
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align={align}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[180px] overflow-hidden rounded-lg border border-[oklch(1_0_0/0.06)]',
            'bg-neutral-200 p-1 shadow-[0_8px_24px_oklch(0_0_0/40%)]',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
          style={{ width }}
        >
          {items.map((item) => {
            if (item.separator) {
              return <DropdownMenuPrimitive.Separator key={item.value} className="my-1 h-px bg-neutral-500" />;
            }

            if (item.checkbox) {
              return (
                <DropdownMenuPrimitive.CheckboxItem
                  key={item.value}
                  checked={item.checked}
                  disabled={item.disabled}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-neutral-900 outline-none hover:bg-neutral-300 focus:bg-neutral-300 data-[disabled]:opacity-50 cursor-pointer"
                  onSelect={item.onClick}
                >
                  <DropdownMenuPrimitive.ItemIndicator>
                    <Check className="h-3.5 w-3.5" />
                  </DropdownMenuPrimitive.ItemIndicator>
                  {item.icon && <span className="shrink-0 text-neutral-600">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </DropdownMenuPrimitive.CheckboxItem>
              );
            }

            if (item.radio) {
              return (
                <DropdownMenuPrimitive.RadioItem
                  key={item.value}
                  value={item.value}
                  disabled={item.disabled}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-neutral-900 outline-none hover:bg-neutral-300 focus:bg-neutral-300 data-[disabled]:opacity-50 cursor-pointer"
                  onSelect={item.onClick}
                >
                  <DropdownMenuPrimitive.ItemIndicator>
                    <Circle className="h-3.5 w-3.5" />
                  </DropdownMenuPrimitive.ItemIndicator>
                  {item.icon && <span className="shrink-0 text-neutral-600">{item.icon}</span>}
                  <span className="flex-1">{item.label}</span>
                </DropdownMenuPrimitive.RadioItem>
              );
            }

            if (item.children) {
              return (
                <DropdownMenuPrimitive.Sub key={item.value}>
                  <DropdownMenuPrimitive.SubTrigger
                    disabled={item.disabled}
                    className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-neutral-900 outline-none hover:bg-neutral-300 focus:bg-neutral-300 data-[disabled]:opacity-50 cursor-pointer"
                  >
                    {item.icon && <span className="shrink-0 text-neutral-600">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-600" />
                  </DropdownMenuPrimitive.SubTrigger>
                  <DropdownMenuPrimitive.Portal>
                    <DropdownMenuPrimitive.SubContent className="z-50 min-w-[180px] overflow-hidden rounded-lg border border-[oklch(1_0_0/0.06)] bg-neutral-200 p-1 shadow-[0_8px_24px_oklch(0_0_0/40%)]">
                      {item.children.map((child) => (
                        <DropdownMenuPrimitive.Item
                          key={child.value}
                          disabled={child.disabled}
                          className="flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] text-neutral-900 outline-none hover:bg-neutral-300 focus:bg-neutral-300 data-[disabled]:opacity-50 cursor-pointer"
                          onSelect={child.onClick}
                        >
                          {child.icon && <span className="shrink-0 text-neutral-600">{child.icon}</span>}
                          <span className="flex-1">{child.label}</span>
                        </DropdownMenuPrimitive.Item>
                      ))}
                    </DropdownMenuPrimitive.SubContent>
                  </DropdownMenuPrimitive.Portal>
                </DropdownMenuPrimitive.Sub>
              );
            }

            return (
              <DropdownMenuPrimitive.Item
                key={item.value}
                disabled={item.disabled}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] outline-none',
                  'hover:bg-neutral-300 focus:bg-neutral-300 data-[disabled]:opacity-50 cursor-pointer',
                  item.destructive ? 'text-error' : 'text-neutral-900'
                )}
                onSelect={item.onClick}
              >
                {item.icon && <span className="shrink-0 text-neutral-600">{item.icon}</span>}
                <span className="flex-1">{item.label}</span>
                {item.shortcut && (
                  <span className="ml-auto text-[11px] text-neutral-600 font-mono">{item.shortcut}</span>
                )}
              </DropdownMenuPrimitive.Item>
            );
          })}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
```

### Tailwind Class Patterns

```tsx
// Basic dropdown
<DropdownMenu
  trigger={<Button variant="ghost" size="icon-md"><MoreHorizontal className="h-4 w-4" /></Button>}
  items={[
    { value: 'edit', label: 'Edit', icon: <Pencil className="h-4 w-4" />, shortcut: '⌘E' },
    { value: 'sep', label: '', separator: true },
    { value: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" />, destructive: true },
  ]}
/>

// With checkbox items
<DropdownMenu
  items={[
    { value: 'bold', label: 'Bold', checkbox: true, checked: isBold, onClick: () => toggleBold() },
    { value: 'italic', label: 'Italic', checkbox: true, checked: isItalic, onClick: () => toggleItalic() },
  ]}
/>
```

### Usage Guidelines

- Use for actions related to a specific item (edit, delete, share)
- Keep items to 5-8 max for usability
- Group related actions with separators
- Use destructive variant for irreversible actions
- Keyboard shortcuts should match platform conventions

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Group related items with separators | Mix unrelated actions |
| Show keyboard shortcuts for power users | Hide critical actions in sub-menus |
| Use icons consistently | Use icons on some items but not others |
| Label destructive actions clearly | Rely only on red color for danger |

### Accessibility

- Arrow keys navigate items
- Enter/Space activates item
- Escape closes menu
- Type-ahead: type characters to jump to items
- `aria-label` on trigger if no visible text
- Focus returns to trigger on close

---

## 12. Command Palette (Cmd+K)

### Visual Description

The command palette is a full-width modal that appears centered at the top of the viewport. It features a search input at the top, categorized results below, and keyboard navigation hints. It uses the same `neutral-200` background with `backdrop-blur-sm`. Results are grouped by category with section headers.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export interface CommandPaletteProps {
  /** Control open state */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Command items */
  items: CommandItem[];
  /** Search placeholder */
  placeholder?: string;
  /** Empty state text */
  emptyText?: string;
  /** Recent items */
  recentItems?: CommandItem[];
  /** Called when an item is selected */
  onSelect?: (item: CommandItem) => void;
}

export interface CommandItem {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Category for grouping */
  category: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Keyboard shortcut */
  shortcut?: string;
  /** Perform action */
  action?: () => void;
}

export function CommandPalette({
  open, onOpenChange, items, placeholder = 'Search commands...',
  emptyText = 'No results found.', recentItems, onSelect
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.description?.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const displayItems = query ? filteredItems : (recentItems || []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-[50%] top-[20%] z-50 w-full max-w-[560px] translate-x-[-50%]',
            'rounded-xl bg-neutral-200 border border-[oklch(1_0_0/0.06)]',
            'shadow-[0_25px_50px_-12px_oklch(0_0_0/0.5)]',
            'animate-in fade-in-0 zoom-in-95',
            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
          )}
        >
          {/* Search Input */}
          <div className="flex items-center border-b border-[oklch(1_0_0/0.06)] px-4">
            <Search className="h-4 w-4 shrink-0 text-neutral-600" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActiveIndex(0); }}
              placeholder={placeholder}
              className="flex-1 bg-transparent py-3 px-3 text-[14px] text-neutral-900 placeholder:text-neutral-600 outline-none"
              autoFocus
            />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-neutral-500 bg-neutral-200 px-1.5 font-mono text-[10px] text-neutral-600">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {query && filteredItems.length === 0 && (
              <div className="py-8 text-center text-[13px] text-neutral-600">{emptyText}</div>
            )}

            {!query && recentItems && recentItems.length > 0 && (
              <div className="mb-2">
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                  Recent
                </p>
                {recentItems.map((item, i) => (
                  <CommandItemRow key={item.value} item={item} isActive={i === activeIndex} onSelect={onSelect} />
                ))}
              </div>
            )}

            {query && Object.entries(grouped).map(([category, categoryItems]) => (
              <div key={category} className="mb-2">
                <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                  {category}
                </p>
                {categoryItems.map((item, i) => (
                  <CommandItemRow key={item.value} item={item} isActive={false} onSelect={onSelect} />
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[oklch(1_0_0/0.06)] px-4 py-2 text-[11px] text-neutral-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="rounded border border-neutral-500 bg-neutral-200 px-1 font-mono">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-neutral-500 bg-neutral-200 px-1 font-mono">↵</kbd> Select</span>
              <span className="flex items-center gap-1"><kbd className="rounded border border-neutral-500 bg-neutral-200 px-1 font-mono">ESC</kbd> Close</span>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandItemRow({ item, isActive, onSelect }: { item: CommandItem; isActive: boolean; onSelect?: (item: CommandItem) => void }) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px]',
        'hover:bg-neutral-300 focus:bg-neutral-300 outline-none transition-colors',
        isActive && 'bg-neutral-300'
      )}
      onClick={() => {
        onSelect?.(item);
        item.action?.();
      }}
    >
      {item.icon && <span className="shrink-0 text-neutral-600">{item.icon}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-neutral-900 font-medium">{item.label}</p>
        {item.description && <p className="text-[12px] text-neutral-600 truncate">{item.description}</p>}
      </div>
      {item.shortcut && (
        <span className="shrink-0 text-[11px] text-neutral-600 font-mono">{item.shortcut}</span>
      )}
    </button>
  );
}
```

### Tailwind Class Patterns

```tsx
// Command palette with categories
<CommandPalette
  open={isOpen}
  onOpenChange={setIsOpen}
  items={[
    { value: 'dashboard', label: 'Dashboard', category: 'Navigation', icon: <LayoutDashboard className="h-4 w-4" /> },
    { value: 'upload', label: 'Upload Document', category: 'Actions', icon: <Upload className="h-4 w-4" />, shortcut: '⌘U' },
    { value: 'search', label: 'Search Documents', category: 'Actions', icon: <Search className="h-4 w-4" />, shortcut: '⌘F' },
  ]}
  onSelect={(item) => item.action?.()}
/>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate items |
| `Enter` | Select active item |
| `Escape` | Close palette |
| Type | Filter results |

### Usage Guidelines

- Open with `Cmd+K` (Mac) / `Ctrl+K` (Windows)
- Include quick actions, navigation, and search
- Show recent items when no query is entered
- Group results by category for scannability
- Keep categories to 3-5 max

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Show keyboard shortcuts for actions | Hide the command palette trigger |
| Group results meaningfully | Mix unrelated items without categories |
| Show recent items first | Show all items without filtering |
| Provide empty state | Leave blank when no results |

### Accessibility

- `role="dialog"` and `aria-modal="true"`
- Search input auto-focused on open
- Arrow keys navigate, Enter selects
- Escape closes and returns focus to trigger
- `aria-activedescendant` for focused item

---

## 13. Sidebar Navigation

### Visual Description

The sidebar is a vertical navigation panel at 240px width (collapsible to 64px). It uses `neutral-100` background with a right border. Navigation items are 32px height with 8px×12px padding and 6px radius. Active items have a 2px left border in `brand-500` and `neutral-300` background. Section labels are uppercase 11px text.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface SidebarProps {
  /** Whether sidebar is collapsed */
  collapsed?: boolean;
  /** Toggle collapse */
  onToggleCollapse?: () => void;
  /** Navigation sections */
  sections: SidebarSection[];
  /** Current active route */
  activeRoute?: string;
  /** Header content (logo, workspace) */
  header?: ReactNode;
  /** Footer content (user, settings) */
  footer?: ReactNode;
}

export interface SidebarSection {
  /** Section label (uppercase) */
  label?: string;
  /** Navigation items */
  items: SidebarItem[];
}

export interface SidebarItem {
  /** Unique value (matches route) */
  value: string;
  /** Display label */
  label: string;
  /** Icon element */
  icon: ReactNode;
  /** Badge count */
  badge?: number | string;
  /** Badge variant */
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  /** Sub-items (nested) */
  children?: SidebarItem[];
  /** Disable item */
  disabled?: boolean;
}

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;

export function Sidebar({
  collapsed = false, onToggleCollapse, sections, activeRoute, header, footer
}: SidebarProps) {
  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-neutral-100 border-r border-[oklch(1_0_0/0.06)]',
        'transition-all duration-300 ease-default',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Header */}
      {header && (
        <div className={cn('flex items-center h-14 border-b border-[oklch(1_0_0/0.06)]', collapsed ? 'justify-center px-2' : 'px-3')}>
          {header}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Sidebar navigation">
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={cn(sectionIndex > 0 && 'mt-4')}>
            {section.label && !collapsed && (
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <SidebarItemComponent
                  key={item.value}
                  item={item}
                  isActive={activeRoute === item.value}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className={cn('border-t border-[oklch(1_0_0/0.06)] p-2', collapsed && 'flex justify-center')}>
          {footer}
        </div>
      )}
    </aside>
  );
}

function SidebarItemComponent({ item, isActive, collapsed }: {
  item: SidebarItem; isActive: boolean; collapsed: boolean;
}) {
  return (
    <Tooltip content={collapsed ? item.label : ''} disabled={!collapsed}>
      <a
        href={`#${item.value}`}
        className={cn(
          'group relative flex items-center gap-3 rounded-md text-[13px] font-medium',
          collapsed ? 'h-10 w-10 justify-center px-0' : 'h-8 px-3',
          'transition-colors duration-150',
          isActive
            ? 'bg-neutral-300 text-neutral-950 border-l-2 border-brand-500 -ml-px'
            : 'text-neutral-700 hover:bg-neutral-300/50 hover:text-neutral-900',
          item.disabled && 'opacity-50 pointer-events-none'
        )}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={cn('shrink-0', isActive ? 'text-brand-500' : 'text-neutral-600 group-hover:text-neutral-800')}>
          {item.icon}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge !== undefined && (
              <Badge variant={item.badgeVariant || 'default'} size="sm">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </a>
    </Tooltip>
  );
}
```

### Tailwind Class Patterns

```tsx
// Sidebar with sections
<Sidebar
  collapsed={isCollapsed}
  onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
  activeRoute={usePathname()}
  header={
    <div className="flex items-center gap-2">
      <Bot className="h-6 w-6 text-brand-500" />
      {!isCollapsed && <span className="text-[15px] font-semibold text-neutral-950">MimoNotes</span>}
    </div>
  }
  sections={[
    {
      items: [
        { value: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { value: '/chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
      ],
    },
    {
      label: 'Knowledge Base',
      items: [
        { value: '/documents', label: 'Documents', icon: <FileText className="h-4 w-4" />, badge: 12 },
        { value: '/upload', label: 'Upload', icon: <Upload className="h-4 w-4" /> },
      ],
    },
  ]}
/>
```

### Collapse Behavior

| State | Width | Content | Labels | Badges |
|-------|-------|---------|--------|--------|
| Expanded | 240px | Icon + Label + Badge | Visible | Visible |
| Collapsed | 64px | Icon only | Hidden | Hidden (tooltip on hover) |

### Usage Guidelines

- Primary nav items at top (Dashboard, Chat)
- Group related items under section labels
- Use badge counts for notifications or document counts
- Collapse on screens < 1024px width
- Remember collapse state in localStorage

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Show tooltips when collapsed | Hide all labels without tooltip |
| Highlight active route clearly | Use subtle indicators for active state |
| Group items with section labels | Mix unrelated items |
| Limit to 8-10 primary items | Overload sidebar with 20+ items |

### Accessibility

- `nav` element with `aria-label="Sidebar navigation"`
- Active item: `aria-current="page"`
- Disabled items: `aria-disabled="true"`
- Collapse toggle: `aria-label="Toggle sidebar"`, `aria-expanded`
- Keyboard: Tab through items, Enter to activate

---

## 14. Empty State

### Visual Description

Empty states are centered content blocks displayed when no data is available. They feature a large icon/illustration (48px), a heading, description text, and an optional action button. The layout is vertically centered with generous spacing.

### Variants

| Variant | Icon | Usage |
|---------|------|-------|
| `no-data` | Inbox | No documents uploaded yet |
| `no-results` | Search | Search returned no results |
| `error` | AlertCircle | Something went wrong |
| `coming-soon` | Sparkles | Feature not yet available |

### Sizes

| Size | Icon | Heading | Description | Spacing |
|------|------|---------|-------------|---------|
| `sm` | 36px | 15px | 13px | p-6 |
| `md` | 48px | 18px | 14px | p-10 |
| `lg` | 64px | 22px | 16px | p-16 |

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Empty state variant */
  variant?: 'no-data' | 'no-results' | 'error' | 'coming-soon';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Main heading */
  title: string;
  /** Description text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  /** Custom icon/illustration override */
  icon?: ReactNode;
  /** Custom illustration slot */
  illustration?: ReactNode;
}

const variantIcons = {
  'no-data': Inbox,
  'no-results': Search,
  'error': AlertCircle,
  'coming-soon': Sparkles,
};

const sizeConfig = {
  sm: { icon: 'h-9 w-9', heading: 'text-[15px]', desc: 'text-[13px]', container: 'p-6' },
  md: { icon: 'h-12 w-12', heading: 'text-[18px]', desc: 'text-[14px]', container: 'p-10' },
  lg: { icon: 'h-16 w-16', heading: 'text-[22px]', desc: 'text-[14px]', container: 'p-16' },
};

export function EmptyState({
  variant = 'no-data', size = 'md', title, description, action, icon, illustration
}: EmptyStateProps) {
  const config = sizeConfig[size];
  const Icon = icon || variantIcons[variant];

  return (
    <div className={cn('flex flex-col items-center justify-center text-center', config.container)}>
      {illustration || (
        <div className={cn('mb-4 flex items-center justify-center rounded-2xl bg-neutral-300/50 p-4', config.icon)}>
          <span className="text-neutral-600">{Icon && <Icon className="h-full w-full" />}</span>
        </div>
      )}
      <h3 className={cn('font-semibold text-neutral-950', config.heading)}>{title}</h3>
      {description && (
        <p className={cn('mt-1.5 max-w-[320px] text-neutral-700', config.desc)}>{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          size="md"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// No documents
<EmptyState
  variant="no-data"
  title="No documents yet"
  description="Upload your first document to start building your knowledge base."
  action={{ label: 'Upload Document', onClick: () => router.push('/upload') }}
/>

// No search results
<EmptyState
  variant="no-results"
  size="sm"
  title="No results found"
  description="Try adjusting your search query."
/>

// Error state
<EmptyState
  variant="error"
  title="Something went wrong"
  description="We couldn't load your documents. Please try again."
  action={{ label: 'Retry', onClick: refetch, variant: 'secondary' }}
/>

// Coming soon
<EmptyState
  variant="coming-soon"
  title="Team Collaboration"
  description="Real-time collaboration features are coming soon."
/>
```

### Usage Guidelines

- **no-data**: First-time users, empty lists, no items
- **no-results**: Search results, filtered lists
- **error**: Failed data loads, API errors
- **coming-soon**: Feature announcements, roadmap hints

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Provide actionable next step | Show empty state without guidance |
| Keep description concise | Write paragraphs of explanation |
| Use appropriate variant | Use error variant for "no data" |
| Match size to context | Use lg size in a small card |

### Accessibility

- Heading level matches document outline (`h2`, `h3`)
- Action button follows Button accessibility guidelines
- Icon has `aria-hidden="true"` (decorative)
- Text content is accessible to screen readers

---

## 15. Skeleton Loader

### Visual Description

Skeletons are animated placeholders that mirror the shape of content being loaded. They use `neutral-300` background with a shimmer animation (linear-gradient sliding left-to-right at 1.5s). Each skeleton variant mimics the specific content layout it replaces.

### Variants

| Variant | Description |
|---------|-------------|
| `text` | 1-4 lines of text |
| `card` | Card with header + body |
| `table` | Table rows with columns |
| `avatar` | Circular avatar placeholder |
| `chat` | Chat message bubble |

### TypeScript Interface

```typescript
import { HTMLAttributes } from 'react';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Skeleton variant */
  variant?: 'text' | 'card' | 'table' | 'avatar' | 'chat';
  /** Number of lines (text variant) */
  lines?: number;
  /** Avatar size (avatar variant) */
  avatarSize?: 'sm' | 'md' | 'lg';
  /** Show header (card variant) */
  showHeader?: boolean;
  /** Number of rows (table variant) */
  rows?: number;
  /** Number of columns (table variant) */
  columns?: number;
  /** Chat message alignment */
  align?: 'left' | 'right';
  /** Width */
  width?: string | number;
  /** Height */
  height?: string | number;
}

const shimmer =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent';

const skeletonBase = 'rounded-md bg-neutral-300';

export function Skeleton({
  variant = 'text', lines = 3, avatarSize = 'md', showHeader = true,
  rows = 5, columns = 4, align = 'left', width, height, className, ...props
}: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div className={cn('space-y-2', className)} {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(skeletonBase, shimmer, 'h-3.5', i === lines - 1 && 'w-3/4')}
            style={{ width: width }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'avatar') {
    const sizeMap = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-14 w-14' };
    return (
      <div className={cn(skeletonBase, shimmer, 'rounded-full', sizeMap[avatarSize], className)} {...props} />
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn('rounded-[10px] border border-[oklch(1_0_0/0.06)] bg-neutral-200 p-5 space-y-4', className)} {...props}>
        {showHeader && (
          <div className="space-y-2">
            <div className={cn(skeletonBase, shimmer, 'h-4 w-1/3')} />
            <div className={cn(skeletonBase, shimmer, 'h-3 w-2/3')} />
          </div>
        )}
        <div className="space-y-2">
          <div className={cn(skeletonBase, shimmer, 'h-3 w-full')} />
          <div className={cn(skeletonBase, shimmer, 'h-3 w-full')} />
          <div className={cn(skeletonBase, shimmer, 'h-3 w-2/3')} />
        </div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)} {...props}>
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex items-center gap-4">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <div
                key={colIdx}
                className={cn(skeletonBase, shimmer, 'h-3.5')}
                style={{ flex: colIdx === 0 ? '0 0 40%' : '1' }}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'chat') {
    return (
      <div className={cn('flex gap-3', align === 'right' && 'flex-row-reverse', className)} {...props}>
        <Skeleton variant="avatar" avatarSize="sm" />
        <div className={cn('space-y-2 max-w-[300px]', align === 'right' && 'items-end')}>
          <div className={cn(skeletonBase, shimmer, 'h-3 w-16')} />
          <div className={cn(skeletonBase, shimmer, 'h-3 w-full')} />
          <div className={cn(skeletonBase, shimmer, 'h-3 w-4/5')} />
        </div>
      </div>
    );
  }

  return <div className={cn(skeletonBase, shimmer, className)} style={{ width, height }} {...props} />;
}

// Preset skeleton compositions
export function ChatSkeleton() {
  return (
    <div className="space-y-6 p-4">
      <Skeleton variant="chat" align="right" />
      <Skeleton variant="chat" align="left" />
      <Skeleton variant="chat" align="right" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Text loading
<Skeleton variant="text" lines={4} />

// Card loading
<Skeleton variant="card" />

// Chat loading
<ChatSkeleton />

// Dashboard loading
<DashboardSkeleton />

// Custom skeleton
<div className="flex items-center gap-3">
  <Skeleton variant="avatar" avatarSize="md" />
  <Skeleton variant="text" lines={2} />
</div>
```

### CSS Keyframes (add to globals.css)

```css
@keyframes shimmer {
  from { transform: translateX(-100%); }
  to { transform: translateX(100%); }
}
```

### Usage Guidelines

- Match skeleton shape to the content it replaces
- Use skeleton immediately on page load (no flash of empty state)
- Replace skeleton with content as soon as data arrives
- Never show skeleton and empty state simultaneously

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Match skeleton shape to content | Use generic rectangles for everything |
| Show skeleton immediately on load | Show empty state while loading |
| Keep shimmer animation subtle | Use flashy or distracting animations |
| Use appropriate variant per component | Mix skeleton types randomly |

### Accessibility

- `aria-hidden="true"` on skeleton containers
- `aria-busy="true"` on parent container
- Screen readers should announce "Loading..." via `aria-live="polite"`
- Skeletons are purely visual — no interactive elements

---

## 16. Breadcrumb

### Visual Description

Breadcrumbs show navigation path as a horizontal list of links separated by chevron or slash icons. The current page is styled as regular text (not a link). On overflow, intermediate items collapse into an ellipsis dropdown.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface BreadcrumbProps {
  /** Breadcrumb items */
  items: BreadcrumbItem[];
  /** Separator style */
  separator?: 'chevron' | 'slash';
  /** Maximum visible items before truncation */
  maxItems?: number;
}

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link href */
  href?: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Click handler (if not using href) */
  onClick?: () => void;
}

const separatorIcons = {
  chevron: <ChevronRight className="h-3.5 w-3.5" />,
  slash: <span className="text-neutral-600">/</span>,
};

export function Breadcrumb({ items, separator = 'chevron', maxItems = 4 }: BreadcrumbProps) {
  const shouldTruncate = items.length > maxItems;
  const visibleItems = shouldTruncate
    ? [items[0], ...items.slice(-maxItems + 1)]
    : items;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      <ol className="flex items-center gap-1.5 text-[13px]">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;
          const isTruncated = shouldTruncate && index === 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <span className="text-neutral-600 shrink-0" aria-hidden="true">
                  {isTruncated ? <span className="text-[13px]">…</span> : separatorIcons[separator]}
                </span>
              )}
              {isTruncated && (
                <DropdownMenu
                  items={items.slice(1, -maxItems + 1).map((item) => ({
                    value: item.href || item.label,
                    label: item.label,
                    onClick: item.onClick,
                  }))}
                >
                  <button className="text-neutral-600 hover:text-neutral-900 transition-colors px-1">
                    …
                  </button>
                </DropdownMenu>
              )}
              {!isTruncated && (
                isLast ? (
                  <span className="font-medium text-neutral-950" aria-current="page">
                    {item.icon && <span className="mr-1.5 inline-flex shrink-0">{item.icon}</span>}
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className="text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    {item.icon && <span className="mr-1.5 inline-flex shrink-0">{item.icon}</span>}
                    {item.label}
                  </a>
                )
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

### Tailwind Class Patterns

```tsx
// Standard breadcrumb
<Breadcrumb items={[
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Documents', href: '/documents' },
  { label: 'My Document' },
]} />

// With icons and truncation
<Breadcrumb
  separator="slash"
  maxItems={3}
  items={[
    { label: 'Home', href: '/', icon: <Home className="h-3.5 w-3.5" /> },
    { label: 'Workspace', href: '/ws' },
    { label: 'Documents', href: '/docs' },
    { label: 'Report Q4' },
  ]}
/>
```

### Usage Guidelines

- Show on all pages except the root dashboard
- Keep labels short (1-2 words)
- Use `chevron` separator for most cases
- Truncate when path exceeds 4 levels

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Show current page as text (not link) | Make all items clickable |
| Keep labels concise | Use full page titles |
| Truncate long paths | Show 10+ breadcrumb levels |
| Use consistent separator | Mix slash and chevron randomly |

### Accessibility

- `nav` with `aria-label="Breadcrumb"`
- `aria-current="page"` on current item
- `aria-hidden="true"` on separators
- `ol` list for semantic structure

---

## 17. Tabs

### Visual Description

Tabs are horizontal navigation controls with three visual variants: underline (2px bottom border), enclosed (background highlight), and pill (rounded background). Active tab has `brand-500` underline or background, inactive tabs have `neutral-700` text. Tab panels sit below with a smooth transition.

### Variants

| Variant | Active Style | Description |
|---------|-------------|-------------|
| `underline` | 2px bottom border brand-500 | Default, clean, Linear-inspired |
| `enclosed` | bg-neutral-300, rounded-md | Distinct sections, settings pages |
| `pill` | bg-brand-500/15, text-brand-500, rounded-full | Filters, tag selectors |

### Sizes

| Size | Height | Font | Padding |
|------|--------|------|---------|
| `sm` | 32px | 12px/500 | px-3 |
| `md` | 36px | 13px/500 | px-3.5 |

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface TabsProps {
  /** Tab items */
  tabs: TabItem[];
  /** Currently active tab value */
  value: string;
  /** Tab change handler */
  onValueChange: (value: string) => void;
  /** Visual variant */
  variant?: 'underline' | 'enclosed' | 'pill';
  /** Size */
  size?: 'sm' | 'md';
  /** Full width tabs */
  fullWidth?: boolean;
}

export interface TabItem {
  /** Unique value */
  value: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Badge count or text */
  badge?: number | string;
  /** Badge variant */
  badgeVariant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'brand';
  /** Disable tab */
  disabled?: boolean;
}

export function Tabs({ tabs, value, onValueChange, variant = 'underline', size = 'md', fullWidth }: TabsProps) {
  return (
    <div className={cn(
      'flex gap-0.5',
      variant === 'underline' && 'border-b border-[oklch(1_0_0/0.06)]',
      variant === 'enclosed' && 'bg-neutral-300/50 p-1 rounded-lg',
      variant === 'pill' && 'gap-1',
      fullWidth && 'w-full',
    )} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.value === value;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.value}`}
            disabled={tab.disabled}
            onClick={() => onValueChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 font-medium transition-all duration-150 outline-none',
              'focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'disabled:opacity-50 disabled:pointer-events-none',
              size === 'sm' ? 'h-8 px-3 text-[12px]' : 'h-9 px-3.5 text-[13px]',
              fullWidth && 'flex-1 justify-center',
              // Underline variant
              variant === 'underline' && cn(
                'border-b-2 -mb-px',
                isActive ? 'border-brand-500 text-neutral-950' : 'border-transparent text-neutral-700 hover:text-neutral-900 hover:border-neutral-500'
              ),
              // Enclosed variant
              variant === 'enclosed' && cn(
                'rounded-md',
                isActive ? 'bg-neutral-200 text-neutral-950 shadow-sm' : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300'
              ),
              // Pill variant
              variant === 'pill' && cn(
                'rounded-full',
                isActive ? 'bg-brand-500/15 text-brand-500' : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300/50'
              ),
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
            {tab.badge !== undefined && (
              <Badge variant={tab.badgeVariant || 'default'} size="sm">
                {tab.badge}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}

// Tab panel wrapper
export function TabPanel({ value, activeValue, children }: {
  value: string; activeValue: string; children: ReactNode;
}) {
  if (value !== activeValue) return null;
  return (
    <div role="tabpanel" id={`tabpanel-${value}`} tabIndex={0}>
      {children}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Underline tabs
<Tabs
  tabs={[
    { value: 'overview', label: 'Overview' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'settings', label: 'Settings' },
  ]}
  value={activeTab}
  onValueChange={setActiveTab}
/>

// Pill tabs with badges
<Tabs
  variant="pill"
  tabs={[
    { value: 'all', label: 'All', badge: 12 },
    { value: 'active', label: 'Active', badge: 5, badgeVariant: 'success' },
    { value: 'archived', label: 'Archived' },
  ]}
  value={filter}
  onValueChange={setFilter}
/>

// Tab panels
<TabPanel value="overview" activeValue={activeTab}>
  <OverviewContent />
</TabPanel>
```

### Usage Guidelines

- **underline**: Settings pages, content sections (default choice)
- **enclosed**: Dashboard widgets, sidebar-like tab switching
- **pill**: Filters, tag selection, quick toggles

### Do's and Don'ts

| ✅ Do | ❌ Don't Use |
|-------|---------|
| Use underline for most cases | More than 7 tabs in a row |
| Show badge counts when relevant | Use tabs for sequential steps (use Stepper) |
| Consistent variant within a view | Mix tab variants on same page |
| Disable unavailable tabs clearly | Hide disabled tabs |

### Accessibility

- `role="tablist"` on container
- `role="tab"` on each tab
- `aria-selected` reflects active state
- `aria-controls` links to panel
- Arrow keys navigate between tabs
- `role="tabpanel"` on content panels

---

## 18. Table

### Visual Description

Tables display structured data in rows and columns. They use `neutral-200` background, 1px bottom borders at `neutral-500`, and hover highlights on rows. Sortable columns show up/down chevron indicators. Selected rows have `brand-500/10%` background.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Row data */
  data: T[];
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row keys */
  selectedKeys?: string[];
  /** Selection change handler */
  onSelectionChange?: (keys: string[]) => void;
  /** Row key accessor */
  rowKey: keyof T | ((row: T) => string);
  /** Enable sorting */
  sortable?: boolean;
  /** Sort state */
  sort?: { column: string; direction: 'asc' | 'desc' };
  /** Sort change handler */
  onSortChange?: (column: string, direction: 'asc' | 'desc') => void;
  /** Empty state */
  empty?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Pagination */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  /** Row click handler */
  onRowClick?: (row: T) => void;
  /** Striped rows */
  striped?: boolean;
}

export interface ColumnDef<T> {
  /** Unique column key */
  key: string;
  /** Column header label */
  header: string;
  /** Cell render function */
  render?: (row: T, index: number) => ReactNode;
  /** Accessor for sorting */
  accessor?: (row: T) => string | number;
  /** Column width */
  width?: string | number;
  /** Align */
  align?: 'left' | 'center' | 'right';
  /** Make column sortable */
  sortable?: boolean;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, selectable, selectedKeys = [], onSelectionChange,
  rowKey, sortable, sort, onSortChange, empty, loading, pagination,
  onRowClick, striped
}: DataTableProps<T>) {
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') return rowKey(row);
    return String(row[rowKey]);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    const allKeys = data.map(getRowKey);
    onSelectionChange(
      selectedKeys.length === data.length ? [] : allKeys
    );
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key]
    );
  };

  return (
    <div className="w-full overflow-auto rounded-lg border border-[oklch(1_0_0/0.06)]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[oklch(1_0_0/0.06)] bg-neutral-200/50">
            {selectable && (
              <th className="w-10 px-3 py-2.5 text-left">
                <input
                  type="checkbox"
                  checked={selectedKeys.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="h-3.5 w-3.5 rounded border-neutral-500 accent-brand-500"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-3 py-2.5 text-left font-medium text-neutral-700',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.sortable && 'cursor-pointer hover:text-neutral-900 select-none',
                  col.hideOnMobile && 'hidden md:table-cell'
                )}
                style={{ width: col.width }}
                onClick={() => {
                  if (col.sortable && onSortChange) {
                    const newDir = sort?.column === col.key && sort.direction === 'asc' ? 'desc' : 'asc';
                    onSortChange(col.key, newDir);
                  }
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sort?.column === col.key && (
                    <span className="text-brand-500">
                      {sort.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </span>
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-8">
                <Skeleton variant="table" rows={5} columns={columns.length} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-3 py-12 text-center text-neutral-600">
                {empty || 'No data available'}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const key = getRowKey(row);
              const isSelected = selectedKeys.includes(key);
              return (
                <tr
                  key={key}
                  className={cn(
                    'border-b border-[oklch(1_0_0/0.06)] transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-brand-500/10',
                    !isSelected && onRowClick && 'hover:bg-neutral-300/30',
                    !isSelected && !onRowClick && 'hover:bg-neutral-300/20',
                    striped && index % 2 === 1 && !isSelected && 'bg-neutral-200/30'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(key)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-3.5 w-3.5 rounded border-neutral-500 accent-brand-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-2.5 text-neutral-900',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-right',
                        col.hideOnMobile && 'hidden md:table-cell'
                      )}
                    >
                      {col.render ? col.render(row, index) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between border-t border-[oklch(1_0_0/0.06)] px-3 py-2.5 text-[12px] text-neutral-700">
          <span>
            Showing {((pagination.page - 1) * pagination.pageSize) + 1}–{Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Basic table
<DataTable
  columns={[
    { key: 'name', header: 'Name', sortable: true, accessor: (row) => row.name },
    { key: 'status', header: 'Status', render: (row) => <Badge variant={row.status === 'ready' ? 'success' : 'warning'}>{row.status}</Badge> },
    { key: 'chunks', header: 'Chunks', align: 'right', accessor: (row) => row.chunks },
  ]}
  data={documents}
  rowKey="id"
  sortable
  sort={sort}
  onSortChange={handleSort}
  onRowClick={(doc) => router.push(`/documents/${doc.id}`)}
  pagination={{ page: 1, pageSize: 10, total: 50, onPageChange: setPage }}
/>
```

### Usage Guidelines

- Use for data sets > 3 items (otherwise use Card/List)
- Always provide empty state for no-data scenarios
- Enable sorting for columns users will want to reorder
- Use pagination for > 50 rows

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Show loading skeleton during fetch | Show empty state during loading |
| Provide empty state for no results | Leave table headerless |
| Use fixed column widths for narrow columns | Let long content push columns |
| Sort numeric columns numerically | Sort numbers as strings |

### Accessibility

- `role="table"` (implicit on `<table>`)
- `scope="col"` on `<th>` elements
- Sort buttons: `aria-sort="ascending" | "descending" | "none"`
- Checkbox: `aria-label="Select row [name]"`
- Pagination: `aria-label="Page navigation"`

---

## 19. File Upload

### Visual Description

File upload provides a drag-and-drop zone with a dashed border that becomes solid with `brand-500` color when a file is dragged over it. Uploaded files display in a list with thumbnails (for images), file type icons, name, size, progress bar, and a remove button.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface FileUploadProps {
  /** Accepted file types (MIME or extensions) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum number of files */
  maxFiles?: number;
  /** Upload handler */
  onUpload: (files: File[]) => void;
  /** Upload progress (0-100) per file */
  progress?: Record<string, number>;
  /** Currently uploaded files */
  files?: UploadedFile[];
  /** Remove file handler */
  onRemove?: (fileId: string) => void;
  /** Custom drop zone content */
  children?: ReactNode;
  /** Disabled state */
  disabled?: boolean;
  /** Compact mode (smaller drop zone) */
  compact?: boolean;
}

export interface UploadedFile {
  /** Unique file ID */
  id: string;
  /** Original file name */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Preview URL (for images) */
  preview?: string;
  /** Upload status */
  status: 'uploading' | 'complete' | 'error';
  /** Error message */
  error?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const fileIcons: Record<string, ReactNode> = {
  'application/pdf': <FileText className="h-5 w-5 text-error" />,
  'image/*': <ImageIcon className="h-5 w-5 text-brand-500" />,
  default: <File className="h-5 w-5 text-neutral-600" />,
};

export function FileUpload({
  accept, maxSize = 10 * 1024 * 1024, multiple = true, maxFiles = 10,
  onUpload, progress = {}, files = [], onRemove, children, disabled, compact
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    onUpload(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer',
          compact ? 'p-4' : 'p-8',
          disabled && 'opacity-50 cursor-not-allowed',
          isDragOver
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-neutral-500 hover:border-neutral-600 hover:bg-neutral-300/20'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept?.join(',')}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />
        {children || (
          <>
            <Upload className={cn('mb-2 text-neutral-600', compact ? 'h-6 w-6' : 'h-8 w-8')} />
            <p className={cn('font-medium text-neutral-900', compact ? 'text-[13px]' : 'text-[14px]')}>
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            {accept && (
              <p className="mt-1 text-[12px] text-neutral-600">
                {accept.join(', ')} up to {formatFileSize(maxSize)}
              </p>
            )}
          </>
        )}
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => {
            const prog = progress[file.id];
            const isUploading = file.status === 'uploading' || (prog !== undefined && prog < 100);

            return (
              <div
                key={file.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-[oklch(1_0_0/0.06)] bg-neutral-200 p-2.5',
                  file.status === 'error' && 'border-error/30'
                )}
              >
                {/* Preview / Icon */}
                {file.preview ? (
                  <img src={file.preview} alt="" className="h-10 w-10 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-300">
                    {fileIcons[file.type] || fileIcons.default}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-medium text-neutral-900">{file.name}</p>
                  <p className="text-[11px] text-neutral-600">
                    {formatFileSize(file.size)}
                    {file.status === 'error' && file.error && (
                      <span className="ml-2 text-error">• {file.error}</span>
                    )}
                  </p>
                  {isUploading && prog !== undefined && (
                    <div className="mt-1.5 h-1 w-full rounded-full bg-neutral-300">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Remove */}
                {!isUploading && onRemove && (
                  <button
                    onClick={() => onRemove(file.id)}
                    className="shrink-0 rounded p-1 text-neutral-600 hover:text-error hover:bg-neutral-300 transition-colors"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Standard upload zone
<FileUpload
  accept={['.pdf', '.docx', '.txt', '.csv']}
  maxSize={10 * 1024 * 1024}
  onUpload={handleUpload}
  files={uploadedFiles}
  progress={uploadProgress}
  onRemove={handleRemove}
/>

// Compact mode
<FileUpload compact accept={['image/*']} onUpload={handleUpload} />

// Custom content
<FileUpload onUpload={handleUpload}>
  <div className="text-center">
    <CloudUpload className="mx-auto h-10 w-10 text-brand-500" />
    <p className="mt-2 text-[14px] font-medium">Drop your documents here</p>
  </div>
</FileUpload>
```

### Usage Guidelines

- Use `accept` to filter valid file types
- Show file type icons for quick identification
- Display upload progress for files > 1MB
- Show file size limits clearly
- Allow removing uploaded files

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Show accepted formats clearly | Accept all file types silently |
| Display upload progress | Hide upload status |
| Show file previews for images | Show only file names |
| Allow removing files | Make uploads permanent immediately |

### Accessibility

- Drop zone: `role="button"`, `tabIndex={0}`, keyboard Enter to open file picker
- `aria-label="Upload files"` on drop zone
- Progress: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Remove button: `aria-label="Remove [filename]"`

---

## 20. Chat Input

### Visual Description

Chat input is a fixed-bottom bar with an auto-resizing textarea, send button (Enter key), file attachment button, and character count. The bar uses `neutral-200` background with a top border. On send, the textarea shows a loading state with animated dots. The send button is `brand-500` and pulses when there's content.

### TypeScript Interface

```typescript
import { ReactNode } from 'react';

export interface ChatInputProps {
  /** Message change handler */
  onMessageChange?: (message: string) => void;
  /** Send handler */
  onSend?: (message: string) => void;
  /** File attachment handler */
  onAttach?: (files: File[]) => void;
  /** Current message value (controlled) */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Loading/sending state */
  isLoading?: boolean;
  /** Maximum character count */
  maxLength?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Disable input */
  disabled?: boolean;
  /** Show file attachment button */
  showAttach?: boolean;
  /** Accepted file types for attachment */
  accept?: string[];
  /** Currently attached files */
  attachments?: ChatAttachment[];
  /** Remove attachment handler */
  onRemoveAttachment?: (id: string) => void;
  /** Custom left addon */
  leftAddon?: ReactNode;
  /** Auto-focus on mount */
  autoFocus?: boolean;
}

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export function ChatInput({
  onMessageChange, onSend, onAttach, value: controlledValue,
  placeholder = 'Type a message...', isLoading, maxLength,
  showCharCount = true, disabled, showAttach = true, accept,
  attachments = [], onRemoveAttachment, leftAddon, autoFocus
}: ChatInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const value = controlledValue ?? internalValue;
  const charCount = value.length;
  const isOverLimit = maxLength ? charCount > maxLength : false;
  const hasContent = value.trim().length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength + 50) return; // Allow slight overtype for editing
    setInternalValue(newValue);
    onMessageChange?.(newValue);
    adjustHeight();
  };

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  useEffect(() => { adjustHeight(); }, [value]);

  const handleSend = () => {
    if (!hasContent || isLoading || isOverLimit) return;
    onSend?.(value);
    setInternalValue('');
    onMessageChange?.('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onAttach?.(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div className="border-t border-[oklch(1_0_0/0.06)] bg-neutral-200 p-3">
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 rounded-lg border border-[oklch(1_0_0/0.06)] bg-neutral-300 px-2.5 py-1.5 text-[12px]"
            >
              {file.preview ? (
                <img src={file.preview} alt="" className="h-8 w-8 rounded object-cover" />
              ) : (
                <File className="h-4 w-4 text-neutral-600" />
              )}
              <span className="max-w-[120px] truncate text-neutral-900">{file.name}</span>
              <button
                onClick={() => onRemoveAttachment?.(file.id)}
                className="text-neutral-600 hover:text-error transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Left addon */}
        {leftAddon && (
          <div className="shrink-0 pb-1">{leftAddon}</div>
        )}

        {/* File attachment button */}
        {showAttach && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept?.join(',')}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon-sm"
              iconOnly
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </>
        )}

        {/* Textarea */}
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isLoading ? 'Sending...' : placeholder}
            disabled={disabled || isLoading}
            autoFocus={autoFocus}
            rows={1}
            className={cn(
              'w-full resize-none rounded-lg bg-neutral-300 border border-neutral-500 px-3 py-2 text-[14px] text-neutral-900',
              'placeholder:text-neutral-600 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 focus:outline-none',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'transition-all duration-150 ease-default',
              'min-h-[38px] max-h-[160px]',
              isOverLimit && 'border-error focus:border-error focus:ring-error/20'
            )}
          />
          {showCharCount && maxLength && (
            <span className={cn(
              'absolute bottom-1.5 right-2 text-[11px]',
              isOverLimit ? 'text-error' : 'text-neutral-600'
            )}>
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          variant="primary"
          size="icon-md"
          iconOnly
          onClick={handleSend}
          disabled={!hasContent || isLoading || isOverLimit}
          isLoading={isLoading}
          aria-label="Send message"
          className={cn(
            'shrink-0 transition-all duration-150',
            hasContent && !isLoading && 'shadow-[0_0_12px_oklch(0.62_0.20_265/0.2)]'
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 flex items-center gap-2 text-[12px] text-neutral-600">
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          <span>MimoNotes is thinking...</span>
        </div>
      )}
    </div>
  );
}
```

### Tailwind Class Patterns

```tsx
// Basic chat input
<ChatInput
  onSend={(msg) => sendMessage(msg)}
  onAttach={(files) => handleFiles(files)}
  placeholder="Ask about your documents..."
  maxLength={4000}
  showAttach
/>

// Controlled input
<ChatInput
  value={message}
  onMessageChange={setMessage}
  onSend={handleSend}
  isLoading={isGenerating}
  attachments={attachedFiles}
  onRemoveAttachment={removeAttachment}
/>

// With left addon (workspace selector)
<ChatInput
  leftAddon={<WorkspaceSelector />}
  onSend={handleSend}
  placeholder="Ask in My Workspace..."
/>
```

### Usage Guidelines

- Always support `Enter` to send, `Shift+Enter` for new line
- Show character count when there's a limit
- Show file previews for image attachments
- Display typing indicator when AI is responding
- Auto-resize textarea up to max height

### Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|---------|
| Send on Enter, new line on Shift+Enter | Send on every Enter without shift |
| Show loading state during generation | Let user type while AI responds |
| Auto-resize textarea dynamically | Use fixed-height textarea |
| Show character limits | Allow exceeding limits silently |

### Accessibility

- Textarea: `aria-label="Chat message"` or associated label
- Send button: `aria-label="Send message"`
- Attach button: `aria-label="Attach file"`
- Loading: `aria-busy="true"` on container
- Character count: `aria-live="polite"` for limit warnings

---

## Implementation Notes

### File Structure

```
components/
├── ui/
│   ├── button.tsx          # Button component
│   ├── input.tsx           # Input component
│   ├── textarea.tsx        # Textarea component
│   ├── select.tsx          # Select / Combobox
│   ├── card.tsx            # Card components
│   ├── badge.tsx           # Badge / Tag
│   ├── avatar.tsx          # Avatar + AvatarGroup
│   ├── dialog.tsx          # Dialog / Modal
│   ├── toast.tsx           # Toast / Notification
│   ├── tooltip.tsx         # Tooltip
│   ├── dropdown-menu.tsx   # Dropdown Menu
│   ├── command.tsx         # Command Palette
│   ├── tabs.tsx            # Tabs
│   ├── table.tsx           # DataTable
│   ├── skeleton.tsx        # Skeleton Loader
│   ├── breadcrumb.tsx      # Breadcrumb
│   ├── empty-state.tsx     # Empty State
│   └── badge.tsx           # Badge
├── layout/
│   ├── sidebar.tsx         # Sidebar Navigation
│   └── top-nav.tsx         # Top Navigation
├── chat/
│   └── chat-input.tsx      # Chat Input
└── upload/
    └── file-upload.tsx     # File Upload
```

### Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.0.0",
    "lucide-react": "^0.400.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "@radix-ui/react-tabs": "^1.1.0",
    "@radix-ui/react-select": "^2.1.0",
    "cmdk": "^1.0.0"
  }
}
```

### cn() Utility

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Design Token Application

All components reference CSS custom properties defined in `globals.css`:

```css
/* Brand scale */
--brand-50..900 (hue 265°)

/* Neutral scale */
--neutral-50..950 (warm neutrals)

/* Semantic colors */
--success, --warning, --error, --info + subtle variants

/* Surface hierarchy */
--surface-0..4
```

### Dark Mode

Components are designed for dark mode first. The Tailwind class patterns above assume dark mode. For light mode adaptation:

1. Surface hierarchy inverts (lighter = higher)
2. Border colors become solid neutral instead of white-overlay
3. Text hierarchy inverts (darker = higher)
4. Shadows become more visible (add to cards in light mode)
5. Brand color saturation may increase slightly

### Performance Considerations

- All components use `forwardRef` for ref forwarding
- Animations use CSS transforms (GPU-accelerated)
- Skeleton loaders use CSS `@keyframes` (no JS animation)
- Lazy-load heavy components (Command Palette, Dialog)
- Virtualize table rows if > 100 items

---

*Generated by Design System Architect — MimoNotes Component Library V2*
*Date: 2026-06-13*
*Version: 2.0.0*
