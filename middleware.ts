import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const now = Math.floor(Date.now() / 1000)

    // Force sign-out if the JWT has expired
    if (token?.exp && (token.exp as number) < now) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    return NextResponse.next()
  },
  {
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
