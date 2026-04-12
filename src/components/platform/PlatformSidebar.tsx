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

      for (const group of menuConfig.groups) {
        // Filter items based on requiredRoles and Permissions
        const allowedItems = group.items.filter(item => {
          // If no requiredRoles specified, allow all roles
          if (!item.requiredRoles || item.requiredRoles.length === 0) {
            return true
          }

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

          const permissionRequirements = item.requiredRoles.filter(r => r.includes(':'))
          if (permissionRequirements.length > 0) {
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

    return {
      overview: [],
      tools: [],
      system: [],
      'data-management': [],
      infrastructure: []
    }
  }, [menuConfig, installedPlugins, session, userPermissions])

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
    if (groupName === 'data-management') {
      if (onGroupSelect) onGroupSelect('')
      if (tabs && tabs.length > 0) {
        handleTabClick(tabs[0].id, (tabs[0] as any).href)
      } else {
        router.push('/admin/space-selection')
      }
      return
    }

    if (groupName === 'infrastructure') {
      if (onGroupSelect) onGroupSelect(groupName)
      if (activeTab !== 'infrastructure' && tabs && tabs.length > 0) {
        handleTabClick(tabs[0].id, (tabs[0] as any).href)
      }
      return
    }

    if (groupName === 'system' || groupName === 'tools') {
      if (onGroupSelect) onGroupSelect(groupName)
      router.push(`/${groupName}`)
      return
    }

    if (onGroupSelect) onGroupSelect(groupName)
    if (tabs && tabs.length > 0) {
      handleTabClick(tabs[0].id, (tabs[0] as any).href)
    }
  }, [onGroupSelect, handleTabClick, activeTab, groupedTabs, router])

  const filterTabs = useCallback((tabs: any[], query: string) => {
    if (!query || query.trim() === '') return tabs
    const lowerQuery = query.toLowerCase()
    return tabs.filter((tab: any) =>
      tab.name.toLowerCase().includes(lowerQuery) ||
      tab.id.toLowerCase().includes(lowerQuery)
    )
  }, [])

  const sidebarBg = mode === 'primary' ? 'var(--sidebar-bg)' : 'var(--bg-surface)'
  const sidebarText = mode === 'primary' ? 'var(--text-primary)' : 'var(--text-secondary)'

  return (
    <div
      className={cn(
        "h-full flex flex-col transition-all duration-300 z-20 shrink-0",
        mode === 'primary' ? (collapsed ? "w-[65px]" : "w-[210px]") : "w-full lg:w-[210px]"
      )}
      data-sidebar={mode}
      style={{
        position: 'relative',
        zIndex: Z_INDEX.sidebar,
        pointerEvents: 'auto',
        backgroundColor: sidebarBg,
        borderRight: mode === 'primary' ? '1px solid var(--sidebar-border)' : 'none'
      }}
    >
      <ScrollArea className="flex-1 overflow-auto">
        <div className={cn("py-2 px-2", mode === 'secondary' && "min-h-full")}>
          {mode === 'primary' ? (
            collapsed ? (
              <div className="space-y-0.5">
                {Object.entries(groupMetadata).filter(([groupId]) => groupId !== 'system').map(([groupId, group], index) => {
                  const Icon = group.icon
                  const isDataManagement = groupId === 'data-management'
                  const isActive = selectedGroup === groupId || (groupId === 'overview' && pathname?.includes('/knowledge')) || (isDataManagement && activeTab === 'space-selection') || (groupId === 'infrastructure' && activeTab === 'infrastructure')

                  return (
                    <div key={groupId}>
                      {isDataManagement && index > 0 && (
                        <div className="border-t border-sidebar-border my-0.5 mx-2" />
                      )}
                      <Button
                        variant={isActive ? "soft-blue" : "ghost"}
                        className={cn(
                          "group relative w-9 h-9 flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer mx-auto p-0",
                          isActive ? "" : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                        )}
                        onClick={() => handleGroupClick(groupId)}
                        onMouseEnter={() => {
                          const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                          if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                            onGroupHover?.(groupId)
                          }
                        }}
                        onMouseLeave={() => {
                          if (selectedGroup !== groupId) onGroupLeave?.()
                        }}
                        title={group.name}
                      >
                        
                        <Icon 
                          strokeWidth={2.5}
                          className={cn("h-[18px] w-[18px] flex-shrink-0 transition-all duration-200", 
                          isActive ? "" : "group-hover:scale-105"
                        )} />
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-0.5">
                {Object.entries(groupMetadata).filter(([groupId]) => groupId !== 'system').map(([groupId, group], index) => {
                  const Icon = group.icon
                  const isDataManagement = groupId === 'data-management'
                  const isActive = selectedGroup === groupId || (groupId === 'overview' && pathname?.includes('/knowledge')) || (isDataManagement && activeTab === 'space-selection') || (groupId === 'infrastructure' && activeTab === 'infrastructure')

                  return (
                    <div key={groupId}>
                      {isDataManagement && (
                        <div className="border-t border-sidebar-border my-1 mx-4" />
                      )}
                        <Button
                          variant={isActive ? "soft-blue" : "ghost"}
                          className={cn(
                            "group flex w-full items-center justify-start rounded-lg px-4 transition-all duration-200 cursor-pointer h-9 gap-3",
                            isActive ? "font-bold" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                          )}
                        onClick={() => handleGroupClick(groupId)}
                        onMouseEnter={() => {
                          const tabs = groupedTabs[groupId as keyof typeof groupedTabs]
                          if (tabs && tabs.length > 0 && groupId !== 'data-management') {
                            onGroupHover?.(groupId)
                          }
                        }}
                        onMouseLeave={() => {
                          if (selectedGroup !== groupId) onGroupLeave?.()
                        }}
                      >
                        <span className={cn(
                          "flex h-5 w-5 items-center justify-center transition-colors",
                          !isActive && "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                        )}>
                          <Icon 
                            strokeWidth={2.5}
                            className="w-[18px] h-[18px] flex-shrink-0 transition-colors" 
                          />
                        </span>
                        <span className="text-[14px] font-medium leading-[1] whitespace-nowrap">{group.name}</span>
                        {!isDataManagement && groupId !== 'infrastructure' && (
                          <ChevronRightIcon 
                            strokeWidth={2.5}
                            className="w-4 h-4 ml-auto text-zinc-400 opacity-50" 
                          />
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          ) : (
            selectedGroup === 'infrastructure' ? (
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
                <div className="space-y-4">
                  {Object.entries(activeGroupSections).map(([sectionName, items], sectionIndex) => {
                    const filteredItems = filterTabs(items, searchValue)
                    if (filteredItems.length === 0) return null

                    return (
                      <div key={sectionName} className="px-1">
                        <div className="px-5 py-1.5 text-[10px] uppercase font-black tracking-[0.1em] text-zinc-500 mb-1">
                          {sectionName}
                        </div>
                        <div className="space-y-0.5">
                          {filteredItems.map((tab: any) => {
                            const isActive = activeTab === tab.id
                            return (
                              <Button
                                key={tab.id}
                                variant={isActive ? "soft-blue" : "ghost"}
                                className={cn(
                                  "group flex w-full items-center justify-start rounded-lg px-4 transition-all duration-200 cursor-pointer h-9 gap-3",
                                  isActive
                                    ? "font-bold"
                                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                )}
                                onClick={() => handleTabClick(tab.id, tab.href)}
                              >
                                <span className={cn(
                                  "flex h-5 w-5 items-center justify-center transition-colors",
                                  !isActive && "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
                                )}>
                                  <tab.icon 
                                    strokeWidth={2.5}
                                    className="w-[18px] h-[18px] flex-shrink-0 transition-colors" 
                                  />
                                </span>
                                <span className="truncate text-[14px] font-medium leading-[1] whitespace-nowrap">{tab.name}</span>
                              </Button>
                            )
                          })}
                        </div>
                        {sectionIndex < Object.entries(activeGroupSections).length - 1 && (
                          <div className="border-t border-sidebar-border my-2 mx-1" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {mode === 'primary' && onToggleCollapse && (
        <div className={cn("py-4 flex flex-col items-stretch space-y-1.5 border-t border-sidebar-border px-4", collapsed && "px-2")}>
          {groupMetadata['system'] && (() => {
            const groupId = 'system'
            const group = groupMetadata['system']
            const Icon = group.icon
            const isActive = selectedGroup === groupId

            return (
              <div className="w-full mb-2 border-b border-sidebar-border pb-2">
                <Button
                  variant={isActive ? "soft-blue" : "ghost"}
                  className={cn(
                    "group flex w-full items-center transition-all duration-200 cursor-pointer h-9",
                    collapsed ? "w-9 h-9 rounded-lg justify-center p-0 mx-auto" : "rounded-lg px-4 justify-start",
                    isActive
                      ? ""
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                  onClick={() => handleGroupClick(groupId)}
                >
                   {collapsed && isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-zinc-900 dark:bg-zinc-100 rounded-r-full" />
                  )}
                  <span className={cn(
                    "flex h-5 w-5 items-center justify-center transition-colors",
                    !collapsed && "mr-3",
                    isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500"
                  )}>
                    <Icon 
                      strokeWidth={2.5}
                      className="w-[18px] h-[18px] flex-shrink-0" 
                    />
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left text-[14px] font-medium leading-[1]">{group.name}</span>
                      <ChevronRightIcon 
                        strokeWidth={2.5}
                        className="w-4 h-4 ml-auto text-zinc-400 opacity-50" 
                      />
                    </>
                  )}
                </Button>
              </div>
            )
          })()}

          <Button
            variant="ghost"
            onClick={onToggleCollapse}
            className={cn(
              "group relative flex items-center transition-all duration-200 h-auto",
              collapsed 
                ? "w-9 h-9 rounded-lg justify-center p-0 mx-auto" 
                : "w-full rounded-lg px-4 justify-start gap-2 text-left h-9"
            )}
          >
            {collapsed ? (
              <ChevronRightIcon 
                strokeWidth={2}
                className="h-5 w-5 text-zinc-400" 
              />
            ) : (
              <>
                <ChevronLeftIcon 
                  strokeWidth={2}
                  className="h-4 w-4 text-zinc-400" 
                />
                <span className="text-xs font-medium text-zinc-500">Collapse</span>
              </>
            )}
          </Button>

          <div className={cn("text-[10px] font-black uppercase tracking-[0.1em] text-zinc-400 px-3", collapsed && "text-center")}>
            v{APP_VERSION}
          </div>
        </div>
      )}
    </div>
  )
}
