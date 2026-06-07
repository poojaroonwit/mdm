import type { Dispatch, SetStateAction } from 'react'
import { Folder, Plus, Shield, Trash2, User as UserIcon } from 'lucide-react'

import { AvatarUpload } from '@/components/ui/avatar-upload'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import type { EditUserForm, Space, User } from './enhanced-user-management-types'

interface EnhancedUserEditDialogProps {
  open: boolean
  editingUser: User | null
  editForm: EditUserForm
  editDialogTab: string
  spaces: Space[]
  setEditForm: Dispatch<SetStateAction<EditUserForm>>
  onAvatarChange: (avatarUrl: string | null) => void
  onOpenChange: (open: boolean) => void
  onTabChange: (tab: string) => void
  onSave: () => void
}

export function EnhancedUserEditDialog({
  open,
  editingUser,
  editForm,
  editDialogTab,
  spaces,
  setEditForm,
  onAvatarChange,
  onOpenChange,
  onTabChange,
  onSave
}: EnhancedUserEditDialogProps) {
  const updateSpaceAssociation = (index: number, field: 'space_id' | 'role', value: string) => {
    setEditForm((current) => {
      const nextSpaces = [...current.spaces]
      nextSpaces[index] = { ...nextSpaces[index], [field]: value }
      return { ...current, spaces: nextSpaces }
    })
  }

  const removeSpaceAssociation = (index: number) => {
    setEditForm((current) => ({
      ...current,
      spaces: current.spaces.filter((_, itemIndex) => itemIndex !== index)
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user information and space associations</DialogDescription>
        </DialogHeader>

        <div className="w-full">
          <Tabs value={editDialogTab} onValueChange={onTabChange}>
            <TabsList className="flex w-full justify-start gap-2">
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
            </TabsList>

            <TabsContent value="basic" className="mt-4 space-y-4">
              {editingUser && (
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <AvatarUpload
                    userId={editingUser.id}
                    currentAvatar={editingUser.avatar}
                    userName={editForm.name}
                    userEmail={editForm.email}
                    onAvatarChange={onAvatarChange}
                    size="lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editForm.name}
                    onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editForm.is_active}
                  onCheckedChange={(checked) => setEditForm((current) => ({ ...current, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </TabsContent>

            <TabsContent value="roles" className="mt-4 space-y-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm((current) => ({ ...current, role: value }))}>
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
                <Label htmlFor="default_space">Default Space</Label>
                <Select
                  value={editForm.default_space_id}
                  onValueChange={(value) => setEditForm((current) => ({ ...current, default_space_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select default space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No default space</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id}>
                        {space.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="spaces" className="mt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Space Associations</Label>
                <div className="mt-2 space-y-2">
                  {editForm.spaces.map((space, index) => (
                    <div key={index} className="flex items-center space-x-2 rounded-lg bg-muted/50 p-3">
                      <Select
                        value={space.space_id}
                        onValueChange={(value) => updateSpaceAssociation(index, 'space_id', value)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select space" />
                        </SelectTrigger>
                        <SelectContent>
                          {spaces.map((availableSpace) => (
                            <SelectItem key={availableSpace.id} value={availableSpace.id}>
                              {availableSpace.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={space.role} onValueChange={(value) => updateSpaceAssociation(index, 'role', value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button variant="outline" size="sm" onClick={() => removeSpaceAssociation(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditForm((current) => ({
                        ...current,
                        spaces: [...current.spaces, { space_id: '', role: 'member' }]
                      }))
                    }}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Space Association
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
