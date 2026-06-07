'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  CheckCircle,
  Edit,
  Key,
  MoreHorizontal,
  Settings,
  Shield,
  Smartphone,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'
import type { User } from '../types'
import { formatLoginMethod } from '../utils'
import { cn } from '@/lib/utils'

interface UserDirectoryTableProps {
  activeFilter: string
  error: string | null
  loading: boolean
  roleFilter: string
  search: string
  selectedUserIds: string[]
  spaceFilter: string
  total: number
  users: User[]
  onCreateUser: () => void
  onDeleteUser: (userId: string) => void
  onEditUser: (user: User) => void
  onRetry: () => void
  onResetPassword: (user: User) => void
  onResetTwoFactor: (user: User) => void
  onSelectedUserIdsChange: (ids: string[]) => void
  onViewUser: (user: User) => void
}

function StatusIcon({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-rose-500" />
  )
}

export function UserDirectoryTable({
  activeFilter,
  error,
  loading,
  roleFilter,
  search,
  selectedUserIds,
  spaceFilter,
  total,
  users,
  onCreateUser,
  onDeleteUser,
  onEditUser,
  onRetry,
  onResetPassword,
  onResetTwoFactor,
  onSelectedUserIdsChange,
  onViewUser,
}: UserDirectoryTableProps) {
  const hasFilters = Boolean(search) || roleFilter !== 'all' || activeFilter !== 'all' || spaceFilter !== 'all'

  return (
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
        <div className="w-full space-y-1">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 animate-pulse">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-5 w-24 hidden md:block" />
              <Skeleton className="h-5 w-24 hidden lg:block" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-10 w-10 text-destructive mb-3" />
          <p className="text-sm font-medium text-destructive mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      ) : users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm font-medium text-foreground mb-1">No users found</p>
          <p className="text-xs text-muted-foreground mb-4">
            {hasFilters ? 'Try adjusting your filters' : 'Get started by adding your first user'}
          </p>
          {!hasFilters && (
            <Button onClick={onCreateUser} size="sm">
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
                    onChange={(event) => {
                      onSelectedUserIdsChange(event.target.checked ? users.map((user) => user.id) : [])
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
                    'border-b border-zinc-100/60 dark:border-zinc-800/60 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all duration-300 group/row',
                    selectedUserIds.includes(user.id) && 'bg-zinc-100/50 dark:bg-zinc-800/30',
                    index === users.length - 1 && 'border-b-0',
                  )}
                >
                  <TableCell className="h-16">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={(event) => {
                        onSelectedUserIdsChange(
                          event.target.checked
                            ? [...selectedUserIds, user.id]
                            : selectedUserIds.filter((id) => id !== user.id),
                        )
                      }}
                      className="rounded-md border-zinc-300 dark:border-zinc-700 cursor-pointer"
                      onClick={(event) => event.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="h-16">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-zinc-100 dark:border-zinc-800">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="text-[10px] font-black">
                          {user.name.split(' ').map((namePart) => namePart[0]).join('').toUpperCase()}
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
                    <RoleBadge
                      role={user.role}
                      label={user.role.replace('_', ' ')}
                      className="text-[10px] font-black uppercase tracking-widest h-5"
                    />
                  </TableCell>
                  <TableCell className="h-16">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{user.department || '-'}</span>
                      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{user.jobTitle || ''}</span>
                    </div>
                  </TableCell>
                  <TableCell className="h-16">
                    <div className="flex items-center gap-2">
                      <StatusIcon isActive={user.isActive} />
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-widest',
                        user.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                      )}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="h-16">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={user.isTwoFactorEnabled ? 'on' : 'off'} className="gap-1 pr-2">
                        <Smartphone className="h-3 w-3" />
                        {user.isTwoFactorEnabled ? 'On' : 'Off'}
                      </StatusBadge>
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
                        {user.spaces.slice(0, 2).map((space, index) => (
                          <Badge key={index} variant="outline" className="text-[10px] font-black uppercase tracking-widest border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30 text-zinc-500 h-5">
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
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="h-16">
                    {user.lastLoginAt ? (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                        {new Date(user.lastLoginAt).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="h-16">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0 border-zinc-200/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all"
                        onClick={() => onEditUser(user)}
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
                          <DropdownMenuItem onClick={() => onViewUser(user)}>
                            <Settings className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditUser(user)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onResetPassword(user)}>
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onResetTwoFactor(user)} className="text-xs font-medium opacity-70">
                            <Smartphone className="h-3.5 w-3.5 mr-2" />
                            Reset 2FA
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onDeleteUser(user.id)}
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
  )
}
