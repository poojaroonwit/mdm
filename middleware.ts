import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAuthSecret, hasExplicitAuthSecret } from '@/lib/auth-secret'

const SESSION_COOKIE_CANDIDATES = [
  '__Secure-next-auth.session-token',
  'next-auth.session-token',
  '__Secure-authjs.session-token',
  'authjs.session-token',
]

async function readSessionToken(req: NextRequest) {
  const secret = getAuthSecret()
  if (!hasExplicitAuthSecret()) {
    console.warn('[middleware] No explicit auth secret is configured. Falling back to a non-production secret.')
  }

  for (const cookieName of SESSION_COOKIE_CANDIDATES) {
    if (!req.cookies.get(cookieName)?.value) {
      continue
    }

    const token = await getToken({
      req,
      secret,
      cookieName,
    })

    if (token) {
      return token
    }
  }

  return await getToken({
    req,
    secret,
  })
}

function buildSignInRedirect(req: NextRequest) {
  const signInUrl = new URL('/auth/signin', req.url)
  const callbackPath = `${req.nextUrl.pathname}${req.nextUrl.search}`
  signInUrl.searchParams.set('callbackUrl', callbackPath)
  return NextResponse.redirect(signInUrl)
}

export default async function middleware(req: NextRequest) {
  const token = await readSessionToken(req)
  const now = Math.floor(Date.now() / 1000)

  if (!token) {
    return buildSignInRedirect(req)
  }

  if (typeof token.exp === 'number' && token.exp < now) {
    return buildSignInRedirect(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/overview/:path*',
    '/data-management/:path*',
    '/infrastructure/:path*',
    '/knowledge/:path*',
    '/marketplace/:path*',
    '/system/:path*',
    '/settings/:path*',
    '/profile/:path*',
    '/((?!auth|chat|api|_next|favicon|public|manifest).*)',
  ],
}
