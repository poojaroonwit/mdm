# Changelog

All notable changes to this project will be documented in this file.

## [1.0.5] - 2026-03-20 (patch 4)

### Fixed
- **Data Models API**: Fixed 500 error on `POST /api/data-models` — INSERT now includes `slug` (auto-generated from name, with uniqueness check) and `display_name` to satisfy NOT NULL DB constraints that were absent from the original query
- **Storage Browse API**: Fixed 500 error on `GET /api/storage/[id]/browse` — `params` is now correctly typed as `Promise<{ id: string }>` and awaited (Next.js 15 async params requirement)
- **Upload routes**: Wrapped `emulator-background`, `favicon`, `logo`, and `widget-avatar` upload handlers with try-catch for proper error propagation and logging

### Added
- **Space Settings — Login Page Customization**: The Login Page Customization card now displays the full URL of the space's login page as a clickable external link, making it easy to preview or share

### Changed
- **Project Management — Kanban board**: Moved "Configure Board" dialog from `ConfigurableKanbanBoard` into `TicketsList`; board config now includes `ticketDisplayMode` (modal/drawer) and per-field card visibility (`cardFields`) options
- **Project Management — Ticket detail**: `TicketDetailModalEnhanced` now supports a `displayMode` prop (`modal` | `drawer`) and initialises inline-edit state (`title`, `description`, `status`, `priority`, `dueDate`, `estimate`) from the ticket on open
- **Project Management — Ticket card**: `CardFields` type is now exported from `TicketCard` for use in board configuration
- **BI Reports — Create dashboard flow**: Two-step create dialog now fetches space pages in step 2, letting users pick an existing page or name a new one before creating the report
- **Role Management**: List items use bottom-dividers instead of full `border rounded` to eliminate the double-border appearance inside card containers
- **Attribute drawers** (`AttributeDetailDrawer`, `EnhancedAttributeDetailDrawer`): Removed hard-coded `p-6` padding from tab content panels — padding is now controlled by `CentralizedDrawer` via the `contentClassName` prop
- **CentralizedDrawer**: Added optional `contentClassName` prop to allow callers to customise content area padding
- **Prisma schema**: Added `WidgetConversation` model (`widget_conversations` table) with `sessionId`, `chatbotId`, `title`, `messages` JSON, and a composite index on `(session_id, chatbot_id)`; added `widgetConversations` relation to `Chatbot`

---

## [1.0.5] - 2026-03-20 (patch 3)

### Fixed
- **BI & Reports — Space selector**: Space selector now displays the space name instead of raw UUID on initial render before the spaces list has loaded

### Added
- **BI & Reports — Create dashboard flow**: "Create new building dashboard/report" now opens a two-step dialog:
  1. Select the target space
  2. Select an existing page from that space or create a new one with a custom name
  - On confirm, a new page is appended to the space's editor config if creating; a draft report (`is_active: false`) is created via `POST /api/reports` linked to the page; the user is navigated directly to `/{space}/studio/page/{pageId}?editMode=true`

---

## [1.0.5] - 2026-03-20

### Fixed
- **Chat widget popover**: Closing the popover no longer clears chat history — the container is now kept mounted after first open and animated in/out without destroying state
- **Chat widget greeting**: Greeting message is only injected once on first load instead of re-triggering on every open/close cycle
- **Embed iframe**: Fixed black/dark background in chat iframe on dark-themed host websites
- **Embed iframe**: Fixed 404 errors and consolidated middleware for iframe routes
- **Embed iframe**: Prevented dark iframe background via `enableColorScheme` and middleware color scheme enforcement
- Various embed, styles, and UI fixes
- **Admin API**: Fixed 404 on `/api/admin/log-stats`, `/api/admin/log-retention`, and `/api/admin/audit-logs`
- **Data Models API**: Fixed 400 error when calling `/api/data-models` without a `space_id` — now returns empty list instead of error when user has no default space
- **Folders API**: Fixed 400 error when calling `/api/folders` without `space_id` — parameter is now optional

### Added
- **Admin log stats route** (`/api/admin/log-stats`): New endpoint returning log statistics by level, service, and hour
- **Admin log retention route** (`/api/admin/log-retention`): New endpoint for managing log retention policies
- **Admin audit logs route** (`/api/admin/audit-logs`): New endpoint backed by real `audit_logs` database records
- **ChatKit metadata tracking**: Session requests to OpenAI ChatKit now include common metadata for analytics and traceability:
  - `chatbot_id` — internal chatbot identifier
  - `space_id` — tenant/space identifier
  - `deployment_type` — widget mode (`popover`, `fullpage`, `popup-center`)
  - `origin` — host website origin
  - `referrer` — page on the host site that triggered the chat
  - `ip` — real client IP extracted server-side from proxy headers (`CF-Connecting-IP` → `X-Real-IP` → `X-Forwarded-For`)
  - `user_agent` — browser user agent
  - `language` — browser locale (e.g. `th-TH`, `en-US`)
  - `timezone` — client timezone (e.g. `Asia/Bangkok`)
  - `platform` — platform identifier (`mdm`)

### Changed
- Removed temporary test route

---

## [1.0.5] - 2026-03-20 (patch 2)

### Fixed
- **Session timeout**: Expired JWT sessions now force immediate sign-out — added `SessionTimeoutWatcher` client component (fires `signOut()` at exact expiry, re-checks on browser resume via `visibilitychange`) and root Next.js `middleware.ts` to block expired sessions on page navigation
- **Chat widget history crash**: Fixed `Cannot read properties of undefined (reading 'map')` when `localStorage` contained chat history entries missing a `messages` field
- **Users & Roles UI**: Removed double-border (border-inside-border) on role list items and user group member items rendered inside shadcn `Card` components — items now use bottom-dividers or subtle backgrounds instead of redundant `border rounded`

### Added
- **Widget conversation persistence**: Chat history for the embeddable widget is now stored in the database (`widget_conversations` table) instead of `localStorage` — anonymous sessions identified by a `widget_session_id` UUID stored in `localStorage` (key only, no data)
- **`WidgetConversation` Prisma model**: New `widget_conversations` table with `sessionId`, `chatbotId`, `title`, `messages` (JSON), indexed by `[sessionId, chatbotId]`
- **Public conversation API routes** (no auth, CORS-enabled for cross-origin embeds):
  - `GET /api/public/chatbots/[chatbotId]/conversations?sessionId=xxx` — list conversations for session
  - `POST /api/public/chatbots/[chatbotId]/conversations` — create conversation
  - `PUT /api/public/chatbots/[chatbotId]/conversations/[conversationId]` — update title/messages (1 s debounce)
  - `DELETE /api/public/chatbots/[chatbotId]/conversations/[conversationId]` — delete conversation
- **Root middleware** (`middleware.ts`): Uses NextAuth `withAuth` to enforce valid session on all protected routes server-side; redirects to `/auth/signin` with `callbackUrl` if session is missing or expired
- **`SessionProvider`** now uses `refetchInterval={300}` and `refetchOnWindowFocus={true}` for proactive token re-validation every 5 minutes

---

## [1.0.4] - 2026-03-13

### Fixed
- Chat window box-shadow restored on inner container
- Popover container alignment and inner dimensions corrected
- Popover position misalignment caused by inner margin removed
- Icon picker: reset category to All when searching to prevent empty grid
- Icon picker: aligned border and UI with AppKit design pattern
- Auth: removed random secret fallback that invalidated sessions on hot reload

### Added
- Premium skeleton loading animations for all major route groups
- Marketplace: Is Compliance filter tag and card border indicator

### Changed
- Core UI components and platform layout refactored for AppKit visual parity
- Button styles, top bar branding, menu and SSO improvements
- Enhanced button shadows and improved icon button visibility in top bar
