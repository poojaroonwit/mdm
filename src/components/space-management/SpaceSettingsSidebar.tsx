'use client'

import { memo, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'
import { Building2, Layout, Users as UsersIcon, Database, FolderPlus, AlertTriangle, RefreshCw } from 'lucide-react'

interface SidebarItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  tooltip: string
}

const SIDEBAR_ITEMS: readonly SidebarItem[] = [
  {
    id: 'details',
    label: 'Space Details',
    icon: Building2,
    tooltip: 'Name, description, and basic info'
  },
  {
    id: 'members',
    label: 'Members',
    icon: UsersIcon,
    tooltip: 'Manage team members and permissions'
  },
  {
    id: 'data-model',
    label: 'Data Model',
    icon: Database,
    tooltip: 'Manage data models and entities'
  },
  {
    id: 'data-sync',
    label: 'Data Sync',
    icon: RefreshCw,
    tooltip: 'Schedule data synchronization from external sources'
  },
  {
    id: 'attachments',
    label: 'Attachments',
    icon: FolderPlus,
    tooltip: 'Manage file storage and attachments'
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: AlertTriangle,
    tooltip: 'Delete space and irreversible actions'
  }
] as const

interface SpaceSettingsSidebarProps {
  activeTab: string
  onTabChange: (value: string) => void
  showAllTabs?: boolean
  showSpaceSelector?: boolean
  selectedSpaceId?: string
  onSpaceChange?: (spaceId: string) => void
  spaces?: Array<{ id: string; name: string; slug?: string }>
}

const SidebarItemComponent = memo(function SidebarItemComponent({ 
  item, 
  isActive, 
  onClick,
  className = '',
  sidebarText
}: { 
  item: SidebarItem
  isActive: boolean
  onClick: () => void
  className?: string
  sidebarText?: string
}) {
  const Icon = item.icon
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          onClick={onClick}
          className={cn(
            "platform-sidebar-menu-button w-full justify-center items-center text-[13px] font-medium h-[32px] px-4 transition-colors duration-150 cursor-pointer gap-3",
            isActive
              ? "bg-[var(--primary-light)]/10 text-[var(--primary-light)] font-bold rounded-sm shadow-sm"
              : "text-muted-foreground hover:!bg-transparent hover:!text-foreground rounded-none",
            className
          )}
          style={{ 
            pointerEvents: 'auto', 
            position: 'relative', 
            zIndex: Z_INDEX.sidebar + 1
          }}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{item.label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{item.tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

export const SpaceSettingsSidebar = memo(function SpaceSettingsSidebar({ 
  activeTab, 
  onTabChange,
  showAllTabs = true,
  showSpaceSelector = false,
  selectedSpaceId,
  onSpaceChange,
  spaces = []
}: SpaceSettingsSidebarProps) {
  // Use same styling as secondary platform sidebar
  const sidebarBg = 'var(--brand-secondary-sidebar-bg, hsl(var(--muted)))'
  const sidebarText = 'var(--brand-secondary-sidebar-text, hsl(var(--muted-foreground)))'
  
  const handleTabClick = useCallback((itemId: string) => {
    onTabChange(itemId)
  }, [onTabChange])

  const visibleItems = showAllTabs 
    ? SIDEBAR_ITEMS 
    : SIDEBAR_ITEMS.filter(item => item.id !== 'danger')

  return (
    <TooltipProvider>
      <div 
        className="w-full flex flex-col h-full"
        data-sidebar="secondary"
        data-component="space-settings-sidebar"
        style={{
          backgroundColor: sidebarBg,
          color: sidebarText
        }}
      >
        {showSpaceSelector && (
          <div className="p-3 border-b border-border">
            <Select
              value={selectedSpaceId || ''}
              onValueChange={(value) => {
                if (onSpaceChange) {
                  onSpaceChange(value)
                }
              }}
            >
              <SelectTrigger className="w-full h-9 text-sm">
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.length > 0 ? (
                  spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name || space.id}
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">No spaces available</div>
                )}
              </SelectContent>
            </Select>
          </div>
        )}
        <nav className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
          <div className="w-full flex flex-col gap-0.5">
            {visibleItems.map((item) => {
              const isDanger = item.id === 'danger'
              return (
                <SidebarItemComponent
                  key={item.id}
                  item={item}
                  isActive={activeTab === item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={isDanger ? 'text-destructive hover:text-destructive/80 hover:bg-destructive/10' : ''}
                  sidebarText={sidebarText}
                />
              )
            })}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  )
})
