---
tags:
  - features
  - dashboards
  - reports
---

# 20 Feature Map - Dashboards & Reports

## Main User-Facing Areas

- platform routes:
  - `src/app/(platform)/dashboard`
  - `src/app/(platform)/api/dashboards`
  - `src/app/(platform)/api/reports`
- shared UI:
  - `src/components/dashboard`
  - `src/components/reports`

## Persistence Anchors

- `Dashboard`
- `DashboardDatasource`
- `DashboardPermission`
- `DashboardSpace`
- `Report`
- `ReportSpace`
- `ReportCategory`
- `ReportFolder`
- `ReportPermission`

## Why This Area Matters

- dashboards and reports are a major analytics surface
- they intersect with spaces, permissions, sharing, exports, integrations, and embed use cases

## Connected Notes

- [[03 API & Route Layout]]
- [[06 Spaces & Multi-Tenancy]]
- [[07 Database & Prisma]]
- [[24 Database Model Map - Reports & Dashboards]]
- [[29 Flow - Dashboard Request Lifecycle]]
