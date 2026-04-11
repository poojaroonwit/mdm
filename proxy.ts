import { NextRequest, NextResponse } from 'next/server'
import { getToken, type JWT } from 'next-auth/jwt'
import { getAuthSecret, hasExplicitAuthSecret } from '@/lib/auth-secret'
import { addCorsHeaders, addSecurityHeaders, handleCors } from '@/lib/security-headers'
import { csrfMiddleware } from '@/lib/csrf'
import { rateLimit } from '@/lib/rate-limit'

const SESSION_COOKIE_CANDIDATES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  '__Secure-authjs.session-token',
  'authjs.session-token',
]

const PROTECTED_PREFIXES = [
  '/admin',
  '/overview',
  '/data-management',
  '/infrastructure',
  '/knowledge',
  '/marketplace',
  '/system',
  '/settings',
  '/profile',
]

const PAGE_PUBLIC_PREFIXES = [
  '/auth',
  '/chat',
  '/api',
  '/next-api',
  '/chat-api',
  '/_next',
  '/favicon',
  '/public',
  '/manifest',
]

const PUBLIC_API_PREFIXES = [
  '/chat-api/public',
  '/chat-api/embed',
  '/next-api/chatkit/session',
  '/api/public',
  '/api/embed',
  '/api/pwa',
]

function isApiRoute(pathname: string) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/next-api/') ||
    pathname.startsWith('/chat-api/')
  )
}

function isPublicApiRoute(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isProtectedPage(pathname: string) {
  if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  if (PAGE_PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return false
  }

  if (/^\/[^/]+\/auth\/signin(?:\/|$)/.test(pathname)) {
    return false
  }

  return true
}

function getAllowedOrigins() {
  const configuredOrigins = process.env.ALLOWED_ORIGINS
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return configuredOrigins && configuredOrigins.length > 0 ? configuredOrigins : '*'
}

async function readSessionToken(req: NextRequest): Promise<JWT | null> {
  const secret = getAuthSecret()
  if (!hasExplicitAuthSecret()) {
    console.warn('[proxy] No explicit auth secret is configured. Falling back to a non-production secret.')
  }

  const secureCookie = req.nextUrl.protocol === 'https:'

  for (const cookieName of SESSION_COOKIE_CANDIDATES) {
    const token = await getToken({
      req,
      secret,
      cookieName,
      secureCookie,
    })

    if (token) {
      return token
    }
  }

  return getToken({
    req,
    secret,
    secureCookie,
  })
}

function buildSignInRedirect(req: NextRequest) {
  const signInUrl = new URL('/auth/signin', req.url)
  const callbackPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
  signInUrl.searchParams.set('callbackUrl', callbackPath)
  return NextResponse.redirect(signInUrl)
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isApiRoute(pathname)) {
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || 'anonymous'
    const limit = rateLimit(ip, 1000)

    if (!limit.allowed) {
      return addSecurityHeaders(
        new NextResponse(
          JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        ),
        pathname
      )
    }

    const corsOptions = {
      origin: getAllowedOrigins(),
      credentials: true,
    }

    const corsResponse = handleCors(req, corsOptions)
    if (corsResponse) {
      return corsResponse
    }

    const csrfResponse = csrfMiddleware(req)
    if (csrfResponse) {
      return addSecurityHeaders(csrfResponse, pathname)
    }

    const token = await readSessionToken(req)
    if (!token && !isPublicApiRoute(pathname)) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        pathname
      )
    }

    if (typeof token?.exp === 'number' && token.exp < Math.floor(Date.now() / 1000)) {
      return addSecurityHeaders(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        pathname
      )
    }

    const response = NextResponse.next()
    addCorsHeaders(req, response, corsOptions)
    return addSecurityHeaders(response, pathname)
  }

  if (isProtectedPage(pathname)) {
    const token = await readSessionToken(req)
    const now = Math.floor(Date.now() / 1000)

    if (!token) {
      return buildSignInRedirect(req)
    }

    if (typeof token.exp === 'number' && token.exp < now) {
      return buildSignInRedirect(req)
    }
  }

  const response = NextResponse.next()

  if (pathname.startsWith('/chat/')) {
    response.headers.set('x-is-chat-route', '1')
  }

  return addSecurityHeaders(response, pathname)
}

export const proxyConfig = {
  matcher: [
    '/((?!api/auth|api/debug|auth/signin|[^/]+/auth/signin|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js)$).*)',
  ],
}
