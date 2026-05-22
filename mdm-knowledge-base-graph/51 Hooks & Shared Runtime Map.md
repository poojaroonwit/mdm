---
tags:
  - hooks
  - shared
  - runtime
---

# 51 Hooks & Shared Runtime Map

## Sources

- `src/hooks`
- `src/shared`

## Hooks Layer

Important hook clusters:

- permissions and spaces
- theme safety
- realtime/query execution
- templates and studio support
- keyboard/history/undo-redo helpers
- data-model helpers

## Shared Layer

Important shared clusters:

- `src/shared/components`
- `src/shared/hooks`
- `src/shared/lib`
- `src/shared/middleware`

## Why This Matters

These folders usually contain the real reuse and cross-cutting behavior that can be missed if you only read route files.

## Connected Notes

- [[01 Runtime & Entry Points]]
- [[02 Frontend Shell]]
- [[03 API & Route Layout]]
- [[39 Change Hotspots]]
