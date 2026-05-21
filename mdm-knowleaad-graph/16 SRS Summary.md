---
tags:
  - srs
  - requirements
  - technical
---

# 16 SRS Summary

## Source

- `SRS.md`

## Product Functions Listed

- dashboard management
- customer management
- assignment system
- data model management
- import/export
- user management
- settings management
- audit trail

## Notable Non-Functional Requirements

- page loads within 2 seconds
- support up to 1000 concurrent users
- secure auth and encrypted transport
- responsive UI
- dark/light themes
- backup/recovery
- audit trail
- horizontal scalability

## Important Caveat

The SRS appears to reflect an earlier product snapshot and should not be treated as a fully accurate architecture document without cross-checking against [[17 Architecture Summary]] and [[18 Documentation Drift & Gaps]].

## Implementation Cross-Links

- [[01 Runtime & Entry Points]]
- [[03 API & Route Layout]]
- [[04 Authentication & Sessions]]
- [[07 Database & Prisma]]
- [[09 Chatbot & AI]]
