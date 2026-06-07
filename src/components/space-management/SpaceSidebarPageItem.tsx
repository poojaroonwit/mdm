'use client'

import { useMemo } from 'react'
import type { ComponentType } from 'react'
import { FileIcon, Lock, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SpacesEditorPage } from '@/lib/space-studio-manager'
import { cn } from '@/lib/utils'
import { Z_INDEX } from '@/lib/z-index'

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

export function SortablePageItem({
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

  const IconComponent = useMemo(() => {
    if (!page.icon) return FileIcon
    const iconName = page.icon.startsWith('lucide-')
      ? page.icon.replace('lucide-', '')
      : page.icon
    const Icon = (LucideIcons as any)[iconName] as ComponentType<{ className?: string }>
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
                'platform-sidebar-menu-button w-full justify-center text-[13px] font-medium h-[32px] px-4 transition-colors duration-150 cursor-pointer text-foreground hover:!bg-transparent hover:!text-foreground rounded-none gap-3',
                editMode ? 'cursor-grab active:cursor-grabbing' : '',
                isActive
                  ? 'bg-[var(--primary-light)]/10 text-[var(--primary-light)] font-bold rounded-sm shadow-sm'
                  : ''
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
                    onClick={(event) => {
                      event.stopPropagation()
                    }}
                    onMouseDown={(event) => {
                      event.stopPropagation()
                    }}
                    className="h-8 p-2 absolute right-1 flex items-center justify-center bg-transparent border-0 hover:bg-transparent p-0"
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
                  onClick={(event) => event.stopPropagation()}
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
