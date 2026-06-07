'use client'

import type { Dispatch, SetStateAction } from 'react'

import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

interface UserDialogsProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  editing: any | null
  form: any
  setForm: Dispatch<SetStateAction<any>>
  availableSpaces: any[]
  loadingSpaces: boolean
  submit: () => void
  resetPasswordOpen: boolean
  setResetPasswordOpen: Dispatch<SetStateAction<boolean>>
  resetPasswordUser: any | null
  newPassword: string
  setNewPassword: Dispatch<SetStateAction<string>>
  confirmPassword: string
  setConfirmPassword: Dispatch<SetStateAction<string>>
  resettingPassword: boolean
  resetPassword: () => void
}

export function UserDialogs({
  open,
  setOpen,
  editing,
  form,
  setForm,
  availableSpaces,
  loadingSpaces,
  submit,
  resetPasswordOpen,
  setResetPasswordOpen,
  resetPasswordUser,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  resettingPassword,
  resetPassword
}: UserDialogsProps) {
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <AvatarUpload
                userId={editing?.id || 'new'}
                currentAvatar={form.avatar}
                userName={form.name}
                userEmail={form.email}
                onAvatarChange={(avatarUrl) => setForm({ ...form, avatar: avatarUrl || '' })}
                size="lg"
                disabled={!editing}
              />
            </div>

            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="email@example.com" />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Full name" />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <RadioGroup value={form.role} onValueChange={(value: string) => setForm({ ...form, role: value })} className="flex flex-col space-y-2">
                {[
                  ['USER', 'user', 'User'],
                  ['MANAGER', 'manager', 'Manager'],
                  ['ADMIN', 'admin', 'Admin'],
                  ['SUPER_ADMIN', 'super_admin', 'Super Admin']
                ].map(([value, id, label]) => (
                  <div key={value} className="flex items-center space-x-2">
                    <RadioGroupItem value={value} id={id} />
                    <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {label}
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

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

            <div className="space-y-1">
              <Label>Space Access</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {loadingSpaces ? (
                  <div className="text-sm text-muted-foreground">Loading spaces...</div>
                ) : availableSpaces.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No spaces available</div>
                ) : (
                  availableSpaces.map(space => {
                    const userSpace = form.spaces.find((item: any) => item.id === space.id)

                    return (
                      <div key={space.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`space-${space.id}`}
                            checked={!!userSpace}
                            onChange={(event) => {
                              if (event.target.checked) {
                                setForm({
                                  ...form,
                                  spaces: [...form.spaces, { id: space.id, name: space.name, role: 'member' }]
                                })
                              } else {
                                setForm({
                                  ...form,
                                  spaces: form.spaces.filter((item: any) => item.id !== space.id)
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
                                spaces: form.spaces.map((item: any) =>
                                  item.id === space.id ? { ...item, role } : item
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
              <Switch checked={form.is_active} onCheckedChange={(value) => setForm({ ...form, is_active: value })} />
            </div>
            {!editing && (
              <div className="space-y-1">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Set a password" />
              </div>
            )}
            {editing && (
              <div className="space-y-1">
                <Label>New Password (optional)</Label>
                <Input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Leave blank to keep current" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? 'Save Changes' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
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
    </>
  )
}
