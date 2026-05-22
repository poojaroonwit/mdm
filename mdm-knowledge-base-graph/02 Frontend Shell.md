---
tags:
  - frontend
  - ui
  - shell
---

# 02 Frontend Shell

## Core UI Layers

- Route shell: `src/app/layout.tsx`
- Providers: `src/app/providers.tsx`
- Shared UI primitives: `src/components/ui`
- Layout shell: `src/components/layout`
- Platform navigation: `src/components/platform`

## Important Contexts

- `src/contexts/theme-context.tsx` -> [[05 Theme & Branding]]
- `src/contexts/space-context.tsx` -> [[06 Spaces & Multi-Tenancy]]
- `src/contexts/system-settings-context.tsx` -> [[10 Admin Surface]]
- `src/contexts/notification-context.tsx`

## UI Architecture

- Shadcn/Radix-style primitives in `src/components/ui`
- App-specific layouts in `src/components/layout`
- richer platform navigation in `src/components/platform`
- specialized feature UIs under folders like:
  - `dashboard`
  - `reports`
  - `knowledge-base`
  - `studio`
  - `workflows`

## Best Graph Neighbors

- [[05 Theme & Branding]]
- [[10 Admin Surface]]
- [[13 Code Map]]
