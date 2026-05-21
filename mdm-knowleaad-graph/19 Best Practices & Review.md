---
tags:
  - review
  - architecture
  - best-practices
---

# 19 Best Practices & Review

## Strengths

- strong route and domain decomposition
- explicit shared runtime layer in `src/lib`
- multi-tenant model is visible and conceptually first-class
- broad provider/context structure is present
- Prisma schema is a strong source of truth for persistence
- admin, chatbot, and plugin concerns are separated enough to be navigable

## Risks / Watch Areas

### Documentation fragmentation

There are multiple overlapping sources of truth, and some are outdated.

See [[18 Documentation Drift & Gaps]].

### Large domain surface

The repository covers many product lines in one codebase:

- admin platform
- space-scoped app
- chatbot stack
- integrations
- reports/dashboards
- plugin ecosystem

That increases coordination and regression risk.

### Shared-style consistency risk

Theming and branding are powerful but easy to fragment if component code falls back to hardcoded colors or one-off patterns.

See [[05 Theme & Branding]].

### Auth and tenancy complexity

The combination of session state, SSO, role checks, and space-scoped authorization is a natural hotspot for subtle bugs.

See [[04 Authentication & Sessions]] and [[06 Spaces & Multi-Tenancy]].

## Best-Practice Recommendations

- keep `AGENTS.md` or a dedicated architecture note as the canonical current-state source
- reduce duplicated type ownership and centralize shared domain types
- keep auth/session and theme logic concentrated in a few trusted modules
- prefer versioned APIs for new routes
- keep doc notes tagged by “current”, “legacy”, and “planned” status if the vault grows further

## Review Interpretation

This is not a full code-quality audit of every feature file. It is a project-level architecture and maintainability review layer for the knowledge graph.
