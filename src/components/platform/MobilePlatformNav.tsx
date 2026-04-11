'use client'

import { useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMarketplacePlugins } from '@/features/marketplace/hooks/useMarketplacePlugins'
import { useMenuConfig } from '@/hooks/useMenuConfig'
import { useUserPermissions } from '@/hooks/use-permission'
import { cn } from '@/lib/utils'
import { getPlatformIcon } from './PlatformSidebar'

interface MobilePlatformNavProps {
  activeTab: string
  selectedSpace?: string
  onTabChange: (tab: string) => void
}

interface MobileNavItem {
  id: string
  name: string
  icon: any
  href: string
  section?: string | null
  priority?: number
  description?: string
}

export function MobilePlatformNav({
  activeTab,
  selectedSpace,
  onTabChange,
}: MobilePlatformNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams()
  const { data: session } = useSession()
  const { permissions: userPermissions } = useUserPermissions()
  const { menuConfig } = useMenuConfig()
  const { plugins: installedPlugins } = useMarketplacePlugins({
    filters: { installedOnly: true },
    spaceId: selectedSpace,
  })
  const [openGroupId, setOpenGroupId] = useState<string | null>(null)

  const groupedTabs = useMemo(() => {
    if (!menuConfig?.groups) {
      return {} as Record<string, MobileNavItem[]>
    }

    const tabs: Record<string, MobileNavItem[]> = {}
    const userRole: string = (session?.user as any)?.role || 'USER'
    const roleHierarchy: Record<string, string[]> = {
      SUPER_ADMIN: ['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'USER'],
      ADMIN: ['ADMIN', 'MANAGER', 'USER'],
      MANAGER: ['MANAGER', 'USER'],
      USER: ['USER'],
    }
    const userEffectiveRoles = roleHierarchy[userRole] || [userRole]

    for (const group of menuConfig.groups) {
      const allowedItems = group.items.filter((item) => {
        if (!item.requiredRoles || item.requiredRoles.length === 0) {
          return true
        }

        if (item.requiredRoles.some((role) => userEffectiveRoles.includes(role))) {
          return true
        }

        const permissionRequirements = item.requiredRoles.filter((role) => role.includes(':'))
        if (permissionRequirements.length > 0) {
          return permissionRequirements.some((permission) => userPermissions.includes(permission))
        }

        return false
      })

      tabs[group.slug] = allowedItems.map((item) => ({
        id: item.slug,
        name: item.name,
        icon: getPlatformIcon(item.icon),
        href: item.href,
        section: item.section,
        priority: item.priority,
      }))
    }

    installedPlugins.forEach((plugin) => {
      if (!plugin.navigation?.group) return
      const groupId = plugin.navigation.group
      if (!tabs[groupId]) return

      const newItem: MobileNavItem = {
        id: plugin.slug,
        name: plugin.navigation.label,
        icon: getPlatformIcon(plugin.navigation.icon),
        href: plugin.navigation.href || `/tools/${plugin.slug}`,
        section: 'Extensions',
        priority: plugin.navigation.priority || 100,
        description: plugin.description || undefined,
      }

      if (!tabs[groupId].find((item) => item.id === newItem.id)) {
        tabs[groupId].push(newItem)
      }
    })

    Object.values(tabs).forEach((items) => {
      items.sort((a, b) => (a.priority || 0) - (b.priority || 0))
    })

    return tabs
  }, [installedPlugins, menuConfig, session, userPermissions])

  const groups = useMemo(() => {
    return (menuConfig?.groups || []).map((group) => ({
      id: group.slug,
      name: group.name,
      icon: getPlatformIcon(group.icon),
    }))
  }, [menuConfig])

  const activeGroupId = useMemo(() => {
    return groups.find((group) => groupedTabs[group.id]?.some((item) => item.id === activeTab))?.id || null
  }, [activeTab, groupedTabs, groups])

  const currentGroup = groups.find((group) => group.id === openGroupId)

  const sectionedItems = useMemo(() => {
    if (!openGroupId) return []

    const sections = new Map<string, MobileNavItem[]>()
    for (const item of groupedTabs[openGroupId] || []) {
      const key = item.section || 'General'
      if (!sections.has(key)) {
        sections.set(key, [])
      }
      sections.get(key)!.push(item)
    }

    return Array.from(sections.entries())
  }, [groupedTabs, openGroupId])

  const getItemDescription = (item: MobileNavItem, groupName?: string) => {
    if (item.description) return item.description

    const normalizedGroup = (groupName || '').toLowerCase()
    if (normalizedGroup.includes('system')) {
      return `Configure ${item.name.toLowerCase()} for the platform.`
    }
    if (normalizedGroup.includes('tool')) {
      return `Open ${item.name.toLowerCase()} to work with this module.`
    }
    if (normalizedGroup.includes('infrastructure')) {
      return `View and manage ${item.name.toLowerCase()} resources.`
    }
    if (normalizedGroup.includes('data')) {
      return `Manage ${item.name.toLowerCase()} across your workspaces.`
    }

    return `Go to ${item.name.toLowerCase()} and continue working there.`
  }

  const navigateToItem = (item: MobileNavItem) => {
    const currentSpaceSlug = typeof params?.space === 'string' ? params.space : ''
    const isSpaceScopedPath = !!currentSpaceSlug && !!pathname?.startsWith(`/${currentSpaceSlug}/`)

    onTabChange(item.id)
    setOpenGroupId(null)

    if (item.href === '/knowledge' && isSpaceScopedPath) {
      router.push(`/${currentSpaceSlug}/knowledge`)
      return
    }

    router.push(item.href || `/${item.id}`)
  }

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/70 bg-white/90 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden">
        <div className="flex items-stretch gap-1 overflow-x-auto pb-1">
          {groups.map((group) => {
            const Icon = group.icon
            const isActive = activeGroupId === group.id

            return (
              <Button
                key={group.id}
                type="button"
                variant="ghost"
                onClick={() => setOpenGroupId(group.id)}
                className={cn(
                  'h-16 min-w-[78px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-[11px] font-semibold',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-500 hover:bg-zinc-100/80 hover:text-zinc-900'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="max-w-full truncate">{group.name}</span>
              </Button>
            )
          })}
        </div>
      </div>

      <Sheet open={!!openGroupId} onOpenChange={(open) => !open && setOpenGroupId(null)}>
        <SheetContent
          side="bottom"
          className="h-[78vh] rounded-t-[32px] border-x-0 border-b-0 bg-white/95 px-0 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-0 md:hidden"
        >
          <div className="mx-auto mt-3 h-1.5 w-16 rounded-full bg-zinc-300" />
          <SheetHeader className="border-b border-zinc-100 px-5 pb-4 pt-5">
            <SheetTitle>{currentGroup?.name || 'Navigation'}</SheetTitle>
            <SheetDescription>
              Choose a module to open from this section.
            </SheetDescription>
          </SheetHeader>

          <div className="h-[calc(78vh-104px)] overflow-y-auto px-4 py-4">
            <div className="space-y-6">
              {sectionedItems.map(([sectionName, items]) => (
                <div key={sectionName} className="space-y-2">
                  <div className="px-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                    {sectionName}
                  </div>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const Icon = item.icon

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => navigateToItem(item)}
                          className="flex w-full items-start gap-3 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 px-4 py-4 text-left transition hover:border-primary/30 hover:bg-primary/5"
                        >
                          <div className="mt-0.5 rounded-2xl bg-white p-2 text-primary shadow-lg">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-zinc-900">{item.name}</div>
                            <div className="mt-1 text-xs leading-5 text-zinc-500">
                              {getItemDescription(item, currentGroup?.name)}
                            </div>
                          </div>
                          <ChevronRightIcon className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-400" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
