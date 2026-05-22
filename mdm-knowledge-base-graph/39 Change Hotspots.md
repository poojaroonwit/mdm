---
tags:
  - maintenance
  - hotspots
  - review
---

# 39 Change Hotspots

## If You Change Authentication

Also inspect:

- `src/lib/auth.ts`
- sign-in pages
- session provider wiring
- timeout logic
- SSO utilities

Related notes:

- [[04 Authentication & Sessions]]
- [[27 API Domain Map - Auth, Spaces & Users]]

## If You Change Theme / Branding

Also inspect:

- `src/app/globals.css`
- `src/app/providers.tsx`
- `src/contexts/theme-context.tsx`
- branding config and admin branding screens

Related notes:

- [[05 Theme & Branding]]

## If You Change Space Access

Also inspect:

- `src/contexts/space-context.tsx`
- `src/lib/space-access.ts`
- space-scoped routes
- API guards

Related notes:

- [[06 Spaces & Multi-Tenancy]]
- [[36 ADR - Why Spaces Are the Tenant Boundary]]

## If You Change Chatbots

Also inspect:

- chat route runtime
- chatbot persistence models
- engine config
- style/version config
- usage/rate-limit/hook logic

Related notes:

- [[09 Chatbot & AI]]
- [[23 Database Model Map - Identity, Spaces & Chatbots]]
- [[30 Flow - Chatbot Request Lifecycle]]

## If You Change Project Management / Tickets

Also inspect:

- `plugin-hub/plugins/project-management/src/tickets/components/TicketsList.tsx`
- `src/components/project-management/TicketDetailModalEnhanced.tsx`
- `src/components/project-management/ConfigurableKanbanBoard.tsx`
- `src/app/(platform)/admin/features/content/components/ProjectsManagement.tsx`
- `src/app/(platform)/api/projects`
- `src/app/(platform)/api/tickets`
- `prisma/schema.prisma` models around `Project`, `Ticket`, and `TicketAttribute`

Related notes:

- [[50 Feature Map - Project Management Tickets]]
- [[11 Plugin Hub]]
- [[07 Database & Prisma]]
- [[06 Spaces & Multi-Tenancy]]
