import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAuthSecret } from '@/lib/auth-secret'

const PUBLIC_PATHS = [
  '/api/auth',
  '/api/system-settings',
  '/api/admin/branding',
  '/auth/signin',
  '/_next',
  '/favicon.ico',
]

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // LOGGING ONLY - NO REDIRECTS FOR NOW
  // This helps us break out of the sign-in loop and see if the dashboard works.
  
  const isPublic = PUBLIC_PATHS.some(path => pathname.startsWith(path)) || pathname.includes('.')
  
  if (isPublic) {
    return NextResponse.next()
  }

  try {
    const secret = getAuthSecret()
    const token = await getToken({
      req,
      secret,
      secureCookie: req.nextUrl.protocol === 'https:',
    })

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
    '/((?!.*\\.).*)',
  ],
}
