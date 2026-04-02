'use client'


import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useSidebar } from '@/contexts/sidebar-context'
import { useSpace } from '@/contexts/space-context'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  Download,
  Workflow,
  ChevronDown,
  ChevronRight,
  Building2,
  Plus,
  BarChart3,
  Kanban,
  FileText,
  Smartphone,
  Database,
  Store,
} from 'lucide-react'
import { AnimatedIcon } from '@/components/ui/animated-icon'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useMenuConfig, MenuGroupConfig, MenuItemConfig } from '@/hooks/useMenuConfig'
import * as LucideIcons from 'lucide-react'
import { sanitizeUrl } from '@/lib/utils/url'
import DOMPurify from 'dompurify'

interface MenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  children?: MenuItem[]
}

const getMenuItems = (
  spaceId: string | null,
  flags?: { assignments?: boolean; bulk_activity?: boolean; workflows?: boolean; dashboard?: boolean; projects?: boolean }
): MenuItem[] => {
  if (!spaceId) {
    return [
      {
        title: 'Others',
        icon: Settings,
        children: [
          { title: 'System Settings', href: `/settings`, icon: Settings },
        ]
      }
    ]
  }

  const items: MenuItem[] = []

  const generalChildren: MenuItem[] = []
  if (flags?.dashboard !== false) {
    generalChildren.push({ title: 'Dashboards', href: `/dashboards`, icon: BarChart3 })
  }
  generalChildren.push({ title: 'Reports', href: `/reports`, icon: FileText })
  if (flags?.assignments !== false) {
    generalChildren.push({ title: 'Assignment', href: `/${spaceId}/assignments`, icon: ClipboardList })
  }
  if (flags?.projects !== false) {
    generalChildren.push({ title: 'Projects', href: `/${spaceId}/projects`, icon: Kanban })
  }
  if (generalChildren.length > 0) {
    items.push({ title: 'General', icon: LayoutDashboard, children: generalChildren })
  }


  items.push({
    title: 'Automation', icon: Workflow, children: [
      { title: 'Workflows', href: `/${spaceId}/workflows`, icon: Workflow },
    ]
  })

  // Channels / Tools
  items.push({
    title: 'Channels', icon: Store, children: [
      { title: 'Marketplace', href: `/marketplace`, icon: Store },
    ]
  })

  const otherChildren: MenuItem[] = []
  if (flags?.bulk_activity !== false) {
    otherChildren.push({ title: 'Bulk Activity', href: `/${spaceId}/import-export`, icon: Download })
  }
  otherChildren.push({ title: 'Users & Roles', href: `/user-roles`, icon: Users })
  otherChildren.push({ title: 'System Settings', href: `/settings`, icon: Settings })
  items.push({ title: 'Others', icon: Settings, children: otherChildren })

  return items
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { settings, isHydrated } = useSidebar()
  const { currentSpace, spaces, setCurrentSpace, isLoading: spacesLoading } = useSpace()
  const { menuConfig, loading: menuLoading } = useMenuConfig()
  const [dynamicModels, setDynamicModels] = useState<any[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [modelsError, setModelsError] = useState<string | null>(null)

  const isActive = (href: string) => pathname === href

  // Get width based on size setting
  const getWidth = () => {
    const size = currentSpace?.sidebar_config?.style?.size || settings.size
    switch (size) {
      case 'small': return 'w-48'
      case 'medium': return 'w-64'
      case 'large': return 'w-80'
      default: return 'w-64'
    }
  }

  // Get background style
  const getBackgroundStyle = () => {
    const style = currentSpace?.sidebar_config?.style
    const bgType = style?.backgroundType || settings.backgroundType
    if (bgType === 'image' && (style?.backgroundImage || settings.backgroundImage)) {
      const img = style?.backgroundImage || settings.backgroundImage
      return {
        backgroundImage: `url(${img})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }
    if (bgType === 'gradient' && style?.gradient?.from && style?.gradient?.to) {
      const angle = style?.gradient?.angle ?? 180
      return {
        backgroundImage: `linear-gradient(${angle}deg, ${style.gradient.from}, ${style.gradient.to})`
      }
    }
    return {
      backgroundColor: style?.backgroundColor || settings.backgroundColor
    }
  }

  // Load data models from API to show under Data Entries
  useEffect(() => {
    async function load() {
      if (!currentSpace?.id) return

      setLoadingModels(true)
      setModelsError(null)
      try {
        const res = await fetch(`/api/data-models?page=1&limit=100&space_id=${currentSpace.id}`)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to load data models')
        }
        const json = await res.json()
        // Prefer pinned models; if none pinned, show all models
        const allModels = (json.dataModels || [])
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
        const pinnedModels = allModels.filter((m: any) => m.is_pinned)
        setDynamicModels(pinnedModels.length > 0 ? pinnedModels : allModels)
      } catch (e: any) {
        setModelsError(e.message || 'Failed to load data models')
      } finally {
        setLoadingModels(false)
      }
    }
    load()
  }, [currentSpace?.id])

  // Don't render until hydrated to prevent flash of default styles
  if (!isHydrated) {
    return (
      <div className={cn('flex h-full flex-col border-r border-border w-64', className)}>
        <div className="p-6">
          <h1 className="text-xl font-bold">{currentSpace?.name || 'Customer Data'}</h1>
        </div>
        <div className="flex-1 px-4">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  const customMenu = currentSpace?.sidebar_config?.menu
  const groups = (menuConfig?.groups || [])

  return (
    <div
      className={cn('flex h-full flex-col border-r border-border', getWidth(), className)}
      style={{
        ...getBackgroundStyle(),
        color: currentSpace?.sidebar_config?.style?.fontColor || settings.fontColor
      }}
    >
      <div className="p-6">
        {spacesLoading ? (
          <div className="text-sm" style={{ color: settings.fontColor, opacity: 0.7 }}>Loading...</div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between text-lg font-bold pr-2 pl-0"
                style={{
                  color: settings.fontColor
                }}
              >
                <div className="flex items-center">
                  <div className="h-9 w-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-lg shadow-blue-600/25 mr-3 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700">
                    <span>{(currentSpace?.name || 'C').substring(0, 1).toUpperCase()}</span>
                  </div>
                  <div className="flex flex-col items-start overflow-hidden whitespace-nowrap">
                    <h1 className="font-bold text-foreground tracking-tight text-lg leading-none mb-0.5">{currentSpace?.name || 'Select Space'}</h1>
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest leading-none">Space</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {spaces.map((space) => (
                <DropdownMenuItem
                  key={space.id}
                  onClick={() => {
                    setCurrentSpace(space)
                    const slug = (space as any).slug || space.id
                    router.push(`/${slug}/dashboard`)
                  }}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>{space.name}</span>
                    {space.is_default && (
                      <span className="ml-2 text-xs text-muted-foreground">(Default)</span>
                    )}
                  </div>
                  {currentSpace?.id === space.id && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </DropdownMenuItem>
              ))}
              {spaces.length > 0 && (
                <>
                  <div className="border-t border-border my-1" />
                  <DropdownMenuItem
                    onClick={() => {
                      sessionStorage.setItem('navigate-to-spaces', 'true')
                      router.push('/spaces')
                    }}
                    className="flex items-center"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>All Spaces</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <div
          className="mt-3 border-t border-border"
          style={{ borderColor: settings.fontColor, opacity: 0.3 }}
        />
      </div>

      <nav className="flex-1 space-y-2 px-4 overflow-y-auto">
        {!currentSpace && (
          <div className="px-2 text-xs" style={{ color: settings.fontColor, opacity: 0.7 }}>
            Select a space to view content
          </div>
        )}

        {menuLoading ? (
          <div className="px-2 py-4 flex items-center justify-center">
            <LucideIcons.RefreshCw className="h-5 w-5 animate-spin" style={{ color: settings.fontColor, opacity: 0.5 }} />
          </div>
        ) : (
          <Accordion type="single" collapsible defaultValue={groups[0]?.name}>
            {groups.map((group: MenuGroupConfig) => {
              const IconComponent = (LucideIcons as any)[group.icon] || LucideIcons.Grid

              // Group items by section
              const itemsBySection: Record<string, MenuItemConfig[]> = {}
              group.items.forEach(item => {
                const section = item.section || 'General'
                if (!itemsBySection[section]) itemsBySection[section] = []
                itemsBySection[section].push(item)
              })

              return (
                <AccordionItem key={group.slug} value={group.name} className="border-none">
                  <AccordionTrigger className="py-2 hover:no-underline md:py-2 px-2 group" style={{ color: settings.fontColor, opacity: 0.9 }}>
                    <div className="flex items-center text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground group-hover:text-foreground transition-colors">
                      <IconComponent className="mr-3 h-4 w-4" />
                      {group.name}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2">
                    <div className="ml-2 space-y-4">
                      {Object.entries(itemsBySection).map(([section, items]) => (
                        <div key={section} className="space-y-1">
                          {Object.keys(itemsBySection).length > 1 && (
                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground/60" style={{ color: settings.fontColor }}>
                              {section}
                            </div>
                          )}
                          {items.map((item) => {
                            const ItemIcon = (LucideIcons as any)[item.icon] || LucideIcons.FileText
                            const isSystemSettings = item.slug === 'settings' && item.href === '/admin/settings'

                            return (
                              <div key={item.slug}>
                                {isSystemSettings ? (
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm h-8"
                                    onClick={() => router.push('/system/settings')}
                                    style={{
                                      color: settings.fontColor,
                                      backgroundColor: 'transparent'
                                    }}
                                  >
                                    <ItemIcon className="mr-2 h-4 w-4" />
                                    {item.name}
                                  </Button>
                                ) : (
                                  <Link href={typeof window !== 'undefined' ? DOMPurify.sanitize(item.href) : item.href}>
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "w-full justify-start text-[13px] font-medium h-9 px-3 rounded-lg group transition-all duration-150",
                                        isActive(item.href) ? "bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                      )}
                                      style={{
                                        color: isActive(item.href) ? 'var(--brand-primary, hsl(var(--primary)))' : undefined,
                                      }}
                                    >
                                      <ItemIcon className={cn(
                                        "mr-3 h-[18px] w-[18px]",
                                        isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                      )} />
                                      <span>{item.name}</span>
                                      {isActive(item.href) && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                      )}
                                    </Button>
                                  </Link>
                                )}
                              </div>
                            )
                          })}

                          {/* Insert Data Entities if this is the Data Workspace group and it's the right section */}
                          {group.slug === 'data-workspace' && section === 'Definition' && currentSpace && (
                            <div className="mt-4 space-y-1">
                              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider opacity-40" style={{ color: settings.fontColor }}>
                                Data Entities
                              </div>
                              {loadingModels && (
                                <div className="px-2 text-xs" style={{ color: settings.fontColor, opacity: 0.7 }}>Loading...</div>
                              )}
                              {modelsError && (
                                <div className="px-2 text-xs text-red-500">{modelsError}</div>
                              )}
                              {(!loadingModels && !modelsError) && (dynamicModels || []).map((m) => {
                                const slug = (m as any).slug || m.id
                                const href = `/${(currentSpace?.slug || currentSpace?.id)}/data/entities/${encodeURIComponent(slug)}`
                                return (
                                  <Link key={m.id} href={typeof window !== 'undefined' ? DOMPurify.sanitize(href) : href}>
                                    <Button
                                      variant="ghost"
                                      className={cn(
                                        "w-full justify-start text-[13px] font-medium h-9 px-3 rounded-lg group transition-all duration-150",
                                        isActive(href) ? "bg-primary/5 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                                      )}
                                      style={{
                                        color: isActive(href) ? 'var(--brand-primary, hsl(var(--primary)))' : undefined,
                                      }}
                                    >
                                      {m.icon ? (
                                        <AnimatedIcon
                                          icon={m.icon}
                                          size={18}
                                          animation="float"
                                          trigger="hover"
                                          className={cn(
                                            "mr-3",
                                            isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                          )}
                                        />
                                      ) : (
                                        <span className={cn(
                                          "mr-3 inline-flex h-4 w-4 items-center justify-center rounded bg-muted font-bold text-[10px]",
                                          isActive(href) ? "text-primary bg-primary/10" : "text-muted-foreground"
                                        )}>
                                          {(String(m.display_name || m.name || '')?.slice(0, 1) || '?').toUpperCase()}
                                        </span>
                                      )}
                                      <span>{m.display_name || m.name}</span>
                                      {isActive(href) && (
                                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                      )}
                                    </Button>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </nav>
    </div>
  )
}
