---
tags:
  - database
  - prisma
  - postgres
---

# 07 Database & Prisma

## Main Database Sources

- schema: `prisma/schema.prisma`
- client access:
  - `src/lib/db.ts`
  - `src/lib/prisma.ts`
- seeds and migrations:
  - `prisma/*.ts`
  - `scripts/*`

## Key Facts

- PostgreSQL database
- Prisma 6 ORM
- very large schema with many domain models
- UUID-heavy schema
- soft deletes in many places
- JSON fields used for flexible config

## Important Pattern

For raw SQL UUID comparisons:

- cast the column, not the parameter
- use `id::text = $1`

## High-Value Model Areas

- users and auth
- spaces
- data models and records
- EAV entities and values
- chatbots and versions
- dashboards and reports
- plugin and service installation metadata

## Related Notes

- [[06 Spaces & Multi-Tenancy]]
- [[08 Data Modeling]]
- [[09 Chatbot & AI]]
- [[11 Plugin Hub]]
