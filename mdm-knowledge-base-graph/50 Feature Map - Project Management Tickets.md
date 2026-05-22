---
tags:
  - features
  - projects
  - tickets
  - kanban
  - gantt
  - plugin-hub
---

# 50 Feature Map - Project Management Tickets

## Purpose

Project management is the ticket, project, kanban, gantt, and time-tracking domain. It is implemented as a plugin-backed UI that calls platform APIs and stores core records in Prisma models.

## Primary User Flows

- create a project from the project list
- switch project list between card and grid display
- open a project's kanban board from the project card/grid
- create and edit tickets in a configurable modal or drawer
- edit ticket title and inline WYSIWYG description
- define ticket custom fields at the project level
- inherit project custom fields into every ticket in that project
- drag kanban tickets between status columns
- drag or resize gantt bars to change ticket start and end dates

## UI Entry Points

- `src/app/(platform)/admin/projects/page.tsx`
- `src/app/(platform)/admin/projects/[id]/issues/page.tsx`
- `src/app/(platform)/tools/projects/page.tsx`
- `src/app/(platform)/admin/features/content/components/ProjectsManagement.tsx`
- `plugin-hub/plugins/project-management/src/tickets/components/TicketsList.tsx`
- `src/components/project-management/TicketDetailModalEnhanced.tsx`
- `src/components/project-management/ConfigurableKanbanBoard.tsx`
- `src/components/project-management/TimesheetView.tsx`

## API Entry Points

- `src/app/(platform)/api/projects/route.ts`
- `src/app/(platform)/api/projects/[id]/route.ts`
- `src/app/(platform)/api/tickets/route.ts`
- `src/app/(platform)/api/tickets/[id]/route.ts`
- `src/app/(platform)/api/tickets/[id]/attributes/route.ts`
- `src/app/(platform)/api/tickets/[id]/comments/route.ts`
- `src/app/(platform)/api/tickets/[id]/time-logs/route.ts`
- `src/app/(platform)/api/modules/route.ts`
- `src/app/(platform)/api/milestones/route.ts`
- `src/app/(platform)/api/releases/route.ts`

## Data Model Anchors

- `Project`
- `Ticket`
- `TicketSpace`
- `TicketAssignee`
- `TicketAttribute`
- `TicketComment`
- `TicketTimeLog`
- `TicketDependency`
- `KanbanConfig`
- `Module`
- `Milestone`
- `Release`
- `Cycle`

## Current Implementation Notes

- The project list is no longer only a ticket board wrapper; it is a project hub with card/grid modes and create-project support.
- Project-level custom field definitions live in `Project.metadata.customFields`.
- Ticket attributes still persist through `TicketAttribute`, but the field definitions come from the selected project instead of ad hoc ticket-level configuration.
- Ticket create accepts `projectId`, `moduleId`, `milestoneId`, and `releaseId` so new tickets can enter the correct project context immediately.
- Ticket detail display mode is controlled by board configuration: `ticketDisplayMode` supports `modal` and `drawer`.
- Ticket descriptions use `RichMarkdownEditor` for inline WYSIWYG editing.
- Gantt bars update `startDate` and `dueDate` through ticket updates after drag or edge resize.

## Risk Notes

- This domain crosses plugin UI, platform API routes, Prisma models, and space access checks, so regressions can be split across several folders.
- Project custom fields use JSON metadata for definitions and ticket attributes for values. Keep the boundary clear when adding validation, imports, or reports.
- The full repo type-check currently has unrelated failures, so targeted testing around project/ticket flows is important after future changes.

## Connected Notes

- [[06 Spaces & Multi-Tenancy]]
- [[07 Database & Prisma]]
- [[08 Data Modeling]]
- [[10 Admin Surface]]
- [[11 Plugin Hub]]
- [[26 API Domain Map]]
- [[39 Change Hotspots]]
- [[44 Feature Map - Space App Modules]]
- [[45 Requirements Traceability]]
