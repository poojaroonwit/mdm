import { Building2, Calendar, Edit, Eye, Mail, UserCheck, Users, UserX } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { StatusBadge } from '@/components/ui/status-badge'

import type { User } from './enhanced-user-management-types'

interface EnhancedUserManagementListProps {
  users: User[]
  total: number
  pages: number
  page: number
  limit: number
  loading: boolean
  error: string | null
  onRetry: () => void
  onPageChange: (page: number) => void
  onViewUser: (user: User) => void
  onEditUser: (user: User) => void
  onToggleUserStatus: (user: User) => void
}

export function EnhancedUserManagementList({
  users,
  total,
  pages,
  page,
  limit,
  loading,
  error,
  onRetry,
  onPageChange,
  onViewUser,
  onEditUser,
  onToggleUserStatus
}: EnhancedUserManagementListProps) {
  return (
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
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Loading users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={onRetry} className="mt-2">
              Retry
            </Button>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No users found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <Card key={user.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name.split(' ').map((part) => part[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center space-x-2">
                          <h3 className="truncate text-lg font-semibold">{user.name}</h3>
                          <RoleBadge role={user.role} label={user.role} />
                          <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                        </div>

                        <div className="mb-3 flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-4 w-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

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
                                <div key={space.id} className="flex items-center space-x-1 rounded-md bg-muted/50 px-2 py-1">
                                  <span className="text-sm font-medium">{space.space_name}</span>
                                  <RoleBadge role={space.role} size="sm" className="text-xs" />
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
                      <Button variant="outline" size="sm" onClick={() => onViewUser(user)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onEditUser(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleUserStatus(user)}
                        className={user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
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

        {pages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {pages}
              </span>
              <Button variant="outline" size="sm" onClick={() => onPageChange(page + 1)} disabled={page === pages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
