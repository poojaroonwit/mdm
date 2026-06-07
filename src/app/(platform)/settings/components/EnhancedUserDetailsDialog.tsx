import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RoleBadge } from '@/components/ui/role-badge'
import { StatusBadge } from '@/components/ui/status-badge'

import type { User } from './enhanced-user-management-types'

interface EnhancedUserDetailsDialogProps {
  open: boolean
  user: User | null
  onOpenChange: (open: boolean) => void
}

export function EnhancedUserDetailsDialog({ open, user, onOpenChange }: EnhancedUserDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View detailed information about this user</DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>
                  {user.name.split(' ').map((part) => part[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <RoleBadge role={user.role} label={user.role} />
                  <StatusBadge status={user.is_active ? 'active' : 'inactive'} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Created</Label>
                <p className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Updated</Label>
                <p className="text-sm text-muted-foreground">{new Date(user.updated_at).toLocaleString()}</p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Space Associations</Label>
              <div className="mt-2 space-y-2">
                {user.spaces.map((space) => (
                  <div key={space.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                    <div>
                      <p className="font-medium">{space.space_name}</p>
                      {space.space_description && (
                        <p className="text-sm text-muted-foreground">{space.space_description}</p>
                      )}
                    </div>
                    <RoleBadge role={space.role} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
