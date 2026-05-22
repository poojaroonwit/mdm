---
tags:
  - database
  - models
  - identity
  - spaces
  - chatbots
---

# 23 Database Model Map - Identity, Spaces & Chatbots

## Identity Cluster

- `User`
- `UserGroup`
- `UserGroupMember`
- `UserSession`

## Space / Tenancy Cluster

- `Space`
- `SpaceMember`

## Chatbot Cluster

- `Chatbot`
- `ChatbotVersion`
- `ChatbotRateLimit`
- `ChatbotCacheConfig`
- `ChatbotRetryConfig`
- `ChatbotCostBudget`
- `ChatbotCostRecord`
- `ChatbotWebhook`
- `ChatbotPerformanceMetric`
- `ChatbotCustomFunction`
- `ChatbotMultiAgentConfig`
- `ChatbotLifecycleHook`
- `ChatbotConnector`
- `ChatbotAgentLoopConfig`

## Why This Map Matters

This cluster explains how:

- users authenticate
- users are attached to tenant boundaries
- chatbots become configurable, versioned, and operationalized runtime entities

## Connected Notes

- [[04 Authentication & Sessions]]
- [[06 Spaces & Multi-Tenancy]]
- [[09 Chatbot & AI]]
- [[30 Flow - Chatbot Request Lifecycle]]
