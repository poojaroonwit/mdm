import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import type { SpacesEditorPage } from '@/lib/space-studio-manager'
import type { UnifiedPage } from './types'
import { BadgeItem } from './BadgeItem'
import { GroupItem } from './GroupItem'
import { HeaderItem } from './HeaderItem'
import { ImageItem } from './ImageItem'
import { LabelItem } from './LabelItem'
import { PageListItem } from './PageListItem'
import { SeparatorItem } from './SeparatorItem'
import { SortablePageItem } from './SortablePageItem'
import { TextItem } from './TextItem'

interface PageAlignmentSectionProps {
  zoneId: string
  title: string
  activeDropText: string
  idleDropText: string
  items: UnifiedPage[]
  allPages: UnifiedPage[]
  pages: SpacesEditorPage[]
  isMobileViewport: boolean
  spaceId: string
  selectedPageId: string | null
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
  iconPickerOpen: string | null
  colorPickerOpen: string | null
  sidebarPositionOpen: string | null
  handlePageReorder: (fromIndex: number, toIndex: number, currentPages: UnifiedPage[], currentCustomPages: SpacesEditorPage[]) => Promise<void>
  handleIconUpdate: (pageId: string, icon: string) => Promise<void>
  setPages: React.Dispatch<React.SetStateAction<SpacesEditorPage[]>>
  setAllPages: React.Dispatch<React.SetStateAction<UnifiedPage[]>>
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedComponent: React.Dispatch<React.SetStateAction<string | null>>
  setSelectedPageForPermissions: React.Dispatch<React.SetStateAction<SpacesEditorPage | null>>
  setPermissionsRoles: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsGroupIds: React.Dispatch<React.SetStateAction<string[]>>
  setPermissionsDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  setComponentSettingsOpen: React.Dispatch<React.SetStateAction<boolean>>
  setIconPickerOpen: React.Dispatch<React.SetStateAction<string | null>>
  setColorPickerOpen: React.Dispatch<React.SetStateAction<string | null>>
  setSidebarPositionOpen: React.Dispatch<React.SetStateAction<string | null>>
}

export function PageAlignmentSection({
  zoneId,
  title,
  activeDropText,
  idleDropText,
  items,
  allPages,
  pages,
  isMobileViewport,
  spaceId,
  selectedPageId,
  allIcons,
  reactIcons,
  iconPickerOpen,
  colorPickerOpen,
  sidebarPositionOpen,
  handlePageReorder,
  handleIconUpdate,
  setPages,
  setAllPages,
  setSelectedPageId,
  setSelectedComponent,
  setSelectedPageForPermissions,
  setPermissionsRoles,
  setPermissionsUserIds,
  setPermissionsGroupIds,
  setPermissionsDialogOpen,
  setComponentSettingsOpen,
  setIconPickerOpen,
  setColorPickerOpen,
  setSidebarPositionOpen
}: PageAlignmentSectionProps) {
  const { setNodeRef, isOver } = useDroppable({ id: zoneId })

  const renderPage = (page: UnifiedPage) => {
    const index = allPages.findIndex((candidate) => candidate.id === page.id)
    const isGroup = (page as any).type === 'group'

    if (isGroup) {
      return (
        <GroupItem
          key={page.id}
          page={page as UnifiedPage & { type: 'group'; children?: UnifiedPage[] }}
          index={index}
          isMobileViewport={isMobileViewport}
          allPages={allPages}
          pages={pages}
          setAllPages={setAllPages}
          setPages={setPages}
          spaceId={spaceId}
          selectedPageId={selectedPageId}
          allIcons={allIcons}
          reactIcons={reactIcons}
          iconPickerOpen={iconPickerOpen}
          colorPickerOpen={colorPickerOpen}
          sidebarPositionOpen={sidebarPositionOpen}
          handlePageReorder={handlePageReorder}
          handleIconUpdate={handleIconUpdate}
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
      )
    }

    if (page.type === 'separator') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <SeparatorItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    if (page.type === 'label') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <LabelItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    if (page.type === 'text') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <TextItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    if (page.type === 'header') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <HeaderItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    if (page.type === 'image') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <ImageItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    if (page.type === 'badge') {
      return (
        <SortablePageItem key={page.id} page={page} index={index}>
          <BadgeItem
            page={page}
            index={index}
            isMobileViewport={isMobileViewport}
            allPages={allPages}
            pages={pages}
            handlePageReorder={handlePageReorder}
            setAllPages={setAllPages}
          />
        </SortablePageItem>
      )
    }

    return (
      <SortablePageItem key={page.id} page={page} index={index}>
        <PageListItem
          page={page}
          index={index}
          isMobileViewport={isMobileViewport}
          spaceId={spaceId}
          selectedPageId={selectedPageId}
          allPages={allPages}
          pages={pages}
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
      </SortablePageItem>
    )
  }

  return (
    <div>
      <div
        ref={setNodeRef}
        className={`mb-2 flex min-h-[48px] items-center justify-center rounded-md border-2 transition-colors ${isOver ? 'border-primary bg-primary/20' : 'border-dashed border-transparent bg-muted/30 hover:border-muted-foreground/50'}`}
        title={`Drop here to move to ${title}`}
      >
        <span className={`text-xs text-muted-foreground ${isOver ? 'font-medium text-primary' : ''}`}>
          {isOver ? activeDropText : idleDropText}
        </span>
      </div>
      <div className={`${isMobileViewport ? 'text-xs' : 'text-[11px]'} mb-1 font-semibold text-muted-foreground`}>
        {title}
      </div>
      <SortableContext items={items.map((page) => page.id)} strategy={verticalListSortingStrategy}>
        <div className={isMobileViewport ? 'space-y-2' : 'space-y-1'}>
          {items.map(renderPage)}
        </div>
      </SortableContext>
    </div>
  )
}
