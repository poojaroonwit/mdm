'use client'

import { useSpace } from '@/contexts/space-context'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { PlatformLayout } from '@/components/platform/PlatformLayout'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export default function SpaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const spaceSlug = params.space as string
  const { currentSpace, setCurrentSpace, spaces, isLoading } = useSpace()
  const [activeTab, setActiveTab] = useState('space-settings')
  // Initialize editMode from URL query parameter
  const editModeFromUrl = searchParams?.get('editMode') === 'true'
  const [editMode, setEditMode] = useState(editModeFromUrl)
  const isUpdatingUrlRef = useRef(false)

  // Sync editMode with URL query parameter on mount and when URL changes (but not when we update it)
  useEffect(() => {
    if (isUpdatingUrlRef.current) {
      isUpdatingUrlRef.current = false
      return
    }
    const editModeParam = searchParams?.get('editMode') === 'true'
    setEditMode(prev => {
      if (prev !== editModeParam) {
        return editModeParam
      }
      return prev
    })
  }, [searchParams])

  const isSpaceSettings = pathname?.includes('/settings')
  const isSpaceModule = pathname?.includes('/module')
  const fromDataManagement = searchParams?.get('from') === 'data-management'
  const fromSpaceSidebar = searchParams?.get('from') === 'space-sidebar'

  // Check if we're in a space context (any route under [space] except settings)
  // This includes /module, /page/[id], and any other space routes
  const isInSpaceContext = !isSpaceSettings && spaceSlug && pathname && (
    pathname.includes(`/${spaceSlug}/module`) ||
    pathname.includes(`/${spaceSlug}/page/`) ||
    (pathname.startsWith(`/${spaceSlug}/`) && !pathname.includes('/settings'))
  )

  // Update URL when editMode changes (only for space context pages)
  useEffect(() => {
    if ((isInSpaceContext || isSpaceModule) && pathname) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      const currentEditMode = params.get('editMode') === 'true'
      if (editMode && !currentEditMode) {
        isUpdatingUrlRef.current = true
        params.set('editMode', 'true')
        const newUrl = `${pathname}?${params.toString()}`
        router.replace(newUrl, { scroll: false })
      } else if (!editMode && currentEditMode) {
        isUpdatingUrlRef.current = true
        params.delete('editMode')
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
        router.replace(newUrl, { scroll: false })
      }
    }
  }, [editMode, isInSpaceContext, isSpaceModule, pathname, searchParams, router])

  // Set the current space based on the URL parameter
  useEffect(() => {
    if (spaceSlug && spaces.length > 0) {
      const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
      if (space && space.id !== currentSpace?.id) {
        setCurrentSpace(space)
      }
    }
  }, [spaceSlug, spaces, setCurrentSpace])

  // Also handle the case where we need to refresh spaces if currentSpace is null
  useEffect(() => {
    if (!currentSpace && spaces.length > 0 && spaceSlug) {
      const space = spaces.find(s => s.slug === spaceSlug || s.id === spaceSlug)
      if (space) {
        setCurrentSpace(space)
      }
    }
  }, [currentSpace, spaces, spaceSlug, setCurrentSpace])

  // Update URL when editMode changes (only for space context pages)
  useEffect(() => {
    if ((isInSpaceContext || isSpaceModule) && pathname) {
      const params = new URLSearchParams(searchParams?.toString() || '')
      const currentEditMode = params.get('editMode') === 'true'
      if (editMode && !currentEditMode) {
        params.set('editMode', 'true')
        const newUrl = `${pathname}?${params.toString()}`
        router.replace(newUrl, { scroll: false })
      } else if (!editMode && currentEditMode) {
        params.delete('editMode')
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
        router.replace(newUrl, { scroll: false })
      }
    }
  }, [editMode, isInSpaceContext, isSpaceModule, pathname, searchParams, router])

  // Map tab IDs to their new route paths
  const getRouteForTab = (tab: string): string => {
    const spaceBase = `/${currentSpace?.slug || currentSpace?.id || spaceSlug}`
    const routeMap: Record<string, string> = {
      'overview': '/',
      'bigquery': '/tools/bigquery',
      'notebook': '/tools/notebook',
      'ai-analyst': '/tools/ai-analyst',
      'ai-chat-ui': '/tools/ai-chat-ui',
      'knowledge-base': `${spaceBase}/knowledge`,
      'marketplace': '/marketplace',
      'infrastructure': '/infrastructure',
      'projects': '/tools/projects',
      'bi': '/tools/bi',
      'storage': '/tools/storage',
      'data-governance': '/tools/data-governance',
      'users': '/system/users',
      'roles': '/system/roles',
      'permission-tester': '/system/permission-tester',
      'space-layouts': '/system/space-layouts',
      'space-settings': '/system/space-settings',
      'assets': '/system/assets',
      'data': '/system/data',
      'attachments': '/system/attachments',
      'kernels': '/system/kernels',
      'health': '/system/health',
      'logs': '/system/logs',
      'audit': '/system/audit',
      'database': '/system/database',
      'change-requests': '/system/change-requests',
      'sql-linting': '/system/sql-linting',
      'schema-migrations': '/system/schema-migrations',
      'data-masking': '/system/data-masking',
      'cache': '/system/cache',
      'backup': '/system/backup',
      'security': '/system/security',
      'performance': '/system/performance',
      'settings': '/system/settings',
      'page-templates': '/system/page-templates',
      'notifications': '/system/notifications',
      'themes': '/system/themes',
      'api': '/system/api',
      'space-selection': '/data-management/space-selection',
    }
    return routeMap[tab] || '/'
  }

  useEffect(() => {
    if (!pathname) return

    if (pathname.includes('/knowledge')) {
      setActiveTab('knowledge-base')
      return
    }

    if (pathname.includes('/module') || pathname.includes('/page/')) {
      setActiveTab('space-module')
      return
    }

    if (pathname.includes('/settings')) {
      setActiveTab('space-settings')
    }
  }, [pathname])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // Navigate to new route structure when clicking other tabs
    if (tab !== 'space-settings') {
      const route = getRouteForTab(tab)
      router.push(route)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space...</p>
        </div>
      </div>
    )
  }

  if (!currentSpace) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Space Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The space you're looking for doesn't exist or you don't have access to it.
          </p>
          <a
            href="/spaces"
            className="text-primary hover:underline"
          >
            ← Back to Spaces
          </a>
        </div>
      </div>
    )
  }

  // For space module page and other space pages, use PlatformLayout with SpaceSidebar
  if (isInSpaceContext || isSpaceModule) {
    return (
      <PlatformLayout
        activeTab="space-module"
        onTabChange={handleTabChange}
        selectedSpace={currentSpace?.id}
        onSpaceChange={(spaceId) => {
          const space = spaces.find(s => s.id === spaceId)
          if (space) {
            router.push(`/${space.slug || space.id}/module`)
          }
        }}
        breadcrumbItems={[
          { label: 'Unified Data Platform', href: '/' },
          { label: currentSpace?.name || 'Space', href: `/${spaceSlug}/module` }
        ]}
        breadcrumbActions={
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={setEditMode}
            />
            <Label htmlFor="edit-mode" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
              Edit Mode
            </Label>
          </div>
        }
        showSpaceSidebar={true}
        spaceSidebarSpaceId={currentSpace?.id}
        spaceSidebarSpaceSlug={spaceSlug}
        spaceSidebarActivePageId={undefined}
        spaceSidebarEditMode={editMode || false}
        onSpaceSidebarPageChange={(pageId) => {
          // Navigation handled by SpaceSidebar component
        }}
      >
        {children}
      </PlatformLayout>
    )
  }

  // For space settings, use PlatformLayout to show platform sidebar
  if (isSpaceSettings) {
    const tabForLayout = fromDataManagement ? 'space-selection' : activeTab

    return (
      <PlatformLayout
        activeTab={tabForLayout}
        onTabChange={handleTabChange}
        selectedSpace={currentSpace?.id}
        onSpaceChange={(spaceId) => {
          const space = spaces.find(s => s.id === spaceId)
          if (space) {
            const preserveFromParam = fromDataManagement ? '?from=data-management' : ''
            router.push(`/${space.slug || space.id}/settings${preserveFromParam}`)
          }
        }}
        breadcrumbItems={[
          { label: 'Unified Data Platform', href: '/' },
          fromDataManagement
            ? { label: 'Data Management', href: '/data-management/space-selection' }
            : { label: 'System', href: '/system/space-settings' },
          { label: 'Space Settings', href: `/${spaceSlug}/settings${(fromDataManagement || fromSpaceSidebar) ? `?from=${fromDataManagement ? 'data-management' : 'space-sidebar'}` : ''}` },
          currentSpace?.name || ''
        ]}
        breadcrumbActions={
          <div className="flex items-center gap-2">
            <Switch
              id="edit-mode"
              checked={editMode}
              onCheckedChange={setEditMode}
            />
            <Label htmlFor="edit-mode" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
              Edit Mode
            </Label>
          </div>
        }
        showSpaceSettingsSidebar={fromDataManagement}
        showSpaceSidebar={fromSpaceSidebar}
        spaceSidebarSpaceId={fromSpaceSidebar ? currentSpace?.id : undefined}
        spaceSidebarSpaceSlug={fromSpaceSidebar ? spaceSlug : undefined}
        spaceSidebarActivePageId={undefined}
        spaceSidebarEditMode={fromSpaceSidebar ? (editMode || false) : false}
        onSpaceSidebarPageChange={(pageId) => {
          // Navigation handled by SpaceSidebar component
        }}
        spaceSettingsTab={searchParams?.get('tab') || 'details'}
        onSpaceSettingsTabChange={(tab) => {
          const params = new URLSearchParams(searchParams?.toString() || '')
          params.set('tab', tab)
          if (fromDataManagement) {
            params.set('from', 'data-management')
          }
          router.push(`/${spaceSlug}/settings?${params.toString()}`)
        }}
        spaceSettingsSelectedSpaceId={currentSpace?.id}
        onSpaceSettingsSpaceChange={(spaceId) => {
          const space = spaces.find(s => s.id === spaceId)
          if (space) {
            const params = new URLSearchParams(searchParams?.toString() || '')
            if (fromDataManagement) {
              params.set('from', 'data-management')
            } else if (fromSpaceSidebar) {
              params.set('from', 'space-sidebar')
            }
            // Preserve the current tab when switching spaces
            const currentTab = searchParams?.get('tab') || 'details'
            if (currentTab) {
              params.set('tab', currentTab)
            }
            // If on layout page, go to layout page, otherwise go to settings page
            if (pathname?.includes('/settings/layout')) {
              router.push(`/${space.slug || space.id}/settings/layout?${params.toString()}`)
            } else {
              router.push(`/${space.slug || space.id}/settings?${params.toString()}`)
            }
          }
        }}
        spaceSettingsSpaces={spaces}
      >
        {children}
      </PlatformLayout>
    )
  }

  return (
    <MainLayout contentClassName={isSpaceSettings ? 'p-0' : undefined}>
      {children}
    </MainLayout>
  )
}
