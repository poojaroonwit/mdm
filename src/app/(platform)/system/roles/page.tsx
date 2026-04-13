'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RolesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the unified Users & Roles page
    router.replace('/system/users')
  }, [router])

  return null
}
