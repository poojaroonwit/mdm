'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Users,
  Plus,
  Search,
  Filter,
  Trash2,
  Key,
  Shield,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Settings,
  Folder,
  Download,
  Upload,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  FolderTree,
  Smartphone,
  Cloud,
  Edit,
  UserPlus,
  UserMinus,
  Globe,
  Mail,
  Calendar,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { User, UserGroup } from '../types'
import { cn } from '@/lib/utils'

interface Space {
  id: string
  name: string
  slug: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [spaceFilter, setSpaceFilter] = useState('all')

  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogTab, setEditDialogTab] = useState('basic')
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'USER',
    isActive: true,
    defaultSpaceId: '',
    spaces: [] as Array<{ spaceId: string; role: string }>,
    allowedLoginMethods: [] as string[],
    groupIds: [] as string[]
  })
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'USER',
    isActive: true,
    defaultSpaceId: '',
    spaces: [] as Array<{ spaceId: string; role: string }>,
    allowedLoginMethods: [] as string[],
    groupIds: [] as string[]
  })
  const [creatingUser, setCreatingUser] = useState(false)

  // Reset password
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)

  // Bulk operations
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [bulkOperation, setBulkOperation] = useState<'role' | 'space' | 'activate' | 'deactivate' | 'delete' | null>(null)
  const [bulkRole, setBulkRole] = useState('')
  const [bulkSpaceId, setBulkSpaceId] = useState('')
  const [bulkSpaceRole, setBulkSpaceRole] = useState('')
  const [bulkProcessing, setBulkProcessing] = useState(false)

  // Import
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<{ success: any[]; failed: any[] } | null>(null)
  
  const [isSyncing, setIsSyncing] = useState(false)

  const handleSyncAd = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/admin/users/sync', { method: 'POST' })
      if (!res.ok) throw new Error('Sync failed')
      const data = await res.json()
      toast.success(`Synced ${data.total} users (${data.created} created, ${data.updated} updated)`)
      loadUsers()
    } catch (e) {
      console.error(e)
      toast.error('Failed to sync AD users')
    } finally {
      setIsSyncing(false)
    }
  }

  // Sync Schedule
  const [showSyncSettingsDialog, setShowSyncSettingsDialog] = useState(false)
  const [syncSchedule, setSyncSchedule] = useState({ enabled: false, frequency: 'daily', time: '00:00' })
  const [savingSyncSettings, setSavingSyncSettings] = useState(false)

  const loadSyncSettings = async () => {
      try {
          const res = await fetch('/api/admin/settings/ad-sync-schedule')
          if (res.ok) {
              const data = await res.json()
              setSyncSchedule({
                  enabled: data.enabled ?? false,
                  frequency: data.frequency || 'daily',
                  time: data.time || '00:00'
              })
          }
      } catch (e) {
          console.error(e)
      }
  }

  const saveSyncSettings = async () => {
      setSavingSyncSettings(true)
      try {
          const res = await fetch('/api/admin/settings/ad-sync-schedule', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(syncSchedule)
          })
          if (res.ok) {
              toast.success('Sync schedule saved')
              setShowSyncSettingsDialog(false)
          } else {
              toast.error('Failed to save settings')
          }
      } catch(e) {
          toast.error('Error saving settings')
      } finally {
          setSavingSyncSettings(false)
      }
  }

  useEffect(() => {
    if (showSyncSettingsDialog) {
        loadSyncSettings()
    }
  }, [showSyncSettingsDialog])

  const [ssoConfig, setSsoConfig] = useState<{ google: boolean; azure: boolean }>({ google: false, azure: false })

  useEffect(() => {
    fetch('/api/auth/sso-providers')
      .then(res => res.json())
      .then(data => setSsoConfig(data))
      .catch(err => console.error(err))
  }, [])

  const getAvailableLoginMethods = () => {
    const methods = ['email']
    if (ssoConfig.azure) methods.push('azure-ad')
    if (ssoConfig.google) methods.push('google')
    return methods
  }

  const formatLoginMethod = (method: string) => {
    if (method === 'email') return 'Email/Password'
    if (method === 'azure-ad') return 'Azure AD'
    if (method === 'google') return 'Google'
    return method
  }

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

  useEffect(() => {
    loadUsers()
    loadSpaces()
    loadGroups()
  }, [page, limit, roleFilter, activeFilter, spaceFilter, search])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        role: roleFilter === 'all' ? '' : roleFilter,
        active: activeFilter === 'all' ? '' : activeFilter,
        spaceId: spaceFilter === 'all' ? '' : spaceFilter
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Transform the data to match the component's interface
        const transformedUsers = data.users?.map((user: any) => ({
          ...user,
          isActive: user.isActive, // Matches API alias
          isTwoFactorEnabled: user.isTwoFactorEnabled,
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : undefined,
          defaultSpaceId: user.defaultSpaceId,
          avatar: user.avatar || undefined,
          allowedLoginMethods: user.allowedLoginMethods || [], // API alias
          createdAt: new Date(user.createdAt),
          adUserId: user.adUserId,
          jobTitle: user.jobTitle,
          department: user.department,
          organization: user.organization
        })) || []
        setUsers(transformedUsers)
        setTotal(data.total || 0)
        setError(null)
      } else {
        let message = 'Failed to load users'
        try {
          const err = await response.json()
          if (err?.error) message = err.error
        } catch { }
        setError(`${response.status} ${message}`)
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const response = await fetch('/api/admin/user-groups?flat=true')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('Error loading groups:', error)
    }
  }

  const openCreateDialog = () => {
    setCreateForm({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      isActive: true,
      defaultSpaceId: '',
      spaces: [],
      allowedLoginMethods: getAvailableLoginMethods(),
      groupIds: []
    })
    setShowCreateDialog(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      defaultSpaceId: user.defaultSpaceId || '',
      spaces: user.spaces || [],
      allowedLoginMethods: user.allowedLoginMethods || [],
      groupIds: user.groups?.map(g => g.groupId) || []
    })
    setEditDialogTab('basic')
    setShowEditDialog(true)
  }

  const createUser = async () => {
    if (!createForm.email || !createForm.name || !createForm.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreatingUser(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: createForm.email,
          name: createForm.name,
          password: createForm.password,
          role: createForm.role,
          isActive: createForm.isActive,
          defaultSpaceId: createForm.defaultSpaceId && createForm.defaultSpaceId !== 'none' ? createForm.defaultSpaceId : null,
          spaces: createForm.spaces,
          allowedLoginMethods: createForm.allowedLoginMethods
        }),
      })

      if (response.ok) {
        toast.success('User created successfully')
        setShowCreateDialog(false)
        setCreateForm({
          name: '',
          email: '',
          password: '',
          role: 'USER',
          isActive: true,
          defaultSpaceId: '',
          spaces: [],
          allowedLoginMethods: getAvailableLoginMethods(),
          groupIds: []
        })
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Failed to create user')
    } finally {
      setCreatingUser(false)
    }
  }

  const saveUser = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          defaultSpaceId: editForm.defaultSpaceId === 'none' ? null : editForm.defaultSpaceId,
          allowedLoginMethods: editForm.allowedLoginMethods,
          groupIds: editForm.groupIds
        }),
      })

      if (response.ok) {
        toast.success('User updated successfully')
        setShowEditDialog(false)
        setEditingUser(null)
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        loadUsers()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  const resetPassword = async () => {
    if (!resetPasswordUser || !newPassword || newPassword !== confirmPassword) {
      toast.error('Please enter matching passwords')
      return
    }

    setResettingPassword(true)
    try {
      const response = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: newPassword }),
      })

      if (response.ok) {
        toast.success('Password reset successfully')
        setShowResetPasswordDialog(false)
        setResetPasswordUser(null)
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      toast.error('Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400'
      case 'ADMIN':
        return 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400'
      case 'MANAGER':
        return 'border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-400'
      case 'USER':
        return 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
      default:
        return 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400'
    }
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? (
      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
    ) : (
      <XCircle className="h-3.5 w-3.5 text-rose-500" />
    )
  }

  const activeUsersCount = useMemo(() => users.filter(u => u.isActive).length, [users])
  const inactiveUsersCount = useMemo(() => users.filter(u => !u.isActive).length, [users])

  return (
    <div className="bg-background">
      <div className="max-w-[1600px] mx-auto">
        {/* Toolbar with Actions and Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Action buttons row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedUserIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBulkDialog(true)
                  }}
                  className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-xl"
                >
                  <Users className="h-3 w-3 mr-2" />
                  Bulk Actions ({selectedUserIds.length})
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-xl">
                    <MoreHorizontal className="h-3 w-3 mr-2" />
                    More
                    <ChevronDown className="h-3 w-3 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
                  <DropdownMenuItem onClick={() => {
                    const url = new URL(window.location.href)
                    url.searchParams.set('tab', 'roles')
                    window.location.href = url.toString()
                  }} className="text-xs font-medium">
                    <Shield className="h-3.5 w-3.5 mr-2" />
                    Manage Roles
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSyncSettingsDialog(true)} className="text-xs font-medium">
                    <Settings className="h-3.5 w-3.5 mr-2" />
                    Sync Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowImportDialog(true)} className="text-xs font-medium">
                    <Upload className="h-3.5 w-3.5 mr-2" />
                    Import Users
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const params = new URLSearchParams({
                        search,
                        role: roleFilter === 'all' ? '' : roleFilter,
                        active: activeFilter === 'all' ? '' : activeFilter,
                        spaceId: spaceFilter === 'all' ? '' : spaceFilter
                      })
                      const response = await fetch(`/api/admin/users/export?${params}`)
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                        toast.success('Users exported successfully')
                      } else {
                        toast.error('Failed to export users')
                      }
                    } catch (error) {
                      console.error('Error exporting users:', error)
                      toast.error('Failed to export users')
                    }
                  }} className="text-xs font-medium">
                    <Download className="h-3.5 w-3.5 mr-2" />
                    Export Users
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSyncAd} disabled={isSyncing} variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-xl">
                <Cloud className={`h-3 w-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync AD'}
              </Button>
              <Button onClick={openCreateDialog} size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10">
                <UserPlus className="h-3 w-3 mr-2" />
                Add User
              </Button>
            </div>
          </div>

          {/* Search and Filters row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="pl-9 h-10 text-xs font-medium bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl placeholder:text-zinc-400 backdrop-blur-xl"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[140px] h-10 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl backdrop-blur-xl">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectItem value="all" className="text-xs font-medium">All Roles</SelectItem>
                  <SelectItem value="SUPER_ADMIN" className="text-xs font-medium text-rose-500">Super Admin</SelectItem>
                  <SelectItem value="ADMIN" className="text-xs font-medium text-amber-500">Admin</SelectItem>
                  <SelectItem value="MANAGER" className="text-xs font-medium text-sky-500">Manager</SelectItem>
                  <SelectItem value="USER" className="text-xs font-medium text-emerald-500">User</SelectItem>
                </SelectContent>
              </Select>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger className="w-[130px] h-10 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl backdrop-blur-xl">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
                  <SelectItem value="true" className="text-xs font-medium text-emerald-500">Active</SelectItem>
                  <SelectItem value="false" className="text-xs font-medium text-rose-500">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={spaceFilter} onValueChange={setSpaceFilter}>
                <SelectTrigger className="w-[160px] h-10 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl backdrop-blur-xl">
                  <SelectValue placeholder="All Spaces" />
                </SelectTrigger>
                <SelectContent className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
                  <SelectItem value="all" className="text-xs font-medium">All Spaces</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id} className="text-xs font-medium">
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(search || roleFilter !== 'all' || activeFilter !== 'all' || spaceFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('')
                    setRoleFilter('all')
                    setActiveFilter('all')
                    setSpaceFilter('all')
                  }}
                  className="h-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table - Supabase Style */}
        <div className="bg-white/50 dark:bg-zinc-950/20 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden backdrop-blur-xl shadow-lg">
          <div className="px-6 py-4 border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/30 dark:bg-zinc-900/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">User Directory</h2>
                {selectedUserIds.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] font-black bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 h-5">
                    {selectedUserIds.length} SELECTED
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-bold text-zinc-400">
                {users.length} OF {total} TOTAL
              </span>
            </div>
          </div>

          {loading ? (
            <div className="w-full space-y-3 p-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-sm font-medium text-destructive mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadUsers}
              >
                Try Again
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
              <p className="text-sm font-medium text-foreground mb-1">No users found</p>
              <p className="text-xs text-muted-foreground mb-4">
                {search || roleFilter !== 'all' || activeFilter !== 'all' || spaceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first user'}
              </p>
              {(!search && roleFilter === 'all' && activeFilter === 'all' && spaceFilter === 'all') && (
                <Button onClick={openCreateDialog} size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-zinc-200/60 dark:border-zinc-800/60 hover:bg-transparent">
                    <TableHead className="w-12 h-12">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds(users.map(u => u.id))
                          } else {
                            setSelectedUserIds([])
                          }
                        }}
                        className="rounded-md border-zinc-300 dark:border-zinc-700 cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Profile</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Email Address</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Global Role</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Demographics</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Account Status</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Security</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Spaces</TableHead>
                    <TableHead className="h-12 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pulse</TableHead>
                    <TableHead className="h-12 w-[80px] text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => (
                    <TableRow
                      key={user.id}
                      className={cn(
                        "border-b border-zinc-100/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all duration-300 group/row",
                        selectedUserIds.includes(user.id) && "bg-zinc-100/50 dark:bg-zinc-800/30",
                        index === users.length - 1 && "border-b-0"
                      )}
                    >
                      <TableCell className="h-16">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, user.id])
                            } else {
                              setSelectedUserIds(selectedUserIds.filter(id => id !== user.id))
                            }
                          }}
                          className="rounded-md border-zinc-300 dark:border-zinc-700 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-zinc-100 dark:border-zinc-800">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[10px] font-black">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{user.name}</div>
                            <div className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="h-16">
                        <Badge 
                          variant="outline" 
                          className={cn("text-[10px] font-black uppercase tracking-widest h-5", getRoleColor(user.role))}
                        >
                          {user.role.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex flex-col">
                           <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{user.department || '-'}</span>
                           <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{user.jobTitle || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(user.isActive)}
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            user.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          )}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex flex-wrap items-center gap-2">
                           {user.isTwoFactorEnabled ? (
                               <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400 gap-1 pr-2">
                                   <Smartphone className="h-3 w-3" />
                                   On
                               </Badge>
                           ) : (
                               <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400 gap-1 pr-2">
                                   <Smartphone className="h-3 w-3 opacity-50" />
                                   Off
                               </Badge>
                           )}
                           {(user.allowedLoginMethods && user.allowedLoginMethods.length > 0 ? user.allowedLoginMethods : ['all']).map((method) => (
                             <Badge
                               key={method}
                               variant="outline"
                               className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300 gap-1 pr-2"
                             >
                               <Shield className="h-3 w-3" />
                               {method === 'all' ? 'All Methods' : formatLoginMethod(method)}
                             </Badge>
                           ))}
                        </div>
                      </TableCell>
                      <TableCell className="h-16">
                        {user.spaces && user.spaces.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {user.spaces.slice(0, 2).map((space, idx) => (
                              <Badge key={idx} variant="outline" className="text-[10px] font-black uppercase tracking-widest border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 text-zinc-500 h-5">
                                {space.spaceName}
                              </Badge>
                            ))}
                            {user.spaces.length > 2 && (
                              <Badge variant="outline" className="text-[10px] font-black uppercase border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 text-zinc-400 h-5">
                                +{user.spaces.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="h-16">
                        {user.lastLoginAt ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            {new Date(user.lastLoginAt).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="h-16">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                            onClick={() => openEditDialog(user)}
                            title="Edit User"
                          >
                            <Edit className="h-3.5 w-3.5 text-zinc-500" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => {
                                setSelectedUser(user)
                                setShowUserDetails(true)
                              }}>
                                <Settings className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setResetPasswordUser(user)
                                setShowResetPasswordDialog(true)
                              }}>
                                <Key className="h-4 w-4 mr-2" />
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={async () => {
                                  if (!confirm(`Are you sure you want to disable 2FA for ${user.name}?`)) return
                                  try {
                                      const res = await fetch(`/api/admin/users/${user.id}/reset-2fa`, { method: 'POST' });
                                      if (res.ok) {
                                          toast.success('2FA disabled successfully');
                                          loadUsers();
                                      } else {
                                          toast.error('Failed to disable 2FA');
                                      }
                                  } catch (e) {
                                      toast.error('Failed to disable 2FA');
                                  }
                              }} className="text-xs font-medium opacity-70">
                                <Smartphone className="h-3.5 w-3.5 mr-2" />
                                Reset 2FA
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => deleteUser(user.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination - Supabase Style */}
        {pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{' '}
              <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-medium text-foreground">{total}</span> users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="h-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  let pageNum
                  if (pages <= 5) {
                    pageNum = i + 1
                  } else if (page <= 3) {
                    pageNum = i + 1
                  } else if (page >= pages - 2) {
                    pageNum = pages - 4 + i
                  } else {
                    pageNum = page - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                      className="w-8 h-8 p-0 text-xs"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="h-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Edit User Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex-1 overflow-y-auto min-h-0 p-6 pt-2 pb-4">

            <div className="w-full">
              <Tabs value={editDialogTab} onValueChange={setEditDialogTab}>
                <TabsList className="w-full flex justify-start gap-2">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4" />
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
                  <TabsTrigger value="groups" className="flex items-center gap-2">
                    <FolderTree className="h-4 w-4" />
                    Groups
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
                      <Label htmlFor="edit-name">Name</Label>
                      <Input
                        id="edit-name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-email">Email</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Allowed Login Methods</Label>
                    <p className="text-xs text-muted-foreground">Select allowed methods. Leave empty to allow all configured methods.</p>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                      {getAvailableLoginMethods().map((method) => {
                        const isSelected = editForm.allowedLoginMethods?.includes(method)
                        return (
                          <div
                            key={method}
                            className={cn(
                              "cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors select-none",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-input"
                            )}
                            onClick={() => {
                              setEditForm(prev => {
                                const current = prev.allowedLoginMethods || []
                                if (current.includes(method)) {
                                  return { ...prev, allowedLoginMethods: current.filter(m => m !== method) }
                                } else {
                                  return { ...prev, allowedLoginMethods: [...current, method] }
                                }
                              })
                            }}
                          >
                            {formatLoginMethod(method)}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="edit-active"
                      checked={editForm.isActive}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, isActive: checked })}
                    />
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                </TabsContent>

                <TabsContent value="roles" className="space-y-4 mt-4">
                  <div>
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Global Role (System-wide)
                    </Label>
                    <p className="text-xs text-muted-foreground mb-2">
                      This role applies across all spaces and controls system-level access
                    </p>
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
                    <Label htmlFor="edit-default-space">Default Space</Label>
                    <Select value={editForm.defaultSpaceId} onValueChange={(value) => setEditForm({ ...editForm, defaultSpaceId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default space" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No default space</SelectItem>
                        {spaces.map(space => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="spaces" className="space-y-4 mt-4">
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      Space Associations
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Manage roles assigned in specific spaces
                    </p>

                    <div className="space-y-2">
                      {editForm.spaces.map((space, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 border rounded">
                          <Select
                            value={space.spaceId}
                            onValueChange={(value) => {
                              const newSpaces = [...editForm.spaces]
                              newSpaces[index] = { ...newSpaces[index], spaceId: value }
                              setEditForm({ ...editForm, spaces: newSpaces })
                            }}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select space" />
                            </SelectTrigger>
                            <SelectContent>
                              {spaces.map(s => (
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
                              newSpaces[index] = { ...newSpaces[index], role: value }
                              setEditForm({ ...editForm, spaces: newSpaces })
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
                            onClick={() => {
                              const newSpaces = editForm.spaces.filter((_, i) => i !== index)
                              setEditForm({ ...editForm, spaces: newSpaces })
                            }}
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
                      onClick={() => {
                        setEditForm({
                          ...editForm,
                          spaces: [...editForm.spaces, { spaceId: '', role: 'member' }]
                        })
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Space Association
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4 mt-4">
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
                            const isSelected = editForm.groupIds.includes(group.id)
                            return (
                              <div
                                key={group.id}
                                className={cn(
                                  "flex items-center gap-3 p-3 cursor-pointer transition-colors",
                                  isSelected
                                    ? "bg-primary/5"
                                    : "hover:bg-muted/50"
                                )}
                                onClick={() => {
                                  setEditForm(prev => ({
                                    ...prev,
                                    groupIds: isSelected
                                      ? prev.groupIds.filter(id => id !== group.id)
                                      : [...prev.groupIds, group.id]
                                  }))
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
                                  {group.description && (
                                    <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                                  )}
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
                    {editForm.groupIds.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {editForm.groupIds.length} group(s) selected
                      </p>
                    )}
                  </div>
                </TabsContent>
              </DialogBody>

            <DialogFooter className="flex-shrink-0 border-t-0 p-6 pt-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)} className="px-6 h-11 rounded-xl">
                Cancel
              </Button>
              <Button onClick={saveUser} className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create User Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl flex flex-col p-0 overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="flex-1 overflow-y-auto p-6 pt-2 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-name">Name *</Label>
                  <Input
                    id="create-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="create-email">Email *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="create-password">Password *</Label>
                <Input
                  id="create-password"
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-role">Role</Label>
                  <Select value={createForm.role} onValueChange={(value) => setCreateForm({ ...createForm, role: value })}>
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
                  <Label htmlFor="create-default-space">Default Space</Label>
                  <Select value={createForm.defaultSpaceId} onValueChange={(value) => setCreateForm({ ...createForm, defaultSpaceId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select default space" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default space</SelectItem>
                      {spaces.map(space => (
                        <SelectItem key={space.id} value={space.id}>
                          {space.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Allowed Login Methods</Label>
                <p className="text-xs text-muted-foreground">Select allowed methods. Leave empty to allow all configured methods.</p>
                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                  {getAvailableLoginMethods().map((method) => {
                    const isSelected = createForm.allowedLoginMethods.includes(method)
                    return (
                      <div
                        key={method}
                        className={cn(
                          "cursor-pointer px-3 py-1.5 rounded-full text-sm border transition-colors select-none",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        )}
                        onClick={() => {
                          setCreateForm(prev => {
                            const current = prev.allowedLoginMethods
                            if (current.includes(method)) {
                              return { ...prev, allowedLoginMethods: current.filter(m => m !== method) }
                            } else {
                              return { ...prev, allowedLoginMethods: [...current, method] }
                            }
                          })
                        }}
                      >
                        {formatLoginMethod(method)}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="create-active"
                  checked={createForm.isActive}
                  onCheckedChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
                />
                <Label htmlFor="create-active">Active</Label>
              </div>

              {/* Space Assignments */}
              <div className="space-y-2">
                <Label>Space Access</Label>
                <div className="text-sm text-muted-foreground mb-2">
                  Assign user to spaces and set their role in each space
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                  {spaces.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No spaces available</div>
                  ) : (
                    spaces.map(space => {
                      const userSpace = createForm.spaces.find((s: any) => s.spaceId === space.id)
                      return (
                        <div key={space.id} className="flex items-center justify-between py-1">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`create-space-${space.id}`}
                              checked={!!userSpace}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCreateForm({
                                    ...createForm,
                                    spaces: [...createForm.spaces, { spaceId: space.id, role: 'member' }]
                                  })
                                } else {
                                  setCreateForm({
                                    ...createForm,
                                    spaces: createForm.spaces.filter((s: any) => s.spaceId !== space.id)
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`create-space-${space.id}`} className="text-sm cursor-pointer">
                              {space.name}
                            </label>
                          </div>
                          {userSpace && (
                            <Select
                              value={userSpace.role}
                              onValueChange={(role) => {
                                setCreateForm({
                                  ...createForm,
                                  spaces: createForm.spaces.map((s: any) =>
                                    s.spaceId === space.id ? { ...s, role } : s
                                  )
                                })
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
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </DialogBody>
            <DialogFooter className="flex-shrink-0 border-t-0 p-6 pt-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="px-6 h-11 rounded-xl">
                Cancel
              </Button>
              <Button onClick={createUser} disabled={creatingUser} className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold">
                {creatingUser ? 'Creating...' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk Operations Dialog */}
        <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle>Bulk Actions</DialogTitle>
              <DialogDescription>
                Apply actions to {selectedUserIds.length} selected user(s)
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4 p-6 pt-2 pb-4">
              <div>
                <Label>Operation Type</Label>
                <Select value={bulkOperation || ''} onValueChange={(value) => setBulkOperation(value as 'role' | 'space' | 'activate' | 'deactivate' | 'delete' | null)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="role">Update Global Role</SelectItem>
                    <SelectItem value="space">Assign to Space</SelectItem>
                    <SelectItem value="activate">Activate Users</SelectItem>
                    <SelectItem value="deactivate">Deactivate Users</SelectItem>
                    <SelectItem value="delete">Delete Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {bulkOperation === 'role' && (
                <div>
                  <Label>Global Role</Label>
                  <Select value={bulkRole} onValueChange={setBulkRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">User</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {bulkOperation === 'space' && (
                <div className="space-y-4">
                  <div>
                    <Label>Space</Label>
                    <Select value={bulkSpaceId} onValueChange={setBulkSpaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select space" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces.map(space => (
                          <SelectItem key={space.id} value={space.id}>
                            {space.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Space Role</Label>
                    <Select value={bulkSpaceRole} onValueChange={setBulkSpaceRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(bulkOperation === 'activate' || bulkOperation === 'deactivate') && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <p className="text-sm text-blue-900 dark:text-blue-200">
                    This will {bulkOperation === 'activate' ? 'activate' : 'deactivate'} {selectedUserIds.length} selected user(s).
                    {bulkOperation === 'deactivate' && ' Deactivated users will not be able to log in.'}
                  </p>
                </div>
              )}

              {bulkOperation === 'delete' && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm text-red-900 dark:text-red-200 font-semibold">
                    ⚠️ Warning: This action cannot be undone. This will permanently delete {selectedUserIds.length} user(s) and all their associated data.
                  </p>
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShowBulkDialog(false)
                setBulkOperation(null)
                setBulkRole('')
                setBulkSpaceId('')
                setBulkSpaceRole('')
              }}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!bulkOperation) {
                    toast.error('Please select an operation')
                    return
                  }
                  if (bulkOperation === 'role' && !bulkRole) {
                    toast.error('Please select a role')
                    return
                  }
                  if (bulkOperation === 'space' && (!bulkSpaceId || !bulkSpaceRole)) {
                    toast.error('Please select space and role')
                    return
                  }
                  if (bulkOperation === 'delete') {
                    if (!confirm(`Are you sure you want to permanently delete ${selectedUserIds.length} user(s)? This action cannot be undone.`)) {
                      return
                    }
                  }

                  setBulkProcessing(true)
                  try {
                    const response = await fetch('/api/admin/users/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userIds: selectedUserIds,
                        operation: ['activate', 'deactivate', 'delete'].includes(bulkOperation) ? bulkOperation : undefined,
                        role: bulkOperation === 'role' ? bulkRole : undefined,
                        spaceId: bulkOperation === 'space' ? bulkSpaceId : undefined,
                        spaceRole: bulkOperation === 'space' ? bulkSpaceRole : undefined
                      })
                    })

                    if (response.ok) {
                      const data = await response.json()
                      const actionName = bulkOperation === 'delete' ? 'deleted' : bulkOperation === 'activate' ? 'activated' : bulkOperation === 'deactivate' ? 'deactivated' : 'updated'
                      toast.success(`Successfully ${actionName} ${data.results.success.length} user(s)`)
                      if (data.results.failed.length > 0) {
                        toast.error(`${data.results.failed.length} user(s) failed: ${data.results.failed.map((f: any) => f.error).join(', ')}`)
                      }
                      setShowBulkDialog(false)
                      setSelectedUserIds([])
                      setBulkOperation(null)
                      setBulkRole('')
                      setBulkSpaceId('')
                      setBulkSpaceRole('')
                      loadUsers()
                    } else {
                      const error = await response.json()
                      toast.error(error.error || 'Bulk operation failed')
                    }
                  } catch (error) {
                    console.error('Error in bulk operation:', error)
                    toast.error('Bulk operation failed')
                  } finally {
                    setBulkProcessing(false)
                  }
                }}
                disabled={bulkProcessing || !bulkOperation || (bulkOperation === 'role' && !bulkRole) || (bulkOperation === 'space' && (!bulkSpaceId || !bulkSpaceRole))}
                variant={bulkOperation === 'delete' ? 'destructive' : 'default'}
              >
                {bulkProcessing ? 'Processing...' : bulkOperation === 'delete' ? 'Delete Users' : 'Apply'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Details Dialog */}
        <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Details
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="flex-1 overflow-y-auto p-6 pt-2 pb-4">
            {selectedUser && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedUser.avatar} />
                    <AvatarFallback className="text-2xl">
                      {selectedUser.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <p className="text-muted-foreground">{selectedUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      {getStatusIcon(selectedUser.isActive)}
                      <Badge className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono">{selectedUser.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="text-sm">{selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedUser.lastLoginAt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Login</Label>
                      <p className="text-sm">{new Date(selectedUser.lastLoginAt).toLocaleString()}</p>
                    </div>
                  )}
                  {selectedUser.defaultSpaceId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Space</Label>
                      <p className="text-sm">{spaces.find(s => s.id === selectedUser.defaultSpaceId)?.name || 'N/A'}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Allowed Login Methods</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(selectedUser.allowedLoginMethods && selectedUser.allowedLoginMethods.length > 0
                        ? selectedUser.allowedLoginMethods
                        : ['all']
                      ).map((method) => (
                        <Badge key={method} variant="outline">
                          {method === 'all' ? 'All Configured Methods' : formatLoginMethod(method)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {selectedUser.spaces && selectedUser.spaces.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Space Memberships</Label>
                    <div className="space-y-2">
                      {selectedUser.spaces.map((space, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border rounded">
                          <span className="text-sm font-medium">{space.spaceName}</span>
                          <Badge variant="outline">{space.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                </div>
              </DialogBody>
              <DialogFooter className="flex-shrink-0 border-t p-4 px-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUserDetails(false)
                    openEditDialog(selectedUser)
                  }}
                  className="rounded-xl h-10 px-4"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowUserDetails(false)
                    setResetPasswordUser(selectedUser)
                    setShowResetPasswordDialog(true)
                  }}
                  className="rounded-xl h-10 px-4"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Reset Password
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserDetails(false)}
                  className="rounded-xl h-10 px-4"
                >
                  Close
                </Button>
              </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>


      <Dialog open={showSyncSettingsDialog} onOpenChange={setShowSyncSettingsDialog}>
        <DialogContent className="p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>AD Sync Settings</DialogTitle>
            <DialogDescription>Configure automatic synchronization with Azure AD.</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
             <div className="flex items-center justify-between">
                <Label>Enable Automatic Sync</Label>
                <Switch 
                   checked={syncSchedule.enabled}
                   onCheckedChange={c => setSyncSchedule({...syncSchedule, enabled: c})}
                />
             </div>
             {syncSchedule.enabled && (
                 <>
                    <div className="space-y-2">
                        <Label>Frequency</Label>
                        <Select 
                            value={syncSchedule.frequency} 
                            onValueChange={v => setSyncSchedule({...syncSchedule, frequency: v})}
                        >
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="hourly">Hourly</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 </>
             )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSyncSettingsDialog(false)}>Cancel</Button>
            <Button onClick={saveSyncSettings} disabled={savingSyncSettings}>
                {savingSyncSettings ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
        {/* Import Users Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle>Import Users</DialogTitle>
              <DialogDescription>
                Upload a CSV file to import users. Required columns: name, email, password. Optional: role, isActive
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4 p-6 pt-2 pb-4">
              {!importResults ? (
                <>
                  <div>
                    <Label htmlFor="import-file">CSV File</Label>
                    <Input
                      id="import-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setImportFile(file)
                        }
                      }}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      CSV format: name,email,password,role,isActive
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-900 dark:text-blue-200">
                      <strong>Example CSV:</strong><br />
                      name,email,password,role,isActive<br />
                      John Doe,john@example.com,password123,USER,true<br />
                      Jane Smith,jane@example.com,password456,ADMIN,true
                    </p>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                    <p className="text-sm text-green-900 dark:text-green-200 font-semibold">
                      Successfully imported {importResults.success.length} user(s)
                    </p>
                  </div>
                  {importResults.failed.length > 0 && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                      <p className="text-sm text-red-900 dark:text-red-200 font-semibold mb-2">
                        Failed to import {importResults.failed.length} user(s):
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {importResults.failed.map((failure, idx) => (
                          <p key={idx} className="text-xs text-red-800 dark:text-red-200">
                            {failure.email}: {failure.error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </DialogBody>
            <DialogFooter>
              {importResults ? (
                <>
                  <Button variant="outline" onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                    setImportResults(null)
                    loadUsers()
                  }}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setImportFile(null)
                    setImportResults(null)
                  }}>
                    Import More
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => {
                    setShowImportDialog(false)
                    setImportFile(null)
                  }}>
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!importFile) {
                        toast.error('Please select a file')
                        return
                      }

                      setImporting(true)
                      try {
                        const formData = new FormData()
                        formData.append('file', importFile)

                        const response = await fetch('/api/admin/users/import', {
                          method: 'POST',
                          body: formData
                        })

                        if (response.ok) {
                          const data = await response.json()
                          setImportResults(data.results)
                          toast.success(`Imported ${data.results.success.length} user(s)`)
                          if (data.results.failed.length > 0) {
                            toast.error(`${data.results.failed.length} user(s) failed to import`)
                          }
                        } else {
                          const error = await response.json()
                          toast.error(error.error || 'Failed to import users')
                        }
                      } catch (error) {
                        console.error('Error importing users:', error)
                        toast.error('Failed to import users')
                      } finally {
                        setImporting(false)
                      }
                    }}
                    disabled={!importFile || importing}
                  >
                    {importing ? 'Importing...' : 'Import Users'}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Reset Password Dialog */}
        <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
          <DialogContent className="p-0 overflow-hidden">
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Set a new password for {resetPasswordUser?.name}.
              </DialogDescription>
            </DialogHeader>
            <DialogBody className="space-y-4 p-6 pt-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
                Cancel
              </Button>
              <Button
                disabled={resettingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                onClick={async () => {
                  if (!resetPasswordUser) return
                  setResettingPassword(true)
                  try {
                    const res = await fetch(`/api/admin/users/${resetPasswordUser.id}/reset-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ password: newPassword })
                    })
                    
                    if (res.ok) {
                      toast.success('Password reset successfully')
                      setShowResetPasswordDialog(false)
                    } else {
                      const err = await res.json()
                      toast.error(err.error || 'Failed to reset password')
                    }
                  } catch (error) {
                    toast.error('Failed to reset password')
                  } finally {
                    setResettingPassword(false)
                  }
                }}
              >
                {resettingPassword ? 'Resetting...' : 'Reset Password'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
