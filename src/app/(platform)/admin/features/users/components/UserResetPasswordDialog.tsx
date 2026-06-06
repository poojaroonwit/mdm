'use client'

import { Button } from '@/components/ui/button'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { User } from '../types'

interface UserResetPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  newPassword: string
  confirmPassword: string
  resettingPassword: boolean
  setNewPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  onResetPassword: () => void
}

export function UserResetPasswordDialog({
  open,
  onOpenChange,
  user,
  newPassword,
  confirmPassword,
  resettingPassword,
  setNewPassword,
  setConfirmPassword,
  onResetPassword,
}: UserResetPasswordDialogProps) {
  return (
    <CrudDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Reset Password"
      description={`Set a new password for ${user?.name}.`}
      bodyClassName="space-y-4"
      footer={(
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={resettingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            onClick={onResetPassword}
          >
            {resettingPassword ? 'Resetting...' : 'Reset Password'}
          </Button>
        </>
      )}
    >
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </div>
    </CrudDialog>
  )
}
