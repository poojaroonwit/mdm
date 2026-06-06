'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ChevronDown,
  Cloud,
  Download,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import type { Space } from '../types'

interface UserManagementToolbarProps {
  activeFilter: string
  isSyncing: boolean
  roleFilter: string
  search: string
  selectedCount: number
  spaceFilter: string
  spaces: Space[]
  onBulkActions: () => void
  onCreateUser: () => void
  onExportUsers: () => void
  onImportUsers: () => void
  onManageRoles: () => void
  onSearchChange: (value: string) => void
  onSetActiveFilter: (value: string) => void
  onSetRoleFilter: (value: string) => void
  onSetSpaceFilter: (value: string) => void
  onSyncAd: () => void
  onSyncSettings: () => void
}

export function UserManagementToolbar({
  activeFilter,
  isSyncing,
  roleFilter,
  search,
  selectedCount,
  spaceFilter,
  spaces,
  onBulkActions,
  onCreateUser,
  onExportUsers,
  onImportUsers,
  onManageRoles,
  onSearchChange,
  onSetActiveFilter,
  onSetRoleFilter,
  onSetSpaceFilter,
  onSyncAd,
  onSyncSettings,
}: UserManagementToolbarProps) {
  const hasFilters = search || roleFilter !== 'all' || activeFilter !== 'all' || spaceFilter !== 'all'

  const clearFilters = () => {
    onSearchChange('')
    onSetRoleFilter('all')
    onSetActiveFilter('all')
    onSetSpaceFilter('all')
  }

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkActions}
              className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-xl"
            >
              <Users className="h-3 w-3 mr-2" />
              Bulk Actions ({selectedCount})
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
              <DropdownMenuItem onClick={onManageRoles} className="text-xs font-medium">
                <Shield className="h-3.5 w-3.5 mr-2" />
                Manage Roles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSyncSettings} className="text-xs font-medium">
                <Settings className="h-3.5 w-3.5 mr-2" />
                Sync Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onImportUsers} className="text-xs font-medium">
                <Upload className="h-3.5 w-3.5 mr-2" />
                Import Users
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportUsers} className="text-xs font-medium">
                <Download className="h-3.5 w-3.5 mr-2" />
                Export Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onSyncAd} disabled={isSyncing} variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-950/20 backdrop-blur-xl">
            <Cloud className={`h-3 w-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync AD'}
          </Button>
          <Button onClick={onCreateUser} size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-900/10 dark:shadow-zinc-100/10">
            <UserPlus className="h-3 w-3 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name or email..."
            className="pl-9 h-10 text-xs font-medium bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl placeholder:text-zinc-400 backdrop-blur-xl"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={roleFilter} onValueChange={onSetRoleFilter}>
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
          <Select value={activeFilter} onValueChange={onSetActiveFilter}>
            <SelectTrigger className="w-[130px] h-10 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl backdrop-blur-xl">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
              <SelectItem value="all" className="text-xs font-medium">All Status</SelectItem>
              <SelectItem value="true" className="text-xs font-medium text-emerald-500">Active</SelectItem>
              <SelectItem value="false" className="text-xs font-medium text-rose-500">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={spaceFilter} onValueChange={onSetSpaceFilter}>
            <SelectTrigger className="w-[160px] h-10 text-[10px] font-black uppercase tracking-widest bg-white/50 dark:bg-zinc-950/20 border-zinc-200/60 dark:border-zinc-800/60 rounded-xl backdrop-blur-xl">
              <SelectValue placeholder="All Spaces" />
            </SelectTrigger>
            <SelectContent className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-zinc-200/50 dark:border-zinc-800/50">
              <SelectItem value="all" className="text-xs font-medium">All Spaces</SelectItem>
              {spaces.map((space) => (
                <SelectItem key={space.id} value={space.id} className="text-xs font-medium">
                  {space.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
