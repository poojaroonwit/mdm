---
tags:
  - adr
  - database
---

# 35 ADR - Why Prisma and Raw SQL Coexist

## Decision

The codebase uses Prisma as the primary ORM but still keeps targeted raw SQL for cases where query shape, joins, access patterns, or legacy behavior require more direct control.

## Why

- large schema complexity
- performance-sensitive queries
- reporting and analytics query shapes
- legacy/transition codepaths
- direct control over casts and UUID comparison patterns

## Cost

- more consistency burden
- more review burden
- raw SQL correctness and safety patterns must be taught explicitly

## Connected Notes

- [[07 Database & Prisma]]
- [[18 Documentation Drift & Gaps]]
