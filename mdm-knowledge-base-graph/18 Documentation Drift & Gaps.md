---
tags:
  - review
  - drift
  - docs
  - risks
---

# 18 Documentation Drift & Gaps

## What This Note Tracks

This note captures mismatches between business/technical docs and the current repository shape.

## High-Confidence Drift

### Stack version drift

- `README.md` and `docs/HIGH_LEVEL_ARCHITECTURE.md` still describe **Next.js 14**
- current repo guidance in `AGENTS.md` describes **Next.js 16**

### Data access drift

- older docs heavily emphasize **PostgREST** and **Supabase**
- current repo guidance and code organization are strongly **Prisma/PostgreSQL** centered

### Product scope drift

- old docs frame the app mainly as customer/MDM tooling
- current repo includes much broader platform scope:
  - chatbots and AI orchestration
  - plugin ecosystem
  - infrastructure management
  - governance, storage, integrations, notebooks, reports, dashboards

### Session policy drift

- `SRS.md` specifies session timeout after **8 hours of inactivity**
- current implementation reads timeout from system settings and currently defaults from app logic rather than fixed 8-hour behavior

### UI/design drift

- older docs emphasize glass morphism and Prompt font
- current implementation uses newer theme tokens, DM Sans, IBM Plex Sans Thai, and a broader design system mix

## Why This Matters

These mismatches can cause:

- onboarding confusion
- wrong architecture assumptions
- inaccurate delivery scoping
- misleading compliance/security expectations
- stale operational runbooks

## Recommended Cleanup Order

1. Update `README.md` to match the real platform scope and stack
2. Create a single current architecture source of truth
3. Reconcile SRS non-functional requirements with actual implementation
4. Add an explicit legacy-vs-current note for PostgREST/Supabase references

## Connected Notes

- [[15 BRD Summary]]
- [[16 SRS Summary]]
- [[17 Architecture Summary]]
- [[19 Best Practices & Review]]
