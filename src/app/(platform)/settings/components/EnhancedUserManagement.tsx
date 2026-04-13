'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  Building2, 
  UserCheck, 
  UserX,
  Eye,
  EyeOff,
  Key,
  Mail,
  Calendar,
  Settings,
  User,
  Folder
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { ScrollArea } from '@/components/ui/scroll-area'

interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  avatar?: string
  created_at: string
  updated_at: string
  default_space_id?: string
  default_space_name?: string
  spaces: Array<{
    id: string
    space_id: string
    role: string
    created_at: string
    space_name: string
    space_description?: string
    space_is_default: boolean
    space_is_active: boolean
  }>
}

interface Space {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
}

export function EnhancedUserManagement() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [spaceFilter, setSpaceFilter] = useState('')
  
  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogTab, setEditDialogTab] = useState('basic')
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    is_active: true,
    default_space_id: '',
    spaces: [] as Array<{ space_id: string; role: string }>
  })

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  // Load users with space associations
  const loadUsers = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (activeFilter) params.set('is_active', activeFilter)
      if (spaceFilter) params.set('space_id', spaceFilter)

      const response = await fetch(`/api/users/all-with-spaces?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`)
      }

      const data = await response.json()
      setUsers(data.users || [])
      setSpaces(data.spaces || [])
      setTotal(data.pagination?.total || 0)
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [page, limit, search, roleFilter, activeFilter, spaceFilter])

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1)
      loadUsers()
    }, 500)
    return () => clearTimeout(timeout)
  }, [search])

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      default_space_id: user.default_space_id || '',
      spaces: user.spaces.map(s => ({ space_id: s.space_id, role: s.role }))
    })
    setEditDialogTab('basic')
    setShowEditDialog(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
      // Update user basic info
      const userResponse = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          email: editForm.email,
          role: editForm.role,
          is_active: editForm.is_active,
          default_space_id: editForm.default_space_id || null
        })
      })

      if (!userResponse.ok) {
        throw new Error('Failed to update user')
      }

      // Update space associations
      const spaceResponse = await fetch(`/api/users/${editingUser.id}/space-associations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaces: editForm.spaces })
      })

      if (!spaceResponse.ok) {
        throw new Error('Failed to update space associations')
      }

      toast.success('User updated successfully')
      setShowEditDialog(false)
      setEditingUser(null)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user')
    }
  }

  const handleToggleUserStatus = async (user: User) => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !user.is_active })
      })

      if (!response.ok) {
        throw new Error('Failed to update user status')
      }

      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`)
      loadUsers()
    } catch (err: any) {
      toast.error(err.message || 'Failed to update user status')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'bg-red-100 text-red-800'
      case 'ADMIN': return 'bg-orange-100 text-orange-800'
      case 'MANAGER': return 'bg-blue-100 text-blue-800'
      case 'USER': return 'bg-muted text-foreground'
      default: return 'bg-muted text-foreground'
    }
  }

  const getSpaceRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-100 text-purple-800'
      case 'admin': return 'bg-orange-100 text-orange-800'
      case 'member': return 'bg-green-100 text-green-800'
      default: return 'bg-muted text-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage all users across all spaces and their associations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            {total} total users
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="USER">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="active">Status</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="space">Space</Label>
              <Select value={spaceFilter} onValueChange={setSpaceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All spaces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All spaces</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Users ({total})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadUsers} className="mt-2">Retry</Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold truncate">{user.name}</h3>
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.is_active ? "default" : "secondary"}>
                              {user.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-4 w-4" />
                              <span>{user.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Space Associations */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">Space Associations:</span>
                              <span className="text-sm text-muted-foreground">
                                {user.spaces.length} space{user.spaces.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            
                            {user.spaces.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {user.spaces.map((space) => (
                                  <div key={space.id} className="flex items-center space-x-1 bg-muted/50 px-2 py-1 rounded-md">
                                    <span className="text-sm font-medium">{space.space_name}</span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${getSpaceRoleColor(space.role)}`}
                                    >
                                      {space.role}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No space associations</p>
                            )}

                            {user.default_space_name && (
                              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                <span>Default space:</span>
                                <Badge variant="outline">{user.default_space_name}</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setShowUserDetails(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleUserStatus(user)}
                          className={user.is_active ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                        >
                          {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page === pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View detailed information about this user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback>
                    {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(selectedUser.role)}>
                      {selectedUser.role}
                    </Badge>
                    <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Updated</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedUser.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Space Associations</Label>
                <div className="mt-2 space-y-2">
                  {selectedUser.spaces.map((space) => (
                    <div key={space.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{space.space_name}</p>
                        {space.space_description && (
                          <p className="text-sm text-muted-foreground">{space.space_description}</p>
                        )}
                      </div>
                      <Badge className={getSpaceRoleColor(space.role)}>
                        {space.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and space associations
            </DialogDescription>
          </DialogHeader>
          
          <div className="w-full">
            <Tabs value={editDialogTab} onValueChange={setEditDialogTab}>
              <TabsList className="w-full flex justify-start gap-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles & Permissions
              </TabsTrigger>
              <TabsTrigger value="spaces" className="flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Space Associations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Avatar Upload */}
              {editingUser && (
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <AvatarUpload
                    userId={editingUser.id}
                    currentAvatar={editingUser.avatar}
                    userName={editForm.name}
                    userEmail={editForm.email}
                    onAvatarChange={(avatarUrl) => {
                      // Update the user in the list
                      setUsers(users.map(u => 
                        u.id === editingUser.id ? { ...u, avatar: avatarUrl || undefined } : u
                      ))
                      // Update editing user
                      setEditingUser({ ...editingUser, avatar: avatarUrl || undefined })
                    }}
                    size="lg"
                  />
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4 mt-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="default_space">Default Space</Label>
                <Select 
                  value={editForm.default_space_id} 
                  onValueChange={(value) => setEditForm({ ...editForm, default_space_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default space</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="space-y-4 mt-4">
              {/* Space Associations Management */}
              <div>
                <Label className="text-sm font-medium">Space Associations</Label>
                <div className="mt-2 space-y-2">
                  {editForm.spaces.map((space, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
                      <Select
                        value={space.space_id}
                        onValueChange={(value) => {
                          const newSpaces = [...editForm.spaces]
                          newSpaces[index].space_id = value
                          setEditForm({ ...editForm, spaces: newSpaces })
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <Select
                        value={space.role}
                        onValueChange={(value) => {
                          const newSpaces = [...editForm.spaces]
                          newSpaces[index].role = value
                          setEditForm({ ...editForm, spaces: newSpaces })
                        }}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newSpaces = editForm.spaces.filter((_, i) => i !== index)
                          setEditForm({ ...editForm, spaces: newSpaces })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        spaces: [...editForm.spaces, { space_id: '', role: 'member' }]
                      })
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Space Association
                  </Button>
                </div>
              </div>
            </TabsContent>
            </Tabs>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
