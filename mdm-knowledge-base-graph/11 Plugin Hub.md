---
tags:
  - plugins
  - ecosystem
  - separate-app
---

# 11 Plugin Hub

## Core Idea

`plugin-hub/` is a **separate Next.js application**, not just a folder inside the main app.

## Why This Matters

- separate build/runtime concerns
- separate type-check noise
- plugin marketplace and ecosystem logic lives outside the main shell
- the main app dynamically loads plugin-related functionality

## Main Relationship

- main app references plugin loading utilities in marketplace code
- plugin-hub acts as an ecosystem surface rather than a normal feature subfolder
- project-management ticket UI is loaded from `plugin-hub/plugins/project-management` while persisting through platform APIs

## Connected Notes

- [[09 Chatbot & AI]]
- [[12 Operations & Integrations]]
- [[13 Code Map]]
- [[50 Feature Map - Project Management Tickets]]
