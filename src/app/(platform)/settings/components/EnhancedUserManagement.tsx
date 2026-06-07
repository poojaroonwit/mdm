'use client'

import { useState, useEffect, useMemo } from 'react'

import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

import { EnhancedUserDetailsDialog } from './EnhancedUserDetailsDialog'
import { EnhancedUserEditDialog } from './EnhancedUserEditDialog'
import { EnhancedUserManagementFilters } from './EnhancedUserManagementFilters'
import { EnhancedUserManagementList } from './EnhancedUserManagementList'
import type { EditUserForm, Space, User } from './enhanced-user-management-types'

const initialEditForm: EditUserForm = {
  name: '',
  email: '',
  role: 'USER',
  is_active: true,
  default_space_id: '',
  spaces: []
}

export function EnhancedUserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [spaceFilter, setSpaceFilter] = useState('')

  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDetails, setShowUserDetails] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editDialogTab, setEditDialogTab] = useState('basic')
  const [editForm, setEditForm] = useState<EditUserForm>(initialEditForm)

  const pages = useMemo(() => Math.ceil(total / limit), [total, limit])

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
  }, [page, limit, roleFilter, activeFilter, spaceFilter])

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
      spaces: user.spaces.map((space) => ({ space_id: space.space_id, role: space.role }))
    })
    setEditDialogTab('basic')
    setShowEditDialog(true)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return

    try {
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

  const handleAvatarChange = (avatarUrl: string | null) => {
    if (!editingUser) return

    const nextAvatar = avatarUrl || undefined
    setUsers((currentUsers) => currentUsers.map((user) => (
      user.id === editingUser.id ? { ...user, avatar: nextAvatar } : user
    )))
    setEditingUser({ ...editingUser, avatar: nextAvatar })
  }

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setShowUserDetails(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-muted-foreground">
            Manage all users across all spaces and their associations
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {total} total users
        </Badge>
      </div>

      <EnhancedUserManagementFilters
        search={search}
        roleFilter={roleFilter}
        activeFilter={activeFilter}
        spaceFilter={spaceFilter}
        spaces={spaces}
        onSearchChange={setSearch}
        onRoleFilterChange={setRoleFilter}
        onActiveFilterChange={setActiveFilter}
        onSpaceFilterChange={setSpaceFilter}
      />

      <EnhancedUserManagementList
        users={users}
        total={total}
        pages={pages}
        page={page}
        limit={limit}
        loading={loading}
        error={error}
        onRetry={loadUsers}
        onPageChange={setPage}
        onViewUser={handleViewUser}
        onEditUser={handleEditUser}
        onToggleUserStatus={handleToggleUserStatus}
      />

      <EnhancedUserDetailsDialog
        open={showUserDetails}
        user={selectedUser}
        onOpenChange={setShowUserDetails}
      />

      <EnhancedUserEditDialog
        open={showEditDialog}
        editingUser={editingUser}
        editForm={editForm}
        editDialogTab={editDialogTab}
        spaces={spaces}
        setEditForm={setEditForm}
        onAvatarChange={handleAvatarChange}
        onOpenChange={setShowEditDialog}
        onTabChange={setEditDialogTab}
        onSave={handleSaveUser}
      />
    </div>
  )
}
