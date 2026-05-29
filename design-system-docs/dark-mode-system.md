# Dark Mode System — MFSA Connect Design System

## Architecture

- **Engine**: Custom `ThemeProvider` (not next-themes)
- **CSS Selector**: `.dark` class on `<html>` element
- **Storage**: `localStorage` key `"theme-mode"` with values `"light"`, `"dark"`, `"auto"`
- **System Detection**: `window.matchMedia("(prefers-color-scheme: dark)")` listener for auto mode
- **CSS Custom Variant**: `@custom-variant dark (&:where(.dark, .dark *))` in globals.css
- **Tailwind v4 Integration**: `@theme inline` maps CSS vars to Tailwind utilities (e.g., `bg-primary`, `text-muted-foreground`)
- **File**: `src/shared/providers/theme-provider.tsx`, token values in `src/app/globals.css`

## ThemeProvider Mechanics

```tsx
// Three-mode cycle: auto → light → dark → auto (or auto → dark → light → auto depending on system preference)
const getNextTheme = (current: ThemeMode): ThemeMode => {
  const themes =
    getSystemTheme() === 'dark' ? ['auto', 'light', 'dark'] : ['auto', 'dark', 'light'];
  return themes[(themes.indexOf(current) + 1) % themes.length];
};
```

- `"light"` mode: adds `class="light"` to `<html>`, applies `:root` CSS vars
- `"dark"` mode: adds `class="dark"` to `<html>`, applies `.dark` CSS vars
- `"auto"` mode: adds both `"auto"` class + resolved theme class, listens to `prefers-color-scheme` changes
- `resolvedTheme` exposes the effective theme (always `"light"` or `"dark"`, never `"auto"`)

## ThemeToggle Component

- Dropdown with 3 options: Light (SunIcon), Dark (MoonIcon), System (DesktopIcon)
- Header button shows current mode icon using Tailwind variant classes:
  - `light:scale-100!` — Sun visible in light mode
  - `dark:scale-100!` — Moon visible in dark mode
  - `auto:scale-100!` — Desktop visible in auto mode
  - Uses `scale-0` to hide inactive icons with `[&>svg]:absolute [&>svg]:size-5 [&>svg]:scale-0`

---

## Color Inversion Rules

### Background Surface Tokens

| Token                  | Light (HEX) | Dark (HEX) | Behavior                                         |
| ---------------------- | ----------- | ---------- | ------------------------------------------------ |
| `--background`         | `#ffffff`   | `#0a0b0d`  | Full inversion                                   |
| `--foreground`         | `#0a0b0d`   | `#ffffff`  | Full inversion                                   |
| `--card`               | `#ffffff`   | `#16181c`  | Inverts to slightly elevated dark                |
| `--card-foreground`    | `#0a0b0d`   | `#ffffff`  | Full inversion                                   |
| `--popover`            | `#ffffff`   | `#16181c`  | Same as card dark                                |
| `--popover-foreground` | `#0a0b0d`   | `#ffffff`  | Full inversion                                   |
| `--secondary`          | `#eef0f3`   | `#16181c`  | Inverts from light gray to dark                  |
| `--muted`              | `#f7f7f7`   | `#16181c`  | Nearly white → dark surface                      |
| `--muted-foreground`   | `#7c828a`   | `#a8acb3`  | Medium gray → lighter gray (readability on dark) |
| `--accent`             | `#f7f7f7`   | `#16181c`  | Same as muted                                    |
| `--accent-foreground`  | `#0a0b0d`   | `#ffffff`  | Full inversion                                   |
| `--border`             | `#dee1e6`   | `#2b2d31`  | Light gray → dark gray                           |
| `--input`              | `#dee1e6`   | `#2b2d31`  | Same as border                                   |
| `--ring`               | `#0052ff`   | `#0052ff`  | **NO CHANGE** — stays primary blue               |
| `--radius`             | `0.625rem`  | `0.625rem` | NO CHANGE                                        |
| `--sidebar`            | `#f7f7f7`   | `#16181c`  | Light gray → dark surface                        |
| `--sidebar-accent`     | `#eef0f3`   | `#2b2d31`  | Light accent → dark accent                       |

### Extended Surface Tokens

| Token                     | Light (HEX) | Dark (HEX) | Behavior                                         |
| ------------------------- | ----------- | ---------- | ------------------------------------------------ |
| `--ink`                   | `#0a0b0d`   | `#ffffff`  | Full inversion                                   |
| `--body`                  | `#5b616e`   | `#a8acb3`  | Inverts to lighter (readable on dark)            |
| `--muted-soft`            | `#a8acb3`   | `#5b616e`  | Inverts to darker (now secondary on dark)        |
| `--hairline`              | `#dee1e6`   | `#2b2d31`  | Light → dark                                     |
| `--hairline-soft`         | `#eef0f3`   | `#16181c`  | Light → dark                                     |
| `--canvas`                | `#ffffff`   | `#0a0b0d`  | Full inversion                                   |
| `--surface-soft`          | `#f7f7f7`   | `#0a0b0d`  | Inverts to background                            |
| `--surface-card`          | `#ffffff`   | `#16181c`  | Inverts to dark card                             |
| `--surface-strong`        | `#eef0f3`   | `#2b2d31`  | Light → dark                                     |
| `--surface-dark`          | `#0a0b0d`   | `#ffffff`  | **CROSS-INVERTS** (dark in light, light in dark) |
| `--surface-dark-elevated` | `#16181c`   | `#f7f7f7`  | Cross-inverts                                    |

### Saturated Tokens (NO CHANGE in dark mode)

| Token                      | HEX       | Purpose                              |
| -------------------------- | --------- | ------------------------------------ |
| `--primary`                | `#0052ff` | Brand blue — identical in both modes |
| `--primary-foreground`     | `#ffffff` | Always white                         |
| `--primary-active`         | `#003ecc` | Always darker blue                   |
| `--destructive`            | `#cf202f` | Always vivid red                     |
| `--destructive-foreground` | `#ffffff` | Always white                         |
| `--semantic-up`            | `#05b169` | Always green                         |
| `--semantic-down`          | `#cf202f` | Always red (same as destructive)     |
| `--accent-yellow`          | `#f4b000` | Always amber/yellow                  |
| `--on-primary`             | `#ffffff` | Always white                         |
| `--chart-1`                | `#0052ff` | Primary series — no change           |
| `--chart-2`                | `#05b169` | Green series — no change             |
| `--chart-3`                | `#f4b000` | Yellow series — no change            |
| `--chart-4`                | `#cf202f` | Red series — no change               |

### Tokens That Change in Dark Mode

| Token                | Light (HEX) | Dark (HEX) |
| -------------------- | ----------- | ---------- |
| `--primary-disabled` | `#a8b8cc`   | `#3a4a5c`  |
| `--on-dark`          | `#ffffff`   | `#0a0b0d`  |
| `--on-dark-soft`     | `#a8acb3`   | `#5b616e`  |
| `--chart-5`          | `#a8b8cc`   | `#3a4a5c`  |

---

## Component Dark Mode Adjustments

### Elevation in Dark Mode

- Card shadow (`shadow-sm`) becomes less visible in dark mode — compensated by `ring-1 ring-foreground/5` which becomes visible as `rgba(255,255,255,0.05)`
- Floating UI shadows (`shadow-md ring-1 ring-foreground/10`) become visible as white-tinted rings in dark mode
- Overlay: `bg-black/20` remains the same in both modes (works on dark backgrounds since it adds darkness)

### Hover States in Dark Mode

- Primary button hover: `hover:bg-primary/80` (80% opacity of same blue) — works identically
- Destructive: `bg-destructive/10` → `hover:bg-destructive/20` (transparent red overlays)
- Ghost/secondary: `hover:bg-muted` → on dark `#16181c` background, hover becomes invisible — relies on `hover:text-foreground` for text color change

### Focus Rings in Dark Mode

- `ring-ring/30` — primary blue ring at 30% opacity — works in both modes

### Sidebar Dark Mode

- Background: `#f7f7f7` → `#16181c`
- Text: `#0a0b0d` → `#ffffff`
- Accent (hover/active): `#eef0f3` → `#2b2d31`
- Border: `#dee1e6` → `#2b2d31`
- Primary/ring stay blue (`#0052ff`)
- Group label: `text-sidebar-foreground/70` — uses CSS var with opacity, resolves correctly in both modes

### Charts in Dark Mode

- Chart-1 through Chart-4 stay identical
- Chart-5 desaturates: `#a8b8cc` → `#3a4a5c` (lighter becomes darker)
- Area chart gradients use `fill` with CSS variables — resolve per mode
- Chart grid lines use `--border` which darkens appropriately

### Tooltip in Dark Mode

- Uses inverted colors: `bg-foreground text-background`
- Light: `bg-black text-white`
- Dark: `bg-white text-black`
- Works correctly via CSS variable resolution

### Table Dark Mode

- Header: uses `text-muted-foreground` which resolves to readable gray in both modes
- Row hover: `hover:bg-muted/50` adapts via CSS variable
- Border: `border-b` uses `--border` which darkens

---

## Contrast Verification

| Token Pair                         | Light Ratio                  | Dark Ratio                   | Passes WCAG AA?                    |
| ---------------------------------- | ---------------------------- | ---------------------------- | ---------------------------------- |
| `foreground` on `background`       | #0a0b0d on #ffffff = ~19.5:1 | #ffffff on #0a0b0d = ~19.5:1 | Yes (AAA)                          |
| `muted-foreground` on `background` | #7c828a on #ffffff = ~4.6:1  | #a8acb3 on #0a0b0d = ~8.3:1  | Yes (AA)                           |
| `body` on `background`             | #5b616e on #ffffff = ~6.7:1  | #a8acb3 on #0a0b0d = ~8.3:1  | Yes (AA)                           |
| `muted-soft` on `background`       | #a8acb3 on #ffffff = ~2.6:1  | #5b616e on #0a0b0d = ~4.2:1  | Light fails, dark passes           |
| `primary` on `background`          | #0052ff on #ffffff = ~5.1:1  | #0052ff on #0a0b0d = ~3.8:1  | Light AA, Dark fails AA borderline |
| `on-primary` on `primary`          | #ffffff on #0052ff = ~5.1:1  | #ffffff on #0052ff = ~5.1:1  | Yes (AA)                           |

> Note: `muted-soft` is only used for secondary metadata where readability is less critical. Primary blue on dark background is borderline — mitigated by larger text sizes and bold weights where primary is used on dark.

---

## Implementation Notes

### Adding New Components with Dark Mode Support

1. Define color values using CSS custom properties (not raw HEX)
2. Use Tailwind semantic classes (`bg-card`, `text-muted-foreground`) instead of literal colors
3. Only add new CSS vars to the `:root` and `.dark` blocks in globals.css
4. Register new vars in `@theme inline` directive for Tailwind utility generation

### CSS Variable Pattern to Follow

```css
/* globals.css */
@theme inline {
  --color-my-token: var(--my-token);
}
:root {
  --my-token: #value-light;
}
.dark {
  --my-token: #value-dark;
}
```

### Animations in Dark Mode

- All animations remain identical — no dark-specific animation overrides
- Overlay opacity remains `bg-black/20` in both modes
- Shadows reduce in visibility but rings compensate
