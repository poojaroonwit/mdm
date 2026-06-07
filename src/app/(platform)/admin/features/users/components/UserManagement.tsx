'use client'
import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { Space, User, UserGroup } from '../types'
import { UserManagementToolbar } from './UserManagementToolbar'
import { UserPagination } from './UserPagination'
import { UserDetailsDialog } from './UserDetailsDialog'
import { UserImportDialog } from './UserImportDialog'
import { UserSyncSettingsDialog } from './UserSyncSettingsDialog'
import { UserResetPasswordDialog } from './UserResetPasswordDialog'
import { UserBulkActionsDialog } from './UserBulkActionsDialog'
import { UserCreateDialog, type UserCreateFormState } from './UserCreateDialog'
import { UserDirectoryTable } from './UserDirectoryTable'
import { UserEditDialog, type UserEditFormState } from './UserEditDialog'
export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogTab, setEditDialogTab] = useState('basic')
  const [editForm, setEditForm] = useState<UserEditFormState>({ name: '', email: '', role: 'USER', isActive: true, defaultSpaceId: '', spaces: [], allowedLoginMethods: [], groupIds: [] })
  const [createForm, setCreateForm] = useState<UserCreateFormState>({
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
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resettingPassword, setResettingPassword] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [showImportDialog, setShowImportDialog] = useState(false)
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
  const [showSyncSettingsDialog, setShowSyncSettingsDialog] = useState(false)
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
        const transformedUsers = data.users?.map((user: any) => ({
          ...user,
          isActive: user.isActive,
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

  const resetTwoFactor = async (user: User) => {
    if (!confirm(`Are you sure you want to disable 2FA for ${user.name}?`)) return

    try {
      const res = await fetch(`/api/admin/users/${user.id}/reset-2fa`, { method: 'POST' })
      if (res.ok) {
        toast.success('2FA disabled successfully')
        loadUsers()
      } else {
        toast.error('Failed to disable 2FA')
      }
    } catch {
      toast.error('Failed to disable 2FA')
    }
  }

  const exportUsers = async () => {
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

  const handleEditAvatarChange = (avatarUrl: string | null) => {
    if (!editingUser) return

    setUsers(users.map((user) =>
      user.id === editingUser.id ? { ...user, avatar: avatarUrl || undefined } : user
    ))
    setEditingUser({ ...editingUser, avatar: avatarUrl || undefined })
  }

  return (
    <div className="bg-background">
      <div className="max-w-[1600px] mx-auto">
        <UserManagementToolbar
          activeFilter={activeFilter}
          isSyncing={isSyncing}
          roleFilter={roleFilter}
          search={search}
          selectedCount={selectedUserIds.length}
          spaceFilter={spaceFilter}
          spaces={spaces}
          onBulkActions={() => setShowBulkDialog(true)}
          onCreateUser={openCreateDialog}
          onExportUsers={exportUsers}
          onImportUsers={() => setShowImportDialog(true)}
          onManageRoles={() => {
            const url = new URL(window.location.href)
            url.searchParams.set('tab', 'roles')
            window.location.href = url.toString()
          }}
          onSearchChange={setSearch}
          onSetActiveFilter={setActiveFilter}
          onSetRoleFilter={setRoleFilter}
          onSetSpaceFilter={setSpaceFilter}
          onSyncAd={handleSyncAd}
          onSyncSettings={() => setShowSyncSettingsDialog(true)}
        />

        <UserDirectoryTable
          activeFilter={activeFilter}
          error={error}
          loading={loading}
          roleFilter={roleFilter}
          search={search}
          selectedUserIds={selectedUserIds}
          spaceFilter={spaceFilter}
          total={total}
          users={users}
          onCreateUser={openCreateDialog}
          onDeleteUser={deleteUser}
          onEditUser={openEditDialog}
          onRetry={loadUsers}
          onResetPassword={(user) => {
            setResetPasswordUser(user)
            setShowResetPasswordDialog(true)
          }}
          onResetTwoFactor={resetTwoFactor}
          onSelectedUserIdsChange={setSelectedUserIds}
          onViewUser={(user) => {
            setSelectedUser(user)
            setShowUserDetails(true)
          }}
        />

        <UserPagination
          limit={limit}
          page={page}
          pages={pages}
          total={total}
          onPageChange={setPage}
        />

        <UserEditDialog
          activeTab={editDialogTab}
          editingUser={editingUser}
          form={editForm}
          groups={groups}
          loginMethods={getAvailableLoginMethods()}
          open={showEditDialog}
          spaces={spaces}
          setActiveTab={setEditDialogTab}
          setForm={setEditForm}
          onAvatarChange={handleEditAvatarChange}
          onOpenChange={setShowEditDialog}
          onSave={saveUser}
        />

        <UserCreateDialog
          creatingUser={creatingUser}
          form={createForm}
          loginMethods={getAvailableLoginMethods()}
          open={showCreateDialog}
          spaces={spaces}
          setForm={setCreateForm}
          onCreateUser={createUser}
          onOpenChange={setShowCreateDialog}
        />

        <UserBulkActionsDialog
          open={showBulkDialog}
          selectedUserIds={selectedUserIds}
          spaces={spaces}
          onCompleted={() => {
            setSelectedUserIds([])
            loadUsers()
          }}
          onOpenChange={setShowBulkDialog}
        />

        <UserDetailsDialog
          open={showUserDetails}
          onOpenChange={setShowUserDetails}
          user={selectedUser}
          spaces={spaces}
          onEditUser={(user) => {
            setShowUserDetails(false)
            openEditDialog(user)
          }}
          onResetPassword={(user) => {
            setShowUserDetails(false)
            setResetPasswordUser(user)
            setShowResetPasswordDialog(true)
          }}
        />
        <UserSyncSettingsDialog
          open={showSyncSettingsDialog}
          onOpenChange={setShowSyncSettingsDialog}
        />

        <UserImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          onImported={loadUsers}
        />
        <UserResetPasswordDialog
          open={showResetPasswordDialog}
          onOpenChange={setShowResetPasswordDialog}
          user={resetPasswordUser}
          newPassword={newPassword}
          confirmPassword={confirmPassword}
          resettingPassword={resettingPassword}
          setNewPassword={setNewPassword}
          setConfirmPassword={setConfirmPassword}
          onResetPassword={resetPassword}
        />
      </div>
    </div>
  )
}
