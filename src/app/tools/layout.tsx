'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect, useMemo } from 'react'
import { BreadcrumbActionsContext } from './hooks'

const pathToTabMap: Record<string, string> = {
  '/tools/bigquery': 'bigquery',
  '/tools/notebook': 'notebook',
  '/tools/ai-analyst': 'ai-analyst',
  '/tools/ai-chat-ui': 'ai-chat-ui',
  '/tools/projects': 'projects',
  '/tools/bi': 'bi',
  '/tools/storage': 'storage',
  '/tools/data-governance': 'data-governance',
  '/tools/api-client': 'api-client',
  '/tools/vector-store': 'vector-store', // Vector Store Management
}

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('bigquery')
  const [breadcrumbActions, setBreadcrumbActions] = useState<React.ReactNode>(null)

  useEffect(() => {
    if (pathname === '/tools') {
      setActiveTab('tools')
      setBreadcrumbActions(null)
      return
    }
    const tab = pathToTabMap[pathname || ''] || 'bigquery'
    setActiveTab(tab)
    // Clear breadcrumb actions when tab changes
    if (tab !== 'bigquery') {
      setBreadcrumbActions(null)
    }
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigation is handled by the sidebar href
  }

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({ setBreadcrumbActions }),
    [setBreadcrumbActions]
  )

  return (
    <BreadcrumbActionsContext.Provider value={contextValue}>
      <PlatformLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        breadcrumbActions={breadcrumbActions}
      >
        {children}
      </PlatformLayout>
    </BreadcrumbActionsContext.Provider>
  )
}

