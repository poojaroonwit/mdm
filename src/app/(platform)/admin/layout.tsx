'use client'

import { usePathname } from 'next/navigation'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { useMemo } from 'react'

// Map route paths to tab IDs
const getTabIdFromPath = (pathname: string): string => {
  if (!pathname) return 'overview'
  
  // Remove leading /admin/ and trailing /page or just /
  let path = pathname.replace(/^\/admin\//, '').replace(/\/$/, '')
  
  // If path is empty, 'admin', or still contains 'admin', return 'overview'
  if (!path || path === 'admin' || path.toLowerCase().includes('admin')) {
    return 'overview'
  }
  
  // Map paths to tab IDs
  const pathToTabMap: Record<string, string> = {
    'analytics': 'analytics',
    'bigquery': 'bigquery',
    'notebook': 'notebook',
    'ai-analyst': 'ai-analyst',
    'ai-chat-ui': 'ai-chat-ui',
    'knowledge-base': 'knowledge-base',
    'projects': 'projects',
    'storage': 'storage',
    'data-governance': 'data-governance',
    'users': 'users',
    'roles': 'roles',
    'permission-tester': 'permission-tester',
    'space-layouts': 'space-layouts',
    'space-settings': 'space-settings',
    'assets': 'assets',
    'data': 'data',
    'attachments': 'attachments',
    'kernels': 'kernels',
    'health': 'health',
    'logs': 'logs',
    'audit': 'audit',
    'database': 'database',
    'change-requests': 'change-requests',
    'sql-linting': 'sql-linting',
    'schema-migrations': 'schema-migrations',
    'data-masking': 'data-masking',
    'cache': 'cache',
    'backup': 'backup',
    'security': 'security',
    'performance': 'performance',
    'settings': 'settings',
    'page-templates': 'page-templates',
    'notifications': 'notifications',
    'export': 'export',
    'integrations': 'integrations',
    'api': 'api',
    'space-selection': 'space-selection',
  }
  
  return pathToTabMap[path] || 'overview'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Memoize activeTab calculation to avoid unnecessary re-renders
  const activeTab = useMemo(() => getTabIdFromPath(pathname || ''), [pathname])

  const handleTabChange = (tab: string) => {
    // Tab change is handled by navigation, no need for state update
  }

  return (
    <PlatformLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      selectedSpace={undefined}
      onSpaceChange={undefined}
    >
      {children}
    </PlatformLayout>
  )
}

