---
tags:
  - data
  - modeling
  - eav
---

# 08 Data Modeling

## Two Coexisting Modeling Systems

### Structured model system

- `DataModel`
- `Attribute`
- `DataRecord`
- `DataRecordValue`

### Dynamic EAV system

- `EntityType`
- `EavAttribute`
- `EavEntity`
- `EavValue`

## Why This Split Matters

- the structured model is more constrained and guided
- the EAV system is more dynamic and schema-flexible
- both are first-class in the product

## Code Neighborhoods

- `src/components/data-model*`
- `src/components/eav`
- `src/lib/eav-utils.ts`
- admin and data-management screens under `src/app/(platform)`

## Graph Links

- [[07 Database & Prisma]]
- [[06 Spaces & Multi-Tenancy]]
- [[10 Admin Surface]]
