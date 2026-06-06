'use client'

import { useEffect, useState } from 'react'

export function useMobileViewport(breakpoint = 768) {
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileViewport(window.innerWidth < breakpoint)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [breakpoint])

  return isMobileViewport
}
