---
tags:
  - prisma
  - migrations
  - maintenance
---

# 53 Prisma & Data Maintenance Map

## Sources

- `prisma/schema.prisma`
- `prisma/*.ts`
- `src/scripts`
- `scripts`

## Prisma Maintenance Scripts Present

- theme update and migration scripts
- theme seeding
- storage seeding
- assets seeding
- cleanup scripts for outdated theme entries

## Why This Matters

Not all data-shape changes happen through formal Prisma migrations alone. This repository also carries runtime and seed scripts that influence effective system behavior.

## Maintenance Concerns

- theme config drift
- environment/bootstrap assumptions
- seed order dependencies
- production vs local bootstrap divergence

## Connected Notes

- [[07 Database & Prisma]]
- [[05 Theme & Branding]]
- [[47 Tech Debt Register]]
