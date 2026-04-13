'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { X, Plus, Edit, Trash2, Key } from 'lucide-react'

export function UsersSection() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [isActive, setIsActive] = useState<string>('')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState<{ 
    email: string
    name: string
    password: string
    role: string
    is_active: boolean
    default_space_id: string
    spaces: Array<{ id: any; name: any; role: string }>
    avatar: string
  }>({ 
    email: '', 
    name: '', 
    password: '', 
    role: 'USER', 
    is_active: true, 
    default_space_id: '', 
    spaces: [],
    avatar: ''
  })
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([])
  const [loadingSpaces, setLoadingSpaces] = useState(false)
  
  // Reset password state
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<any | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit])

  // Check if current user can reset passwords (MANAGER+ roles)
  const canResetPassword = useMemo(() => {
    if (!session?.user?.role) return false
    const allowedRoles = ['MANAGER', 'ADMIN', 'SUPER_ADMIN']
    return allowedRoles.includes(session.user.role)
  }, [session?.user?.role])

  async function loadSpaces() {
    setLoadingSpaces(true)
    try {
      const res = await fetch('/api/spaces?limit=100')
      if (res.ok) {
        const data = await res.json()
        setAvailableSpaces(data.spaces || [])
      }
    } catch (e) {
      console.error('Failed to load spaces:', e)
    } finally {
      setLoadingSpaces(false)
    }
  }

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(limit))
      if (search) params.set('search', search)
      if (role) params.set('role', role)
      if (isActive) params.set('is_active', isActive)
      const res = await fetch(`/api/users?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(`Failed to load users: ${res.status} ${res.statusText} - ${errorData.error || 'Unknown error'}`)
      }
      const data = await res.json()
      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
    } catch (e: any) {
      console.error('Load users error:', e)
      setError(e.message || 'Failed loading users')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search effect
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    const timeout = setTimeout(() => {
      setPage(1)
      load()
    }, 500) // 500ms debounce
    
    setSearchTimeout(timeout)
    
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [search])

  useEffect(() => { load() }, [page, limit, role, isActive])

  function openCreate() {
    setEditing(null)
    setForm({ 
      email: '', 
      name: '', 
      password: '', 
      role: 'USER', 
      is_active: true, 
      default_space_id: '', 
      spaces: [],
      avatar: ''
    })
    loadSpaces()
    setOpen(true)
  }

  function openEdit(u: any) {
    setEditing(u)
    setForm({ 
      email: u.email, 
      name: u.name, 
      password: '', 
      role: u.role, 
      is_active: u.is_active,
      default_space_id: u.default_space_id || '',
      spaces: u.spaces || [],
      avatar: u.avatar || null
    })
    loadSpaces()
    setOpen(true)
  }

  async function submit() {
    try {
      const method = editing ? 'PUT' : 'POST'
      const url = editing ? `/api/users/${editing.id}` : '/api/users'
      const payload: any = { 
        email: form.email, 
        name: form.name, 
        role: form.role, 
        is_active: form.is_active,
        default_space_id: form.default_space_id || null,
        spaces: form.spaces
      }
      if (!editing) payload.password = form.password
      if (editing && form.password) payload.password = form.password
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error('Save failed')
      setOpen(false)
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    }
  }

  async function removeUser(id: string) {
    if (!confirm('Delete this user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      await load()
    } catch (e: any) {
      toast.error(e.message || 'Delete failed')
    }
  }

  function openResetPassword(user: any) {
    setResetPasswordUser(user)
    setNewPassword('')
    setConfirmPassword('')
    setResetPasswordOpen(true)
  }

  async function resetPassword() {
    if (!resetPasswordUser) return
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setResettingPassword(true)
    try {
      const res = await fetch(`/api/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword })
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Reset failed')
      }
      
      toast.success('Password reset successfully')
      setResetPasswordOpen(false)
      setResetPasswordUser(null)
      setNewPassword('')
      setConfirmPassword('')
    } catch (e: any) {
      toast.error(e.message || 'Reset failed')
    } finally {
      setResettingPassword(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Input 
                placeholder="Search by name or email..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load() } }} 
                className={search ? 'pr-8' : ''}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Role Filter Dropdown */}
          <div className="min-w-[150px]">
            <Select value={role || 'all'} onValueChange={(value) => { setRole(value === 'all' ? '' : value); setPage(1); load() }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="MANAGER">Manager</SelectItem>
                <SelectItem value="USER">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Status Filter Dropdown */}
          <div className="min-w-[150px]">
            <Select value={isActive || 'all'} onValueChange={(value) => { setIsActive(value === 'all' ? '' : value); setPage(1); load() }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters Button */}
          <Button 
            variant="outline" 
            onClick={() => { 
              setSearch(''); 
              setRole(''); 
              setIsActive(''); 
              setPage(1); 
              load() 
            }}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
        <div>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add New User
          </Button>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {(search || (role && role !== '') || (isActive && isActive !== '')) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm">
              <span>Search: "{search}"</span>
              <button onClick={() => setSearch('')} className="ml-1 hover:text-blue-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {role && (
            <div className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-md text-sm">
              <span>Role: {role}</span>
              <button onClick={() => setRole('')} className="ml-1 hover:text-green-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {isActive && (
            <div className="flex items-center gap-1 bg-purple-100 text-purple-800 px-2 py-1 rounded-md text-sm">
              <span>Status: {isActive === 'true' ? 'Active' : 'Inactive'}</span>
              <button onClick={() => setIsActive('')} className="ml-1 hover:text-purple-600">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2">Avatar</th>
              <th className="text-left p-2">Email</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Role</th>
              <th className="text-left p-2">Default Space</th>
              <th className="text-left p-2">Space Access</th>
              <th className="text-left p-2">Active</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-4" colSpan={8}>Loading...</td></tr>
            ) : error ? (
              <tr><td className="p-4 text-red-600" colSpan={8}>{error}</td></tr>
            ) : users.length === 0 ? (
              <tr><td className="p-4" colSpan={8}>No users found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="border-t border-border hover:bg-muted/50">
                  <td className="p-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={u.avatar || undefined} alt={u.name || 'User'} />
                      <AvatarFallback className="text-xs">
                        {u.name ? u.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) : 
                         u.email ? u.email[0].toUpperCase() : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </td>
                  <td className="p-3 font-medium">{u.email}</td>
                  <td className="p-3">{u.name || '-'}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                      u.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' :
                      u.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                      'bg-muted text-foreground'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm text-muted-foreground">
                      {u.default_space_name || 'None'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {u.spaces && u.spaces.length > 0 ? (
                        u.spaces.slice(0, 2).map((space: any) => (
                          <span key={space.id} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {space.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No access</span>
                      )}
                      {u.spaces && u.spaces.length > 2 && (
                        <span className="text-xs text-muted-foreground">+{u.spaces.length - 2} more</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => openEdit(u)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      {canResetPassword && u.id !== session?.user?.id && (
                        <Button variant="outline" size="sm" onClick={() => openResetPassword(u)}>
                          <Key className="h-3 w-3 mr-1" />
                          Reset Password
                        </Button>
                      )}
                      <Button variant="destructive" size="sm" onClick={() => removeUser(u.id)}>
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {users.length} of {total} users
          {total > 0 && (
            <span className="ml-2">
              (Page {page} of {pages})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page <= 1} 
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= pages} 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <AvatarUpload
                userId={editing?.id || 'new'}
                currentAvatar={form.avatar}
                userName={form.name}
                userEmail={form.email}
                onAvatarChange={(avatarUrl) => setForm({ ...form, avatar: avatarUrl || '' })}
                size="lg"
                disabled={!editing} // Only allow avatar upload for existing users
              />
            </div>
            
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <RadioGroup value={form.role} onValueChange={(value: string) => setForm({ ...form, role: value })} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="USER" id="user" />
                  <label htmlFor="user" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    User
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MANAGER" id="manager" />
                  <label htmlFor="manager" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Manager
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ADMIN" id="admin" />
                  <label htmlFor="admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Admin
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SUPER_ADMIN" id="super_admin" />
                  <label htmlFor="super_admin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Super Admin
                  </label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Default Space Selection */}
            <div className="space-y-1">
              <Label>Default Space</Label>
              <Select value={form.default_space_id} onValueChange={(value) => setForm({ ...form, default_space_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select default space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No default space</SelectItem>
                  {availableSpaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name} {space.is_default && '(Default)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Space Access Multi-Select */}
            <div className="space-y-1">
              <Label>Space Access</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {loadingSpaces ? (
                  <div className="text-sm text-muted-foreground">Loading spaces...</div>
                ) : availableSpaces.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No spaces available</div>
                ) : (
                  availableSpaces.map(space => {
                    const userSpace = form.spaces.find((s: any) => s.id === space.id)
                    return (
                      <div key={space.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`space-${space.id}`}
                            checked={!!userSpace}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({
                                  ...form,
                                  spaces: [...form.spaces, { id: space.id, name: space.name, role: 'member' }]
                                })
                              } else {
                                setForm({
                                  ...form,
                                  spaces: form.spaces.filter((s: any) => s.id !== space.id)
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`space-${space.id}`} className="text-sm">
                            {space.name} {space.is_default && '(Default)'}
                          </label>
                        </div>
                        {userSpace && (
                          <Select
                            value={userSpace.role}
                            onValueChange={(role) => {
                              setForm({
                                ...form,
                                spaces: form.spaces.map((s: any) => 
                                  s.id === space.id ? { ...s, role } : s
                                )
                              })
                            }}
                          >
                            <SelectTrigger className="w-24 h-6 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="owner">Owner</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Active</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Set a password" />
              </div>
            )}
            {editing && (
              <div className="space-y-1">
                <Label>New Password (optional)</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Leave blank to keep current" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                Resetting password for: <span className="font-medium">{resetPasswordUser?.email}</span>
              </p>
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Enter new password (min 6 characters)" 
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm new password" 
              />
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-600">Passwords do not match</p>
            )}
            {newPassword && newPassword.length < 6 && (
              <p className="text-sm text-red-600">Password must be at least 6 characters long</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={resetPassword} 
              disabled={resettingPassword || newPassword.length < 6 || newPassword !== confirmPassword}
            >
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
