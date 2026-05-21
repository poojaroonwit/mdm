---
tags:
  - moc
  - architecture
aliases:
  - MDM Home
  - Project Map
---

# 00 Home

## What This Project Is

This repository is a large **Next.js 16 App Router** platform for multi-tenant data, admin operations, dashboards, chatbots, integrations, and a separate plugin ecosystem.

Core anchors:

- [[01 Runtime & Entry Points]]
- [[02 Frontend Shell]]
- [[03 API & Route Layout]]
- [[04 Authentication & Sessions]]
- [[05 Theme & Branding]]
- [[06 Spaces & Multi-Tenancy]]
- [[07 Database & Prisma]]
- [[08 Data Modeling]]
- [[09 Chatbot & AI]]
- [[10 Admin Surface]]
- [[11 Plugin Hub]]
- [[12 Operations & Integrations]]
- [[13 Code Map]]
- [[14 Graph Guide]]
- [[15 BRD Summary]]
- [[16 SRS Summary]]
- [[17 Architecture Summary]]
- [[18 Documentation Drift & Gaps]]
- [[19 Best Practices & Review]]
- [[20 Feature Map - Dashboards & Reports]]
- [[21 Feature Map - Knowledge Base & Notifications]]
- [[22 Feature Map - Studio, Workflows & Infrastructure]]
- [[23 Database Model Map - Identity, Spaces & Chatbots]]
- [[24 Database Model Map - Reports & Dashboards]]
- [[25 Database Model Map - Knowledge & Notifications]]
- [[26 API Domain Map]]
- [[32 Integration Inventory]]
- [[38 Glossary]]
- [[39 Change Hotspots]]
- [[40 Feature Map - Customers, Data & EAV]]
- [[42 Feature Map - Marketplace, Plugins & Developer Surfaces]]
- [[43 Feature Map - Settings, Admin & System Control]]
- [[44 Feature Map - Space App Modules]]
- [[45 Requirements Traceability]]
- [[46 Risk Register]]
- [[47 Tech Debt Register]]
- [[48 Architecture Diagram - System Context]]
- [[49 Architecture Diagram - Domain Relationships]]

## Primary Source Paths

- `src/app`
- `src/components`
- `src/contexts`
- `src/lib`
- `prisma/schema.prisma`
- `plugin-hub`
- `AGENTS.md`
- `BRD.md`
- `SRS.md`
- `docs/HIGH_LEVEL_ARCHITECTURE.md`

## Mental Model

The system has three especially important axes:

1. **Platform shell and app routing** via `src/app`
2. **Shared runtime services** via `src/lib`
3. **Tenant-aware business data** centered around [[06 Spaces & Multi-Tenancy]] and [[08 Data Modeling]]

## High-Value Traversal Paths

- Login and session flow: [[01 Runtime & Entry Points]] -> [[04 Authentication & Sessions]]
- UI consistency and dark mode: [[02 Frontend Shell]] -> [[05 Theme & Branding]]
- Database understanding: [[07 Database & Prisma]] -> [[08 Data Modeling]]
- AI and chatbot understanding: [[09 Chatbot & AI]] -> [[10 Admin Surface]]
- Ecosystem and external modules: [[11 Plugin Hub]] -> [[12 Operations & Integrations]]
- requirements-to-code path: [[15 BRD Summary]] -> [[16 SRS Summary]] -> [[17 Architecture Summary]] -> [[18 Documentation Drift & Gaps]]
- analytics path: [[20 Feature Map - Dashboards & Reports]] -> [[24 Database Model Map - Reports & Dashboards]] -> [[29 Flow - Dashboard Request Lifecycle]]
- AI path: [[09 Chatbot & AI]] -> [[23 Database Model Map - Identity, Spaces & Chatbots]] -> [[30 Flow - Chatbot Request Lifecycle]]
- maintenance path: [[19 Best Practices & Review]] -> [[39 Change Hotspots]]
- feature-domain path: [[40 Feature Map - Customers, Data & EAV]] -> [[08 Data Modeling]] -> [[28 API Domain Map - Data, AI & Integrations]]
- governance path: [[43 Feature Map - Settings, Admin & System Control]] -> [[04 Authentication & Sessions]] -> [[05 Theme & Branding]]
