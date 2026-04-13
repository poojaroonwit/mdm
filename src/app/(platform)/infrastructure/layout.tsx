'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'
import { InfrastructureProvider } from '@/contexts/infrastructure-context'

const pathToTabMap: Record<string, string> = {
  '/infrastructure': 'infrastructure',
}

function InfrastructureLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('infrastructure')

  useEffect(() => {
    const tab = pathToTabMap[pathname || ''] || 'infrastructure'
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

export default function InfrastructureLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InfrastructureProvider>
      <InfrastructureLayoutContent>
        {children}
      </InfrastructureLayoutContent>
    </InfrastructureProvider>
  )
}

