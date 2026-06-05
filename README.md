# Customer Data Management Platform

A configuration-first Unified Data Platform for managing spaces, dynamic data models, storage, reports, projects, plugins, and AI/chatbot experiences.

## Stack

- **Framework:** Next.js 16 App Router, React 19, TypeScript 5
- **Database:** PostgreSQL with Prisma 6 and selected raw SQL helpers
- **Auth:** NextAuth.js 4 with credentials, Google OAuth, Azure AD, 2FA, and account lockout
- **Storage:** MinIO and S3-compatible providers
- **AI:** OpenAI API, ChatKit, OpenAI Agent SDK, Dify integration
- **UI:** Tailwind CSS 4, local Shadcn/Radix-style primitives, Lucide React
- **Plugin ecosystem:** `plugin-hub/` as a separate app/service

## Quick Start

```bash
npm install
cp env.example .env.local
npm run dev
```

The app runs on the Next.js dev server with webpack. Turbopack is intentionally disabled.

## Common Commands

```bash
npm run dev              # Start local dev server
npm run build            # Generate Prisma client and build production app
npm start                # Start production server
npm run lint             # ESLint
npm run lint:fix         # ESLint autofix
npm run type-check       # TypeScript no-emit check
npm test                 # Jest tests
npx playwright test      # E2E tests
npx prisma generate      # Regenerate Prisma client
```

For direct Next.js commands, always pass `--webpack`.

## Project Structure

```text
src/
  app/
    (platform)/           Authenticated platform pages and API routes
    [space]/              Space-scoped runtime routes
    chat/[id]/            Public chatbot/widget runtime
  components/
    ui/                   Local UI primitives
    layout/               Shared layout/navigation
  features/               Feature packages shared outside route folders
  contexts/               React context providers
  hooks/                  Shared hooks
  lib/                    Core database, auth, API, AI, and integration utilities
  shared/                 Cross-feature server utilities
  types/                  Shared TypeScript contracts
plugin-hub/               Separate plugin ecosystem app/source tree
prisma/schema.prisma      Database schema and Prisma model source of truth
docs/                     Architecture and domain docs
scripts/                  Operational scripts
```

## Architecture Notes

The platform has two active dynamic modeling systems:

- `DataModel / Attribute / DataRecord / DataRecordValue`
- `EntityType / EavAttribute / EavEntity / EavValue`

New features should choose one explicitly and avoid introducing a third modeling pattern.

Most backend behavior lives in Next.js route handlers under `src/app/(platform)/api`. Prisma is preferred for schema-backed operations; the `query()` helper in `src/lib/db.ts` is used for dynamic or legacy SQL.

For UUID comparisons in raw SQL, cast the column:

```sql
WHERE id::text = $1
```

## Plugin Boundary

`plugin-hub/` is intended to be separate from the main app. Main-app routes should import plugin-backed UI through `src/features/plugin-adapters/`, while longer-term plugin work should move toward metadata/API/dynamic loading instead of source-level coupling.

## Documentation

- [High-Level Architecture](docs/HIGH_LEVEL_ARCHITECTURE.md)
- [Chat Embed Guide](docs/CHAT_EMBED_GUIDE.md)
- [Attributes](docs/attributes.md)
- [Entity Types](docs/entity-types.md)
- [Entities](docs/entities.md)
- [Values](docs/values.md)
- [Mobile Content API](docs/mobile-content-api.md)

## Verification

Run the full gate before merging broad refactors:

```bash
npm run lint
npm run type-check
npm run build
```

On Windows, if Prisma generation fails with `EPERM` while renaming `query_engine-windows.dll.node`, stop processes that may be holding the Prisma engine file and rerun the build.
