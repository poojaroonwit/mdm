'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { Space } from '../types'
import {
  AllowedLoginMethodsSelector,
  CreateSpaceAccessSelector,
} from './UserFormSections'

export interface UserCreateFormState {
  name: string
  email: string
  password: string
  role: string
  isActive: boolean
  defaultSpaceId: string
  spaces: Array<{ spaceId: string; role: string }>
  allowedLoginMethods: string[]
  groupIds: string[]
}

interface UserCreateDialogProps {
  creatingUser: boolean
  form: UserCreateFormState
  loginMethods: string[]
  open: boolean
  spaces: Space[]
  setForm: Dispatch<SetStateAction<UserCreateFormState>>
  onCreateUser: () => void
  onOpenChange: (open: boolean) => void
}

export function UserCreateDialog({
  creatingUser,
  form,
  loginMethods,
  open,
  spaces,
  setForm,
  onCreateUser,
  onOpenChange,
}: UserCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="create-email">Email *</Label>
                <Input
                  id="create-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="Enter email address"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="create-password">Password *</Label>
              <Input
                id="create-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter password"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-role">Role</Label>
                <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
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
                <Select value={form.defaultSpaceId} onValueChange={(value) => setForm({ ...form, defaultSpaceId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select default space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default space</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AllowedLoginMethodsSelector
              methods={loginMethods}
              selectedMethods={form.allowedLoginMethods}
              onToggleMethod={(method) => {
                setForm((previous) => {
                  const current = previous.allowedLoginMethods
                  return {
                    ...previous,
                    allowedLoginMethods: current.includes(method)
                      ? current.filter((item) => item !== method)
                      : [...current, method],
                  }
                })
              }}
            />

            <div className="flex items-center space-x-2">
              <Switch
                id="create-active"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
              <Label htmlFor="create-active">Active</Label>
            </div>

            <CreateSpaceAccessSelector
              formSpaces={form.spaces}
              spaces={spaces}
              onChange={(nextSpaces) => setForm({ ...form, spaces: nextSpaces })}
            />
          </div>
        </DialogBody>
        <DialogFooter className="flex-shrink-0 border-t-0 p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-11 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={onCreateUser}
            disabled={creatingUser}
            className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold"
          >
            {creatingUser ? 'Creating...' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
