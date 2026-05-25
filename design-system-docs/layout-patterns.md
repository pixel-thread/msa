# Layout Patterns — MFSA Connect Design System

## Page Width Strategy

### Public Pages (Landing)
- Max-width: `max-w-7xl` (1280px) centered with `mx-auto`
- Content padding: `px-6`
- Full-width sections with `border-y` separators

### Dashboard Pages
- Full-width within sidebar inset: no max-width constraint
- Content padding: `p-6`
- Uses flex-1 with `min-w-0` for overflow prevention

---

## Grid Systems

### Dashboard Stats Cards
```jsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
```
- Single column on mobile, 2 on tablet, 4 on desktop

### Dashboard Chart Pairs
```jsx
<div className="grid gap-4 md:grid-cols-2">
```
- Single column on mobile, 2 columns on tablet+

### Landing Page Feature Grid
```jsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
```
- Feature cards: single → 2 → 3 columns

### Landing Page Stats
```jsx
<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
```
- 2 columns on mobile, 4 on desktop

### Footer
```jsx
<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
```
- Single → 2 → 4 columns

### About Section Stats
```jsx
<div className="grid grid-cols-2 gap-4">
```
- 2-column grid always

### Contact Form
```jsx
<div className="grid gap-12 md:grid-cols-2">
```
- 2-column layout for contact info + form

### How It Works Steps
```jsx
<div className="grid gap-8 md:grid-cols-3">
```
- Single → 3 columns on tablet+

---

## Dashboard Layout

### Structure
```
SidebarProvider
├── AppSidebar (collapsible="icon")
│   ├── SidebarHeader (brand logo + name)
│   ├── SidebarContent (NavMain navigation)
│   └── SidebarFooter (NavUser avatar + dropdown)
└── SidebarInset
    ├── header (h-16, border-b, flex with theme toggle)
    └── div (flex-1 flex-col gap-6 p-6 bg-canvas)
```

### Header Bar
- Height: `h-16` (expanded), `h-12` (sidebar collapsed)
- Border: `border-b border-hairline`
- Background: `bg-canvas`
- Padding: `px-4`
- Contains: SidebarTrigger icon + vertical separator + theme toggle

### Sidebar Dimensions
- Expanded width: `16rem` (256px)
- Collapsed width: `3rem` (48px)
- Mobile width: `18rem` (288px) opens as Sheet overlay

---

## Breakpoint Strategy

### Tailwind Default Breakpoints
```
sm: 640px
md: 768px (also used for mobile detection in hooks)
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Container Queries (CSS @container)
Used for card-level responsive adaptation:
- `@container/card` — card-level container context
- `@[250px]/card:text-3xl` — card title grows at 250px width
- `@[540px]/card:block` — show full description at 540px
- `@[767px]/card:flex` — toggle group visible at 767px
- `@xl/main:grid-cols-2` — large sidebar grid
- `@5xl/main:grid-cols-4` — very wide sidebar grid
- `@container` query names: `/card`, `/card-header`, `/main`

### Mobile Detection
- `use-mobile.ts`: Breakpoint at 768px
- Mobile sidebar: renders as Sheet overlay
- Chart interactive: default 90d range, switches to 7d on mobile

---

## Sidebar Navigation Pattern

### Main Navigation (NavMain)
- Uses Collapsible items for nested groups
- Groups under "Platform" label
- Active detection: `pathname === item.url || pathname?.startsWith(item.url + "/")`
- Chevron rotation on expand: `transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90`

### User Navigation (NavUser)
- Avatar + name/email in sidebar footer
- Dropdown menu with: Account, Change Password, Log out
- Dropdown side="right" on desktop, "bottom" on mobile

### Secondary Navigation (NavSecondary)
- Flat list of icon + label items
- Used for support/docs links

---

## Data Table Page Pattern (Repeated Across Features)

Every CRUD list page follows this exact structure:

```jsx
<>
  {/* Page Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
        Title
      </h1>
      <p className="mt-1 text-base text-body">Description</p>
    </div>
    <Button><Plus /> Action</Button>
  </div>

  {/* Filters */}
  <DataTableFilters fields={[...]} onFilterChange={...} />

  {/* Table */}
  <DataTable loading={...} data={...} columns={...} />

  {/* Pagination */}
  <DataTablePagination meta={...} onPageChange={...} />
</>
```

This pattern is followed by members, payments, announcements, compliance, consent, dsar, member-types, and associations pages.

---

## Layout Spacing Conventions

| Element | Spacing |
|---------|---------|
| Page section top/bottom (landing) | `py-24` |
| Dashboard page padding | `p-6` |
| Section title to content | `mb-4` (heading), `mt-1` (description) |
| Dashboard sections | `space-y-6` |
| Card groups | `gap-4` |
| Chart grid | `gap-4 md:grid-cols-2` |
| Filter bar | Card with `gap-3 p-4 flex-row` |
| Page title to filters | Implicit via `space-y-6` or manual |
| Filters to table | Implicit via `space-y-6` or `flex-col gap-6` |
| Table to pagination | `flex items-center justify-between` |
| Form fields | `space-y-4` (within form) |
| Form field pairs | `grid grid-cols-2 gap-4` |

---

## Content Density

- **Dashboard:** Comfortable. Large titles, generous card padding, spaced grid sections.
- **Data Tables:** Dense. Compact cells with `p-3`, `whitespace-nowrap`, and scrollable overflow.
- **Landing:** Very generous. Large display typography, py-24 sections, max-w-7xl containers.
- **Forms:** Moderate. Standard spacing with grid pairs, dialog padding.
- **Sidebar:** Dense but comfortable. Tight item spacing (gap-0.5), clear visual hierarchy.

---

## Dashboard Landing Page Sections

1. **Page Title** — "Dashboard" heading with description
2. **Stats Cards** — 4 cards in responsive grid (Total Members, Revenue, Pending Dues, New Members)
3. **Revenue Area Chart** — Full-width stacked area chart
4. **Chart Pairs** — 2-column grids:
   - MemberBarChart + RevenueLineChart
   - PaymentPieChart + RolesRadarChart
5. **Recent Payments Table** — Full-width table section with heading
