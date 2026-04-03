'use client'
// force refresh

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ShieldCheckIcon,
  CircleStackIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  DocumentTextIcon,
  CloudIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ServerIcon,
  KeyIcon,
  ComputerDesktopIcon,
  PaperClipIcon,
  BellIcon,
  SwatchIcon,
  HeartIcon,
  BoltIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  CpuChipIcon,
  WindowIcon,
  FolderIcon,
  BeakerIcon,
  BookOpenIcon,
  CommandLineIcon,
  CheckCircleIcon,
  DocumentIcon,
  ClockIcon,
  ViewColumnsIcon,
  BuildingStorefrontIcon,
  ShareIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'
import { APP_VERSION } from '@/lib/version'
import { HorizonSidebar } from '@/components/infrastructure/HorizonSidebar'
import { InfrastructureInstance } from '@/features/infrastructure/types'
import { useMarketplacePlugins } from '@/features/marketplace/hooks/useMarketplacePlugins'
import { useMenuConfig } from '@/hooks/useMenuConfig'
import { useUserPermissions } from '@/hooks/use-permission'
import { useSystemSettingsSafe } from '@/contexts/system-settings-context'

// Map of icon names to components for dynamic rendering
const ICON_MAP: Record<string, any> = {
  Monitor: ComputerDesktopIcon,
  Users: UsersIcon,
  Building: BuildingOfficeIcon,
  Building2: BuildingOffice2Icon,
  Code: CodeBracketIcon,
  FileText: DocumentTextIcon,
  MessageCircle: ChatBubbleLeftIcon,
  Settings: Cog6ToothIcon,
  Shield: ShieldCheckIcon,
  Activity: ChartBarIcon,
  Cloud: CloudIcon,
  Key: KeyIcon,
  FileTextIcon: DocumentTextIcon,
  DatabaseIcon: CircleStackIcon,
  Database: CircleStackIcon,
  GitBranch: CommandLineIcon,
  CheckCircle2: CheckCircleIcon,
  FileCode: DocumentIcon,
  ShieldCheck: ShieldCheckIcon,
  Zap: BoltIcon,
  HardDrive: ServerIcon,
  BarChart3: ChartBarIcon,
  Kanban: ViewColumnsIcon,
  Network: ShareIcon,
  History: ClockIcon,
  Palette: SwatchIcon,
  FlaskConical: BeakerIcon,
  Bot: CpuChipIcon,
  Store: BuildingStorefrontIcon,
  FolderKanban: FolderIcon,
  Layout: WindowIcon,
  BookOpen: BookOpenIcon,
  Table: TableCellsIcon,
  Server: ServerIcon,
  Paperclip: PaperClipIcon,
  Bell: BellIcon,
  Heart: HeartIcon,
  ChevronDown: ChevronDownIcon,
  ChevronRight: ChevronRightIcon
}

export const getPlatformIcon = (name: string) => ICON_MAP[name] || DocumentTextIcon



interface PlatformSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  collapsed?: boolean
  selectedGroup?: string | null
  onGroupSelect?: (group: string) => void
  onGroupHover?: (group: string | null) => void
  onGroupLeave?: () => void
  mode?: 'primary' | 'secondary'
  onToggleCollapse?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedVmId?: string | null
  onVmSelect?: (vm: InfrastructureInstance) => void
  onVmPermission?: (vm: InfrastructureInstance) => void
  onVmRemove?: (vm: InfrastructureInstance) => void
  onVmReboot?: (vm: InfrastructureInstance) => void
  onVmEdit?: (vm: InfrastructureInstance) => void
  onVmAccess?: (vm: InfrastructureInstance) => void
  onAddVm?: () => void
}

export function PlatformSidebar({
  activeTab,
  onTabChange,
  selectedSpace,
  onSpaceChange,
  collapsed = false,
  selectedGroup,
  onGroupSelect,
  onGroupHover,
  onGroupLeave,
  mode = 'primary',
  onToggleCollapse,
  searchQuery = '',
  onSearchChange,
  selectedVmId,
  onVmSelect,
  onVmPermission,
  onVmRemove,
  onVmReboot,
  onVmEdit,
  onVmAccess,
  onAddVm,
}: PlatformSidebarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState('')
  const searchValue = searchQuery !== undefined ? searchQuery : localSearchQuery
  const handleSearchChange = onSearchChange || ((query: string) => setLocalSearchQuery(query))
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()

  // Fetch installed plugins with navigation data
  const { plugins: installedPlugins } = useMarketplacePlugins({
    filters: { installedOnly: true },
    spaceId: selectedSpace
  })

  // Fetch menu configuration from database
  const { menuConfig, loading: menuLoading } = useMenuConfig()


  // Inside component function
  const { data: session } = useSession()
  const { permissions: userPermissions } = useUserPermissions()
  const { settings } = useSystemSettingsSafe()

  // Build groupedTabs from database menu config, with plugin injection and role filtering
  const groupedTabs = useMemo(() => {
    // Start with database config if available
    if (menuConfig?.groups) {
      const tabs: Record<string, any[]> = {}

      // Get user role from session or default to USER
      const userRole: string = (session?.user as any)?.role || 'USER'
      console.log('PlatformSidebar Debug:', { userRole, groups: menuConfig.groups })


      for (const group of menuConfig.groups) {
        // Filter items based on requiredRoles and Permissions
        const allowedItems = group.items.filter(item => {
          // If no requiredRoles specified, allow all roles
          if (!item.requiredRoles || item.requiredRoles.length === 0) {
            return true
          }

          // Check for Role match with hierarchy
          // SUPER_ADMIN > ADMIN > MANAGER > USER
          // Higher roles can see items for lower roles
          const roleHierarchy: Record<string, string[]> = {
            'SUPER_ADMIN': ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
            'ADMIN': ['ADMIN', 'MANAGER', 'USER'],
            'MANAGER': ['MANAGER', 'USER'],
            'USER': ['USER']
          }
          const userEffectiveRoles = roleHierarchy[userRole] || [userRole]

          if (item.requiredRoles.some(r => userEffectiveRoles.includes(r))) {
            return true
          }

          // Check for Permission match (strings with ':')
          // If the item requires specific permissions (e.g. 'system:manage_users')
          // and the user has them, allow access.
          const permissionRequirements = item.requiredRoles.filter(r => r.includes(':'))
          if (permissionRequirements.length > 0) {
            // Check if user has ANY of the required permissions listed
            // This acts as an OR condition with Roles. 
            // (Role A OR Role B OR Permission P)
            const hasPermission = permissionRequirements.some(p => userPermissions.includes(p))
            if (hasPermission) return true
          }

          return false
        })

        tabs[group.slug] = allowedItems.map(item => ({
          id: item.slug,
          name: item.name,
          icon: getPlatformIcon(item.icon),
          href: item.href,
          section: item.section,
          priority: item.priority,
          requiredRoles: item.requiredRoles,
        }))
      }

      // Inject plugin tabs
      installedPlugins.forEach(plugin => {
        if (plugin.navigation) {
          const { group, label, icon, href, priority } = plugin.navigation
          if (group && tabs[group]) {
            const newItem = {
              id: plugin.slug,
              name: label,
              icon: getPlatformIcon(icon),
              href: href || `/tools/${plugin.slug}`,
              priority: priority || 100
            }
            if (!tabs[group].find((t: any) => t.id === newItem.id)) {
              tabs[group].push(newItem)
            }
          }
        }
      })

      return tabs
    }

    // Fallback to empty structure if menu not loaded
    return {
      overview: [],
      tools: [],
      system: [],
      'data-management': [],
      infrastructure: []
    }
  }, [menuConfig, installedPlugins, session])

  // Group metadata for primary sidebar (from database)
  const groupMetadata = useMemo(() => {
    if (menuConfig?.groups) {
      const meta: Record<string, { name: string; icon: any }> = {}
      for (const group of menuConfig.groups) {
        meta[group.slug] = {
          name: group.name,
          icon: getPlatformIcon(group.icon)
        }
      }
      return meta
    }
    // Fallback
    return {
      overview: { name: 'Homepage', icon: ComputerDesktopIcon },
      tools: { name: 'Tools', icon: BeakerIcon },
      infrastructure: { name: 'Infrastructure', icon: ShareIcon },
      system: { name: 'System', icon: Cog6ToothIcon },
      'data-management': { name: 'Data Management', icon: FolderIcon }
    }
  }, [menuConfig])

  // Build sections dynamically for the selected group
  const activeGroupSections = useMemo(() => {
    const sections: Record<string, any[]> = {}
    if (!selectedGroup) return sections

    const items = groupedTabs[selectedGroup as keyof typeof groupedTabs] || []
    for (const item of items) {
      const sectionName = item.section || 'General'
      if (!sections[sectionName]) {
        sections[sectionName] = []
      }
      sections[sectionName].push(item)
    }
    return sections
  }, [groupedTabs, selectedGroup])


  const handleTabClick = useCallback((tabId: string, href?: string) => {
    // Always use href if available, otherwise construct from tabId
    const targetHref = href || `/${tabId}`
    const currentSpaceSlug = typeof params?.space === 'string' ? params.space : ''
    const isSpaceScopedPath = !!currentSpaceSlug && !!pathname?.startsWith(`/${currentSpaceSlug}/`)

    if (targetHref === '/knowledge' && isSpaceScopedPath) {
      router.push(`/${currentSpaceSlug}/knowledge`)
      return
    }

    router.push(targetHref)
  }, [router, params, pathname])

  const handleGroupClick = useCallback((groupName: string) => {
    const tabs = groupedTabs[groupName as keyof typeof groupedTabs]
    // Data Management has no secondary sidebar - go directly to the tab and clear selectedGroup
    if (groupName === 'data-management') {
      if (onGroupSelect) {
        onGroupSelect('') // Clear selectedGroup to hide secondary sidebar
      }
      // Use tab if available, otherwise fallback to hardcoded path
      if (tabs && tabs.length > 0) {
        handleTabClick(tabs[0].id, (tabs[0] as any).href)
      } else {
        // Navigate to space selection page
        router.push('/admin/space-selection')
      }
      return
    }

    // Infrastructure shows VM list in secondary sidebar
    if (groupName === 'infrastructure') {
      if (onGroupSelect) {
        onGroupSelect(groupName) // Show secondary sidebar with VM list
      }
      // Navigate to infrastructure page if not already there
      if (activeTab !== 'infrastructure' && tabs && tabs.length > 0) {
        handleTabClick(tabs[0].id, (tabs[0] as any).href)
      }
      return
    }

    // For System and Tools, navigate to the grid view
    if (groupName === 'system' || groupName === 'tools') {
        if (onGroupSelect) {
            onGroupSelect(groupName)
        }
        router.push(`/${groupName}`)
        return
    }

    if (onGroupSelect) {
      onGroupSelect(groupName)
    }
    // If group has tabs, select the first one
    if (tabs && tabs.length > 0) {
      handleTabClick(tabs[0].id, (tabs[0] as any).href)
    }
  }, [onGroupSelect, handleTabClick, activeTab, groupedTabs, router])

  // Filter tabs based on search query
  const filterTabs = useCallback((tabs: any[], query: string) => {
    if (!query || query.trim() === '') {
      return tabs
    }
    const lowerQuery = query.toLowerCase()
    return tabs.filter((tab: any) =>
      tab.name.toLowerCase().includes(lowerQuery) ||
      tab.id.toLowerCase().includes(lowerQuery) ||
      (tab.description && tab.description.toLowerCase().includes(lowerQuery))
    )
  }, [])



  const sidebarBg = mode === 'primary'
        ? 'var(--brand-platform-sidebar-bg, hsl(var(--background)))'
        : 'var(--brand-secondary-sidebar-bg, hsl(var(--muted)))'

  const sidebarText = mode === 'primary'
        ? 'var(--brand-platform-sidebar-text, hsl(var(--foreground)))'
        : 'var(--brand-secondary-sidebar-text, hsl(var(--muted-foreground)))'

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all duration-300",
        mode === 'primary' ? (collapsed ? "w-16" : "w-64") : "w-full lg:w-[320px]"
      )}
      data-sidebar={mode}
      data-component="platform-sidebar"
      style={{
        position: 'relative',
        zIndex: Z_INDEX.sidebar,
        pointerEvents: 'auto',
        backgroundColor: 'transparent',
        borderRight: mode === 'primary' ? '1px solid var(--border-default)' : 'none'
      }}
    >


      {/* GCP-style Navigation */}
      <ScrollArea
        className="flex-1 overflow-auto"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          className={mode === 'secondary' ? 'min-h-full py-2 px-2' : 'py-2 px-2'}
          style={{ pointerEvents: 'auto' }}
        >
          {mode === 'primary' ? (
            // Primary sidebar - show groups
            collapsed ? (
              // Collapsed view - show only group icons
              <div className="space-y-1">
                {Object.entries(groupMetadata).map(([groupId, group], index) => {
                  const Icon = group.icon
                  const isDataManagement = groupId === 'data-management'
                  const isInfrastructure = groupId === 'infrastructure'

                  return (
                    <div key={groupId}>
                      {isDataManagement && index > 0 && (
                        <div className="border-t border-border/50 my-1 mx-2" />
                      )}
                      <Button
                        variant="ghost"
                        className={cn(
                          "platform-sidebar-menu-button w-full justify-center h-10 transition-all duration-300 cursor-pointer group",
                          (selectedGroup === groupId || (groupId === 'data-management' && (activeTab === 'space-selection' || selectedGroup === 'data-management')) || (groupId === 'infrastructure' && activeTab === 'infrastructure'))
                            ? "platform-sidebar-menu-button-active bg-zinc-900/5 dark:bg-white/10 text-zinc-900 dark:text-white rounded-xl shadow-sm"
                            : "text-zinc-500 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl"
                        )}
                        onClick={() => handleGroupClick(groupId)}
                        onMouseEnter={() => {
                          const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                          // Only show secondary sidebar if group has tabs and is not data-management
                          if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                            onGroupHover?.(groupId)
                          }
                        }}
                        onMouseLeave={() => {
                          // Only clear hover if not currently selected
                          if (selectedGroup !== groupId) {
                            onGroupLeave?.()
                          }
                        }}
                        title={group.name}
                        style={{
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: Z_INDEX.sidebar + 1
                        }}
                      >
                        <Icon className="h-5 w-5 stroke-2" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              // Expanded view - show groups with names
              <div className="space-y-1">
                {Object.entries(groupMetadata).map(([groupId, group], index) => {
                  const Icon = group.icon
                  const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                  const isDataManagement = groupId === 'data-management'
                  const isInfrastructure = groupId === 'infrastructure'
                  const isLastGroup = index === Object.entries(groupMetadata).length - 1

                  return (
                    <div key={groupId}>
                      {isDataManagement && (
                        <div className="border-t border-border/50 my-2 mx-4" />
                      )}
                      <Button
                        variant="ghost"
                        className={cn(
                          "platform-sidebar-menu-button w-full justify-start text-sm font-bold h-11 px-4 transition-all duration-300 cursor-pointer group",
                          (selectedGroup === groupId || (groupId === 'data-management' && activeTab === 'space-selection') || (groupId === 'infrastructure' && activeTab === 'infrastructure'))
                            ? "platform-sidebar-menu-button-active bg-zinc-900/5 dark:bg-white/10 text-zinc-900 dark:text-white rounded-xl shadow-sm"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-xl"
                        )}
                        onClick={() => handleGroupClick(groupId)}
                        onMouseEnter={() => {
                          const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                          // Only show secondary sidebar if group has tabs and is not data-management
                          if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                            onGroupHover?.(groupId)
                          }
                        }}
                        onMouseLeave={() => {
                          // Only clear hover if not currently selected
                          if (selectedGroup !== groupId) {
                            onGroupLeave?.()
                          }
                        }}
                        style={{
                          pointerEvents: 'auto',
                          position: 'relative',
                          zIndex: Z_INDEX.sidebar + 1
                        }}
                      >
                        <Icon className="h-4 w-4 mr-3 stroke-2" />
                        <span className="flex-1 text-left">{group.name}</span>
                        {!isDataManagement && !isInfrastructure && (
                          <ChevronRightIcon className="h-4 w-4 ml-2 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            // Secondary sidebar - show submenu items for selected group or Horizon tab for infrastructure
            selectedGroup === 'infrastructure' ? (
              // Infrastructure group - show Horizon tab with VMs and Services
              <div className="w-full h-full flex flex-col">
                <HorizonSidebar
                  selectedVmId={selectedVmId}
                  onVmSelect={onVmSelect}
                  spaceId={selectedSpace}
                  onVmPermission={onVmPermission}
                  onVmRemove={onVmRemove}
                  onVmReboot={onVmReboot}
                  onVmEdit={onVmEdit}
                  onVmAccess={onVmAccess}
                  onAddVm={onAddVm}
                />
              </div>
            ) : selectedGroup && groupedTabs[selectedGroup as keyof typeof groupedTabs] ? (
              <div className="w-full pb-4">

                {/* Group Header Label */}
                {selectedGroup && groupMetadata[selectedGroup] && (
                  <div className="px-4 py-6 border-b border-zinc-100/60 dark:border-zinc-800/60 mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 flex items-center gap-3">
                      {(() => {
                        const Icon = groupMetadata[selectedGroup].icon
                        return <Icon className="h-4 w-4 stroke-[2.5]" />
                      })()}
                      {groupMetadata[selectedGroup].name}
                    </h3>
                  </div>
                )}

                {/* Dynamic Section Rendering */}
                <div className="space-y-4">
                  {Object.entries(activeGroupSections).map(([sectionName, items], sectionIndex) => {
                    const filteredItems = filterTabs(items, searchValue)
                    if (filteredItems.length === 0) return null

                    return (
                      <div key={sectionName} className="py-2 px-2">
                        <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-4 px-4">
                          {sectionName}
                        </div>
                        <div className="space-y-1">
                          {filteredItems.map((tab: any) => (
                            <Button
                              key={tab.id}
                              variant="ghost"
                              className={cn(
                                "platform-sidebar-menu-button w-full justify-start items-center text-sm font-bold h-10 px-4 transition-all duration-200 cursor-pointer rounded-xl group",
                                activeTab === tab.id
                                  ? "platform-sidebar-menu-button-active bg-zinc-900/5 dark:bg-white/10 text-zinc-900 dark:text-white shadow-sm"
                                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100"
                              )}
                              onClick={() => handleTabClick(tab.id, (tab as any).href)}
                              style={{
                                pointerEvents: 'auto',
                                position: 'relative',
                                zIndex: Z_INDEX.sidebar + 1,
                                ...(activeTab === tab.id 
                                  ? { 
                                      backgroundColor: 'var(--brand-primary-light, rgba(59, 130, 246, 0.10))',
                                      color: 'var(--brand-primary, hsl(var(--primary)))'
                                    } 
                                  : {})
                              }}
                            >
                              <tab.icon className={cn("h-4 w-4 mr-3 flex-shrink-0", activeTab === tab.id ? "text-primary" : "")} />
                              <span className="truncate text-left">{tab.name}</span>
                            </Button>
                          ))}
                        </div>
                        {sectionIndex < Object.entries(activeGroupSections).length - 1 && (
                          <div className="border-t border-border/50 my-2 mx-0" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              // Fallback: Show message if group not found
              <div className="p-4 text-sm text-muted-foreground">
                No menu items available for this group.
              </div>
            )
          )}
        </div>
      </ScrollArea>

      {/* Zinc Footer */}
      {mode === 'primary' && onToggleCollapse && (
        <div
          className={cn(
            "px-4 py-4 border-t border-zinc-100/60 dark:border-zinc-800/60 bg-transparent flex flex-col gap-4",
            collapsed && "px-2 items-center"
          )}
          style={{ pointerEvents: 'auto' }}
        >
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={onToggleCollapse}
            className={cn(
              "w-full transition-all duration-300 rounded-xl font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-zinc-100",
              collapsed ? "h-10 w-10 justify-center" : "h-10 justify-start px-3 gap-3"
            )}
            style={{ pointerEvents: 'auto' }}
          >
            {collapsed ? (
              <ChevronRightIcon className="h-4 w-4 stroke-2" />
            ) : (
              <>
                <ChevronLeftIcon className="h-4 w-4 stroke-2" />
                <span className="text-xs uppercase tracking-widest font-black text-[11px]">Collapse</span>
              </>
            )}
          </Button>

          <div className={cn(
            "text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400/60 dark:text-zinc-500/60",
            collapsed ? "text-center" : "px-1"
          )}>
            {collapsed ? `v${APP_VERSION}` : `Version ${APP_VERSION}`}
          </div>
        </div>
      )}
    </div>
  )
}
