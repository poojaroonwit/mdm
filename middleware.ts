import { NextRequest, NextResponse } from 'next/server'
import { getToken, type JWT } from 'next-auth/jwt'
import { getAuthSecret } from '@/lib/auth-secret'

const SESSION_COOKIE_CANDIDATES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  '__Secure-authjs.session-token',
  'authjs.session-token',
]

const PUBLIC_PATHS = [
  '/api/auth',
  '/api/public',
  '/api/embed',
  '/api/pwa',
  '/api/system-settings',
  '/api/admin/branding',
  '/chat-api/public',
  '/chat-api/embed',
  '/next-api/chatkit/session',
  '/auth/signin',
  '/chat',
  '/_next',
  '/favicon.ico',
  '/favicon.svg',
]

const PROTECTED_PAGE_PREFIXES = [
  '/admin',
  '/overview',
  '/data-management',
  '/infrastructure',
  '/knowledge',
  '/marketplace',
  '/system',
  '/settings',
  '/profile',
  '/spaces',
  '/tools',
  '/workflows',
  '/assignments',
  '/customers',
  '/dashboard',
  '/data',
  '/export-profiles',
  '/import-profiles',
  '/notifications',
  '/user-roles',
]

function isApiRoute(pathname: string) {
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/next-api/') ||
    pathname.startsWith('/chat-api/')
  )
}

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`)) || pathname.includes('.')
}

function isProtectedPage(pathname: string) {
  if (PROTECTED_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  if (isPublicPath(pathname) || /^\/[^/]+\/auth\/signin(?:\/|$)/.test(pathname)) {
    return false
  }

  return !isApiRoute(pathname)
}

function isExpired(token: JWT | string | null) {
  if (!token || typeof token === 'string') return true
  return typeof token?.exp === 'number' && token.exp <= Math.floor(Date.now() / 1000)
}

async function readSessionToken(req: NextRequest) {
  const secret = getAuthSecret()
  const secureCookie = req.nextUrl.protocol === 'https:'

  for (const cookieName of SESSION_COOKIE_CANDIDATES) {
    const token = await getToken({
      req,
      secret,
      cookieName,
      secureCookie,
    })

    if (token) return token
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
  signInUrl.searchParams.set('reason', 'session-expired')
  return NextResponse.redirect(signInUrl)
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  try {
    const token = await readSessionToken(req)

    if (isApiRoute(pathname)) {
      if (!token || isExpired(token)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return NextResponse.next()
    }

    if (isProtectedPage(pathname) && (!token || isExpired(token))) {
      return buildSignInRedirect(req)
    }

    if (token) {
      console.log(`[middleware] Path: ${pathname} | User: ${token.email} | Role: ${token.role}`)
    } else {
      console.log(`[middleware] Path: ${pathname} | NO SESSION (Redirect disabled)`)
    }
  } catch (error) {
    console.error('[middleware] Token error:', error)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html|js|css|map|txt|ico)$).*)',
  ],
}
