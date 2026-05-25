# Component Patterns — MFSA Connect Design System

## Design Philosophy
- **Zero border-radius** on all components (`rounded-none` is the default and defining characteristic)
- **Uppercase + tracking-wider** for all label-level text (buttons, badges, dropdown items, table headers, tabs, labels)
- **Bottom-border-only inputs** with transparent top/left/right borders (underline-style form fields)
- **Subtle shadows + rings** for elevation instead of heavy box-shadows
- **Consistent 10px height** for input/button default (h-10)

---

## Button
**File:** `src/shared/components/ui/button.tsx`

### Variants
| Variant | Classes | Usage |
|---------|---------|-------|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/80` | Primary actions, form submits, CTAs |
| `outline` | `border-border bg-transparent hover:bg-muted hover:text-foreground` | Secondary actions, cancel buttons |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` | Alternative secondary |
| `ghost` | `hover:bg-muted hover:text-foreground` | Toolbar actions, icon buttons, sidebar triggers |
| `destructive` | `bg-destructive/10 text-destructive hover:bg-destructive/20` | Delete, remove, dangerous actions |
| `link` | `text-primary underline underline-offset-4 hover:underline` | Inline text links |

### Sizes
| Size | Height | Padding X | Icon Gap | Icon Size |
|------|--------|-----------|----------|-----------|
| `xs` | h-7 | px-3 | gap-1 | 12px (size-3) |
| `sm` | h-9 | px-4 | gap-1 | 14px (size-3.5) |
| `default` | h-10 | px-6 | gap-1.5 | 14px (size-3.5) |
| `lg` | h-11 | px-8 | gap-1.5 | 14px (size-3.5) |
| `icon` | size-10 | - | - | 14px (size-3.5) |
| `icon-xs` | size-7 | - | - | 12px (size-3) |
| `icon-sm` | size-9 | - | - | 14px (size-3.5) |
| `icon-lg` | size-11 | - | - | 14px (size-3.5) |

### States
- **Active press:** `active:not-aria-[haspopup]:translate-y-px` (1px downward shift)
- **Disabled:** `disabled:pointer-events-none disabled:opacity-50`
- **Focus:** `focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30`
- **Invalid:** `aria-invalid:border-destructive`

### Text Style
`text-xs font-semibold tracking-widest uppercase` — always uppercase with wide tracking.

---

## Input
**File:** `src/shared/components/ui/input.tsx`

### Default Styling
- Border: `border border-transparent border-b-input` (only bottom border visible)
- Height: `h-10`
- Internal padding: `pl-2 px-0 py-1`
- Text: `text-base md:text-sm`
- Placeholder: `placeholder:text-muted-foreground`
- Focus: `focus-visible:border-b-ring`
- Disabled: `disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50`
- Invalid: `aria-invalid:border-b-destructive`

### Icon Leading Pattern
- Container: `relative` with `Search` icon positioned `absolute left-3 top-1/2 -translate-y-1/2`
- Input: `pl-9` (icon width + padding)
- Common icon size: `h-4 w-4`

### Combobox / Search Input
- Same underline pattern
- Dropdown: `absolute z-50 mt-1 w-full border bg-popover shadow-md`

---

## Select
**File:** `src/shared/components/ui/select.tsx`

### Trigger
- Same underline pattern as Input: `border border-transparent border-b-input`
- Height: `h-10` (default), `h-9` (sm)
- Text: `text-sm`
- Icon: UnfoldMoreIcon (HugeIcons) `size-3.5 text-muted-foreground`

### Content (Dropdown)
- Position: `z-50`
- Min-width: `min-w-36`
- Background: `bg-popover text-popover-foreground`
- Elevation: `shadow-md ring-1 ring-foreground/10`
- Padding: `scroll-my-1.5 p-1.5` (SelectGroup)

### Items
- Padding: `py-2 pr-8 pl-3`
- Text: `text-sm`
- Hover: `focus:bg-accent focus:text-accent-foreground`
- Selected indicator: Tick02Icon on the right

---

## Card
**File:** `src/shared/components/ui/card.tsx`

### Default Card
- Padding: `py-8 px-8` (content)
- Gap: `gap-8` (between header and content)
- Background: `bg-card`
- Elevation: `shadow-sm ring-1 ring-foreground/5`
- Border radius: `rounded-none` (omitted = default 0)

### Small Card (`size="sm"`)
- Padding: `py-5 px-5`
- Gap: `gap-5`

### Title
- Font: `font-heading text-lg font-semibold tracking-wider uppercase`

### Description
- Text: `text-sm leading-relaxed text-muted-foreground`

### Header Layout
- Default gap: `gap-1.5`
- Header can contain Title + Description + Action (badge, toggle) in a grid: `has-[data-action]:grid-cols-[1fr_auto]`

---

## Badge
**File:** `src/shared/components/ui/badge.tsx`

### Variants
| Variant | Text Color | Usage |
|---------|-----------|-------|
| `default` | `text-foreground` | Generic labels |
| `secondary` | `text-muted-foreground` | Subtle status |
| `destructive` | `text-destructive` | Error/critical status |
| `outline` | `text-foreground` | Neutral status |
| `ghost` | `text-muted-foreground hover:text-foreground` | Subtle hover |
| `link` | `text-foreground underline` | Linked labels |

### Text Style
`text-[0.625rem] font-semibold tracking-widest uppercase` (10px)
- Gap: `gap-1.5`
- Icon size: `size-3`

### Badge as Status Indicator (observed usage)
Used in data tables with mapped colors:
- `COMPLETED` → `default`
- `PENDING` → `secondary`
- `FAILED` → `destructive`
- `REFUNDED` / `WAIVED` → `outline`

---

## Table
**File:** `src/shared/components/ui/table.tsx`

### Structure
- Container: `relative w-full overflow-x-auto`
- Table: `w-full caption-bottom text-sm`

### Header
- Height: `h-12`
- Padding: `px-3`
- Text: `text-xs font-medium tracking-wider uppercase text-muted-foreground`
- Alignment: `text-left align-middle`

### Body Rows
- Border: `border-b transition-colors`
- Hover: `hover:bg-muted/50`
- Selected: `data-[state=selected]:bg-muted`

### Cells
- Padding: `p-3`
- White-space: `whitespace-nowrap`

### DataTable (Composite)
- Wraps Table in a Card with: `className="overflow-visible p-4"`
- Header uses: `bg-primary/80 text-primary-foreground`

---

## Dialog
**File:** `src/shared/components/ui/dialog.tsx`

### Overlay
- `fixed inset-0 z-50 bg-black/20 backdrop-blur-sm`
- Animation: fade-in/fade-out 100ms

### Content
- Width: `max-w-[calc(100%-2rem)] sm:max-w-md`
- Position: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- Padding: `p-6`
- Gap: `gap-6`
- Background: `bg-popover`
- Elevation: `shadow-md ring-1 ring-foreground/10`

### Title
- `font-heading text-lg leading-none font-semibold tracking-wider uppercase`

### Description
- `text-sm leading-relaxed text-muted-foreground`

### Footer
- `flex flex-col-reverse gap-2 sm:flex-row sm:justify-end`
- Cancel button on left (outline), action button on right (default)

---

## Sheet (Side Panel)
**File:** `src/shared/components/ui/sheet.tsx`

### Dimensions
- Mobile sidebar: `w-(--sidebar-width)` = `18rem` (288px)
- Desktop sidebar: `w-(--sidebar-width)` = `16rem` (256px)
- Icon collapsed: `w-(--sidebar-width-icon)` = `3rem` (48px)
- Sheet right/left: `w-3/4 sm:max-w-sm`

### Content
- Background: `bg-popover`
- Elevation: `shadow-md`
- Animation: `duration-200 ease-in-out` with slide-in/out

---

## Sidebar
**File:** `src/shared/components/ui/sidebar.tsx`

### Variants
- `sidebar`: Default, fills left side with border
- `floating`: Floating panel with shadow + ring
- `inset`: Content area adjusts with margin

### Collapsible Modes
- `offcanvas`: Slides off-screen
- `icon`: Collapses to 48px icon bar
- `none`: Always visible

### Menu Items
- Height: `h-9` (default), `h-8` (sm), `h-14` (lg)
- Padding: `px-3 py-2`
- Text: `text-sm`
- Icon: `size-4`
- Active: `data-active:bg-sidebar-accent data-active:font-medium`
- Hover: `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`

### Group Label
- `text-xs font-semibold tracking-wider uppercase text-sidebar-foreground/70`
- Height: `h-8`
- Padding: `px-3`

---

## Dropdown Menu
**File:** `src/shared/components/ui/dropdown-menu.tsx`

### Content
- Width: `w-(--radix-dropdown-menu-trigger-width) min-w-48`
- Max-height: `max-h-(--radix-dropdown-menu-content-available-height)`
- Padding: `p-1.5`
- Elevation: `shadow-md ring-1 ring-foreground/10`

### Items
- Padding: `px-3 py-2`
- Text: `text-xs font-medium tracking-wider uppercase`
- Gap: `gap-2.5`
- Hover: `focus:bg-accent focus:text-accent-foreground`
- Destructive variant: `data-[variant=destructive]:text-destructive`

---

## Tabs
**File:** `src/shared/components/ui/tabs.tsx`

### Variants
- `default`: Background fill on active tab (`bg-muted` list, `data-active:bg-background` trigger)
- `line`: Underline indicator (`after:bg-foreground after:opacity-0 data-active:after:opacity-100`)

### Trigger Text
`text-xs font-semibold tracking-wider uppercase text-foreground/60`

### List Padding
`p-1` with `gap-1` for line variant

---

## Toggle & ToggleGroup
**File:** `src/shared/components/ui/toggle.tsx`, `src/shared/components/ui/toggle-group.tsx`

### Toggle Sizes
- Default: `h-10 min-w-10 px-6`
- Sm: `h-9 min-w-9 px-4`
- Lg: `h-11 min-w-11 px-8`

### Toggle Group Variant
- `outline` variant for segmented controls (used in chart time range selector)
- Active state: `data-[state=on]:bg-muted data-[state=on]:text-foreground`

---

## Alert
**File:** `src/shared/components/ui/alert.tsx`

### Variants
- `default`: `bg-card text-card-foreground after:bg-foreground` (left accent bar)
- `destructive`: `bg-card text-destructive after:bg-destructive` (red accent bar)

### Structure
- Left accent bar: `after:w-0.5` pseudo-element
- Padding: `px-4 py-3`
- Gap: `gap-1`
- Icon size: `size-4`

---

## Switch
**File:** `src/shared/components/ui/switch.tsx`

### Sizes
- Default: `h-4.5 w-8.25` with thumb `size-3.5`
- Sm: `h-3.5 w-6.25` with thumb `size-2.5`
- Checked: `bg-primary` border and background
- Unchecked: `bg-input` background

---

## Progress
**File:** `src/shared/components/ui/progress.tsx`
- Height: `h-0.5` (thin line)
- Background: `bg-muted`
- Indicator: `bg-primary` fill

---

## Checkbox
**File:** `src/shared/components/ui/checkbox.tsx`
- Size: `size-4.5`
- Unchecked: `border-input bg-transparent`
- Checked: `border-primary bg-primary text-primary-foreground`
- Icon: Tick02Icon

---

## Avatar
**File:** `src/shared/components/ui/avatar.tsx`
- Default: `size-8` with `rounded-full`
- Sizes: sm (size-6), lg (size-10)
- Fallback: `bg-muted text-sm text-muted-foreground`
- Border overlay: `after:border after:border-border after:mix-blend-darken`

---

## Pagination
**File:** `src/shared/components/ui/pagination.tsx`
- Uses Button component with `variant={isActive ? 'outline' : 'ghost'}`
- Gap: `gap-1` between items
- Previous/Next: Uses ArrowLeft01Icon / ArrowRight01Icon

---

## Tooltip
**File:** `src/shared/components/ui/tooltip.tsx`
- Background: `bg-foreground text-background` (inverted)
- Padding: `px-3 py-1.5`
- Text: `text-xs`
- Max-width: `max-w-xs`
- Arrow: `size-2.5 bg-foreground fill-foreground`

---

## Form
**File:** `src/shared/components/ui/form.tsx`
- Item: `grid gap-2`
- Label: Uses Label component with error state `data-[invalid=true]:text-destructive`
- Message: `text-[0.8rem] font-medium text-destructive`
- Description: `text-[0.8rem] text-muted-foreground`

---

## Combobox
**File:** `src/shared/components/ui/combobox.tsx`
- Uses Base UI Combobox primitive (not Radix)
- Trigger: Underline pattern matching Input/Select
- Content: `shadow-md ring-1 ring-foreground/10` with same enter/exit animations
- Items: Same pattern as select items (`py-2 pr-8 pl-3 text-sm`)
- Chips: Multi-select variant with `bg-muted` chips

---

## Skeleton
**File:** `src/shared/components/ui/skeleton.tsx`
- Animation: `animate-pulse`
- Color: `bg-muted`

---

## Empty State
**File:** `src/shared/components/ui/empty.tsx`
- Layout: `flex flex-col items-center justify-center gap-4 p-12`
- Title: `font-heading text-lg font-semibold tracking-wider uppercase`
- Description: `text-sm/relaxed text-muted-foreground`
- Max-width: `max-w-sm` centered

---

## Repeated Class Combinations (Observed Frequently)

```jsx
// Page header pattern (used on nearly every page)
<div className="flex items-center justify-between">
  <div>
    <h1 className="text-[36px] font-normal leading-tight tracking-tight text-ink">
      Page Title
    </h1>
    <p className="mt-1 text-base text-body">
      Description text
    </p>
  </div>
  <Button>Action</Button>
</div>

// Card with border and surface-card background (dashboard cards)
<Card className="border-hairline bg-surface-card">
  <CardHeader className="pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Title
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-ink">Value</div>
    <p className="mt-1 text-xs text-body">Subtitle</p>
  </CardContent>
</Card>

// Grid layout for stats cards
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

// Dashboard chart card
<Card className="border-hairline bg-surface-card">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
  </CardContent>
</Card>

// Data table filter row
<Card className="gap-3 p-4 flex-row">
  <div className="relative flex-1 min-w-[200px]">
    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input placeholder="Search..." className="pl-9 h-10" />
  </div>
  <Button variant="default" className="h-10">Apply</Button>
</Card>

// Dialog with form
<Dialog>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <Form>
      <form className="space-y-4">
        <FormField>...</FormField>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogFooter>
      </form>
    </Form>
  </DialogContent>
</Dialog>

// Icon in colored box pattern (landing page)
<div className="flex size-10 items-center justify-center bg-primary/10 text-primary">
  <HugeiconsIcon icon={Icon} className="size-5" />
</div>
```
