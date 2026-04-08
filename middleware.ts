import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const now = Math.floor(Date.now() / 1000)

    console.log(`[middleware] Path: ${req.nextUrl.pathname}, Token: ${!!token}, Exp: ${token?.exp}`)
    if (token) {
      console.log(`[middleware] Token role: ${(token as any).role}, Is SuperAdmin: ${(token as any).isSuperAdmin}`)
    }

    // Force sign-out if the JWT has expired
    if (token?.exp && (token.exp as number) < now) {
      console.warn(`[middleware] Token expired at ${token.exp}, current time is ${now}. Redirecting to signin.`)
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  },
  {
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
      signIn: '/auth/signin',
    },
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

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
