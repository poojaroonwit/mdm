---
tags:
  - flow
  - ai
  - chatbot
---

# 30 Flow - Chatbot Request Lifecycle

## Typical Path

1. chat route loads under `src/app/chat/[id]`
2. chatbot configuration and versioned styling are resolved
3. engine choice is determined
4. conversation/thread state is loaded or created
5. request is sent through the appropriate backend path
6. responses stream back to the client
7. usage, limits, cost, retries, or hooks may be recorded

## Architectural Touchpoints

- chat route runtime -> [[01 Runtime & Entry Points]]
- UI/chat shell -> [[02 Frontend Shell]]
- chatbot domain and models -> [[23 Database Model Map - Identity, Spaces & Chatbots]]
- integrations and providers -> [[12 Operations & Integrations]]

## Common Failure Zones

- missing chatbot config
- invalid theme/style config
- engine mismatch
- auth/rate limit issues
- connector / hook failures
