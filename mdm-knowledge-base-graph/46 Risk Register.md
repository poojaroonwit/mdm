---
tags:
  - risks
  - review
  - maintenance
---

# 46 Risk Register

## R1. Documentation Drift

- impact: onboarding confusion and wrong implementation assumptions
- evidence: [[18 Documentation Drift & Gaps]]

## R2. Broad Domain Surface

- impact: regression risk and ownership ambiguity
- evidence: admin + spaces + AI + marketplace + infra in one codebase

## R3. Auth / Tenancy Complexity

- impact: subtle authorization bugs
- evidence: [[04 Authentication & Sessions]], [[06 Spaces & Multi-Tenancy]]

## R4. Theme / Branding Fragmentation

- impact: inconsistent UI and dark/light regressions
- evidence: [[05 Theme & Branding]]

## R5. Mixed Persistence Styles

- impact: correctness and maintainability burden
- evidence: [[35 ADR - Why Prisma and Raw SQL Coexist]]

## R6. Separate Plugin Ecosystem Boundary

- impact: drift between marketplace expectations and actual plugin runtime behavior
- evidence: [[11 Plugin Hub]], [[42 Feature Map - Marketplace, Plugins & Developer Surfaces]]
