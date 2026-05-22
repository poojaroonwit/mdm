---
tags:
  - architecture
  - design
  - docs
---

# 17 Architecture Summary

## Sources

- `AGENTS.md`
- `docs/HIGH_LEVEL_ARCHITECTURE.md`
- `README.md`

## Current Architecture Signal

The strongest current architecture source is `AGENTS.md`, not `README.md`.

## Current Best-Fit Understanding

- main app is a **Next.js 16 App Router** platform
- auth is **NextAuth.js 4**
- ORM is **Prisma 6**
- database is **PostgreSQL**
- storage is **MinIO**
- theme system uses `next-themes` plus custom theme context
- the project includes a substantial **admin surface**, **chatbot/AI surface**, **space-scoped tenancy model**, and **plugin-hub** app

## Important Architectural Domains

- app shell and route topology -> [[01 Runtime & Entry Points]]
- frontend UI shell -> [[02 Frontend Shell]]
- API boundary -> [[03 API & Route Layout]]
- auth/session boundary -> [[04 Authentication & Sessions]]
- tenant boundary -> [[06 Spaces & Multi-Tenancy]]
- persistence boundary -> [[07 Database & Prisma]]
- AI subsystem -> [[09 Chatbot & AI]]
- external ecosystem -> [[11 Plugin Hub]]

## Notable Architectural Tension

The repository contains signals of multiple historical architectures:

- PostgREST-oriented docs
- Prisma-centric implementation
- legacy MDM/customer language
- newer unified platform and chatbot/platform admin language

That tension is captured in [[18 Documentation Drift & Gaps]].
