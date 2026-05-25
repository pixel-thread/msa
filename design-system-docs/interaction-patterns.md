# Interaction Patterns — MFSA Connect Design System

## UX Philosophy

- **Functional minimalism** — every interaction serves a purpose. No decorative animations, no micro-interactions for their own sake.
- **Immediate feedback** — hover states, focus rings, and active press effects fire within 75-150ms.
- **Predictable layout** — pages follow strict templates. Navigation is always on the left sidebar. Actions are always in the page header or data table row.
- **Error prevention over error handling** — form validation runs on blur and submit. Disabled states prevent impossible actions.
- **Low cognitive load** — uppercase labels, consistent spacing, clear visual hierarchy. No ambiguous icons without text labels in navigation.

---

## Feedback States

### Loading

| Pattern | Implementation | Usage |
|---------|---------------|-------|
| Full-page loading | `Loading` component with `Spinner` + optional label | Auth redirects, initial page load |
| Table skeleton | `TableSkeleton` component renders rows matching page size | Data table loading (react-query `isLoading`) |
| Dashboard skeleton | `DashboardSkeleton` renders full skeleton layout | Dashboard page initial load |
| Button loading | `disabled` state + text change (e.g., "Creating...", "Saving...") | Form submissions |
| Spinner | `Loading03Icon` from HugeIcons with `animate-spin` | Inline actions, search-as-you-type |
| Skeleton component | `animate-pulse bg-muted` | Card/content placeholder |

### Empty

| Pattern | Implementation |
|---------|---------------|
| Empty state component | `Empty` component with title + description + optional action |
| Layout | `flex flex-col items-center justify-center gap-4 p-12 max-w-sm mx-auto` |
| Title style | `font-heading text-lg font-semibold tracking-wider uppercase` |
| Description style | `text-sm/relaxed text-muted-foreground` |
| Usage | Data tables with no results, search with no matches, empty feature sections |

### Error

| Pattern | Detail |
|---------|--------|
| Form field errors | `text-[0.8rem] font-medium text-destructive` below field |
| Form-level errors | Alert at top of form with destructive variant |
| Invalid field styling | `aria-invalid:border-b-destructive` on inputs, `aria-invalid:text-destructive` on labels |
| API errors | Handled by react-query error states, surfaced in toast or inline alert |
| Toast notifications | `sonner` Toaster at top-right, `position="top-right"` |

### Success

| Pattern | Detail |
|---------|--------|
| Toast notification | `sonner` library — auto-dismissing success messages |
| Form submit success | Redirect to list page + success toast |
| Inline success | Green checkmark indicators via `CheckmarkCircle02Icon` in `text-semantic-up` |
| State transitions | Optimistic updates via react-query |

---

## Navigation Patterns

### Primary Navigation (Sidebar)
- Always visible on desktop (collapsible to 48px icon bar)
- Active state: `data-active:bg-sidebar-accent data-active:font-medium`
- Groups under collapsible sections (e.g., "Platform")
- Active detection: `pathname === item.url || pathname?.startsWith(item.url + "/")`
- Icon-only state shows tooltips on hover

### Secondary Navigation
- Footer links in sidebar (NavSecondary) for support/docs
- Public header navigation for landing pages (sticky, z-50, backdrop-blur)

### Context Navigation
- Tab bars for sub-sections within pages (Tabs component)
- `line` variant tabs for secondary navigation (underline indicator)
- `default` variant tabs for primary tab switching (background fill)

### Navigation Guards
- Auth redirect: `Redirect` component wraps children
- Role-based access: handled server-side via API permissions
- Session check on mount: redirects to login if unauthenticated

---

## Data Entry Patterns

### Form Fields
- Label: `text-xs font-semibold tracking-widest uppercase` above field
- Input: underline style (`border-transparent border-b-input`)
- Height: `h-10` consistent across all input types
- Spacing: `space-y-4` between fields, `grid grid-cols-2 gap-4` for field pairs
- Label-to-input gap: `mb-1.5`
- Form item wrapper: `grid gap-2`

### Search
- Search input: leading icon (`Search` icon at `left-3 top-1/2 -translate-y-1/2`)
- Padding for icon: `pl-9`
- Min-width for search: `min-w-[200px]`
- Clearable via controlled value + X icon

### Select / Combobox
- Select trigger matches input styling (underline pattern, h-10)
- Dropdown: `z-50 min-w-36 bg-popover shadow-md ring-1 ring-foreground/10`
- Items: `py-2 pr-8 pl-3 text-sm`
- Combobox: search within dropdown, multi-select with chips
- Chips: `bg-muted` for selected items

### Date/Calendar
- Calendar component from Radix UI
- Used in date range pickers for data table filters
- Month navigation with arrow icons

---

## Confirmation Patterns

### Dialog
- Centered modal with overlay backdrop
- Title: uppercase + tracking-wider
- Footer: Cancel (outline) + Confirm (default) buttons
- Width: `sm:max-w-md` (default), `sm:max-w-lg` (form dialogs)
- Used for: create/edit forms, confirm destructive actions

### Alert Dialog
- For destructive confirmations (delete, remove)
- Uses `alert-dialog.tsx` component
- Action button uses `variant="destructive"` style

### Sheet (Side Panel)
- Slides in from right (default)
- Used for: detail views, settings, complex forms
- Width: `w-3/4 sm:max-w-sm`
- Animation: 200ms ease-in-out slide

### Dropdown Menu
- For quick actions, navigation, user menu
- Items: uppercase + tracking-wider
- Min-width: `min-w-48`
- Destructive items: `data-[variant=destructive]:text-destructive`

---

## Notification System

### Toast (sonner)
| Property | Value |
|----------|-------|
| Position | `top-right` |
| Region | Toaster in AppProviders |
| Library | `sonner` |
| Text style | `text-sm text-popover-foreground` |
| Use cases | Success confirmations, error alerts, generic notifications |

### Inline Feedback
- Alert component: left accent bar (`after:w-0.5`) with default or destructive variant
- Form validation message: inline below field in `text-destructive`
- Field description: `text-[0.8rem] text-muted-foreground` below field

### Progress Indication
- Progress bar: `h-0.5 bg-muted` with `bg-primary` fill
- Switch/checkbox: immediate visual toggle
- Button: text changes to indicate in-progress state

---

## Responsive & Adaptive Patterns

### Sidebar Adaptation
| Viewport | Behavior |
|----------|----------|
| Desktop (>=768px) | Sidebar persistent, collapsible to icon bar (48px) |
| Mobile (<768px) | Sidebar opens as Sheet overlay (288px width) |
| Touch | Same interaction model — no special touch targets |

### Data Table Adaptation
- Horizontal scroll for overflow (`overflow-x-auto`)
- `whitespace-nowrap` on cells
- Filters stack vertically on mobile
- Pagination stays at bottom

### Form Adaptation
- Field pairs: `grid grid-cols-2` collapses to single column on mobile
- Dialog footer: `flex-col-reverse gap-2 sm:flex-row` (Cancel below Confirm on mobile)
- Sheet: full-width on mobile, `sm:max-w-sm` on desktop

### Chart Adaptation
- Interactive chart: defaults to 90-day range, switches to 7-day on mobile
- Chart container: `aspect-auto h-[300px]` on desktop, responsive via container query

---

## Focus & Keyboard

### Focus Indicators
```css
/* Applied globally via @layer base */
* { @apply border-border outline-ring/50; }

/* Component level */
focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30
```

### Keyboard Navigation
- All Radix UI primitives include full keyboard support
- Dropdown menu: arrow keys, Enter/Space to select, Escape to close
- Dialog/Sheet: Escape to close, focus trap within
- Sidebar: collapsible via keyboard trigger
- Combobox: type to search, arrow to navigate, Enter to select

---

## Disabled & Inactive States

### Visual Treatment
| Component | Disabled Style |
|-----------|---------------|
| Button | `disabled:pointer-events-none disabled:opacity-50` |
| Input | `disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50` |
| Switch | `disabled:cursor-not-allowed disabled:opacity-50` |
| Checkbox | `disabled:cursor-not-allowed disabled:opacity-50` |
| Select | disabled via Radix prop |

### Disabled Logic
- Submit buttons disabled during form submission (text changes to "Saving...")
- Delete buttons disabled when user lacks permission
- Pagination buttons disabled at first/last page
- Table actions disabled during loading state
