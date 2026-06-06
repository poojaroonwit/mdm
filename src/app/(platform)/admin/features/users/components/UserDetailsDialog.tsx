'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RoleBadge } from '@/components/ui/role-badge'
import { CheckCircle, Edit, Key, Users, XCircle } from 'lucide-react'
import type { Space, User } from '../types'
import { formatLoginMethod } from '../utils'

interface UserDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  spaces: Space[]
  onEditUser: (user: User) => void
  onResetPassword: (user: User) => void
}

function UserStatusIcon({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
  ) : (
    <XCircle className="h-3.5 w-3.5 text-rose-500" />
  )
}

export function UserDetailsDialog({
  open,
  onOpenChange,
  user,
  spaces,
  onEditUser,
  onResetPassword,
}: UserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Details
          </DialogTitle>
        </DialogHeader>
        {user && (
          <>
            <DialogBody className="flex-1 overflow-y-auto p-6 pt-2 pb-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-2xl">
                      {user.name.split(' ').map((part) => part[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <UserStatusIcon isActive={user.isActive} />
                      <RoleBadge role={user.role} label={user.role} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">User ID</Label>
                    <p className="text-sm font-mono">{user.id}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <p className="text-sm">{user.isActive ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Created</Label>
                    <p className="text-sm">{new Date(user.createdAt).toLocaleString()}</p>
                  </div>
                  {user.lastLoginAt && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Last Login</Label>
                      <p className="text-sm">{new Date(user.lastLoginAt).toLocaleString()}</p>
                    </div>
                  )}
                  {user.defaultSpaceId && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Default Space</Label>
                      <p className="text-sm">{spaces.find((space) => space.id === user.defaultSpaceId)?.name || 'N/A'}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <Label className="text-xs text-muted-foreground">Allowed Login Methods</Label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(user.allowedLoginMethods && user.allowedLoginMethods.length > 0
                        ? user.allowedLoginMethods
                        : ['all']
                      ).map((method) => (
                        <Badge key={method} variant="outline">
                          {method === 'all' ? 'All Configured Methods' : formatLoginMethod(method)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {user.spaces && user.spaces.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Space Memberships</Label>
                    <div className="space-y-2">
                      {user.spaces.map((space, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <span className="text-sm font-medium">{space.spaceName}</span>
                          <RoleBadge role={space.role} label={space.role} />
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
                onClick={() => onEditUser(user)}
                className="rounded-xl h-10 px-4"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onResetPassword(user)}
                className="rounded-xl h-10 px-4"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-10 px-4"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
