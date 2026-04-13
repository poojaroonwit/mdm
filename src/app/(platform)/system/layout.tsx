'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useState, useEffect } from 'react'

const pathToTabMap: Record<string, string> = {
  '/system/users': 'users',
  '/system/permission-tester': 'permission-tester',
  '/system/space-layouts': 'space-layouts',
  '/system/space-settings': 'space-settings',
  '/system/assets': 'assets',
  '/system/data': 'data',
  '/system/attachments': 'attachments',
  '/system/kernels': 'kernels',
  '/system/health': 'health',
  '/system/logs': 'logs',
  '/system/audit': 'audit',
  '/system/database': 'database',
  '/system/change-requests': 'change-requests',
  '/system/sql-linting': 'sql-linting',
  '/system/schema-migrations': 'schema-migrations',
  '/system/data-masking': 'data-masking',
  '/system/cache': 'cache',
  '/system/backup': 'backup',
  '/system/security': 'security',
  '/system/performance': 'performance',
  '/system/settings': 'settings',
  '/system/page-templates': 'page-templates',
  '/system/notifications': 'notifications',
  '/system/themes': 'themes',
  '/system/export': 'export',
  '/system/integrations': 'integrations',
  '/system/api': 'api',
}

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('users')

  useEffect(() => {
    if (pathname === '/system') {
      setActiveTab('system')
      return
    }
    const tab = pathToTabMap[pathname || ''] || 'users'
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

