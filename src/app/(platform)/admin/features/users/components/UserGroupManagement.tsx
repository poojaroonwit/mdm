'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  FolderTree,
  UserPlus,
  X,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { UserGroup, UserGroupMember, UserGroupFormData, User } from '../types'
import { Skeleton } from '@/components/ui/skeleton'
import { UserGroupDialogs } from './UserGroupDialogs'
import { GroupTreeNode } from './UserGroupTreeNode'

export function UserGroupManagement() {
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [flatGroups, setFlatGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  const [groupDetails, setGroupDetails] = useState<UserGroup | null>(null)
  const [groupMembers, setGroupMembers] = useState<UserGroupMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [parentGroupId, setParentGroupId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<UserGroupFormData>({
    name: '',
    description: '',
    parentId: null,
    sortOrder: 0
  })
  
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)

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
      parentId,
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
              <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
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
                    onAddChild={(parent: UserGroup) => openCreateDialog(parent.id)}
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
                    <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
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
                            className="flex items-center gap-3 p-4 rounded-2xl border border-zinc-100/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 hover:shadow-lg transition-all duration-300 group"
                          >
                            <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                              <AvatarImage src={member.userAvatar} />
                              <AvatarFallback className="text-xs font-black">
                                {(member.userName || '').split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{member.userName}</p>
                              <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 truncate tracking-tight">{member.userEmail}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest text-zinc-500 h-5">
                              {member.role}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
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

      <UserGroupDialogs
        editingGroup={editingGroup}
        filteredUsers={filteredUsers}
        flatGroups={flatGroups}
        formData={formData}
        handleAddMembers={handleAddMembers}
        handleCreateGroup={handleCreateGroup}
        handleUpdateGroup={handleUpdateGroup}
        loadingUsers={loadingUsers}
        parentGroupId={parentGroupId}
        selectedGroup={selectedGroup}
        selectedUserIds={selectedUserIds}
        setFormData={setFormData}
        setSelectedUserIds={setSelectedUserIds}
        setShowAddMemberDialog={setShowAddMemberDialog}
        setShowCreateDialog={setShowCreateDialog}
        setShowEditDialog={setShowEditDialog}
        setUserSearch={setUserSearch}
        showAddMemberDialog={showAddMemberDialog}
        showCreateDialog={showCreateDialog}
        showEditDialog={showEditDialog}
        userSearch={userSearch}
      />    </div>
  )
}
