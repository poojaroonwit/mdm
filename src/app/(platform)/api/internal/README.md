# Internal API Routes

This directory contains internal APIs that are not meant for external consumption.

## Routes

- `automation/` - Automation and scheduling
- `scheduler/` - Unified scheduler
- `webhooks/` - Webhook handlers
- `sse/` - Server-sent events

## Access

These routes are typically:
- Called by internal services
- Used for background jobs
- Not exposed to external clients
- May require special authentication

