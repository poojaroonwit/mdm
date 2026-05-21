---
tags:
  - auth
  - sessions
  - security
---

# 04 Authentication & Sessions

## Core Files

- `src/lib/auth.ts`
- `src/lib/sso.ts`
- `src/lib/identity-utils.ts`
- `src/app/(platform)/api/auth/[...nextauth]/route.ts`
- sign-in pages:
  - `src/app/(platform)/auth/signin/page.tsx`
  - `src/app/[space]/auth/signin/page.tsx`

## Auth Model

- Uses **NextAuth.js 4**
- Credentials provider plus SSO providers
- JWT session strategy
- session timeout comes from system settings
- 2FA and lockout logic are part of the auth layer

## Important Runtime Links

- mounted session provider in [[01 Runtime & Entry Points]]
- session-aware UI in [[02 Frontend Shell]]
- tenant-aware authorization in [[06 Spaces & Multi-Tenancy]]

## Current Architecture Topics

- sign-in UX has both platform and space-scoped variants
- session expiry must redirect back to sign-in
- SSO provider resolution is data-driven

## Related Notes

- [[06 Spaces & Multi-Tenancy]]
- [[10 Admin Surface]]
- [[12 Operations & Integrations]]
