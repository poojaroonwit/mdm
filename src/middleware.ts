import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Signal to the root layout that we're on a chat route so it can force
  // light theme in next-themes' blocking script (preventing dark iframe flash).
  if (pathname.startsWith('/chat/')) {
    response.headers.set('x-is-chat-route', '1')
  }

  return response
}

export const config = {
  // Run on all routes except Next.js internals and static files
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
