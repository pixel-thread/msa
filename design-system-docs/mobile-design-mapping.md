# Mobile Design Mapping — MFSA Connect Design System

## Overview

This document maps the MFSA Connect web design system to React Native (RN) frameworks. The web system is built with Tailwind CSS v4 + Radix UI. For mobile, the closest parity is achieved with:

| Framework | Best For | Parity Level |
|-----------|----------|-------------|
| NativeWind v4 | React Native with Tailwind-like utility classes | High |
| Tamagui | Universal design system with styled components | High (CSS vars → tokens) |
| Expo Router | File-based routing matching Next.js App Router | High |

---

## Color Token Mapping

### Web → NativeWind

```js
// tailwind.config.js (NativeWind)
// Web uses CSS vars + @theme inline; NativeWind uses JS config with CSS var fallbacks
module.exports = {
  theme: {
    extend: {
      colors: {
        // Core semantic tokens (static values, no dark mode variants needed)
        primary: '#0052ff',
        'primary-foreground': '#ffffff',
        destructive: '#cf202f',
        'destructive-foreground': '#ffffff',
        'semantic-up': '#05b169',
        'semantic-down': '#cf202f',
        'accent-yellow': '#f4b000',

        // Backgrounds (use React Native Appearance API for dark mode)
        background: { light: '#ffffff', dark: '#0a0b0d' },
        foreground: { light: '#0a0b0d', dark: '#ffffff' },
        card: { light: '#ffffff', dark: '#16181c' },
        'card-foreground': { light: '#0a0b0d', dark: '#ffffff' },
        popover: { light: '#ffffff', dark: '#16181c' },
        'popover-foreground': { light: '#0a0b0d', dark: '#ffffff' },
        muted: { light: '#f7f7f7', dark: '#16181c' },
        'muted-foreground': { light: '#7c828a', dark: '#a8acb3' },
        border: { light: '#dee1e6', dark: '#2b2d31' },
        input: { light: '#dee1e6', dark: '#2b2d31' },
        ring: '#0052ff', // same in both modes
      },
    },
  },
};
```

### Web → Tamagui Tokens

```ts
// tamagui.config.ts
import { createTokens } from 'tamagui';

export const tokens = createTokens({
  color: {
    primary: '#0052ff',
    primaryForeground: '#ffffff',
    primaryActive: '#003ecc',
    primaryDisabled: { light: '#a8b8cc', dark: '#3a4a5c' },
    background: { light: '#ffffff', dark: '#0a0b0d' },
    foreground: { light: '#0a0b0d', dark: '#ffffff' },
    card: { light: '#ffffff', dark: '#16181c' },
    cardForeground: { light: '#0a0b0d', dark: '#ffffff' },
    popover: { light: '#ffffff', dark: '#16181c' },
    popoverForeground: { light: '#0a0b0d', dark: '#ffffff' },
    muted: { light: '#f7f7f7', dark: '#16181c' },
    mutedForeground: { light: '#7c828a', dark: '#a8acb3' },
    border: { light: '#dee1e6', dark: '#2b2d31' },
    hairline: { light: '#dee1e6', dark: '#2b2d31' },
    ink: { light: '#0a0b0d', dark: '#ffffff' },
    body: { light: '#5b616e', dark: '#a8acb3' },
    mutedSoft: { light: '#a8acb3', dark: '#5b616e' },
    canvas: { light: '#ffffff', dark: '#0a0b0d' },
    surfaceCard: { light: '#ffffff', dark: '#16181c' },
    semanticUp: '#05b169',
    semanticDown: '#cf202f',
    accentYellow: '#f4b000',
  },
});
```

---

## Typography Mapping

### Web → NativeWind

```js
// Font families — requires native font setup
theme: {
  extend: {
    fontFamily: {
      sans: ['Roboto', 'system-ui', 'sans-serif'],
      heading: ['Roboto', 'system-ui', 'sans-serif'], // Same font, separate variable
      mono: ['JetBrains Mono', 'monospace'],
    },
    fontSize: {
      // Text component scale mapped to RN
      'display-mega': ['80px', { lineHeight: 80, letterSpacing: -2 }],
      'display-xl': ['64px', { lineHeight: 64, letterSpacing: -1.6 }],
      'display-lg': ['52px', { lineHeight: 52, letterSpacing: -1.3 }],
      'display-md': ['44px', { lineHeight: 48, letterSpacing: -1 }],
      'display-sm': ['36px', { lineHeight: 40, letterSpacing: -0.5 }],
      'title-lg': ['32px', { lineHeight: 36, letterSpacing: -0.4 }],
      'title-md': ['18px', { lineHeight: 24, letterSpacing: 0 }],
      'title-sm': ['16px', { lineHeight: 20, letterSpacing: 0 }],
      'body-md': ['16px', { lineHeight: 24, letterSpacing: 0 }],
      'body-sm': ['14px', { lineHeight: 21, letterSpacing: 0 }],
      'caption': ['13px', { lineHeight: 20, letterSpacing: 0 }],
      'caption-strong': ['12px', { lineHeight: 18, letterSpacing: 0 }],
      'number-display': ['18px', { lineHeight: 25, letterSpacing: 0 }],
    },
  },
}
```

### Web → Expo with Custom Fonts

```ts
// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

// Load fonts, apply via provider context or styled-components theme
```

---

## Component Mapping

### Web → React Native (General)

| Web Component | RN Equivalent | Notes |
|---------------|---------------|-------|
| `Button` | `Pressable` + `Text` | No native `<button>`, use Pressable with styled children |
| `Input` | `TextInput` | underline style via `borderBottomWidth` |
| `Select` | Custom modal picker / `Picker` | No native `<select>`, use Modal with FlatList |
| `Combobox` | Custom component | TextInput + FlatList dropdown |
| `Textarea` | `TextInput multiline` | Same component, multiline prop |
| `Dialog` | `Modal` with transparent overlay | Animation via Animated API |
| `Sheet` | `Modal` with slide animation | PanResponder for drag-to-dismiss |
| `DropdownMenu` | Context menu / Modal | Use Modal for mobile-appropriate UX |
| `Popover` | `Modal` / Tooltip | Position absolutely, use Modal on small screens |
| `Tooltip` | `Tooltip` (RN 0.73+) | Native Tooltip component |
| `Tabs` | Custom segmented control | FlatList-based tab bar |
| `Toggle` | `Pressable` with state | Styled toggle button |
| `Badge` | `View` + `Text` | Same styling pattern |
| `Card` | `View` with shadow | Use shadow props (shadowColor, shadowOffset, etc.) |
| `Avatar` | `Image` + fallback `View` | Use `Image` component with onError fallback |
| `Switch` | `Switch` (RN built-in) | Native switch, style via theme |
| `Checkbox` | `Pressable` + icon | Use checkbox or switch pattern |
| `Progress` | `View` clip pattern | Two overlapping Views with width % |
| `Separator` | `View` | Thin View with border color |
| `Skeleton` | `View` with animation | Animated opacity pulse |
| `Table` | FlatList / ScrollView | Use FlatList with header row |
| `Pagination` | Custom component | FlatList + page indicator |
| `Sidebar` | Drawer navigation | React Navigation Drawer or custom |
| `Breadcrumb` | Text links with separator | Simple text-based navigation |
| `Carousel` | FlatList paging | horizontal pagingEnabled FlatList |

### Web → NativeWind (Tailwind ID)

NativeWind allows using same Tailwind classes in RN:

```tsx
// Web
<Button className="bg-primary text-primary-foreground h-10 px-6 text-xs font-semibold tracking-widest uppercase">
  Submit
</Button>

// NativeWind (RN)
<Pressable className="bg-primary h-10 px-6 items-center justify-center">
  <Text className="text-primary-foreground text-xs font-semibold tracking-widest uppercase">
    Submit
  </Text>
</Pressable>
```

### Web → Tamagui

```tsx
// Tamagui — uses styled components with theme tokens
import { Button, Text, YStack } from 'tamagui';

<Button
  backgroundColor="$primary"
  color="$primaryForeground"
  height={40}
  paddingHorizontal={24}
>
  <Text
    fontSize={12}
    fontWeight="600"
    letterSpacing={1}
    textTransform="uppercase"
  >
    Submit
  </Text>
</Button>
```

---

## Spacing Mapping

| Web Class | Value | RN (NativeWind) | RN (StyleSheet) | Notes |
|-----------|-------|-----------------|-----------------|-------|
| `p-6` | 24px | `p-6` | `{ padding: 24 }` | Dashboard page padding |
| `p-4` | 16px | `p-4` | `{ padding: 16 }` | Compact card |
| `px-8` | 32px | `px-8` | `{ paddingHorizontal: 32 }` | Card content X |
| `py-8` | 32px | `py-8` | `{ paddingVertical: 32 }` | Card Y padding |
| `gap-4` | 16px | `gap-4` | `{ gap: 16 }` | Grid gaps |
| `space-y-6` | 24px | N/A | Manual margin bottom | Use margin on children |
| `h-10` | 40px | `h-10` | `{ height: 40 }` | Standard input/button height |
| `rounded-none` | 0 | `rounded-none` | `{ borderRadius: 0 }` | All components |
| `rounded-full` | 9999px | `rounded-full` | `{ borderRadius: 9999 }` | Avatars only |

> Note: `space-y-*` and `space-x-*` are gap utilities in web CSS that don't exist in RN. Replace with explicit `margin` or `gap` props.

---

## Elevation Mapping

| Web | RN (iOS) | RN (Android) |
|-----|----------|--------------|
| `shadow-sm` | `{ shadowColor, shadowOffset: {0,1}, shadowOpacity: 0.05, shadowRadius: 2 }` | `{ elevation: 1 }` |
| `shadow-md` | `{ shadowColor, shadowOffset: {0,4}, shadowOpacity: 0.1, shadowRadius: 6 }` | `{ elevation: 3 }` |
| `ring-1 ring-foreground/5` | `{ borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }` | Same |
| `z-50` | `{ zIndex: 50 }` | `{ elevation: 50 }` |

---

## Dark Mode Mapping

### Web (CSS class toggle)
```css
/* Web: .dark class toggles CSS vars */
.dark { --background: #0a0b0d; }
```

### React Native (Appearance API)
```ts
import { useColorScheme } from 'react-native';

// NativeWind: automatically uses dark: variant
<View className="bg-white dark:bg-black" />

// Manual approach
const isDark = useColorScheme() === 'dark';
const backgroundColor = isDark ? '#0a0b0d' : '#ffffff';
```

### Tamagui
```ts
// Tamagui has built-in dark mode support via ThemeProvider
<Theme name={isDark ? 'dark' : 'light'}>
  <Button backgroundColor="$background" />
</Theme>
```

---

## Navigation Mapping

| Web (Next.js App Router) | Expo Router | React Navigation |
|--------------------------|-------------|-----------------|
| `app/(dashboard)/layout.tsx` | `app/(dashboard)/_layout.tsx` | Stack navigator |
| `app/(dashboard)/members/page.tsx` | `app/(dashboard)/members.tsx` | `MembersScreen` |
| `SidebarProvider` + `AppSidebar` | Drawer navigator in layout | Drawer.Navigator |
| `SidebarInset` + header + content | Stack navigator with header | Stack.Navigator |

**Expo Router Layout Mapping:**
```tsx
// app/(dashboard)/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function DashboardLayout() {
  return (
    <Drawer
      screenOptions={{
        drawerStyle: { width: 256 },
        headerStyle: { height: 64 },
      }}
    />
  );
}
```

---

## Font Loading on Mobile

### Expo (recommended)
```ts
// Use @expo-google-fonts/* packages for parity with web
import { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold } from '@expo-google-fonts/roboto';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';
```

### Bare React Native
- Download font files manually
- Configure in `react-native.config.js`
- Link via `npx react-native-asset`

---

## Platform-Specific Considerations

### iOS
- Safe area insets: use `SafeAreaView` or `expo-status-bar`
- Shadow rendering: use `shadowColor, shadowOpacity, shadowOffset, shadowRadius`
- Gesture handling: `react-native-gesture-handler` for sheet/drawer
- Haptic feedback: `expo-haptics` for button presses, toggles

### Android
- Elevation: use Android `elevation` property instead of shadow
- Ripple effect: `TouchableNativeFeedback` for press feedback
- Back button: handle hardware back button for dialogs/sheets
- Font rendering: Roboto is system font — may not need explicit loading

### Both Platforms
- No CSS `:hover` state — use `Pressable` state styles instead
- No CSS `:focus-visible` — handle focus via accessibility states
- Scroll behaviour: `ScrollView` for overflow content, `FlatList` for data tables
- Keyboard avoidance: `KeyboardAvoidingView` for forms

---

## Component Migration Priorities

| Priority | Component | Reason |
|----------|-----------|--------|
| P0 | Sidebar/Drawer | Core navigation, must work first |
| P0 | Card | Most common layout container |
| P0 | Button | Primary interaction element |
| P0 | Input/TextInput | Form entry |
| P0 | Text | Typography foundation |
| P1 | Dialog/Modal | CRUD operations |
| P1 | DataTable | List/CRUD pages |
| P1 | Form | All data entry |
| P1 | Select/Picker | Dropdown selection |
| P1 | Toast | User feedback |
| P2 | Sheet | Detail panels |
| P2 | Tabs | Content organization |
| P2 | Charts | Data visualization |
| P3 | Carousel | Landing page only |
| P3 | Skeleton | Loading polish |

---

## Responsive Strategy for Mobile

### Web Approach
- Container queries (`@container`) for card-level responsiveness
- Tailwind breakpoints (sm/md/lg/xl) for page-level responsiveness
- Mobile detection at 768px for sidebar behavior

### Mobile Approach
- Fixed layout (no breakpoints needed on single-device-width)
- Adapt between phone and tablet using `Dimensions` API
- Tablet: use `useWindowDimensions()` to switch between compact/regular layouts (similar to `md:` breakpoint)
- Orientation changes: listen to `Dimensions` change events

```ts
// Tablet adaptation
import { useWindowDimensions } from 'react-native';

const { width } = useWindowDimensions();
const isTablet = width >= 768;

// Render different layouts
return isTablet ? <SidebarLayout /> : <TabLayout />;
```
