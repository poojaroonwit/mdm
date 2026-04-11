'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { PlatformSidebar } from './PlatformSidebar'
import { TopMenuBar } from './TopMenuBar'
import { Z_INDEX } from '@/lib/z-index'
import { InfrastructureInstance } from '@/features/infrastructure/types'
import { VMCredentialsCard } from '@/components/infrastructure/VMCredentialsCard'
import { VMTerminal } from '@/components/infrastructure/VMTerminal'
import { EditVMDialog } from '@/components/infrastructure/EditVMDialog'
import { InfrastructurePlaceholder } from '@/components/infrastructure/InfrastructurePlaceholder'
import { AddInstanceDialog } from '@/features/infrastructure/components/AddInstanceDialog'
import { AddVMDialog } from '@/features/infrastructure/components/AddVMDialog'
import { AddServiceDialog } from '@/features/infrastructure/components/AddServiceDialog'
import { useInfrastructureContext } from '@/contexts/infrastructure-context'
import { useSpace } from '@/contexts/space-context'
import { cn } from '@/lib/utils'
import { SpaceSettingsSidebar } from '@/components/space-management/SpaceSettingsSidebar'
import { SpaceSidebar } from '@/components/space-management/SpaceSidebar'

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
}

const getGroupForTab = (tab: string): string | null => {
  if (tab === 'infrastructure') return 'infrastructure'

  const groupedTabs: Record<string, string[]> = {
    overview: ['overview', 'analytics', 'knowledge-base', 'projects'],
    tools: ['tools', 'bigquery', 'notebook', 'ai-analyst', 'ai-chat-ui', 'marketplace', 'bi', 'storage', 'data-governance'],
    system: ['system', 'users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'assets', 'data', 'attachments', 'kernels', 'logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup', 'security', 'performance', 'settings', 'page-templates', 'notifications', 'themes', 'integrations', 'api'],
    'data-management': ['space-selection']
  }

  for (const [group, tabs] of Object.entries(groupedTabs)) {
    if (tabs.includes(tab)) {
      if (group === 'data-management') return null
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
}: PlatformLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const infrastructureContext = useInfrastructureContext()
  const { currentSpace, spaces } = useSpace()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [secondarySidebarCollapsed, setSecondarySidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVmId, setSelectedVmId] = useState<string | null>(null)
  const [selectedVm, setSelectedVm] = useState<InfrastructureInstance | null>(null)
  const [vmCredentials, setVmCredentials] = useState<{ username: string; password: string } | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVm, setEditingVm] = useState<InfrastructureInstance | null>(null)

  const isDataManagementRoute = useMemo(() => pathname?.startsWith('/data-management') ?? false, [pathname])

  const currentGroup = useMemo(() => {
    if (showSpaceSettingsSidebar) return 'data-management'
    if (isDataManagementRoute) return null
    return getGroupForTab(activeTab)
  }, [activeTab, isDataManagementRoute, showSpaceSettingsSidebar])

  const [selectedGroup, setSelectedGroup] = useState<string | null>(currentGroup)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const isGroupManuallySelected = useRef(false)

  const displayGroup = useMemo(() => {
    if (showSpaceSettingsSidebar) return null
    if (hoveredGroup && hoveredGroup !== 'data-management') return hoveredGroup
    if (activeTab === currentGroup) return null
    if (selectedGroup && selectedGroup !== 'data-management') return selectedGroup
    if (currentGroup && currentGroup !== 'data-management') return currentGroup
    return null
  }, [hoveredGroup, selectedGroup, currentGroup, showSpaceSettingsSidebar, activeTab])

  useEffect(() => {
    if (!isGroupManuallySelected.current) {
      if (showSpaceSettingsSidebar && selectedGroup !== 'data-management') {
        setSelectedGroup('data-management')
      } else if (!showSpaceSettingsSidebar && selectedGroup !== currentGroup) {
        setSelectedGroup(currentGroup)
      }
    } else {
      isGroupManuallySelected.current = false
    }
  }, [activeTab, currentGroup, selectedGroup, showSpaceSettingsSidebar])

  const handleGroupSelect = useCallback((group: string | null) => {
    isGroupManuallySelected.current = true
    setSelectedGroup(group)
  }, [])

  const handleGroupHover = useCallback((group: string | null) => {
    if (group === 'data-management') {
      setHoveredGroup(null)
      return
    }
    setHoveredGroup(group)
  }, [])

  const handleGroupLeave = useCallback(() => setHoveredGroup(null), [])
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
        if (showSpaceSettingsSidebar || (currentGroup && currentGroup !== '')) {
          setSecondarySidebarCollapsed(prev => !prev)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGroup, showSpaceSettingsSidebar])

  return (
    <div className="flex flex-col h-screen bg-background">
      <TopMenuBar
        activeTab={activeTab}
        spaceName={
          ((activeTab === 'space-selection' && selectedSpace) || activeTab === 'space-module' || showSpaceSidebar) && (spaceSidebarSpaceId || selectedSpace)
            ? (currentSpace?.name || (selectedSpace && spaces.find(s => s.id === selectedSpace)?.name))
            : undefined
        }
        showSpaceName={!!(((activeTab === 'space-selection' && selectedSpace) || activeTab === 'space-module' || showSpaceSidebar) && (spaceSidebarSpaceId || selectedSpace))}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden flex-shrink-0 md:flex">
          <div
            className={cn(
              "transition-all duration-300 ease-in-out flex-shrink-0 border-r border-sidebar-border",
              sidebarCollapsed ? 'w-16' : 'w-52'
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
              onGroupHover={handleGroupHover}
              onGroupLeave={handleGroupLeave}
              mode="primary"
              onToggleCollapse={handleToggleCollapse}
            />
          </div>

          {showSpaceSidebar ? (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-56'
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
          ) : showSpaceSettingsSidebar ? (
            <div
              className={cn(
                "flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden border-r border-sidebar-border",
                secondarySidebarCollapsed ? 'w-0' : 'w-56'
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
                secondarySidebarCollapsed ? 'w-0' : 'w-56'
              )}
              style={{ position: 'relative', zIndex: Z_INDEX.sidebar, pointerEvents: 'auto', backgroundColor: 'var(--bg-surface)' }}
              onMouseEnter={() => displayGroup && setHoveredGroup(displayGroup)}
              onMouseLeave={() => selectedGroup !== displayGroup && handleGroupLeave()}
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
          <main className="flex-1 overflow-y-auto relative bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 pb-24 md:pb-0">
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
