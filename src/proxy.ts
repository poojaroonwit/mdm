import { withAuth } from "next-auth/middleware"
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { addSecurityHeaders, handleCors, addCorsHeaders } from '@/lib/security-headers'
import { rateLimit } from '@/lib/rate-limit'
import { csrfMiddleware } from '@/lib/csrf'

export default withAuth(
  function proxy(req: NextRequest & { nextauth: { token: any } }) {
    const path = req.nextUrl.pathname

    // Handle CORS and Rate Limiting for API routes
    if (path.startsWith('/api/') || path.startsWith('/next-api/') || path.startsWith('/chat-api/')) {
      // Rate limiting (1000 requests per minute per IP)
      const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'anonymous'
      const limit = rateLimit(ip, 1000)

      if (!limit.allowed) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const corsResponse = handleCors(req, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      })

      if (corsResponse) {
        return corsResponse
      }

      // CSRF Protection for state-changing operations
      const csrfResponse = csrfMiddleware(req)
      if (csrfResponse) {
        return csrfResponse
      }
    }

    // Create response
    const response = NextResponse.next()

    // Signal to the root layout that we're on a chat route so it can force
    // light theme in next-themes' blocking script (preventing dark iframe flash).
    if (path.startsWith('/chat/')) {
      response.headers.set('x-is-chat-route', '1')
    }

    // Add CORS headers to all API responses (not just preflight)
    if (path.startsWith('/api/') || path.startsWith('/chat-api/')) {
      addCorsHeaders(req, response, {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true,
      })
    }

    // Add security headers to all responses with route-specific CSP
    return addSecurityHeaders(response, path)
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname

        // Allow public routes that need headers but no auth
        // These routes are used by the chatbot embed and need to be accessible
        // without authentication when embedded on external websites
        if (
          path.startsWith('/chat') ||
          path.startsWith('/chat-api/public') ||
          path.startsWith('/chat-api/embed') ||
          path.startsWith('/next-api/chatkit/session') ||
          path.startsWith('/api/public') ||
          path.startsWith('/api/embed') ||
          path.startsWith('/api/pwa')
        ) {
          return true
        }

        if (!token) return false
        const exp = (token as any).exp as number | undefined
        if (!exp) return true // fallback: if no exp set, allow (legacy sessions)
        const now = Math.floor(Date.now() / 1000)
        return exp > now
      }
    },
  }
)

export const config = {
  matcher: [
    // Protect all routes except auth, API debug, static files, and sign-in page
    // Note: We include chat and public APIs here so headers are applied, but authorized callback allows them
    '/((?!api/auth|api/debug|auth/signin|[^/]+/auth/signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js)$).*)',
  ],
}

