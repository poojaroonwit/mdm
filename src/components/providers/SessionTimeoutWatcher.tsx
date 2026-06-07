'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

/**
 * Watches the NextAuth session expiry (session.exp) and forces a signOut
 * when the token expires, including when the tab was backgrounded and resumed.
 */
export function SessionTimeoutWatcher() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (status !== 'authenticated' || !session?.exp) return

    const expMs = session.exp * 1000
    const nowMs = Date.now()
    const msUntilExpiry = expMs - nowMs
    const signInPath = pathname?.includes('/auth/signin') ? (pathname || '/auth/signin') : '/auth/signin'
    const callbackUrl = `${signInPath}?callbackUrl=${encodeURIComponent(pathname || '/')}&reason=session-expired`

    if (msUntilExpiry <= 0) {
      signOut({ callbackUrl })
      return
    }

    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl })
    }, msUntilExpiry)

    const validateExpiry = () => {
      if (Date.now() >= expMs) {
        signOut({ callbackUrl })
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        validateExpiry()
      }
    }

    window.addEventListener('focus', validateExpiry)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      window.removeEventListener('focus', validateExpiry)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [pathname, session, status])

  return null
}
