'use client'

import { useState, useEffect, useRef, Fragment, useMemo, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
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

// Determine which group the active tab belongs to
const getGroupForTab = (tab: string): string | null => {
  // Infrastructure has its own group
  if (tab === 'infrastructure') {
    return 'infrastructure'
  }

  const groupedTabs: Record<string, string[]> = {
    overview: ['overview', 'analytics', 'knowledge-base', 'projects'],
    tools: ['tools', 'bigquery', 'notebook', 'ai-analyst', 'ai-chat-ui', 'marketplace', 'bi', 'storage', 'data-governance'],
    system: ['system', 'users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'assets', 'data', 'attachments', 'kernels', 'logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup', 'security', 'performance', 'settings', 'page-templates', 'notifications', 'themes', 'integrations', 'api'],
    'data-management': ['space-selection']
  }

  for (const [group, tabs] of Object.entries(groupedTabs)) {
    if (tabs.includes(tab)) {
      // Data Management has no secondary sidebar
      if (group === 'data-management') {
        return null
      }
      return group
    }
  }
  return null
}

// Generate breadcrumb items based on group structure
const generateBreadcrumbs = (activeTab: string): BreadcrumbItem[] => {
  const groupMetadata: Record<string, { name: string }> = {
    overview: { name: 'Homepage' },
    tools: { name: 'Tools' },
    infrastructure: { name: 'Infrastructure' },
    system: { name: 'System' },
    'data-management': { name: 'Data Management' }
  }

  const toolSections: Record<string, string[]> = {
    'AI & Assistants': ['ai-analyst', 'ai-chat-ui'],
    'Data Tools': ['bigquery', 'notebook', 'storage', 'data-governance'],
    'Platform Services': ['marketplace', 'infrastructure'],
    'Reporting': ['bi']
  }

  const groupSections: Record<string, string[]> = {
    management: ['users', 'roles', 'permission-tester', 'space-layouts', 'space-settings', 'assets', 'data', 'attachments'],
    kernels: ['kernels'],
    system: ['logs', 'audit', 'database', 'change-requests', 'sql-linting', 'schema-migrations', 'data-masking', 'cache', 'backup'],
    security: ['security', 'performance'],
    integrations: ['settings', 'page-templates', 'notifications', 'themes']
  }

  const tabNames: Record<string, string> = {
    'overview': 'Overview',
    'analytics': 'Analytics',
    'bigquery': 'SQL Query',
    'notebook': 'Data Science',
    'ai-analyst': 'Chat with AI',
    'ai-chat-ui': 'Agent Embed GUI',
    'knowledge-base': 'Knowledge Base',
    'marketplace': 'Marketplace',
    'infrastructure': 'Infrastructure',
    'projects': 'Project Management',
    'bi': 'BI & Reports',
    'storage': 'Storage',
    'data-governance': 'Data Governance',
    'users': 'Users',
    'roles': 'Roles',
    'permission-tester': 'Permission Tester',
    'space-layouts': 'Space Layouts',
    'space-settings': 'Space Settings',
    'assets': 'Asset Management',
    'data': 'Data Models',
    'attachments': 'Attachments',
    'logs': 'Logs',
    'audit': 'Audit Logs',
    'database': 'Database',
    'change-requests': 'Change Requests',
    'sql-linting': 'SQL Linting',
    'schema-migrations': 'Schema Migrations',
    'data-masking': 'Data Masking',
    'cache': 'Cache',
    'backup': 'Backup & Recovery',
    'security': 'Security',
    'performance': 'Performance',
    'settings': 'System Settings',
    'page-templates': 'Page Templates',
    'notifications': 'Notifications',
    'themes': 'Theme & Branding',
    'integrations': 'Integrations',
    'api': 'API Management',
    'space-selection': 'Data Management'
  }

  const group = getGroupForTab(activeTab)
  const breadcrumbs: BreadcrumbItem[] = []

  // If no group found or activeTab is invalid, return empty breadcrumbs
  if (!group || !activeTab || activeTab === 'admin') {
    return breadcrumbs
  }

  // Add group name
  if (groupMetadata[group]) {
    breadcrumbs.push({
      label: groupMetadata[group].name,
      href: undefined
    })
  }

  // Find section for tools group
  if (group === 'tools') {
    for (const [sectionName, tabIds] of Object.entries(toolSections)) {
      if (tabIds.includes(activeTab)) {
        breadcrumbs.push({
          label: sectionName,
          href: undefined
        })
        break
      }
    }
  }

  // Find section for system group
  if (group === 'system') {
    for (const [sectionName, tabIds] of Object.entries(groupSections)) {
      if (tabIds.includes(activeTab)) {
        const sectionLabel = sectionName.charAt(0).toUpperCase() + sectionName.slice(1)
        breadcrumbs.push({
          label: sectionLabel,
          href: undefined
        })
        break
      }
    }
  }

  // Add tab name
  const tabName = tabNames[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
  breadcrumbs.push({
    label: tabName,
    href: undefined
  })

  return breadcrumbs
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

  // Check if we're on a data-management route
  const isDataManagementRoute = useMemo(() => {
    return pathname?.startsWith('/data-management') ?? false
  }, [pathname])

  // Memoize group calculation to avoid unnecessary recalculations
  const currentGroup = useMemo(() => {
    // If showing space settings sidebar from data management, return 'data-management' to show it as selected
    if (showSpaceSettingsSidebar) {
      return 'data-management'
    }
    // If on data-management route, always return null to hide secondary sidebar
    if (isDataManagementRoute) {
      return null
    }
    return getGroupForTab(activeTab)
  }, [activeTab, isDataManagementRoute, showSpaceSettingsSidebar])

  // Initialize selectedGroup based on activeTab
  const [selectedGroup, setSelectedGroup] = useState<string | null>(currentGroup)
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null)
  const isGroupManuallySelected = useRef(false)

  // Determine which group to show in secondary sidebar (hover takes precedence, then selected, then current)
  const displayGroup = useMemo(() => {
    // If showing space settings sidebar, don't show regular secondary sidebar
    if (showSpaceSettingsSidebar) {
      return null
    }
    if (hoveredGroup && hoveredGroup !== 'data-management') {
      return hoveredGroup
    }
    
    // If we are on the root page of a group (activeTab == currentGroup), hide the secondary sidebar
    if (activeTab === currentGroup) {
      return null
    }

    if (selectedGroup && selectedGroup !== 'data-management') {
      return selectedGroup
    }
    if (currentGroup && currentGroup !== 'data-management') {
      return currentGroup
    }
    return null
  }, [hoveredGroup, selectedGroup, currentGroup, showSpaceSettingsSidebar, activeTab])

  // Set selected group based on active tab when activeTab changes
  // Only update if the group was not manually selected by the user clicking on a group
  useEffect(() => {
    if (!isGroupManuallySelected.current) {
      // Always set to 'data-management' when showing space settings sidebar
      if (showSpaceSettingsSidebar && selectedGroup !== 'data-management') {
        setSelectedGroup('data-management')
      } else if (!showSpaceSettingsSidebar && selectedGroup !== currentGroup) {
        setSelectedGroup(currentGroup)
      }
    } else {
      // Reset the flag after processing
      isGroupManuallySelected.current = false
    }
  }, [activeTab, currentGroup, selectedGroup, showSpaceSettingsSidebar])

  // Custom setter that tracks manual selection
  const handleGroupSelect = useCallback((group: string | null) => {
    isGroupManuallySelected.current = true
    setSelectedGroup(group)
  }, [])

  // Handle group hover to show secondary sidebar
  const handleGroupHover = useCallback((group: string | null) => {
    // Don't show secondary sidebar for data-management
    if (group === 'data-management') {
      setHoveredGroup(null)
      return
    }
    setHoveredGroup(group)
  }, [])

  const handleGroupLeave = useCallback(() => {
    setHoveredGroup(null)
  }, [])

  const handleToggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleToggleSecondaryCollapse = useCallback(() => {
    setSecondarySidebarCollapsed(prev => !prev)
  }, [])

  const handleVmSelect = useCallback((vm: InfrastructureInstance) => {
    setSelectedVmId(vm.id)
    setSelectedVm(vm)
    // Check if username/password are set
    const hasCredentials = vm.connectionConfig?.username && vm.connectionConfig?.password
    if (!hasCredentials) {
      setVmCredentials(null) // Show credentials card
    } else {
      // Use stored credentials
      if (vm.connectionConfig) {
        setVmCredentials({
          username: vm.connectionConfig.username,
          password: vm.connectionConfig.password,
        })
      }
    }
  }, [])

  const handleVmAccess = useCallback((username: string, password: string) => {
    if (selectedVm) {
      setVmCredentials({ username, password })
    }
  }, [selectedVm])

  const handleVmPermission = useCallback((vm: InfrastructureInstance) => {
    // TODO: Implement permission dialog
    console.log('Permission for VM:', vm.id)
  }, [])

  const handleVmRemove = useCallback(async (vm: InfrastructureInstance) => {
    if (!confirm(`Are you sure you want to remove ${vm.name}?`)) return

    try {
      const response = await fetch(`/api/infrastructure/instances/${vm.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        if (selectedVmId === vm.id) {
          setSelectedVmId(null)
          setSelectedVm(null)
          setVmCredentials(null)
        }
      }
    } catch (error) {
      console.error('Error removing VM:', error)
    }
  }, [selectedVmId])

  const handleVmReboot = useCallback(async (vm: InfrastructureInstance) => {
    if (!confirm(`Are you sure you want to reboot ${vm.name}?`)) return

    try {
      // TODO: Implement reboot API call
      console.log('Reboot VM:', vm.id)
    } catch (error) {
      console.error('Error rebooting VM:', error)
    }
  }, [])

  const handleVmEdit = useCallback((vm: InfrastructureInstance) => {
    setEditingVm(vm)
    setShowEditDialog(true)
  }, [])

  const handleVmAccessClick = useCallback((vm: InfrastructureInstance) => {
    handleVmSelect(vm)
  }, [handleVmSelect])

  const handleAddVm = useCallback(() => {
    // Try to use infrastructure context if available (when on infrastructure page)
    if (infrastructureContext && infrastructureContext.isProviderActive && infrastructureContext.setShowAddVmDialog) {
      infrastructureContext.setShowAddVmDialog(true)
    } else {
      // Context not available, navigate to infrastructure page
      router.push('/infrastructure')
    }
  }, [router, infrastructureContext])

  const handleAddService = useCallback(() => {
    // Try to use infrastructure context if available (when on infrastructure page)
    if (infrastructureContext && infrastructureContext.isProviderActive && infrastructureContext.setShowAddServiceDialog) {
      infrastructureContext.setShowAddServiceDialog(true)
    } else {
      // Context not available, navigate to infrastructure page
      router.push('/infrastructure')
    }
  }, [router, infrastructureContext])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + B - Toggle primary sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b' && !e.shiftKey) {
        e.preventDefault()
        setSidebarCollapsed(prev => !prev)
      }
      // Ctrl/Cmd + Shift + B - Toggle secondary sidebar
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'B') {
        e.preventDefault()
        if (showSpaceSettingsSidebar || (currentGroup && currentGroup !== '')) {
          setSecondarySidebarCollapsed(prev => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentGroup])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Menu Bar - Full Width Above Everything */}
      <TopMenuBar
        activeTab={activeTab}
        spaceName={
          ((activeTab === 'space-selection' && selectedSpace) || activeTab === 'space-module' || showSpaceSidebar) && (spaceSidebarSpaceId || selectedSpace)
            ? (currentSpace?.name || (selectedSpace && spaces.find(s => s.id === selectedSpace)?.name))
            : undefined
        }
        showSpaceName={
          ((activeTab === 'space-selection' && selectedSpace) || activeTab === 'space-module' || showSpaceSidebar) && (spaceSidebarSpaceId || selectedSpace)
            ? true
            : false
        }
      />

      {/* Content Area with Sidebars */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebars Container */}
        <div className="flex flex-shrink-0">
          {/* Primary Sidebar - Groups */}
          <div
            className={`transition-all duration-150 ease-in-out ${sidebarCollapsed ? 'w-16' : 'w-52'} flex-shrink-0 border-r border-border/50`}
            data-sidebar="primary"
            style={{
              position: 'relative',
              zIndex: Z_INDEX.sidebar,
              pointerEvents: 'auto'
            }}
            onMouseEnter={() => setSidebarCollapsed(false)}
            onMouseLeave={(e) => {
              // Only collapse if not moving to secondary sidebar
              const relatedTarget = e.relatedTarget
              // Check if relatedTarget is an Element (has closest method)
              if (relatedTarget && relatedTarget instanceof Element) {
                if (!relatedTarget.closest('[data-sidebar="secondary"]') &&
                  !relatedTarget.closest('.flex-shrink-0.border-r')) {
                  setSidebarCollapsed(true)
                }
              } else {
                // If relatedTarget is null or not an Element, collapse the sidebar
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

          {/* Secondary Sidebar - Submenu Items */}
          {/* Show space sidebar for space module page */}
          {/* Show space settings sidebar when accessed from data management */}
          {/* Show secondary sidebar for all pages with a valid group (always visible) */}
          {/* Hide secondary sidebar for data-management routes */}
          {/* Show secondary sidebar when hovering over a group or when a group is selected */}
          {showSpaceSidebar ? (
            <div
              className={`${secondarySidebarCollapsed ? 'w-0' : 'w-56'} flex-shrink-0 transition-all duration-150 ease-in-out overflow-hidden border-r border-border/50`}
              data-sidebar="secondary"
              style={{
                position: 'relative',
                zIndex: Z_INDEX.sidebar,
                pointerEvents: 'auto'
              }}
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
              className={`${secondarySidebarCollapsed ? 'w-0' : 'w-56'} flex-shrink-0 transition-all duration-150 ease-in-out overflow-hidden border-r border-border/50`}
              data-sidebar="secondary"
              style={{
                position: 'relative',
                zIndex: Z_INDEX.sidebar,
                pointerEvents: 'auto',
                backgroundColor: 'var(--brand-secondary-sidebar-bg)'
              }}
            >
              {!secondarySidebarCollapsed && spaceSettingsTab && onSpaceSettingsTabChange && (
                <div className="w-full h-full flex flex-col">

                  <div className="flex-1 overflow-hidden">
                    <SpaceSettingsSidebar
                      activeTab={spaceSettingsTab || 'details'}
                      onTabChange={onSpaceSettingsTabChange || (() => { })}
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
              className={`${secondarySidebarCollapsed ? 'w-0' : 'w-56'} flex-shrink-0 transition-all duration-150 ease-in-out overflow-hidden border-r border-border/50`}
              data-sidebar="secondary"
              style={{
                position: 'relative',
                zIndex: Z_INDEX.sidebar,
                pointerEvents: 'auto',
                backgroundColor: 'var(--brand-secondary-sidebar-bg)'
              }}
              onMouseEnter={() => {
                // Keep secondary sidebar visible when hovering over it
                // If we have a displayGroup, maintain it as hovered
                if (displayGroup) {
                  setHoveredGroup(displayGroup)
                }
              }}
              onMouseLeave={() => {
                // Only clear hover if the group is not currently selected
                if (selectedGroup !== displayGroup) {
                  handleGroupLeave()
                }
              }}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Breadcrumb Bar */}
          <div className="h-10 bg-background flex items-center justify-between px-4 border-b border-border/50 tracking-tight">
            <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
              <nav aria-label="Breadcrumb" className="truncate text-muted-foreground min-w-0">
                <ol className="flex items-center space-x-2">
                  {(() => {
                    // Generate breadcrumbs, filtering out any items that contain "admin"
                    const crumbs = breadcrumbItems && breadcrumbItems.length
                      ? breadcrumbItems
                      : generateBreadcrumbs(activeTab)

                    // Filter out any breadcrumb items that contain "admin" (case-insensitive)
                    return crumbs.filter(item => {
                      const label = typeof item === 'string' ? item : item.label
                      return label && !label.toLowerCase().includes('admin')
                    })
                  })().map((item, idx, arr) => {
                    const isLast = idx === arr.length - 1
                    const label = typeof item === 'string' ? item : item.label
                    const href = typeof item === 'object' ? item.href : undefined
                    const onClick = typeof item === 'object' ? item.onClick : undefined
                    const isClickable = !isLast && (href || onClick)

                    return (
                      <Fragment key={`breadcrumb-${idx}`}>
                        <li className={`truncate ${isLast ? 'font-medium text-foreground' : 'whitespace-nowrap'}`}>
                          {isClickable ? (
                            href ? (
                              <Link
                                href={href}
                                className="hover:text-foreground hover:underline transition-colors"
                              >
                                {label}
                              </Link>
                            ) : (
                              <button
                                onClick={onClick}
                                className="hover:text-foreground hover:underline transition-colors text-left"
                              >
                                {label}
                              </button>
                            )
                          ) : (
                            <span>{label}</span>
                          )}
                        </li>
                        {!isLast && <li className="text-muted-foreground">/</li>}
                      </Fragment>
                    )
                  })}
                </ol>
              </nav>
            </div>
            {breadcrumbActions && (
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                {breadcrumbActions}
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto">
            {selectedVm && activeTab === 'infrastructure' ? (
              vmCredentials ? (
                <VMTerminal
                  vm={selectedVm}
                  username={vmCredentials.username}
                  password={vmCredentials.password}
                  onClose={() => {
                    setSelectedVm(null)
                    setSelectedVmId(null)
                    setVmCredentials(null)
                  }}
                />
              ) : (
                <VMCredentialsCard
                  vm={selectedVm}
                  onAccess={handleVmAccess}
                  onCancel={() => {
                    setSelectedVm(null)
                    setSelectedVmId(null)
                    setVmCredentials(null)
                  }}
                />
              )
            ) : activeTab === 'infrastructure' ? (
              <InfrastructurePlaceholder
                onAddVm={handleAddVm}
                onAddService={handleAddService}
              />
            ) : (
              children
            )}
          </div>
        </div>
      </div>

      {/* Edit VM Dialog */}
      <EditVMDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        vm={editingVm}
        onSuccess={() => {
          // Refresh VM data if needed
          if (editingVm && selectedVmId === editingVm.id) {
            // Reload VM data
          }
        }}
      />

      {/* Add Instance Dialog - Always available when infrastructure context is active */}
      {infrastructureContext?.isProviderActive && (
        <>
          <AddInstanceDialog
            open={infrastructureContext.showAddDialog}
            onOpenChange={infrastructureContext.setShowAddDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {
              // Dialog will handle success, but we might want to refresh VM list if needed
            }}
          />
          <AddVMDialog
            open={infrastructureContext.showAddVmDialog}
            onOpenChange={infrastructureContext.setShowAddVmDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {
              // Dialog will handle success, but we might want to refresh VM list if needed
            }}
          />
          <AddServiceDialog
            open={infrastructureContext.showAddServiceDialog}
            onOpenChange={infrastructureContext.setShowAddServiceDialog}
            spaceId={selectedSpace || currentSpace?.id || null}
            onSuccess={() => {
              // Dialog will handle success, but we might want to refresh VM list if needed
            }}
          />
        </>
      )}
    </div>
  )
}
