---
tags:
  - moc
  - architecture
aliases:
  - MDM Home
  - Project Map
---

# 00 Home

## What This Project Is

This repository is a large **Next.js 16 App Router** platform for multi-tenant data, admin operations, dashboards, chatbots, integrations, and a separate plugin ecosystem.

Core anchors:

- [[01 Runtime & Entry Points]]
- [[02 Frontend Shell]]
- [[03 API & Route Layout]]
- [[04 Authentication & Sessions]]
- [[05 Theme & Branding]]
- [[06 Spaces & Multi-Tenancy]]
- [[07 Database & Prisma]]
- [[08 Data Modeling]]
- [[09 Chatbot & AI]]
- [[10 Admin Surface]]
- [[11 Plugin Hub]]
- [[12 Operations & Integrations]]
- [[13 Code Map]]
- [[14 Graph Guide]]
- [[15 BRD Summary]]
- [[16 SRS Summary]]
- [[17 Architecture Summary]]
- [[18 Documentation Drift & Gaps]]
- [[19 Best Practices & Review]]

## Primary Source Paths

- `src/app`
- `src/components`
- `src/contexts`
- `src/lib`
- `prisma/schema.prisma`
- `plugin-hub`
- `AGENTS.md`
- `BRD.md`
- `SRS.md`
- `docs/HIGH_LEVEL_ARCHITECTURE.md`

## Mental Model

The system has three especially important axes:

1. **Platform shell and app routing** via `src/app`
2. **Shared runtime services** via `src/lib`
3. **Tenant-aware business data** centered around [[06 Spaces & Multi-Tenancy]] and [[08 Data Modeling]]

## High-Value Traversal Paths

- Login and session flow: [[01 Runtime & Entry Points]] -> [[04 Authentication & Sessions]]
- UI consistency and dark mode: [[02 Frontend Shell]] -> [[05 Theme & Branding]]
- Database understanding: [[07 Database & Prisma]] -> [[08 Data Modeling]]
- AI and chatbot understanding: [[09 Chatbot & AI]] -> [[10 Admin Surface]]
- Ecosystem and external modules: [[11 Plugin Hub]] -> [[12 Operations & Integrations]]
- requirements-to-code path: [[15 BRD Summary]] -> [[16 SRS Summary]] -> [[17 Architecture Summary]] -> [[18 Documentation Drift & Gaps]]
