# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev              # Start dev server (Next.js with webpack, 8GB heap)
npm run build            # Build for production (runs prisma generate first)
npm start                # Start production server

# Code quality
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all src files
npm run type-check       # TypeScript type check (no emit)

# Testing
npm test                 # Run Jest tests
npm run test:watch       # Jest in watch mode
npm run test:coverage    # Jest with coverage report
npx playwright test      # Run e2e tests

# Database
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Push schema to database
npm run seed             # Full DB reset + seed (destructive)

# Diagnostics
npm run scan:ts          # Scan for TypeScript errors
npm run scan:all         # Scan for all issues
```

Always use `--webpack` flag explicitly when running Next.js directly (Turbopack is disabled in this project).

## Architecture Overview

### Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript 5
- **Database**: PostgreSQL via Prisma 6 ORM
- **Auth**: NextAuth.js 4 (credentials + Google OAuth + Azure AD)
- **Storage**: MinIO (S3-compatible)
- **AI**: OpenAI API, @openai/chatkit-react, OpenAI Agent SDK, Dify integration
- **UI**: Tailwind CSS 4, Shadcn/UI, Radix UI, Lucide React
- **State**: TanStack React Query 5 (server state), React Context (app state)
- **Observability**: SigNoz + Langfuse (optional, fail-silently)

### Directory Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── admin/           # Admin panel (features + components)
│   ├── api/             # REST API endpoints (80+ endpoint groups)
│   │   ├── v1/          # Versioned API (preferred, migrate routes here)
│   │   ├── internal/    # Internal service endpoints
│   │   └── public/      # Unauthenticated endpoints
│   └── chat/[id]/       # Chat/widget interface
├── components/          # Shared UI components
│   ├── ui/              # Shadcn/UI primitives
│   └── layout/          # Sidebar, header, navigation
├── lib/                 # Core utilities
│   ├── db.ts            # Prisma client + raw query() helper
│   ├── auth.ts          # NextAuth configuration
│   ├── api-response.ts  # Standardized API response helpers
│   ├── api-permissions.ts # RBAC permission checking
│   └── api-middleware.ts # Common middleware
├── contexts/            # React context providers
├── hooks/               # Custom React hooks
└── types/               # Global TypeScript types
plugin-hub/              # Separate Next.js app for the plugin ecosystem
prisma/
└── schema.prisma        # Single source of truth for DB schema (100+ models)
```

### Database Patterns

The Prisma client is exported as both `db` and `prisma` (alias) from `src/lib/db.ts`.

For raw SQL queries, use the `query()` helper from `src/lib/db.ts`. **Critical pattern for UUID comparisons in raw SQL**:
```typescript
// CORRECT: Cast the column, not the parameter
WHERE id::text = $1

// WRONG: Prisma binds params as text, this fails
WHERE id = $1::uuid
```
Function indexes exist (migration 054) to maintain performance when casting columns to text.

The schema uses:
- UUID primary keys (database-generated)
- Soft deletes via `deletedAt` timestamp
- JSON columns for flexible data
- Cascade deletes for child records

### Two Data Modeling Systems

The app has two coexisting systems:
1. **DataModel/Attribute/DataRecord/DataRecordValue** – structured data models with defined attributes
2. **EAV System (EntityType/EavAttribute/EavEntity/EavValue)** – fully dynamic entity-attribute-value for arbitrary schemas

Both have full CRUD APIs. DataModel is more constrained; EAV is used for highly dynamic scenarios.

### API Routes Pattern

API routes live in `src/app/api/`. New routes should be added to `src/app/api/v1/` (the preferred versioned path). Old routes in the root `/api/` directory still work via the existing structure.

Standard response format using `src/lib/api-response.ts`:
```typescript
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from '@/lib/api-response'
// Returns: { success: true, data: ..., meta: { timestamp, pagination? } }
```

### Admin Section

The admin panel (`src/app/admin/`) is organized into **features** (business logic + UI) and **components** (shared admin UI):

- `features/analytics/` – dashboards, logs, performance monitoring
- `features/business-intelligence/` – BigQuery, AI analyst, merged BI reports
- `features/data/` – database management, SQL, data export/import, masking
- `features/data-governance/` – governance policies
- `features/security/` – security features
- `features/spaces/` – space management
- `features/storage/` – MinIO/cache management
- `features/users/` – user management
- `components/chatbot/` – full chatbot configuration UI (style configs, emulator, deployment)

### Chatbot & AI Architecture

Chatbots support multiple engines (configured per chatbot):
- **ChatKit** (`@openai/chatkit-react`) – widget-based with `ChatKitStyleConfig`
- **OpenAI direct** – standard API calls
- **OpenAI Agent SDK** – multi-agent orchestration with `ChatbotAgentLoopConfig`
- **Dify** – external AI platform

Chatbot configuration has a version system: draft configs save as `ChatbotVersion` records and get published separately. Style configurations are split into 20+ sections in `src/app/admin/components/chatbot/style/sections/`.

Chat widget is served at `src/app/chat/[id]/` (the `[id]` is the chatbot ID).

### Authentication Flow

NextAuth configured in `src/lib/auth.ts`. Key features:
- 2FA via TOTP (`twoFactorSecret` encrypted field)
- Account lockout (`failedLoginAttempts`, `lockoutUntil`)
- SSO config loaded from `platform_integrations` DB table (10-minute cache), falling back to env vars
- Session timeout pulled from system settings dynamically

### Multi-Tenancy (Spaces)

The platform is multi-tenant via **Spaces**. Most data is scoped to a space. Key models: `Space`, `SpaceMember`, `SpaceRole`. Features can be enabled/disabled per space (flags like `enableWorkflows`, `enableDashboard`).

### Plugin System

`plugin-hub/` is a **separate Next.js application** that hosts the plugin ecosystem. It is not bundled into the main build—it's a standalone service. The main app loads plugins dynamically via `external-plugin-loader.ts` (intentional dynamic requires, suppressed webpack warning).

### Build Notes

- Build uses webpack (not Turbopack): `--webpack` flag is set in npm scripts
- `NODE_OPTIONS=--max-old-space-size=8192` is set for both dev and build
- `typescript.ignoreBuildErrors: true` in next.config.js – TypeScript errors don't block build but are still reported
- `@openai/chatkit-react` is client-only; it's ignored on the server via webpack IgnorePlugin
- Heavy packages (`@prisma/client`, `openai`, `minio`, `@aws-sdk/*`, `langfuse`) are in `serverExternalPackages`
- Path alias `@/` maps to `src/`
