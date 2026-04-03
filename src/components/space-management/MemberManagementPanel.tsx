'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { UserInviteInput } from '@/components/ui/user-invite-input'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  MoreVertical, 
  UserPlus, 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Mail,
  FileText,
  Folder,
  Key
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import toast from 'react-hot-toast'

interface Member {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_system_role: string
  role: 'member' | 'admin' | 'owner'
  joined_at: string
  last_active?: string
  is_active: boolean
  status?: 'invite' | 'enable' | 'disable'
  avatar?: string
  group?: string
  group_id?: string
  permissions?: string[]
}

interface MemberManagementPanelProps {
  spaceId: string
  members: Member[]
  onInvite: (user: any, role: string) => Promise<void>
  onUpdateRole: (userId: string, role: string) => Promise<void>
  onRemoveMember: (userId: string) => Promise<void>
  onBulkOperation: (operation: string, userIds: string[], data?: any) => Promise<void>
  canManageMembers: boolean
  loading?: boolean
}

export function MemberManagementPanel({
  spaceId,
  members,
  onInvite,
  onUpdateRole,
  onRemoveMember,
  onBulkOperation,
  canManageMembers,
  loading = false
}: MemberManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [groupFilter, setGroupFilter] = useState('all')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [bulkOperation, setBulkOperation] = useState('')

  // Ensure members is always an array
  const safeMembers = Array.isArray(members) ? members : []

  // Filter members based on search and filters
  const filteredMembers = useMemo(() => {
    return safeMembers.filter(member => {
      const matchesSearch = 
        member.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.user_email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'invite' && member.status === 'invite') ||
        (statusFilter === 'enable' && member.is_active) ||
        (statusFilter === 'disable' && !member.is_active && member.status !== 'invite')
      const matchesGroup = groupFilter === 'all' || member.group_id === groupFilter || member.group === groupFilter
      
      return matchesSearch && matchesRole && matchesStatus && matchesGroup
    })
  }, [safeMembers, searchTerm, roleFilter, statusFilter, groupFilter])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMembers(filteredMembers.map(m => m.user_id))
    } else {
      setSelectedMembers([])
    }
  }

  const handleSelectMember = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, userId])
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== userId))
    }
  }

  const handleBulkOperation = async (operation: string) => {
    if (selectedMembers.length === 0) {
      toast.error('Please select members first')
      return
    }

    try {
      await onBulkOperation(operation, selectedMembers)
      setSelectedMembers([])
      setShowBulkDialog(false)
      toast.success(`Bulk operation completed successfully`)
    } catch (error) {
      toast.error('Failed to perform bulk operation')
    }
  }

  const exportMembers = () => {
    const csvContent = [
      ['Name', 'Email', 'Role', 'Status', 'Joined', 'Last Active'].join(','),
      ...filteredMembers.map(member => [
        member.user_name,
        member.user_email,
        member.role,
        member.is_active ? 'Active' : 'Inactive',
        new Date(member.joined_at).toLocaleDateString(),
        member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `space-members-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-destructive/10 text-destructive'
      case 'admin': return 'bg-primary/10 text-primary'
      case 'member': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusIcon = (member: Member) => {
    if (!member.is_active) return <XCircle className="h-4 w-4 text-destructive" />
    if (member.last_active) {
      const lastActive = new Date(member.last_active)
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
      return lastActive > hourAgo ? 
        <CheckCircle className="h-4 w-4 text-primary" /> : 
        <Clock className="h-4 w-4 text-warning" />
    }
    return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
  }

  const [showInviteDialog, setShowInviteDialog] = useState(false)

  return (
    <div className="space-y-6">
      <div className="w-full space-y-4">
        {/* Invite Button and Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={groupFilter} onValueChange={setGroupFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {Array.from(new Set(safeMembers.map(m => m.group).filter(Boolean))).map(group => {
                      const groupValue = String(group || '__no_group__')
                      return (
                        <SelectItem key={groupValue} value={groupValue}>
                          {group || 'No Group'}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="invite">Invite</SelectItem>
                    <SelectItem value="enable">Enable</SelectItem>
                    <SelectItem value="disable">Disable</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                  <DialogTrigger asChild>
                    <Button disabled={!canManageMembers}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Member</DialogTitle>
                      <DialogDescription>
                        Select an existing platform user, or create a platform user first and assign them to this space.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                      <UserInviteInput
                        spaceId={spaceId}
                        onInvite={async (user, role) => {
                          await onInvite(user, role)
                          setShowInviteDialog(false)
                        }}
                        disabled={!canManageMembers}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Bulk Actions */}
          {selectedMembers.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMembers([])}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Bulk Actions
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Actions</DialogTitle>
                          <DialogDescription>
                            Choose an action to perform on {selectedMembers.length} selected members.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setBulkOperation('change_role')
                                // Handle role change dialog
                              }}
                            >
                              Change Role
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('remove')}
                            >
                              Remove Members
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('deactivate')}
                            >
                              Deactivate
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => handleBulkOperation('activate')}
                            >
                              Activate
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={exportMembers}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="p-4 text-left">
                        <Checkbox
                          checked={selectedMembers.length === filteredMembers.length && filteredMembers.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-4 text-left font-medium">Member</th>
                      <th className="p-4 text-left font-medium">Group</th>
                      <th className="p-4 text-left font-medium">Role</th>
                      <th className="p-4 text-left font-medium">Permissions</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Joined</th>
                      <th className="p-4 text-left font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-muted">
                        <td className="p-4">
                          <Checkbox
                            checked={selectedMembers.includes(member.user_id)}
                            onCheckedChange={(checked) => handleSelectMember(member.user_id, checked as boolean)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar} />
                              <AvatarFallback>
                                {member.user_name ? member.user_name[0].toUpperCase() : member.user_email[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{member.user_name}</div>
                              <div className="text-sm text-muted-foreground">{member.user_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {member.group || (
                                <span className="text-muted-foreground italic">No Group</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          {canManageMembers && member.role !== 'owner' ? (
                            <Select
                              value={member.role}
                              onValueChange={(role) => onUpdateRole(member.user_id, role)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            {member.permissions && member.permissions.length > 0 ? (
                              <>
                                <Key className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {member.permissions.length} permission{member.permissions.length !== 1 ? 's' : ''}
                                </span>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                                      View
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                      <DialogTitle>Permissions for {member.user_name}</DialogTitle>
                                      <DialogDescription>
                                        Role: {member.role} | Permissions: {member.permissions.length}
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="max-h-96 overflow-y-auto mt-4">
                                      <div className="space-y-2">
                                        {member.permissions.map((perm, idx) => (
                                          <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <code className="text-sm">{perm}</code>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No custom permissions</span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(member)}
                            <Badge 
                              variant={
                                member.is_active ? "default" : 
                                (member.status === 'invite' ? "secondary" : "outline")
                              }
                              className={
                                member.is_active 
                                  ? "bg-primary/10 text-primary"
                                  : member.status === 'invite'
                                  ? "bg-warning/20 text-warning"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {member.status === 'invite' ? 'Invite' : 
                               member.is_active ? 'Enable' : 'Disable'}
                            </Badge>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              {canManageMembers && member.role !== 'owner' && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => onRemoveMember(member.user_id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Remove
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}
