'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Users, Trash2, Edit, Crown, Shield, User, Mail, UserPlus, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

interface Space {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_by: string
  created_by_name?: string
  user_role?: string
}

interface SpaceMember {
  id: string
  space_id: string
  user_id: string
  role: string
  user_name?: string
  user_email?: string
  user_system_role?: string
  is_active?: boolean
}

interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

export default function SpaceMembersPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params.id as string
  
  const [space, setSpace] = useState<Space | null>(null)
  const [members, setMembers] = useState<SpaceMember[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<SpaceMember | null>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    role: 'member'
  })

  const fetchSpaceAndMembers = async () => {
    try {
      setIsLoading(true)
      
      // Fetch space details and members
      const response = await fetch(`/api/spaces/${spaceId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch space details')
      }
      
      const data = await response.json()
      setSpace(data.space)
      setMembers(data.members || [])
      
    } catch (error) {
      console.error('Error fetching space details:', error)
      toast.error('Failed to load space details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      const response = await fetch('/api/users?page=1&limit=100')
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      
      const data = await response.json()
      // Filter out users who are already members
      const memberUserIds = members.map(m => m.user_id)
      const available = (data.users || []).filter((user: User) => 
        !memberUserIds.includes(user.id) && user.is_active
      )
      setAvailableUsers(available)
      
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load available users')
    }
  }

  useEffect(() => {
    if (spaceId) {
      fetchSpaceAndMembers()
    }
  }, [spaceId])

  useEffect(() => {
    // Check if invite parameter is present in URL
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('invite') === 'true') {
      setIsInviteDialogOpen(true)
    }
  }, [])

  useEffect(() => {
    if (members.length > 0) {
      fetchAvailableUsers()
    }
  }, [members])

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.user_id) {
      toast.error('Please select a user')
      return
    }

    try {
      const response = await fetch(`/api/spaces/${spaceId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: formData.user_id,
          role: formData.role
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to invite user')
      }

      toast.success('User invited successfully')
      setIsInviteDialogOpen(false)
      setFormData({ user_id: '', role: 'member' })
      await fetchSpaceAndMembers()
      
    } catch (error) {
      console.error('Error inviting user:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to invite user')
    }
  }

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update member role')
      }

      toast.success('Member role updated successfully')
      await fetchSpaceAndMembers()
      
    } catch (error) {
      console.error('Error updating member role:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the space?')) {
      return
    }

    try {
      const response = await fetch(`/api/spaces/${spaceId}/members/${memberId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove member')
      }

      toast.success('Member removed successfully')
      await fetchSpaceAndMembers()
      
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Owner</Badge>
      case 'admin':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Admin</Badge>
      default:
        return <Badge variant="outline">Member</Badge>
    }
  }

  const canManageMembers = space?.user_role === 'owner' || space?.user_role === 'admin'

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading space members...</p>
        </div>
      </div>
    )
  }

  if (!space) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Space not found</h3>
        <p className="text-muted-foreground mb-4">The space you're looking for doesn't exist or you don't have access to it.</p>
        <Button onClick={() => router.push('/settings/spaces')}>
          Back to Spaces
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <button 
          onClick={() => router.push('/settings/spaces')}
          className="hover:text-foreground transition-colors"
        >
          Spaces
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">{space.name}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground">Members</span>
      </nav>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{space.name} - Members</h1>
          <p className="text-muted-foreground">
            Manage members and their roles in this space
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.push('/settings/spaces')}>
            Back to Spaces
          </Button>
          {canManageMembers && (
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite User to Space</DialogTitle>
                  <DialogDescription>
                    Add a new member to this space and assign their role.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteUser}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user_id">Select User</Label>
                      <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a user to invite" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center space-x-2">
                                <span>{user.name}</span>
                                <span className="text-muted-foreground">({user.email})</span>
                                <Badge variant="outline" className="text-xs">{user.role}</Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          {space.user_role === 'owner' && (
                            <SelectItem value="owner">Owner</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      Invite User
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Space Members ({members.length})</span>
          </CardTitle>
          <CardDescription>
            Manage who has access to this space and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No members yet</h3>
              <p className="text-muted-foreground mb-4">
                Invite users to collaborate in this space.
              </p>
              {canManageMembers && (
                <Button onClick={() => setIsInviteDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite First Member
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>System Role</TableHead>
                  <TableHead>Space Role</TableHead>
                  <TableHead>Status</TableHead>
                  {canManageMembers && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(member.role)}
                        <span className="font-medium">{member.user_name || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{member.user_email || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{member.user_system_role || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {canManageMembers && member.role !== 'owner' ? (
                        <Select
                          value={member.role}
                          onValueChange={(newRole) => handleUpdateMemberRole(member.user_id, newRole)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {space.user_role === 'owner' && (
                              <SelectItem value="owner">Owner</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        getRoleBadge(member.role)
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    {canManageMembers && (
                      <TableCell>
                        {member.role !== 'owner' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveMember(member.user_id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
