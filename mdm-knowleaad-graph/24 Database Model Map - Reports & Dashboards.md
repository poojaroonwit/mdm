---
tags:
  - database
  - models
  - analytics
---

# 24 Database Model Map - Reports & Dashboards

## Report Cluster

- `Report`
- `ReportSpace`
- `ReportCategory`
- `ReportFolder`
- `ReportPermission`

## Dashboard Cluster

- `Dashboard`
- `DashboardDatasource`
- `DashboardPermission`
- `DashboardSpace`

## Cross-Cutting Concerns

- tenant scoping through spaces
- sharing and permission layers
- embed/export and integration flows

## Connected Notes

- [[20 Feature Map - Dashboards & Reports]]
- [[06 Spaces & Multi-Tenancy]]
- [[12 Operations & Integrations]]
