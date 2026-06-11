'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, usePathname } from 'next/navigation'
import { PlatformSidebar } from './PlatformSidebar'
import { TopMenuBar } from './TopMenuBar'
import { MobilePlatformNav } from './MobilePlatformNav'
import { Z_INDEX } from '@/lib/z-index'
import type { InfrastructureInstance } from '@/features/infrastructure/types'
import { useInfrastructureContext } from '@/contexts/infrastructure-context'
import { useSpace } from '@/contexts/space-context'
import { cn } from '@/lib/utils'
import { useMenuConfig } from '@/hooks/useMenuConfig'
import { getPlatformGroupForPath } from './platformSidebarModel'

const VMCredentialsCard = dynamic(
  () => import('@/components/infrastructure/VMCredentialsCard').then(mod => mod.VMCredentialsCard),
  { ssr: false }
)
const VMTerminal = dynamic(
  () => import('@/components/infrastructure/VMTerminal').then(mod => mod.VMTerminal),
  { ssr: false }
)
const EditVMDialog = dynamic(
  () => import('@/components/infrastructure/EditVMDialog').then(mod => mod.EditVMDialog),
  { ssr: false }
)
const InfrastructurePlaceholder = dynamic(
  () => import('@/components/infrastructure/InfrastructurePlaceholder').then(mod => mod.InfrastructurePlaceholder),
  { ssr: false }
)
const AddInstanceDialog = dynamic(
  () => import('@/features/infrastructure/components/AddInstanceDialog').then(mod => mod.AddInstanceDialog),
  { ssr: false }
)
const AddVMDialog = dynamic(
  () => import('@/features/infrastructure/components/AddVMDialog').then(mod => mod.AddVMDialog),
  { ssr: false }
)
const AddServiceDialog = dynamic(
  () => import('@/features/infrastructure/components/AddServiceDialog').then(mod => mod.AddServiceDialog),
  { ssr: false }
)
const SpaceSettingsSidebar = dynamic(
  () => import('@/components/space-management/SpaceSettingsSidebar').then(mod => mod.SpaceSettingsSidebar),
  { ssr: false }
)
const SpaceSidebar = dynamic(
  () => import('@/components/space-management/SpaceSidebar').then(mod => mod.SpaceSidebar),
  { ssr: false }
)
const ProjectManagementSidebar = dynamic(
  () => import('@/components/project-management/ProjectManagementSidebar').then(mod => mod.ProjectManagementSidebar),
  { ssr: false }
)

type BreadcrumbItem = string | { label: string; href?: string; onClick?: () => void }

interface PlatformLayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  breadcrumbItems?: BreadcrumbItem[]
  breadcrumbActions?: React.ReactNode
  showSpaceSettingsSidebar?: boolean
  spaceSettingsTab?: string
  onSpaceSettingsTabChange?: (tab: string) => void
  spaceSettingsSelectedSpaceId?: string
  onSpaceSettingsSpaceChange?: (spaceId: string) => void
  spaceSettingsSpaces?: Array<{ id: string; name: string; slug?: string }>
  showSpaceSidebar?: boolean
  spaceSidebarSpaceId?: string
  spaceSidebarSpaceSlug?: string
  spaceSidebarActivePageId?: string
  spaceSidebarEditMode?: boolean
  onSpaceSidebarPageChange?: (pageId: string) => void
  showProjectManagementSidebar?: boolean
  projectManagementProjectId?: string
}

const getFallbackGroupForTab = (tab: string, pathname?: string | null): string | null => {
  if (tab === 'infrastructure') return 'infrastructure'
  if (pathname?.startsWith('/system')) return 'system'
  if (pathname?.startsWith('/tools')) return 'tools'
  if (pathname?.startsWith('/infrastructure')) return 'infrastructure'

  const groupedTabs: Record<string, string[]> = {
    overview: ['overview', 'analytics', 'knowledge-base', 'projects'],
    tools: ['tools', 'project-management', 'bigquery', 'notebook', 'ai-analyst', 'ai-chat-ui', 'marketplace', 'bi', 'knowledge'],
    infrastructure: ['infra-instances', 'infra-monitoring', 'storage', 'database', 'cache', 'backup', 'logs', 'kernels'],
    system: ['system', 'users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'change-requests', 'audit', 'security', 'settings', 'page-templates', 'notifications', 'themes', 'integrations', 'api'],
    'data-management': ['space-selection', 'data', 'data-models', 'assets', 'attachments', 'import-export', 'data-governance', 'schema-migrations', 'sql-linting', 'data-masking', 'analytics']
  }

  for (const [group, tabs] of Object.entries(groupedTabs)) {
    if (tabs.includes(tab)) {
      return group
    }
  }
  return null
}

export function PlatformLayout({
  children,
  activeTab,
  onTabChange,
  selectedSpace,
  onSpaceChange,
  breadcrumbItems,
  breadcrumbActions,
  showSpaceSettingsSidebar = false,
  spaceSettingsTab,
  onSpaceSettingsTabChange,
  spaceSettingsSelectedSpaceId,
  onSpaceSettingsSpaceChange,
  spaceSettingsSpaces = [],
  showSpaceSidebar = false,
  spaceSidebarSpaceId,
  spaceSidebarSpaceSlug,
  spaceSidebarActivePageId,
  spaceSidebarEditMode = false,
  onSpaceSidebarPageChange,
  showProjectManagementSidebar = false,
  projectManagementProjectId,
}: PlatformLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const infrastructureContext = useInfrastructureContext()
  const { currentSpace, spaces } = useSpace()
  const { menuConfig } = useMenuConfig()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVmId, setSelectedVmId] = useState<string | null>(null)
  const [selectedVm, setSelectedVm] = useState<InfrastructureInstance | null>(null)
  const [vmCredentials, setVmCredentials] = useState<{ username: string; password: string } | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVm, setEditingVm] = useState<InfrastructureInstance | null>(null)

  const currentGroup = useMemo(() => {
    if (showSpaceSettingsSidebar || showProjectManagementSidebar) return null
    const fallbackGroup = getFallbackGroupForTab(activeTab, pathname)
    const routeGroup = getPlatformGroupForPath(menuConfig?.groups, pathname)

    if (fallbackGroup === 'data-management' && pathname?.startsWith('/admin')) {
      return fallbackGroup
    }

    return routeGroup || fallbackGroup
  }, [activeTab, menuConfig?.groups, pathname, showProjectManagementSidebar, showSpaceSettingsSidebar])

  const [selectedGroup, setSelectedGroup] = useState<string | null>(currentGroup)
  const isGroupManuallySelected = useRef(false)

  const displayGroup = useMemo(() => {
    if (showSpaceSettingsSidebar || showProjectManagementSidebar) return null
    if (activeTab === currentGroup) return null
    if (selectedGroup) return selectedGroup
    if (currentGroup) return currentGroup
    return null
  }, [selectedGroup, currentGroup, showProjectManagementSidebar, showSpaceSettingsSidebar, activeTab])

  const selectedSpaceInfo = useMemo(() => {
    const spaceId = spaceSidebarSpaceId || selectedSpace || currentSpace?.id
    if (!spaceId) return null
    const matchedSpace = spaces.find(space => space.id === spaceId || space.slug === spaceId)
    const resolvedSpace = matchedSpace || (currentSpace?.id === spaceId ? currentSpace : null)
    if (!resolvedSpace) return null

    return {
      name: resolvedSpace.name,
      logoUrl: resolvedSpace.logo_url || resolvedSpace.logoUrl || null,
    }
  }, [currentSpace, selectedSpace, spaceSidebarSpaceId, spaces])

  useEffect(() => {
    if (!isGroupManuallySelected.current) {
      if (showSpaceSettingsSidebar && selectedGroup !== 'data-management') {
        setSelectedGroup('data-management')
      } else if (showProjectManagementSidebar) {
        setSelectedGroup(null)
      } else if (!showSpaceSettingsSidebar && selectedGroup !== currentGroup) {
        setSelectedGroup(currentGroup)
      }
    } else {
      isGroupManuallySelected.current = false
    }
  }, [activeTab, currentGroup, selectedGroup, showProjectManagementSidebar, showSpaceSettingsSidebar])

  const handleGroupSelect = useCallback((group: string | null) => {
    isGroupManuallySelected.current = true
    setSelectedGroup(group)
  }, [])

  const handleToggleCollapse = useCallback(() => setSidebarCollapsed(prev => !prev), [])
  const handleToggleSecondaryCollapse = useCallback(() => setSecondarySidebarCollapsed(prev => !prev), [])

  const handleVmSelect = useCallback((vm: InfrastructureInstance) => {
    setSelectedVmId(vm.id)
    setSelectedVm(vm)
    const hasCredentials = vm.connectionConfig?.username && vm.connectionConfig?.password
    if (!hasCredentials) {
      setVmCredentials(null)
    } else if (vm.connectionConfig) {
      setVmCredentials({
        username: vm.connectionConfig.username,
        password: vm.connectionConfig.password,
      })
    }
  }, [])

  const handleVmAccess = useCallback((username: string, password: string) => {
    if (selectedVm) setVmCredentials({ username, password })
  }, [selectedVm])

  const handleVmPermission = useCallback((vm: InfrastructureInstance) => console.log('Permission for VM:', vm.id), [])

  const handleVmRemove = useCallback(async (vm: InfrastructureInstance) => {
    if (!confirm(`Are you sure you want to remove ${vm.name}?`)) return
    try {
      const response = await fetch(`/api/infrastructure/instances/${vm.id}`, { method: 'DELETE' })
      if (response.ok && selectedVmId === vm.id) {
        setSelectedVmId(null)
        setSelectedVm(null)
        setVmCredentials(null)
      }
    } catch (error) {
      console.error('Error removing VM:', error)
    }
  }, [selectedVmId])

  const handleVmReboot = useCallback(async (vm: InfrastructureInstance) => {
    if (!confirm(`Are you sure you want to reboot ${vm.name}?`)) return
    console.log('Reboot VM:', vm.id)
  }, [])

  const handleVmEdit = useCallback((vm: InfrastructureInstance) => {
    setEditingVm(vm)
    setShowEditDialog(true)
  }, [])

  const handleVmAccessClick = useCallback((vm: InfrastructureInstance) => handleVmSelect(vm), [handleVmSelect])

  const handleAddVm = useCallback(() => {
    if (infrastructureContext?.isProviderActive && infrastructureContext.setShowAddVmDialog) {
      infrastructureContext.setShowAddVmDialog(true)
    } else {
      router.push('/infrastructure')
    }
  }, [router, infrastructureContext])

  const handleAddService = useCallback(() => {
    if (infrastructureContext?.isProviderActive && infrastructureContext.setShowAddServiceDialog) {
      infrastructureContext.setShowAddServiceDialog(true)
    } else {
      router.push('/infrastructure')
    }
  }, [router, infrastructureContext])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
          e.preventDefault()
          if (showSpaceSettingsSidebar || showProjectManagementSidebar || (currentGroup && currentGroup !== '')) {
            setSecondarySidebarCollapsed(prev => !prev)
          }
        }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGroup, showProjectManagementSidebar, showSpaceSettingsSidebar])

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopMenuBar
        activeTab={activeTab}
        spaceName={selectedSpaceInfo?.name}
        spaceLogoUrl={selectedSpaceInfo?.logoUrl}
        showSpaceName={!!(((activeTab === 'space-selection' && selectedSpace) || activeTab === 'space-module' || showSpaceSidebar) && selectedSpaceInfo?.name)}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden flex-shrink-0 md:flex">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out flex-shrink-0 border-r border-sidebar-border",
              sidebarCollapsed ? 'w-16' : 'w-53'
            )}
            style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto' }}
            onMouseEnter={() => setSidebarCollapsed(false)}
            onMouseLeave={(e) => {
              const relatedTarget = e.relatedTarget
              if (relatedTarget && relatedTarget instanceof Element) {
                if (!relatedTarget.closest('[data-sidebar="secondary"]') && !relatedTarget.closest('.flex-shrink-0.border-r')) {
                  setSidebarCollapsed(true)
                }
              } else {
                setSidebarCollapsed(true)
              }
            }}
          >
            <PlatformSidebar
              activeTab={activeTab}
              onTabChange={onTabChange}
              selectedSpace={selectedSpace}
              onSpaceChange={onSpaceChange}
              collapsed={sidebarCollapsed}
              selectedGroup={selectedGroup}
              onGroupSelect={handleGroupSelect}
              mode="primary"
              onToggleCollapse={handleToggleCollapse}
            />
          </div>

          {showSpaceSidebar ? (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-53'
              )}
              style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto' }}
            >
              {!secondarySidebarCollapsed && spaceSidebarSpaceId && spaceSidebarSpaceSlug && (
                <div className="w-full h-full flex flex-col">
                  <SpaceSidebar
                    spaceId={spaceSidebarSpaceId}
                    spaceSlug={spaceSidebarSpaceSlug}
                    activePageId={spaceSidebarActivePageId}
                    editMode={spaceSidebarEditMode}
                    onPageChange={onSpaceSidebarPageChange}
                  />
                </div>
              )}
            </div>
          ) : showProjectManagementSidebar ? (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-53'
              )}
              style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)' }}
            >
              {!secondarySidebarCollapsed && (
                <div className="w-full h-full flex flex-col">
                  <ProjectManagementSidebar activeProjectId={projectManagementProjectId} />
                </div>
              )}
            </div>
          ) : showSpaceSettingsSidebar ? (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-53'
              )}
              style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)' }}
            >
              {!secondarySidebarCollapsed && spaceSettingsTab && onSpaceSettingsTabChange && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 overflow-hidden">
                    <SpaceSettingsSidebar
                      activeTab={spaceSettingsTab || 'details'}
                      onTabChange={onSpaceSettingsTabChange}
                      showSpaceSelector={true}
                      selectedSpaceId={spaceSettingsSelectedSpaceId}
                      onSpaceChange={onSpaceSettingsSpaceChange}
                      spaces={spaceSettingsSpaces}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : displayGroup && displayGroup !== '' && (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-53'
              )}
              style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)' }}
            >
              {!secondarySidebarCollapsed && (
                <PlatformSidebar
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  selectedSpace={selectedSpace}
                  onSpaceChange={onSpaceChange}
                  collapsed={false}
                  selectedGroup={displayGroup}
                  onGroupSelect={handleGroupSelect}
                  mode="secondary"
                  onToggleCollapse={handleToggleSecondaryCollapse}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedVmId={selectedVmId}
                  onVmSelect={handleVmSelect}
                  onVmPermission={handleVmPermission}
                  onVmRemove={handleVmRemove}
                  onVmReboot={handleVmReboot}
                  onVmEdit={handleVmEdit}
                  onVmAccess={handleVmAccessClick}
                  onAddVm={handleAddVm}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto relative bg-background text-foreground pb-24 md:pb-0">
            {selectedVm && activeTab === 'infrastructure' ? (
              vmCredentials ? (
                <VMTerminal
                  vm={selectedVm}
                  username={vmCredentials.username}
                  password={vmCredentials.password}
                  onClose={() => { setSelectedVm(null); setSelectedVmId(null); setVmCredentials(null); }}
                />
              ) : (
                <VMCredentialsCard
                  vm={selectedVm}
                  onAccess={handleVmAccess}
                  onCancel={() => { setSelectedVm(null); setSelectedVmId(null); setVmCredentials(null); }}
                />
              )
            ) : activeTab === 'infrastructure' ? (
              <InfrastructurePlaceholder onAddVm={handleAddVm} onAddService={handleAddService} />
            ) : (
              <div className="w-full mx-auto">
                {children}
              </div>
            )}
          </main>
        </div>
      </div>

      {!showSpaceSettingsSidebar && !showSpaceSidebar && !showProjectManagementSidebar && (
        <MobilePlatformNav
          activeTab={activeTab}
          selectedSpace={selectedSpace}
          onTabChange={onTabChange}
        />
      )}

      {/* Edit VM Dialog */}
      <EditVMDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        vm={editingVm}
        onSuccess={() => {}}
      />

      {infrastructureContext?.isProviderActive && (
        <>
          <AddInstanceDialog
            open={infrastructureContext.showAddDialog}
            onOpenChange={infrastructureContext.setShowAddDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {}}
          />
          <AddVMDialog
            open={infrastructureContext.showAddVmDialog}
            onOpenChange={infrastructureContext.setShowAddVmDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {}}
          />
          <AddServiceDialog
            open={infrastructureContext.showAddServiceDialog}
            onOpenChange={infrastructureContext.setShowAddServiceDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {}}
          />
        </>
      )}
    </div>
  )
}
