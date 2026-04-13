# API v1 Routes

This directory contains versioned API routes for the stable API.

## Structure

Routes are organized by domain/feature:

- `data-models/` - Data model operations
- `entities/` - EAV entity operations
- `attributes/` - EAV attribute operations
- `values/` - EAV value operations
- `spaces/` - Space management
- `users/` - User management
- `notifications/` - Notifications
- `dashboards/` - Dashboard operations
- `workflows/` - Workflow operations
- `tickets/` - Ticket management
- `chatbots/` - Chatbot operations
- `notebooks/` - Notebook operations
- `files/` - File operations
- `folders/` - Folder operations
- `attachments/` - Attachment operations
- `import-export/` - Import/Export operations
- `templates/` - Template operations
- `roles/` - Role management
- `permissions/` - Permission checks
- `assignments/` - Assignment operations
- `invitations/` - Invitation operations
- `settings/` - Settings
- `health/` - Health check
- `realtime/` - Real-time updates

## Migration Status

Routes are being migrated incrementally from the root `/api/` directory.

## Usage

```typescript
// Old (still works via redirects)
fetch('/api/data-models')

// New (recommended)
fetch('/api/v1/data-models')
```

