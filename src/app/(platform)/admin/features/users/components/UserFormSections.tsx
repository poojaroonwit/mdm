'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Folder, FolderTree, Plus, Trash2 } from 'lucide-react'
import type { Space, UserGroup } from '../types'
import { formatLoginMethod } from '../utils'

interface AllowedLoginMethodsSelectorProps {
  methods: string[]
  selectedMethods: string[]
  onToggleMethod: (method: string) => void
}

export function AllowedLoginMethodsSelector({
  methods,
  selectedMethods,
  onToggleMethod,
}: AllowedLoginMethodsSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Allowed Login Methods</Label>
      <p className="text-xs text-muted-foreground">Select allowed methods. Leave empty to allow all configured methods.</p>
      <div className="flex flex-wrap gap-2 p-3 border rounded-md">
        {methods.map((method) => {
          const isSelected = selectedMethods.includes(method)
          return (
            <div
              key={method}
              className={cn(
                'cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors select-none',
                isSelected
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background hover:bg-muted border-input'
              )}
              onClick={() => onToggleMethod(method)}
            >
              {formatLoginMethod(method)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface SpaceAssociationsEditorProps {
  formSpaces: Array<{ spaceId: string; role: string }>
  spaces: Space[]
  onChange: (spaces: Array<{ spaceId: string; role: string }>) => void
}

export function SpaceAssociationsEditor({
  formSpaces,
  spaces,
  onChange,
}: SpaceAssociationsEditorProps) {
  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold flex items-center gap-2">
        <Folder className="h-4 w-4" />
        Space Associations
      </Label>
      <p className="text-xs text-muted-foreground">
        Manage roles assigned in specific spaces
      </p>

      <div className="space-y-2">
        {formSpaces.map((space, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded">
            <Select
              value={space.spaceId}
              onValueChange={(value) => {
                const nextSpaces = [...formSpaces]
                nextSpaces[index] = { ...nextSpaces[index], spaceId: value }
                onChange(nextSpaces)
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={space.role}
              onValueChange={(value) => {
                const nextSpaces = [...formSpaces]
                nextSpaces[index] = { ...nextSpaces[index], role: value }
                onChange(nextSpaces)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="sm"
              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => onChange(formSpaces.filter((_, itemIndex) => itemIndex !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => onChange([...formSpaces, { spaceId: '', role: 'member' }])}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Space Association
      </Button>
    </div>
  )
}

interface GroupMembershipSelectorProps {
  groups: UserGroup[]
  selectedGroupIds: string[]
  onChange: (groupIds: string[]) => void
}

export function GroupMembershipSelector({
  groups,
  selectedGroupIds,
  onChange,
}: GroupMembershipSelectorProps) {
  return (
    <div>
      <Label>Group Memberships</Label>
      <p className="text-sm text-muted-foreground mb-3">
        Select groups this user should belong to
      </p>
      <div className="border rounded-md max-h-[300px] overflow-y-auto">
        {groups.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <FolderTree className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No groups available</p>
            <p className="text-xs">Create groups in the Groups tab first</p>
          </div>
        ) : (
          <div className="divide-y">
            {groups.map((group) => {
              const isSelected = selectedGroupIds.includes(group.id)
              return (
                <div
                  key={group.id}
                  className={cn(
                    'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                    isSelected ? 'bg-primary/5' : 'hover:bg-muted/50'
                  )}
                  onClick={() => {
                    onChange(
                      isSelected
                        ? selectedGroupIds.filter((id) => id !== group.id)
                        : [...selectedGroupIds, group.id]
                    )
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded"
                  />
                  <FolderTree className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{group.name}</p>
                    {group.description ? (
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    ) : null}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {group.memberCount || 0} members
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {selectedGroupIds.length > 0 ? (
        <p className="text-xs text-muted-foreground mt-2">
          {selectedGroupIds.length} group(s) selected
        </p>
      ) : null}
    </div>
  )
}

interface CreateSpaceAccessSelectorProps {
  formSpaces: Array<{ spaceId: string; role: string }>
  spaces: Space[]
  onChange: (spaces: Array<{ spaceId: string; role: string }>) => void
}

export function CreateSpaceAccessSelector({
  formSpaces,
  spaces,
  onChange,
}: CreateSpaceAccessSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Space Access</Label>
      <div className="text-sm text-muted-foreground mb-2">
        Assign user to spaces and set their role in each space
      </div>
      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
        {spaces.length === 0 ? (
          <div className="text-sm text-muted-foreground">No spaces available</div>
        ) : (
          spaces.map((space) => {
            const userSpace = formSpaces.find((item) => item.spaceId === space.id)
            return (
              <div key={space.id} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`create-space-${space.id}`}
                    checked={!!userSpace}
                    onChange={(event) => {
                      onChange(
                        event.target.checked
                          ? [...formSpaces, { spaceId: space.id, role: 'member' }]
                          : formSpaces.filter((item) => item.spaceId !== space.id)
                      )
                    }}
                    className="rounded"
                  />
                  <label htmlFor={`create-space-${space.id}`} className="text-sm cursor-pointer">
                    {space.name}
                  </label>
                </div>
                {userSpace ? (
                  <Select
                    value={userSpace.role}
                    onValueChange={(role) => {
                      onChange(
                        formSpaces.map((item) =>
                          item.spaceId === space.id ? { ...item, role } : item
                        )
                      )
                    }}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
