'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  ChevronDown,
  FolderTree,
  UserPlus,
  X,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UserGroup, UserGroupMember, UserGroupFormData, User } from '../types'
import { cn } from '@/lib/utils'

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

function GroupTreeNode({
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
          "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
          isSelected 
            ? "bg-primary/10 text-primary border border-primary/20" 
            : "hover:bg-muted/50"
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
        <span className="flex-1 text-sm font-medium truncate">{group.name}</span>
        <Badge variant="outline" className="text-xs">
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

export function UserGroupManagement() {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [flatGroups, setFlatGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  // Selection and expansion
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  // Group details and members
  const [groupDetails, setGroupDetails] = useState<UserGroup | null>(null)
  const [groupMembers, setGroupMembers] = useState<UserGroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [parentGroupId, setParentGroupId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<UserGroupFormData>({
    name: '',
    description: '',
    parentId: null,
    sortOrder: 0
  })
  
  // Add member
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Load groups
  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      // Load tree structure
      const response = await fetch('/api/admin/user-groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
        setError(null)
      } else {
        setError('Failed to load groups')
      }
      
      // Load flat list for parent selection
      const flatResponse = await fetch('/api/admin/user-groups?flat=true')
      if (flatResponse.ok) {
        const flatData = await flatResponse.json()
        setFlatGroups(flatData.groups || [])
      }
    } catch (err) {
      console.error('Error loading groups:', err)
      setError('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load group details
  const loadGroupDetails = useCallback(async (groupId: string) => {
    setLoadingMembers(true)
    try {
      const response = await fetch(`/api/admin/user-groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroupDetails(data.group)
        setGroupMembers(data.group.members || [])
      }
    } catch (err) {
      console.error('Error loading group details:', err)
    } finally {
      setLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup.id)
    } else {
      setGroupDetails(null)
      setGroupMembers([])
    }
  }, [selectedGroup, loadGroupDetails])

  const handleToggleExpand = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const handleSelectGroup = (group: UserGroup) => {
    setSelectedGroup(group)
  }

  const openCreateDialog = (parentId: string | null = null) => {
    setParentGroupId(parentId)
    setFormData({
      name: '',
      description: '',
      parentId: parentId,
      sortOrder: 0
    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (group: UserGroup) => {
    setEditingGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      parentId: group.parentId || null,
      sortOrder: group.sortOrder
    })
    setShowEditDialog(true)
  }

  const handleCreateGroup = async () => {
    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/user-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Group created successfully')
        setShowCreateDialog(false)
        loadGroups()
        if (parentGroupId) {
          setExpandedGroups(prev => new Set(prev).add(parentGroupId))
        }
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to create group')
      }
    } catch (err) {
      toast.error('Failed to create group')
    }
  }

  const handleUpdateGroup = async () => {
    if (!editingGroup || !formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    try {
      const response = await fetch(`/api/admin/user-groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success('Group updated successfully')
        setShowEditDialog(false)
        setEditingGroup(null)
        loadGroups()
        if (selectedGroup?.id === editingGroup.id) {
          loadGroupDetails(editingGroup.id)
        }
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to update group')
      }
    } catch (err) {
      toast.error('Failed to update group')
    }
  }

  const handleDeleteGroup = async (group: UserGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will remove all member associations.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/user-groups/${group.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Group deleted successfully')
        if (selectedGroup?.id === group.id) {
          setSelectedGroup(null)
        }
        loadGroups()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to delete group')
      }
    } catch (err) {
      toast.error('Failed to delete group')
    }
  }

  const openAddMemberDialog = async () => {
    if (!selectedGroup) return
    
    setLoadingUsers(true)
    setShowAddMemberDialog(true)
    setSelectedUserIds([])
    setUserSearch('')
    
    try {
      const response = await fetch('/api/admin/users?limit=100')
      if (response.ok) {
        const data = await response.json()
        // Filter out users already in the group
        const memberUserIds = new Set(groupMembers.map(m => m.userId))
        const available = (data.users || [])
          .filter((u: any) => !memberUserIds.has(u.id))
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            role: u.role,
            isActive: u.is_active
          }))
        setAvailableUsers(available)
      }
    } catch (err) {
      console.error('Error loading users:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUserIds.length === 0) return

    try {
      const response = await fetch(`/api/admin/user-groups/${selectedGroup.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUserIds })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.message || 'Members added')
        setShowAddMemberDialog(false)
        loadGroupDetails(selectedGroup.id)
        loadGroups()
      } else {
        const err = await response.json()
        toast.error(err.error || 'Failed to add members')
      }
    } catch (err) {
      toast.error('Failed to add members')
    }
  }

  const handleRemoveMember = async (member: UserGroupMember) => {
    if (!selectedGroup) return
    if (!confirm(`Remove ${member.userName} from this group?`)) return

    try {
      const response = await fetch(
        `/api/admin/user-groups/${selectedGroup.id}/members?memberId=${member.id}`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        toast.success('Member removed')
        loadGroupDetails(selectedGroup.id)
        loadGroups()
      } else {
        toast.error('Failed to remove member')
      }
    } catch (err) {
      toast.error('Failed to remove member')
    }
  }

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  const filteredGroups = groups.filter(group =>
    !search || group.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-200px)] gap-6">
      {/* Left Panel - Group Tree */}
      <Card className="w-80 flex-shrink-0">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">User Groups</CardTitle>
            <Button size="sm" onClick={() => openCreateDialog(null)}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="pl-9 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[calc(100%-100px)]">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <FolderTree className="h-10 w-10 text-muted-foreground mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No groups found</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => openCreateDialog(null)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Group
                </Button>
              </div>
            ) : (
              <div className="py-2">
                {filteredGroups.map((group) => (
                  <GroupTreeNode
                    key={group.id}
                    group={group}
                    level={0}
                    selectedGroupId={selectedGroup?.id || null}
                    expandedGroups={expandedGroups}
                    onSelect={handleSelectGroup}
                    onToggleExpand={handleToggleExpand}
                    onEdit={openEditDialog}
                    onDelete={handleDeleteGroup}
                    onAddChild={(parent) => openCreateDialog(parent.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right Panel - Group Details */}
      <Card className="flex-1">
        {selectedGroup ? (
          <>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{groupDetails?.name || selectedGroup.name}</CardTitle>
                  <CardDescription>
                    {groupDetails?.description || 'No description'}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(selectedGroup)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={openAddMemberDialog}>
                    <UserPlus className="h-4 w-4 mr-1" />
                    Add Members
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {groupDetails?.memberCount ?? selectedGroup.memberCount ?? 0} members
                  </Badge>
                  {groupDetails?.parent && (
                    <span>Parent: {groupDetails.parent.name}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3">Members</h3>
                  {loadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                    </div>
                  ) : groupMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No members in this group</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={openAddMemberDialog}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add Members
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2">
                        {groupMembers.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.userAvatar} />
                              <AvatarFallback className="text-xs">
                                {(member.userName || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{member.userName}</p>
                              <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {member.role}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveMember(member)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            </CardContent>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <FolderTree className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Select a group</p>
            <p className="text-sm">Choose a group from the left panel to view its details</p>
          </div>
        )}
      </Card>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User Group</DialogTitle>
            <DialogDescription>
              {parentGroupId
                ? 'Create a new child group under the selected parent'
                : 'Create a new root-level user group'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update the group details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateGroup}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Members Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Members to {selectedGroup?.name}</DialogTitle>
            <DialogDescription>Select users to add to this group</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {loadingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No users available to add</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        selectedUserIds.includes(user.id)
                          ? "bg-primary/10 border border-primary/20"
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
                        className="rounded"
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-xs">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {selectedUserIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedUserIds.length} user(s) selected
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
            <Button onClick={handleAddMembers} disabled={selectedUserIds.length === 0}>
              Add {selectedUserIds.length || ''} Member{selectedUserIds.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
