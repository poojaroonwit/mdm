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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Folder, FolderTree, Globe, Shield, User as UserIcon } from 'lucide-react'
import type { Space, User, UserGroup } from '../types'
import {
  AllowedLoginMethodsSelector,
  GroupMembershipSelector,
  SpaceAssociationsEditor,
} from './UserFormSections'

export interface UserEditFormState {
  name: string
  email: string
  role: string
  isActive: boolean
  defaultSpaceId: string
  spaces: Array<{ spaceId: string; role: string }>
  allowedLoginMethods: string[]
  groupIds: string[]
}

interface UserEditDialogProps {
  activeTab: string
  editingUser: User | null
  form: UserEditFormState
  groups: UserGroup[]
  loginMethods: string[]
  open: boolean
  spaces: Space[]
  setActiveTab: (tab: string) => void
  setForm: Dispatch<SetStateAction<UserEditFormState>>
  onAvatarChange: (avatarUrl: string | null) => void
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function UserEditDialog({
  activeTab,
  editingUser,
  form,
  groups,
  loginMethods,
  open,
  spaces,
  setActiveTab,
  setForm,
  onAvatarChange,
  onOpenChange,
  onSave,
}: UserEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information and permissions
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 overflow-y-auto min-h-0 p-6 pt-2 pb-4">
          <div className="w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full flex justify-start gap-2">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Roles & Permissions
                </TabsTrigger>
                <TabsTrigger value="spaces" className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  Space Associations
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4" />
                  Groups
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
                {editingUser && (
                  <div className="space-y-2">
                    <Label>Profile Picture</Label>
                    <AvatarUpload
                      userId={editingUser.id}
                      currentAvatar={editingUser.avatar}
                      userName={form.name}
                      userEmail={form.email}
                      onAvatarChange={onAvatarChange}
                      size="lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm({ ...form, email: event.target.value })}
                    />
                  </div>
                </div>

                <AllowedLoginMethodsSelector
                  methods={loginMethods}
                  selectedMethods={form.allowedLoginMethods || []}
                  onToggleMethod={(method) => {
                    setForm((previous) => {
                      const current = previous.allowedLoginMethods || []
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
                    id="edit-active"
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <Label htmlFor="edit-active">Active</Label>
                </div>
              </TabsContent>

              <TabsContent value="roles" className="space-y-4 mt-4">
                <div>
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Global Role (System-wide)
                  </Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    This role applies across all spaces and controls system-level access
                  </p>
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
                  <Label htmlFor="edit-default-space">Default Space</Label>
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
              </TabsContent>

              <TabsContent value="spaces" className="space-y-4 mt-4">
                <SpaceAssociationsEditor
                  formSpaces={form.spaces}
                  spaces={spaces}
                  onChange={(nextSpaces) => setForm({ ...form, spaces: nextSpaces })}
                />
              </TabsContent>

              <TabsContent value="groups" className="space-y-4 mt-4">
                <GroupMembershipSelector
                  groups={groups}
                  selectedGroupIds={form.groupIds}
                  onChange={(groupIds) => setForm({ ...form, groupIds })}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogBody>

        <DialogFooter className="flex-shrink-0 border-t-0 p-6 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="px-6 h-11 rounded-xl">
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="px-8 h-11 rounded-xl bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-bold"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
