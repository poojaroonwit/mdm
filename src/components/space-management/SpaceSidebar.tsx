'use client'

import { memo, useCallback, useState, useEffect, useMemo, useRef, useContext } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Building2, Layout, Users as UsersIcon, Database, FolderPlus, Archive, AlertTriangle, ChevronDown, ChevronRight, Settings, Plus, MoreVertical, Trash2, Pencil, FileIcon, Search, Lock } from 'lucide-react'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { PermissionsDialog } from '@/components/studio/layout-config/PermissionsDialog'
import { useSpace } from '@/contexts/space-context'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import { IconPicker } from '@/components/ui/icon-picker'
import * as LucideIcons from 'lucide-react'

interface SpaceSidebarProps {
  spaceId: string
  spaceSlug: string
  activePageId?: string
  editMode?: boolean
  onPageChange?: (pageId: string) => void
}

const SPACE_SETTINGS_ITEMS = [
  {
    id: 'details',
    label: 'Space Details',
    icon: Building2,
    tooltip: 'Name, description, and basic info',
    path: '/settings?tab=details'
  },
  {
    id: 'members',
    label: 'Members',
    icon: UsersIcon,
    tooltip: 'Manage team members and permissions',
    path: '/settings?tab=members'
  },
  {
    id: 'data-model',
    label: 'Data Model',
    icon: Database,
    tooltip: 'Manage data models and entities',
    path: '/settings?tab=data-model'
  },
  {
    id: 'attachments',
    label: 'Attachments',
    icon: FolderPlus,
    tooltip: 'Manage file storage and attachments',
    path: '/settings?tab=attachments'
  },
  {
    id: 'restore',
    label: 'Backup and Restore',
    icon: Archive,
    tooltip: 'Backup and restore data',
    path: '/settings?tab=restore'
  },
  {
    id: 'danger',
    label: 'Danger Zone',
    icon: AlertTriangle,
    tooltip: 'Delete space and irreversible actions',
    path: '/settings?tab=danger'
  }
] as const

// Sortable Page Item Component
interface SortablePageItemProps {
  page: SpacesEditorPage
  isActive: boolean
  editMode: boolean
  onPageClick: (page: SpacesEditorPage) => void
  onDelete: (pageId: string) => void
  onRename: (page: SpacesEditorPage) => void
  onPermissions: (page: SpacesEditorPage) => void
  menuOpen: string | null
  onMenuOpenChange: (pageId: string | null) => void
}

function SortablePageItem({
  page,
  isActive,
  editMode,
  onPageClick,
  onDelete,
  onRename,
  onPermissions,
  menuOpen,
  onMenuOpenChange
}: SortablePageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Resolve icon from page.icon string
  const IconComponent = useMemo(() => {
    if (!page.icon) return FileIcon
    // If icon is stored as "lucide-IconName", extract the name
    const iconName = page.icon.startsWith('lucide-') 
      ? page.icon.replace('lucide-', '') 
      : page.icon
    const Icon = (LucideIcons as any)[iconName] as React.ComponentType<{ className?: string }>
    return Icon || FileIcon
  }, [page.icon])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'z-50' : ''}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex items-center w-full">
            <Button
              variant="ghost"
              onClick={() => onPageClick(page)}
              {...(editMode ? { ...attributes, ...listeners } : {})}
              className={cn(
                "platform-sidebar-menu-button w-full justify-center text-[13px] font-medium h-[32px] px-4 transition-colors duration-150 cursor-pointer text-foreground hover:!bg-transparent hover:!text-foreground rounded-none gap-3",
                editMode ? 'cursor-grab active:cursor-grabbing' : '',
                isActive
                  ? "bg-[var(--primary-light)]/10 text-[var(--primary-light)] font-bold rounded-sm shadow-sm"
                  : ""
              )}
              style={{ 
                pointerEvents: 'auto', 
                position: 'relative', 
                zIndex: Z_INDEX.sidebar + 1
              }}
            >
              <IconComponent className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{page.displayName || page.name || 'Untitled Page'}</span>
              {editMode && <div className="h-8 w-8 flex-shrink-0" />}
            </Button>
            {editMode && (
              <Popover open={menuOpen === page.id} onOpenChange={(open) => onMenuOpenChange(open ? page.id : null)}>
                <PopoverTrigger asChild>
                  <a
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation()
                    }}
                    className="h-8  p-2 absolute right-1 flex items-center justify-center bg-transparent border-0 hover:bg-transparent p-0"
                    style={{ 
                      color: 'hsl(var(--primary))',
                      zIndex: Z_INDEX.dropdown,
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </a>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-40 bg-popover" 
                  align="start" 
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-col">
                    <button
                      onClick={() => {
                        onRename(page)
                        onMenuOpenChange(null)
                      }}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <Pencil className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Rename</span>
                    </button>
                    <button
                      onClick={() => {
                        onPermissions(page)
                        onMenuOpenChange(null)
                      }}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    >
                      <Lock className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Permissions</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this page?')) {
                          onDelete(page.id)
                        }
                        onMenuOpenChange(null)
                      }}
                      className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-destructive focus:bg-accent focus:text-destructive text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Delete</span>
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{page.displayName || page.name || 'Untitled Page'}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export const SpaceSidebar = memo(function SpaceSidebar({ 
  spaceId,
  spaceSlug,
  activePageId,
  editMode = false,
  onPageChange
}: SpaceSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { spaces, currentSpace, setCurrentSpace } = useSpace()
  const [pages, setPages] = useState<SpacesEditorPage[]>([])
  const [isLoadingPages, setIsLoadingPages] = useState(true)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false)
  const [renameDialogOpen, setRenameDialogOpen] = useState(false)
  const [pageToRename, setPageToRename] = useState<SpacesEditorPage | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [pageMenuOpen, setPageMenuOpen] = useState<string | null>(null)

  // Permissions state
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [selectedPageForPermissions, setSelectedPageForPermissions] = useState<SpacesEditorPage | null>(null)
  const [spaceUsers, setSpaceUsers] = useState<Array<{ id: string; name: string; email: string; space_role: string }>>([])
  const [permissionsRoles, setPermissionsRoles] = useState<string[]>([])
  const [permissionsUserIds, setPermissionsUserIds] = useState<string[]>([])
  const [permissionsGroupIds, setPermissionsGroupIds] = useState<string[]>([])
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load pages from layout config - refresh on spaceId or pathname change
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setIsLoadingPages(true)
        const spacePages = await SpacesEditorManager.getPages(spaceId)
        if (mounted) {
          setPages(spacePages || [])
        }
      } catch (error) {
        console.error('Error loading pages:', error)
      } finally {
        if (mounted) {
          setIsLoadingPages(false)
        }
      }
    })()

    // Load users and groups if spaceId is available
    if (spaceId) {
      fetch(`/api/spaces/${spaceId}/users`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (mounted) setSpaceUsers(data.users || [])
        })
        .catch(err => console.error('Failed to load users', err))
        
      fetch('/api/user-groups', { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (mounted) setUserGroups(data.groups || [])
        })
        .catch(err => console.error('Failed to load groups', err))
    }

    return () => { mounted = false }
  }, [spaceId, pathname])

  // Check if we're on a settings page to expand settings menu
  useEffect(() => {
    if (pathname?.includes('/settings')) {
      setIsSettingsExpanded(true)
    }
  }, [pathname])

  // Determine active settings item based on pathname
  const activeSettingsItem = useMemo(() => {
    if (!pathname?.includes('/settings')) return null
    const tab = new URLSearchParams(window.location.search).get('tab') || 'details'
    return tab
  }, [pathname])

  const handlePageClick = useCallback((page: SpacesEditorPage) => {
    // Always use the correct route structure with the actual page ID
    // Don't rely on page.path as it may have incorrect format
    const pagePath = `/${spaceSlug}/page/${page.id}`
    
    // If in edit mode, check if page has a layout configured
    if (editMode) {
      // Check if page has layout config (placedWidgets or layoutConfig)
      const hasLayout = (page as any).placedWidgets || (page as any).layoutConfig
      
      if (!hasLayout) {
        // Show layout selection first
        router.push(`/${spaceSlug}/page/${page.id}/layout?editMode=true`)
      } else {
        // Page has layout, go directly to editor
        router.push(`${pagePath}?editMode=true`)
      }
    } else {
      // Not in edit mode, just navigate to page
      router.push(pagePath)
    }
    
    if (onPageChange) {
      onPageChange(page.id)
    }
  }, [router, spaceSlug, onPageChange, editMode])

  const handleSettingsItemClick = useCallback((item: typeof SPACE_SETTINGS_ITEMS[number]) => {
    // Add from=space-sidebar parameter to show space sidebar and activate Data Management
    const separator = item.path.includes('?') ? '&' : '?'
    router.push(`/${spaceSlug}${item.path}${separator}from=space-sidebar`)
  }, [router, spaceSlug])

  const toggleSettingsExpanded = useCallback(() => {
    setIsSettingsExpanded(prev => !prev)
  }, [])

  const handleDeletePage = useCallback(async (pageId: string) => {
    try {
      await SpacesEditorManager.deletePage(spaceId, pageId)
      const spacePages = await SpacesEditorManager.getPages(spaceId)
      setPages(spacePages || [])
      toast.success('Page deleted')
      setPageMenuOpen(null)
    } catch (error) {
      console.error('Error deleting page:', error)
      toast.error('Failed to delete page')
    }
  }, [spaceId])

  const handleRenamePage = useCallback(async () => {
    if (!pageToRename || !renameValue.trim()) return
    
    try {
      const updateData: any = {
        displayName: renameValue.trim()
      }
      if (selectedIcon) {
        updateData.icon = selectedIcon
      }
      await SpacesEditorManager.updatePage(spaceId, pageToRename.id, updateData)
      const spacePages = await SpacesEditorManager.getPages(spaceId)
      setPages(spacePages || [])
      toast.success('Page updated')
      setRenameDialogOpen(false)
      setPageToRename(null)
      setRenameValue('')
      setSelectedIcon('')
      setPageMenuOpen(null)
    } catch (error) {
      console.error('Error updating page:', error)
      toast.error('Failed to update page')
    }
  }, [spaceId, pageToRename, renameValue, selectedIcon])

  const openRenameDialog = useCallback((page: SpacesEditorPage) => {
    setPageToRename(page)
    setRenameValue(page.displayName || page.name || '')
    setSelectedIcon(page.icon || '')
    setRenameDialogOpen(true)
    setPageMenuOpen(null)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = pages.findIndex((p) => p.id === active.id)
    const newIndex = pages.findIndex((p) => p.id === over.id)

    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedPages = [...pages]
      const [movedPage] = reorderedPages.splice(oldIndex, 1)
      reorderedPages.splice(newIndex, 0, movedPage)

      // Update order values
      const updatedPages = reorderedPages.map((page, index) => ({
        ...page,
        order: index + 1
      }))

      setPages(updatedPages)

      // Save order to backend
      try {
        await Promise.all(
          updatedPages.map((page) =>
            SpacesEditorManager.updatePage(spaceId, page.id, { order: page.order })
          )
        )
        toast.success('Pages reordered')
      } catch (error) {
        console.error('Error reordering pages:', error)
        toast.error('Failed to save page order')
        // Revert on error
        const spacePages = await SpacesEditorManager.getPages(spaceId)
        setPages(spacePages || [])
      }
    }
  }, [pages, spaceId])

  const handleAddPage = useCallback(async () => {
    try {
      // Create page under space module
      const newPage = await SpacesEditorManager.createPage(spaceId, {
        name: `page-${Date.now()}`,
        displayName: 'New Page',
        description: 'A new page'
        // Don't set path here - we'll update it after creation with the correct page ID
      } as any)
      // Update the page path to use the correct route structure with the actual page ID
      await SpacesEditorManager.updatePage(spaceId, newPage.id, {
        ...newPage,
        path: `/${spaceSlug}/page/${newPage.id}`
      })
      // Reload pages
      const spacePages = await SpacesEditorManager.getPages(spaceId)
      setPages(spacePages || [])
      toast.success('Page created')
      // Always use the correct route structure with the actual page ID
      // If in edit mode, navigate to layout selection first
      if (editMode) {
        router.push(`/${spaceSlug}/page/${newPage.id}/layout?editMode=true`)
      } else {
        // Not in edit mode, navigate to page using the correct route structure
        // Always use the actual page ID, not the path property which may have incorrect ID
        router.push(`/${spaceSlug}/page/${newPage.id}`)
      }
    } catch (error) {
      console.error('Error creating page:', error)
      toast.error('Failed to create page')
    }
  }, [spaceId, spaceSlug, router, editMode])

  // Use same styling as secondary platform sidebar
  const sidebarBg = 'var(--brand-secondary-sidebar-bg, hsl(var(--muted)))'
  const sidebarText = 'var(--brand-secondary-sidebar-text, hsl(var(--muted-foreground)))'

  return (
    <TooltipProvider>
      <div 
        className="w-full flex flex-col h-full"
        data-sidebar="secondary"
        data-component="space-sidebar"
        style={{
          backgroundColor: sidebarBg,
          color: sidebarText
        }}
      >
        <nav className="flex-1 flex flex-col p-2.5 space-y-1 overflow-y-auto">
          {/* Pages Section */}
       
            <div className="px-2.5 py-1.5">
              <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.1em]">
                Pages
              </div>
            </div>
            {(pages.length > 0 || editMode) && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={pages.filter(page => !page.hidden).map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-0.5 mt-1">
                    {pages
                      .filter(page => !page.hidden)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((page) => {
                        const isActive = activePageId === page.id || pathname?.includes(`/page/${page.id}`)
                        return (
                          <SortablePageItem
                            key={page.id}
                            page={page}
                            isActive={isActive}
                            editMode={editMode}
                            onPageClick={handlePageClick}
                            onDelete={handleDeletePage}
                            onRename={openRenameDialog}
                            onPermissions={(page: SpacesEditorPage) => {
                              setSelectedPageForPermissions(page)
                              setPermissionsRoles(page.permissions?.roles || [])
                              setPermissionsUserIds(page.permissions?.userIds || [])
                              setPermissionsGroupIds(page.permissions?.groupIds || [])
                              setPermissionsDialogOpen(true)
                            }}
                            menuOpen={pageMenuOpen}
                            onMenuOpenChange={setPageMenuOpen}
                          />
                        )
                      })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
         

          {/* Space Settings Section */}
          <div>
            <Button
              variant="ghost"
              onClick={toggleSettingsExpanded}
              className={cn(
                "platform-sidebar-menu-button w-full justify-start text-[13px] font-medium h-[32px] px-4 transition-colors duration-150 cursor-pointer text-foreground hover:!bg-transparent hover:!text-foreground rounded-none"
              )}
              style={{ 
                pointerEvents: 'auto', 
                position: 'relative', 
                zIndex: Z_INDEX.sidebar + 1
              }}
            >
              <Settings className="h-4 w-4 mr-3 flex-shrink-0" />
              <span className="truncate flex-1 text-left">Space Settings</span>
              {isSettingsExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
            </Button>

            {isSettingsExpanded && (
              <div className="mt-1 space-y-0.5 pl-4">
                {SPACE_SETTINGS_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSettingsItem === item.id
                  const isDanger = item.id === 'danger'
                  return (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          onClick={() => handleSettingsItemClick(item)}
                          className={cn(
                            "platform-sidebar-menu-button w-full justify-center text-[13px] font-medium h-[32px] px-4 transition-colors duration-150 cursor-pointer text-foreground hover:!bg-transparent hover:!text-foreground rounded-none gap-3",
                            isActive
                              ? "bg-[var(--primary-light)]/10 text-[var(--primary-light)] font-bold rounded-sm shadow-sm"
                              : "",
                            isDanger ? "text-destructive hover:text-destructive/80 hover:bg-destructive/10" : ""
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
                })}
              </div>
            )}
          </div>

          {/* Add New Page Menu Item - At bottom when edit mode is enabled */}
          {editMode && (
            <div className="mt-auto pt-2.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handleAddPage()
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:bg-muted/50 rounded-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Page</span>
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add New Page</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}

        </nav>
      </div>

      {/* Rename Page Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update the name and icon for this page.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Page Name</label>
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Page name"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenamePage()
                  }
                }}
                autoFocus
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <IconPicker
                value={selectedIcon}
                onChange={setSelectedIcon}
                placeholder="Search icons..."
                grouped={true}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false)
                setPageToRename(null)
                setRenameValue('')
                setSelectedIcon('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenamePage} disabled={!renameValue.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {spaceId && (
        <PermissionsDialog
          open={permissionsDialogOpen}
          onOpenChange={setPermissionsDialogOpen}
          spaceId={spaceId}
          selectedPageForPermissions={selectedPageForPermissions}
          spaceUsers={spaceUsers}
          permissionsRoles={permissionsRoles}
          permissionsUserIds={permissionsUserIds}
          permissionsGroupIds={permissionsGroupIds}
          userGroups={userGroups}
          setPermissionsRoles={setPermissionsRoles}
          setPermissionsUserIds={setPermissionsUserIds}
          setPermissionsGroupIds={setPermissionsGroupIds}
          setSelectedPageForPermissions={setSelectedPageForPermissions}
          setPages={setPages}
        />
      )}
    </TooltipProvider>
  )
})

