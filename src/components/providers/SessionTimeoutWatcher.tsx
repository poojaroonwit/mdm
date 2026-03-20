'use client'

import { useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'

/**
 * Watches the NextAuth session expiry (session.exp) and forces a signOut
 * when the token expires, including when the tab was backgrounded and resumed.
 */
export function SessionTimeoutWatcher() {
  const { data: session, status } = useSession()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== 'authenticated' || !(session as any)?.exp) return

    const expMs = (session as any).exp * 1000
    const nowMs = Date.now()
    const msUntilExpiry = expMs - nowMs

    if (msUntilExpiry <= 0) {
      // Already expired
      signOut({ callbackUrl: '/auth/signin' })
      return
    }

    // Schedule sign-out at expiry
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      signOut({ callbackUrl: '/auth/signin' })
    }, msUntilExpiry)

    // Re-check when the tab regains focus (handles browser suspend/sleep)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && Date.now() >= expMs) {
        signOut({ callbackUrl: '/auth/signin' })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [session, status])

  return null
}
