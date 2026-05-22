---
tags:
  - adr
  - spaces
  - tenancy
---

# 36 ADR - Why Spaces Are the Tenant Boundary

## Decision

Spaces are used as the main multi-tenant organizational boundary.

## Why

- clear membership model
- feature enablement per tenant
- easier scoped authorization
- reusable pattern across dashboards, reports, knowledge, chatbots, and content

## Consequences

- many APIs need space-aware checks
- UI navigation must resolve current space correctly
- data sharing across spaces becomes an explicit design decision

## Connected Notes

- [[06 Spaces & Multi-Tenancy]]
- [[27 API Domain Map - Auth, Spaces & Users]]
