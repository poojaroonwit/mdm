---
tags:
  - spaces
  - multitenancy
  - authorization
---

# 06 Spaces & Multi-Tenancy

## Core Concept

**Spaces** are the multi-tenant boundary for much of the system.

Important models and concepts:

- `Space`
- `SpaceMember`
- `SpaceRole`
- feature flags per space

## Relevant Code

- route segment: `src/app/[space]`
- context: `src/contexts/space-context.tsx`
- access helpers: `src/lib/space-access.ts`
- many APIs enforce space membership before data access

## Why Spaces Matter

Spaces affect:

- navigation and scoped pages
- authorization checks
- visibility of data models
- dashboards, reports, attachments, workflows, chatbots, and more

## Connected Notes

- [[03 API & Route Layout]]
- [[04 Authentication & Sessions]]
- [[07 Database & Prisma]]
- [[08 Data Modeling]]
