'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AdminPageRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Preserve query parameters when redirecting
    const params = searchParams?.toString()
    const redirectUrl = params ? `/?${params}` : '/'
    router.replace(redirectUrl)
  }, [router, searchParams])

  return null
}
