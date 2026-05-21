---
tags:
  - api
  - routes
  - backend
---

# 03 API & Route Layout

## Primary API Location

The main route tree lives in `src/app`, especially under:

- `src/app/(platform)/api`
- `src/app/chat`
- some tenant-aware routes under `src/app/[space]`

## Route Conventions

- Preferred versioned APIs: `api/v1`
- Existing legacy routes still coexist
- Public/internal/platform boundaries exist inside the app route tree

## Shared API Utilities

- `src/lib/api-response.ts`
- `src/lib/api-middleware.ts`
- `src/lib/api-permissions.ts`
- `src/lib/api-validation.ts`

## Frequent Cross-Cuts

- Session checks -> [[04 Authentication & Sessions]]
- Space access checks -> [[06 Spaces & Multi-Tenancy]]
- DB access -> [[07 Database & Prisma]]
- chatbot and realtime flows -> [[09 Chatbot & AI]]

## Key Route Families

- auth
- dashboards
- reports
- spaces
- attachments
- notifications
- admin
- chatbot and AI endpoints
