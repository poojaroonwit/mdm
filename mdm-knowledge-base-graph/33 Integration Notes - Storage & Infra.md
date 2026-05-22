---
tags:
  - integrations
  - storage
  - infra
---

# 33 Integration Notes - Storage & Infra

## Main Services

- MinIO / S3
- Redis
- Vault
- Kong
- Grafana
- Prometheus

## Main Code Anchors

- `src/lib/minio.ts`
- `src/lib/attachment-storage.ts`
- `src/lib/redis-client.ts`
- `src/lib/secrets-manager.ts`
- `src/lib/kong-client.ts`
- `src/lib/signoz-client.ts`

## Common Reasons To Visit This Note

- file upload/download failures
- stale cache behavior
- secret loading issues
- gateway/infra dashboard setup
- observability wiring

## Connected Notes

- [[12 Operations & Integrations]]
- [[31 Flow - Import Export and Background Jobs]]
