---
tags:
  - theme
  - branding
  - darkmode
---

# 05 Theme & Branding

## Core Files

- `src/app/globals.css`
- `src/app/providers.tsx`
- `src/contexts/theme-context.tsx`
- `src/hooks/use-theme-safe.ts`
- `src/lib/themes.ts`
- `src/lib/theme-constants.ts`
- `src/lib/branding.ts`
- `src/config/branding.ts`

## Theme Stack

- `next-themes` provides theme preference and html class switching
- custom theme context manages theme variants
- branding config overlays system-wide styling choices
- global CSS tokens define the baseline surface colors and semantic variables

## Why This Note Exists

Theme issues usually come from one of four places:

1. HTML/class mode resolution
2. CSS token mismatch in `globals.css`
3. branding config overrides
4. component-level hardcoded colors

## Graph Neighbors

- [[01 Runtime & Entry Points]]
- [[02 Frontend Shell]]
- [[10 Admin Surface]]

## Good Debug Paths

- dark/light mismatch -> `globals.css` and provider setup
- theme persistence -> `theme-context.tsx`
- branding-driven colors -> `branding.ts` and admin branding screens
