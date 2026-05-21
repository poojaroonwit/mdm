---
tags:
  - features
  - marketplace
  - plugins
  - developer
---

# 42 Feature Map - Marketplace, Plugins & Developer Surfaces

## Main Areas

- routes:
  - `src/app/(platform)/marketplace`
  - `src/app/(platform)/marketplace/developer`
  - API groups:
    - `api/marketplace`
    - `api/plugins`
- components:
  - `src/features/marketplace`
  - `plugin-hub`

## Responsibilities

- plugin discovery
- installation and registration
- developer-facing plugin tooling
- ecosystem metadata

## Architectural Tension

Marketplace behavior spans both:

- the main app
- the separate [[11 Plugin Hub]]

This is powerful, but it increases the chance of product and documentation drift.

## Connected Notes

- [[11 Plugin Hub]]
- [[32 Integration Inventory]]
- [[37 ADR - Why Plugin Hub Is Separate]]
