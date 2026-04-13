'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

const pathToTabMap: Record<string, string> = {
  '/data-management/space-selection': 'space-selection',
}

export default function DataManagementLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('space-selection')

  useEffect(() => {
    const tab = pathToTabMap[pathname || ''] || 'space-selection'
    setActiveTab(tab)
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigation is handled by the sidebar href
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {children}
    </PlatformLayout>
  )
}

