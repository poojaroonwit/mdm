'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight, Edit, FolderTree, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import type { UserGroup } from '../types'
interface GroupTreeNodeProps {
  group: UserGroup
  level: number
  selectedGroupId: string | null
  expandedGroups: Set<string>
  onSelect: (group: UserGroup) => void
  onToggleExpand: (groupId: string) => void
  onEdit: (group: UserGroup) => void
  onDelete: (group: UserGroup) => void
  onAddChild: (parentGroup: UserGroup) => void
}

export function GroupTreeNode({
  group,
  level,
  selectedGroupId,
  expandedGroups,
  onSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddChild
}: GroupTreeNodeProps) {
  const hasChildren = group.children && group.children.length > 0
  const isExpanded = expandedGroups.has(group.id)
  const isSelected = selectedGroupId === group.id

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-300 group/node",
          isSelected 
            ? "bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 shadow-lg" 
            : "hover:bg-zinc-100/80 dark:hover:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400"
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={() => onSelect(group)}
      >
        <button
          className="p-0.5 hover:bg-muted rounded"
          onClick={(e) => {
            e.stopPropagation()
            if (hasChildren) onToggleExpand(group.id)
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )
          ) : (
            <div className="w-4 h-4" />
          )}
        </button>
        <FolderTree className="h-4 w-4 text-muted-foreground" />
        <span className={cn(
          "flex-1 text-sm font-semibold truncate",
          isSelected ? "text-white dark:text-zinc-950" : "text-zinc-700 dark:text-zinc-300"
        )}>
          {group.name}
        </span>
        <Badge 
          variant={isSelected ? "outline" : "secondary"} 
          className={cn(
            "text-[10px] font-black h-5",
            isSelected ? "border-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
          )}
        >
          {group.memberCount || 0}
        </Badge>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(group) }}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Group
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onAddChild(group) }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Child Group
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); onDelete(group) }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {group.children!.map((child) => (
            <GroupTreeNode
              key={child.id}
              group={child}
              level={level + 1}
              selectedGroupId={selectedGroupId}
              expandedGroups={expandedGroups}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}
