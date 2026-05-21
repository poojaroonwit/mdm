---
tags:
  - ops
  - integrations
  - storage
  - observability
---

# 12 Operations & Integrations

## Cross-Cutting Services

- MinIO / S3-compatible storage
- email and SMTP
- Redis and caching
- observability hooks like Langfuse and SigNoz
- Jira, ServiceDesk, Grafana, Power BI, Looker Studio, Git integrations

## Important Code Zones

- `src/lib/minio.ts`
- `src/lib/attachment-storage.ts`
- `src/lib/notification-service.ts`
- `src/lib/langfuse.ts`
- `src/lib/signoz-client.ts`
- `src/lib/jira-service.ts`
- `src/lib/manageengine-servicedesk.ts`
- `src/lib/kong-client.ts`

## Runtime Areas Impacted

- API routes -> [[03 API & Route Layout]]
- admin configuration -> [[10 Admin Surface]]
- chatbots and agent integrations -> [[09 Chatbot & AI]]
- plugin and service ecosystem -> [[11 Plugin Hub]]
