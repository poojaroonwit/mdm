'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Search, Users } from 'lucide-react'

interface UserGroupDialogsProps {
  editingGroup: any
  filteredUsers: any[]
  flatGroups: any[]
  formData: any
  handleAddMembers: () => void
  handleCreateGroup: () => void
  handleUpdateGroup: () => void
  loadingUsers: boolean
  parentGroupId: string | null
  selectedGroup: any
  selectedUserIds: string[]
  setFormData: (formData: any) => void
  setSelectedUserIds: React.Dispatch<React.SetStateAction<string[]>>
  setShowAddMemberDialog: (open: boolean) => void
  setShowCreateDialog: (open: boolean) => void
  setShowEditDialog: (open: boolean) => void
  setUserSearch: (search: string) => void
  showAddMemberDialog: boolean
  showCreateDialog: boolean
  showEditDialog: boolean
  userSearch: string
}

export function UserGroupDialogs({
  editingGroup,
  filteredUsers,
  flatGroups,
  formData,
  handleAddMembers,
  handleCreateGroup,
  handleUpdateGroup,
  loadingUsers,
  parentGroupId,
  selectedGroup,
  selectedUserIds,
  setFormData,
  setSelectedUserIds,
  setShowAddMemberDialog,
  setShowCreateDialog,
  setShowEditDialog,
  setUserSearch,
  showAddMemberDialog,
  showCreateDialog,
  showEditDialog,
  userSearch,
}: UserGroupDialogsProps) {
  return (
    <>      {/* Create Group Dialog */}
      <CrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title="Create User Group"
        description={
          parentGroupId
            ? 'Create a new child group under the selected parent'
            : 'Create a new root-level user group'
        }
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </>
        )}
      >
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Engineering Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Group</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (root level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root level)</SelectItem>
                  {flatGroups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
      </CrudDialog>

      {/* Edit Group Dialog */}
      <CrudDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Group"
        description="Update the group details"
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateGroup}>Save Changes</Button>
          </>
        )}
      >
            <div className="space-y-2">
              <Label>Group Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Engineering Team"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Parent Group</Label>
              <Select
                value={formData.parentId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="No parent (root level)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (root level)</SelectItem>
                  {flatGroups
                    .filter(g => g.id !== editingGroup?.id)
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
      </CrudDialog>

      {/* Add Members Dialog */}
      <CrudDialog
        open={showAddMemberDialog}
        onOpenChange={setShowAddMemberDialog}
        title={`Add Members to ${selectedGroup?.name}`}
        description="Select users to add to this group"
        contentClassName="max-w-lg"
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>
              Add {selectedUserIds.length || ''} Member{selectedUserIds.length !== 1 ? 's' : ''}
            </Button>
          </>
        )}
      >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9 h-10 rounded-xl"
              />
            </div>
            <ScrollArea className="h-[300px] border rounded-xl p-2">
              {loadingUsers ? (
                <div className="w-full space-y-3 p-4">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm font-medium">No users available to add</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors",
                        selectedUserIds.includes(user.id)
                          ? "bg-zinc-900/5 dark:bg-zinc-100/5 border border-zinc-900/10 dark:border-zinc-100/10"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setSelectedUserIds(prev =>
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        )
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => {}}
                        className="rounded cursor-pointer"
                      />
                      <Avatar className="h-8 w-8 border border-zinc-100 dark:border-zinc-800">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px] font-black">
                          {(user.name || '').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate tracking-tight text-zinc-900 dark:text-zinc-100">{user.name}</p>
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate tracking-tight">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 h-5">
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedUserIds.length > 0 && (
              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
                {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
      </CrudDialog>
    </>
  )
}
