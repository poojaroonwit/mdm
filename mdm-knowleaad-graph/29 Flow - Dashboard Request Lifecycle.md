---
tags:
  - flow
  - dashboards
  - runtime
---

# 29 Flow - Dashboard Request Lifecycle

## Typical Path

1. user enters a dashboard screen
2. shell/providers resolve session and theme
3. route/API layer validates access
4. tenant/space constraints are applied
5. dashboard/report data is queried
6. datasource and widget configuration are resolved
7. UI renders with filters, permissions, and possibly sharing/export affordances

## Common Cross-Cuts

- session validation -> [[04 Authentication & Sessions]]
- space access -> [[06 Spaces & Multi-Tenancy]]
- persistence -> [[24 Database Model Map - Reports & Dashboards]]

## Why This Note Helps

It makes dashboard bugs easier to localize:

- auth bug
- tenancy bug
- datasource bug
- widget/rendering bug
- permission/share bug
