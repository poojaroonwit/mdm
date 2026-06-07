'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, FileIcon, Minus, Tag, Type, Heading, Image, Badge, Folder } from 'lucide-react'
import toast from 'react-hot-toast'
import { SpacesEditorManager, SpacesEditorPage } from '@/lib/space-studio-manager'
import { UnifiedPage } from './types'
import { ComponentSettingsDialog } from './ComponentSettingsDialog'
import { ComponentConfig } from './types'
import { LoginPageItem } from './LoginPageItem'
import { PageAlignmentSection } from './PageAlignmentSection'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'

interface PagesTabProps {
  spaceId: string
  isMobileViewport: boolean
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  selectedPageId: string | null
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsGroupIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  // Sidebar visibility functions removed - pages now use secondary platform sidebar
  componentConfigs: Record<string, ComponentConfig>
  handleComponentConfigUpdate: (type: string, updates: Partial<ComponentConfig>) => void
}

export function PagesTab({
  spaceId,
  isMobileViewport,
  allPages,
  pages,
  selectedPageId,
  allIcons,
  reactIcons,
  setPages,
  setAllPages,
  setSelectedPageId,
  setSelectedComponent,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsGroupIds,
  setPermissionsDialogOpen,
  handlePageReorder,
  componentConfigs,
  handleComponentConfigUpdate,
}: PagesTabProps) {
  const [iconPickerOpen, setIconPickerOpen] = useState<string | null>(null)
  const [colorPickerOpen, setColorPickerOpen] = useState<string | null>(null)
  const [componentSettingsOpen, setComponentSettingsOpen] = useState(false)
  const [sidebarPositionOpen, setSidebarPositionOpen] = useState<string | null>(null)

  const handleIconUpdate = useCallback(async (pageId: string, icon: string) => {
    try {
      await SpacesEditorManager.updatePage(spaceId, pageId, { icon })
      setPages((prev) => prev.map((x) => x.id === pageId ? { ...x, icon } : x))
    } catch (err) {
      throw err // Let IconPicker handle the error toast
    }
  }, [spaceId, setPages])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Handle drag end
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    // Move to alignment zones by dropping on zone containers
    if (over.id === 'zone-top' || over.id === 'zone-bottom') {
      const toBottom = over.id === 'zone-bottom'
      const draggedIndex = allPages.findIndex(p => p.id === active.id)
      if (draggedIndex !== -1) {
        const dragged = allPages[draggedIndex]
        // Persist the change to backend if it's a custom page
        if (dragged.type === 'custom' && dragged.page) {
          try {
            await SpacesEditorManager.updatePage(spaceId, dragged.page.id, { sidebarPosition: toBottom ? 'bottom' : undefined } as any)
          } catch (err) {
            console.error('Failed to update page sidebar position:', err)
            toast.error('Failed to update page alignment')
            return
          }
        }
        setAllPages(prev => {
          // Remove from any group children and root
          const stripFromGroups = (arr: UnifiedPage[]) => arr.map(p => {
            if ((p as any).type === 'group' && Array.isArray((p as any).children)) {
              return { ...p, children: (p as any).children.filter((c: any) => c.id !== dragged.id) } as any
            }
            return p
          })
          let next = stripFromGroups(prev)
          next = next.filter(p => p.id !== dragged.id)
          // Split zones and push item to end of destination zone
          const tops = next.filter((p: any) => p.sidebarPosition !== 'bottom')
          const bottoms = next.filter((p: any) => p.sidebarPosition === 'bottom')
          const updated: any = { ...dragged }
          if (toBottom) updated.sidebarPosition = 'bottom'; else delete updated.sidebarPosition
          if (toBottom) bottoms.push(updated); else tops.push(updated)
          return [...tops, ...bottoms]
        })
        toast.success(`Page moved to ${toBottom ? 'bottom' : 'top'} alignment`)
      }
      return
    }

    // Handle drop into group container
    if (String(over.id).startsWith('group-drop-')) {
      const groupId = String(over.id).replace('group-drop-', '')
      const draggedIndex = allPages.findIndex(p => p.id === active.id)
      if (draggedIndex === -1) return
      const draggedItem = allPages[draggedIndex]
      // Do not allow groups inside groups for now
      if ((draggedItem as any).type === 'group') return
      setAllPages(prev => {
        // Remove from any existing group children first
        const removeFromGroups = (pagesArr: UnifiedPage[]) => pagesArr.map(p => {
          if ((p as any).type === 'group' && Array.isArray((p as any).children)) {
            return { ...p, children: (p as any).children.filter((c: any) => c.id !== draggedItem.id) } as any
          }
          return p
        })
        let next = removeFromGroups(prev)
        // Remove from root list
        next = next.filter(p => p.id !== draggedItem.id)
        // Add to target group children
        next = next.map(p => {
          if (p.id === groupId) {
            const children = ([...((p as any).children || []), draggedItem]) as UnifiedPage[]
            return { ...p, children } as any
          }
          return p
        })
        return next
      })
      return
    }

    const oldIndex = allPages.findIndex((page) => page.id === active.id)
    const newIndex = allPages.findIndex((page) => page.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    // Use the handlePageReorder callback which handles state updates and persistence
    await handlePageReorder(oldIndex, newIndex, allPages, pages)
  }, [allPages, pages, handlePageReorder])

  return (
    <div className="mb-4 px-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`${isMobileViewport ? 'text-base' : 'text-sm'} font-semibold`}>Pages</div>
        {/* Add menu for overall header -> targets top by default */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size={isMobileViewport ? "default" : "sm"} variant="outline">
              <Plus className={`${isMobileViewport ? 'h-5 w-5' : 'h-4 w-4'} mr-1`} /> Add
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={async () => {
              try {
                const newPage = await SpacesEditorManager.createPage(spaceId, { name: `page-${Date.now()}`, displayName: 'New Page' })
                setPages((prev) => [newPage, ...prev])
                setAllPages((prev) => [...prev, { id: newPage.id, name: newPage.displayName || newPage.name, type: 'custom', page: newPage } as any])
                setSelectedComponent('canvas')
                setSelectedPageId(newPage.id)
                toast.success('Page created')
              } catch (e) { toast.error('Failed to create page'); console.error(e) }
            }}>
              <FileIcon className="mr-2 h-4 w-4" />
              <span>Page</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `separator-${Date.now()}`, name: 'Separator', type: 'separator' } as any]); toast.success('Separator added') }}>
              <Minus className="mr-2 h-4 w-4" />
              <span>Separator</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `label-${Date.now()}`, name: 'Label', type: 'label', label: 'New Label' } as any]); toast.success('Label added') }}>
              <Tag className="mr-2 h-4 w-4" />
              <span>Label</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `text-${Date.now()}`, name: 'Text', type: 'text', text: 'Text' } as any]); toast.success('Text added') }}>
              <Type className="mr-2 h-4 w-4" />
              <span>Text</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `header-${Date.now()}`, name: 'Header', type: 'header', headerText: 'Header' } as any]); toast.success('Header added') }}>
              <Heading className="mr-2 h-4 w-4" />
              <span>Header</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `image-${Date.now()}`, name: 'Logo', type: 'image', imageUrl: '', imageAlt: 'Logo' } as any]); toast.success('Image added') }}>
              <Image className="mr-2 h-4 w-4" />
              <span>Image Logo</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `badge-${Date.now()}`, name: 'Badge', type: 'badge', badgeText: 'New', badgeColor: '#ef4444' } as any]); toast.success('Badge added') }}>
              <Badge className="mr-2 h-4 w-4" />
              <span>Badge</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setAllPages((prev) => [...prev, { id: `group-${Date.now()}`, name: 'Group', type: 'group', children: [] } as any]); toast.success('Group added') }}>
              <Folder className="mr-2 h-4 w-4" />
              <span>Group</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Login Page - Always at the top */}
      <div className={`${isMobileViewport ? 'mb-4' : 'mb-3'}`}>
        <LoginPageItem
          page={{ id: 'login-page', name: 'Login Page', type: 'login' }}
          index={-1}
          isMobileViewport={isMobileViewport}
          spaceId={spaceId}
          selectedPageId={selectedPageId}
          setSelectedPageId={setSelectedPageId}
        />
      </div>

      {/* Unified Pages List with Drag & Drop */}
      {allPages.length === 0 ? (
        <div className={`${isMobileViewport ? 'text-sm' : 'text-xs'} text-muted-foreground`}>No pages</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          {(() => {
            const topItems = allPages.filter((page) => (page as any).sidebarPosition !== 'bottom' && page.type !== 'login')
            const bottomItems = allPages.filter((page) => (page as any).sidebarPosition === 'bottom' && page.type !== 'login')

            return (
              <div className="space-y-4">
                <PageAlignmentSection
                  zoneId="zone-top"
                  title="Top alignment"
                  activeDropText="Drop to move to top"
                  idleDropText="Drop here for top alignment"
                  items={topItems}
                  allPages={allPages}
                  pages={pages}
                  isMobileViewport={isMobileViewport}
                  spaceId={spaceId}
                  selectedPageId={selectedPageId}
                  allIcons={allIcons}
                  reactIcons={reactIcons}
                  iconPickerOpen={iconPickerOpen}
                  colorPickerOpen={colorPickerOpen}
                  sidebarPositionOpen={sidebarPositionOpen}
                  handlePageReorder={handlePageReorder}
                  handleIconUpdate={handleIconUpdate}
                  setPages={setPages}
                  setAllPages={setAllPages}
                  setSelectedPageId={setSelectedPageId}
                  setSelectedComponent={setSelectedComponent}
                  setSelectedPageForPermissions={setSelectedPageForPermissions}
                  setPermissionsRoles={setPermissionsRoles}
                  setPermissionsUserIds={setPermissionsUserIds}
                  setPermissionsGroupIds={setPermissionsGroupIds}
                  setPermissionsDialogOpen={setPermissionsDialogOpen}
                  setComponentSettingsOpen={setComponentSettingsOpen}
                  setIconPickerOpen={setIconPickerOpen}
                  setColorPickerOpen={setColorPickerOpen}
                  setSidebarPositionOpen={setSidebarPositionOpen}
                />

                <PageAlignmentSection
                  zoneId="zone-bottom"
                  title="Bottom alignment"
                  activeDropText="Drop to move to bottom"
                  idleDropText="Drop here for bottom alignment"
                  items={bottomItems}
                  allPages={allPages}
                  pages={pages}
                  isMobileViewport={isMobileViewport}
                  spaceId={spaceId}
                  selectedPageId={selectedPageId}
                  allIcons={allIcons}
                  reactIcons={reactIcons}
                  iconPickerOpen={iconPickerOpen}
                  colorPickerOpen={colorPickerOpen}
                  sidebarPositionOpen={sidebarPositionOpen}
                  handlePageReorder={handlePageReorder}
                  handleIconUpdate={handleIconUpdate}
                  setPages={setPages}
                  setAllPages={setAllPages}
                  setSelectedPageId={setSelectedPageId}
                  setSelectedComponent={setSelectedComponent}
                  setSelectedPageForPermissions={setSelectedPageForPermissions}
                  setPermissionsRoles={setPermissionsRoles}
                  setPermissionsUserIds={setPermissionsUserIds}
                  setPermissionsGroupIds={setPermissionsGroupIds}
                  setPermissionsDialogOpen={setPermissionsDialogOpen}
                  setComponentSettingsOpen={setComponentSettingsOpen}
                  setIconPickerOpen={setIconPickerOpen}
                  setColorPickerOpen={setColorPickerOpen}
                  setSidebarPositionOpen={setSidebarPositionOpen}
                />
              </div>
            )
          })()}
        </DndContext>
      )}
      
      {/* Component Settings Dialog */}
      <ComponentSettingsDialog
        open={componentSettingsOpen}
        onOpenChange={setComponentSettingsOpen}
        isMobileViewport={isMobileViewport}
        componentConfigs={componentConfigs}
        handleComponentConfigUpdate={handleComponentConfigUpdate}
      />
    </div>
  )
}

