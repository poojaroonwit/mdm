---
tags:
  - ai
  - chatbot
  - agents
---

# 09 Chatbot & AI

## Core Concept

This project includes a substantial chatbot platform with multiple engine backends and a versioned configuration model.

## Main Areas

- widget and chat routes: `src/app/chat/[id]`
- admin chatbot builder UIs
- agent-loop and multi-agent utilities in `src/lib`
- integrations with OpenAI, ChatKit, and Dify

## Important Files and Folders

- `src/lib/agent-loop.ts`
- `src/lib/multi-agent.ts`
- `src/lib/openai-config.ts`
- `src/lib/chatbot-helper.ts`
- `src/lib/chatbot-access.ts`
- `src/app/chat/[id]`

## Chatbot Architecture

- chatbots can be space-scoped
- chatbot configs are versioned
- style configuration is extensive
- there are direct API, ChatKit, Agent SDK, and Dify pathways

## Related Notes

- [[07 Database & Prisma]]
- [[10 Admin Surface]]
- [[11 Plugin Hub]]
- [[12 Operations & Integrations]]
