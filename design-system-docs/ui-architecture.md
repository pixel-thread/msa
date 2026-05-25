# UI Architecture — MFSA Connect Design System

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── globals.css               # Design tokens, Tailwind config, animations
│   ├── layout.tsx                # Root layout: fonts, AppProviders
│   ├── page.tsx                  # Landing page (public)
│   ├── (auth)/                   # Authentication pages
│   ├── (dashboard)/              # Dashboard pages (authenticated)
│   │   ├── layout.tsx            # DashboardLayout wrapper
│   │   ├── dashboard/            # Dashboard overview page
│   │   ├── members/              # Member management (CRUD)
│   │   ├── payments/             # Payment management
│   │   ├── announcements/        # Announcement management
│   │   ├── compliance/           # Compliance management
│   │   ├── consent/              # Consent management
│   │   ├── dsar/                 # DSAR request management
│   │   ├── member-types/         # Member type configuration
│   │   ├── associations/         # Association management
│   │   ├── meetings/             # Meeting management
│   │   ├── ledger/               # Financial ledger
│   │   ├── subscriptions/        # Subscription management
│   │   ├── training/             # Training modules
│   │   └── audit-logs/           # Audit log viewer
│   ├── sign-up/                  # Registration
│   ├── sign-in/                  # Login
│   └── forgot-password/          # Password recovery
│
├── features/                     # Feature modules (data layer + business logic)
│   ├── auth/                     # Authentication logic
│   ├── members/                  # Member API + types
│   ├── payments/                 # Payment API + types
│   ├── dashboard/                # Dashboard data
│   ├── announcements/            # Announcement logic
│   ├── compliance/               # Compliance logic
│   ├── consent/                  # Consent management
│   ├── dsar/                     # DSAR logic
│   ├── member-type/              # Member type API
│   ├── associations/             # Association API
│   ├── meetings/                 # Meeting logic
│   ├── ledger/                   # Ledger API
│   ├── subscriptions/            # Subscription API
│   ├── training/                 # Training logic
│   ├── membership-applications/  # Applications logic
│   ├── audit-logs/               # Audit log API
│   ├── cron/                     # Scheduled jobs
│   ├── user/                     # User profile logic
│   └── swagger/                  # API documentation
│
└── shared/                       # Shared code (reusable across features)
    ├── components/               # React components
    │   ├── ui/                   # 53 primitive UI components
    │   ├── app-sidebar.tsx       # App sidebar composite
    │   ├── dashboard-layout.tsx  # Dashboard layout wrapper
    │   ├── data-table.tsx        # Data table composite
    │   ├── data-table-filters.tsx# Search/filter bar
    │   ├── data-table-pagination.tsx # Pagination controls
    │   ├── section-cards.tsx     # Dashboard stat cards
    │   ├── nav-main.tsx          # Primary sidebar navigation
    │   ├── nav-secondary.tsx     # Secondary sidebar links
    │   ├── nav-projects.tsx      # Project navigation
    │   ├── nav-documents.tsx     # Document navigation
    │   ├── nav-user.tsx          # User menu in sidebar
    │   ├── team-switcher.tsx     # Association switcher
    │   ├── public-header.tsx     # Landing page header
    │   ├── public-footer.tsx     # Landing page footer
    │   ├── site-header.tsx       # Site header
    │   ├── chart-area-interactive.tsx # Interactive chart
    │   ├── Redirect.tsx          # Auth redirect guard
    │   ├── Ternary.tsx           # Conditional render helper
    │   ├── dashboard/            # Dashboard-specific components
    │   ├── loading/              # Loading skeleton components
    │   └── members/              # Member-specific components
    ├── providers/                # React context providers
    │   ├── AppProviders.tsx      # Provider composition root
    │   ├── theme-provider.tsx    # Theme context (light/dark/auto)
    │   ├── AuthProvider.tsx      # Auth context
    │   └── QueryProvider.tsx     # React Query provider
    ├── lib/                      # Utility functions
    ├── hooks/                    # Custom React hooks
    └── styles/                   # Additional styles (theme.css — minimal)
```

---

## Provider Hierarchy

```
<html> (suppressHydrationWarning, font variables, antialiased)
 └── <body>
      └── <Suspense>
           └── <AppProviders>
                ├── <ThemeProvider>        # Theme context (light/dark/auto)
                │    └── <TooltipProvider> # Radix tooltip context (delayDuration=0)
                │         └── <QueryProvider>     # React Query client
                │              └── <AuthProvider>       # Auth context
                │                   └── <Redirect>      # Auth guard
                │                        └── children
                │
                └── <Toaster>              # Sonner toast (position="top-right")
```

**Key details:**
- `ThemeProvider` wraps `TooltipProvider` so tooltips can respond to theme changes
- `QueryProvider` is inside theme context (no theme dependency, but logical order)
- `AuthProvider` is inside query context (may use queries)
- `Redirect` is inside auth context to access auth state
- `Toaster` is sibling, not parent — portaled to document body

---

## Dashboard Page Composition

```
(page)
 └── <DashboardLayout>
      └── <SidebarProvider>              # Sidebar context (collapsible state)
           ├── <AppSidebar>              # Sidebar panel
           │    ├── <SidebarHeader>      # Brand logo + name
           │    ├── <SidebarContent>     # Scrollable navigation
           │    │    ├── <TeamSwitcher>   # Association selector
           │    │    ├── <NavMain>        # Primary navigation (collapsible groups)
           │    │    │    ├── CollapsibleItem > SubMenuItems
           │    │    │    └── ...
           │    │    ├── <NavSecondary>   # Support/docs links
           │    │    └── <NavDocuments>   # Document links
           │    └── <SidebarFooter>
           │         └── <NavUser>        # Avatar + name + dropdown menu
           │
           └── <SidebarInset>
                ├── <header>             # Top bar
                │    ├── <SidebarTrigger>  # Collapse/expand button
                │    ├── <Separator>
                │    └── <ThemeToggle>     # Light/dark/auto switch
                │
                └── <main>               # Content area (flex-1 flex-col gap-6 p-6)
                     ├── Page Header      # title + description + action button
                     ├── <SectionCards>   # Stat cards grid (dashboard only)
                     ├── <DataTableFilters> # Search + filter controls
                     ├── <DataTable>      # Data table with columns
                     └── <DataTablePagination> # Page navigation
```

---

## DataTable Feature Page Pattern

Every CRUD feature page follows this exact structure (repeated across 8+ pages: members, payments, announcements, compliance, consent, dsar, member-types, associations):

```tsx
export default function FeaturePage() {
  // 1. Server state (React Query)
  const { data, isLoading, meta } = useFeatureList(page, search, filters);
  const deleteMutation = useDeleteFeature();

  // 2. Client state (search, filters, page)
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState({});
  const [page, setPage] = React.useState(1);

  return (
    <>
      {/* 3. Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
            Feature Name
          </h1>
          <p className="mt-1 text-base text-body">Description</p>
        </div>
        <NewFeatureDialog />
      </div>

      {/* 4. Filters */}
      <DataTableFilters fields={filterFields} onFilterChange={setFilters} />

      {/* 5. Table with loading/empty states */}
      <DataTable
        loading={isLoading}
        data={data ?? []}
        columns={columns}
        onDelete={(id) => deleteMutation.mutate(id)}
      />

      {/* 6. Pagination */}
      {meta && (
        <DataTablePagination meta={meta} onPageChange={setPage} />
      )}
    </>
  );
}
```

---

## File Organization Conventions

### Component File Structure
```
ui/button.tsx          # Single component per file
ui/card.tsx            # Compound component (Card, CardHeader, CardContent, etc.)
ui/sidebar.tsx         # Complex compound with context provider
```

### Component Export Pattern
```tsx
// Named exports for compound components
export { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription };
```

### Icon Import Convention
```tsx
// HugeIcons (primary icon set)
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Payment01Icon } from "@hugeicons/core-free-icons";

// Lucide (supplementary)
import { MoonIcon, SunIcon, Search } from "lucide-react";

// Radix UI icons (minimal)
import { DesktopIcon } from "@radix-ui/react-icons";
```

### Import Aliases (from tsconfig.json)
```
@src/*  →  src/*
```

### Styling Approach
- **CSS variables** in `globals.css` for theme tokens
- **Tailwind v4 utilities** for component styling
- **CVA** for variant-driven component APIs
- **cn()** utility (clsx + tailwind-merge) for className composition
- **PascalCase** for component files, **kebab-case** for CSS classes

---

## Component Categories

### Primitives (53 in `src/shared/components/ui/`)
Build on Radix UI primitives, provide consistent styling and API:

| Category | Components |
|----------|-----------|
| Navigation | sidebar, breadcrumb, navigation-menu, tabs, pagination |
| Layout | card, separator, scroll-area |
| Form | button, input, textarea, select, checkbox, switch, radio-group, slider, label, form, field, input-group, input-otp, native-select |
| Feedback | alert, alert-dialog, dialog, sheet, drawer, sonner, skeleton, spinner, progress, empty, table-skeleton |
| Overlay | dropdown-menu, popover, hover-card, tooltip, menubar |
| Display | text, badge, avatar, table, calendar, carousel, chart |
| Data | combobox, toggle, toggle-group, button-group |
| Utility | collapsible, direction, item |

### Composite Components (12 in `src/shared/components/`)
Compose primitives into feature-ready patterns:

| Component | Composes | Purpose |
|-----------|----------|---------|
| app-sidebar | Sidebar + NavMain + NavUser + TeamSwitcher | Full sidebar assembly |
| dashboard-layout | SidebarProvider + AppSidebar + SidebarInset | Page-level layout wrapper |
| data-table | Card + Table + Loading + Empty | Reusable data display |
| data-table-filters | Card + Input + Combobox | Search/filter bar |
| data-table-pagination | Button + Text | Page navigation |
| section-cards | Card grid | Dashboard stat display |
| nav-main | Collapsible + SidebarMenu | Primary navigation |
| nav-user | SidebarMenu + DropdownMenu | User menu |
| public-header | Navigation links | Landing page header |
| public-footer | Link groups | Landing page footer |
| chart-area-interactive | Chart + ToggleGroup | Interactive time series |
| team-switcher | Select + Avatar | Association selector |

---

## Dependency Direction

```
Pages (app/(dashboard)/*/page.tsx)
  └── Composite Components (shared/components/*.tsx)
       └── UI Primitives (shared/components/ui/*.tsx)
            └── Radix UI / Base UI (external primitives)
                 └── Tailwind CSS v4 (styling)
```

- Pages never use UI primitives directly — always through composites
- Features (business logic) never import components — pages wire them together
- Features import from `shared/lib` (utils, types) and external libraries (api clients)
- Theme context flows down via React Context
- Sidebar state flows down via React Context (SidebarProvider)
