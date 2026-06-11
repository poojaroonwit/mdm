'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'

const SIGN_OUT_EVENT = 'appkit:session-expired'

function getSessionExpiryMs(session: any): number | null {
  if (typeof session?.exp === 'number') {
    return session.exp * 1000
  }

  if (session?.expires) {
    const expiresMs = Date.parse(session.expires)
    return Number.isFinite(expiresMs) ? expiresMs : null
  }

  return null
}

/**
 * Watches the NextAuth session expiry (session.exp) and forces a signOut
 * when the token expires, including when the tab was backgrounded and resumed.
 */
export function SessionTimeoutWatcher() {
  const { data: session, status, update } = useSession()
  const pathname = usePathname()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSigningOutRef = useRef(false)

  const signOutExpiredSession = useCallback(() => {
    if (isSigningOutRef.current) return
    isSigningOutRef.current = true

    try {
      window.localStorage.setItem(SIGN_OUT_EVENT, String(Date.now()))
    } catch {
      // Storage can be unavailable in private or embedded contexts.
    }

    const currentPath = pathname || '/'
    const signInPath = /^\/[^/]+\/auth\/signin(?:\/|$)/.test(currentPath)
      ? currentPath
      : '/auth/signin'
    const callbackUrl = `${signInPath}?callbackUrl=${encodeURIComponent(currentPath)}&reason=session-expired`
    signOut({ callbackUrl })
  }, [pathname])

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (status !== 'authenticated') return

    const expMs = getSessionExpiryMs(session)
    if (!expMs) return

    const nowMs = Date.now()
    const msUntilExpiry = expMs - nowMs

    if (msUntilExpiry <= 0) {
      signOutExpiredSession()
      return
    }

    timerRef.current = setTimeout(() => {
      signOutExpiredSession()
    }, msUntilExpiry)

    const validateExpiry = async () => {
      try {
        await update()
      } catch {
        // If the refresh fails, still validate the local expiry below.
      }

      if (Date.now() >= expMs) {
        signOutExpiredSession()
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
  }, [session, signOutExpiredSession, status, update])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === SIGN_OUT_EVENT) {
        signOutExpiredSession()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [signOutExpiredSession])

  return null
}
