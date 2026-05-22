---
tags:
  - runtime
  - nextjs
  - entrypoints
---

# 01 Runtime & Entry Points

## Main Runtime Surface

- Root layout: `src/app/layout.tsx`
- Global providers: `src/app/providers.tsx`
- Global styles: `src/app/globals.css`
- Route trees:
  - `src/app/(platform)`
  - `src/app/[space]`
  - `src/app/chat`

## Major Entry Boundaries

- Platform app shell: [[02 Frontend Shell]]
- API routes: [[03 API & Route Layout]]
- Authentication bootstrapping: [[04 Authentication & Sessions]]
- Theme bootstrapping: [[05 Theme & Branding]]

## Runtime Notes

- Uses **Next.js App Router**
- Uses **webpack**, not Turbopack
- Global providers compose:
  - `SessionProvider`
  - `NextThemeProvider`
  - custom `ThemeProvider`
  - React Query provider
  - notification provider

## Why This Note Matters

When debugging boot issues, hydration problems, theme flash, stale session state, or cross-route behavior, start here and then branch to [[04 Authentication & Sessions]] or [[05 Theme & Branding]].
