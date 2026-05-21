---
tags:
  - adr
  - plugins
  - architecture
---

# 37 ADR - Why Plugin Hub Is Separate

## Decision

`plugin-hub` is maintained as a separate Next.js application rather than being folded into the main app runtime.

## Why

- clearer ecosystem boundary
- separate deployment/runtime concerns
- looser coupling for plugin marketplace behavior
- avoids collapsing all plugin concerns into the already large main platform surface

## Tradeoff

- more docs and build complexity
- more onboarding complexity
- cross-app drift risk

## Connected Notes

- [[11 Plugin Hub]]
- [[18 Documentation Drift & Gaps]]
