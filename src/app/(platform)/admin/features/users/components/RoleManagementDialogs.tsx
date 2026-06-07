'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CrudDialog } from '@/components/ui/crud-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Copy, Save, Search, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { RolePermissionSelector } from './RolePermissionSelector'

interface RoleManagementDialogsProps {
  analytics: any
  cloneForm: any
  cloningRole: any
  createRole: () => void
  editingRole: any
  filteredPermissions: any[]
  groupedPermissions: Record<string, any[]>
  loadRoles: () => void
  roleForm: any
  roleTemplates: any
  selectedPermissions: string[]
  selectedTemplate: any
  setCloneForm: (form: any) => void
  setCloningRole: (role: any) => void
  setRoleForm: (form: any) => void
  setSelectedPermissions: (permissions: string[]) => void
  setSelectedTemplate: (template: any) => void
  setSearchQuery: (query: string) => void
  setShowAnalytics: (open: boolean) => void
  setShowCloneDialog: (open: boolean) => void
  setShowCreateDialog: (open: boolean) => void
  setShowEditDialog: (open: boolean) => void
  setShowTemplatesDialog: (open: boolean) => void
  showAnalytics: boolean
  showCloneDialog: boolean
  showCreateDialog: boolean
  showEditDialog: boolean
  showTemplatesDialog: boolean
  updateRolePermissions: () => void
  searchQuery: string
  selectedLevel: 'global' | 'space'
}

export function RoleManagementDialogs({
  analytics,
  cloneForm,
  cloningRole,
  createRole,
  editingRole,
  filteredPermissions,
  groupedPermissions,
  loadRoles,
  roleForm,
  roleTemplates,
  selectedPermissions,
  selectedTemplate,
  setCloneForm,
  setCloningRole,
  setRoleForm,
  setSelectedPermissions,
  setSelectedTemplate,
  setSearchQuery,
  setShowAnalytics,
  setShowCloneDialog,
  setShowCreateDialog,
  setShowEditDialog,
  setShowTemplatesDialog,
  showAnalytics,
  showCloneDialog,
  showCreateDialog,
  showEditDialog,
  showTemplatesDialog,
  updateRolePermissions,
  searchQuery,
  selectedLevel,
}: RoleManagementDialogsProps) {
  return (
    <>      {/* Create Role Dialog */}
      <CrudDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        title={`Create New ${selectedLevel === 'global' ? 'Global' : 'Space'} Role`}
        description="Create a new role and assign permissions"
        contentClassName="max-w-4xl max-h-[90vh]"
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createRole}>
              Create Role
            </Button>
          </>
        )}
      >
            <div>
              <Label htmlFor="role-name" className="text-sm font-bold">Role Name *</Label>
              <Input
                id="role-name"
                value={roleForm.name}
                onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                placeholder="Enter role name"
                className="h-10 rounded-xl mt-1"
              />
            </div>
            <div>
              <Label htmlFor="role-description" className="text-sm font-bold">Description</Label>
              <Textarea
                id="role-description"
                value={roleForm.description}
                onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                placeholder="Enter role description"
                rows={3}
                className="rounded-xl mt-1"
              />
            </div>
            <RolePermissionSelector
              filteredPermissions={filteredPermissions}
              groupedPermissions={groupedPermissions}
              searchQuery={searchQuery}
              selectedPermissions={selectedPermissions}
              setSearchQuery={setSearchQuery}
              setSelectedPermissions={setSelectedPermissions}
            />      </CrudDialog>

      {/* Edit Role Permissions Dialog */}
      <CrudDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Edit Role Permissions"
        description={`Update permissions for ${editingRole?.name}`}
        contentClassName="max-w-4xl max-h-[90vh]"
        bodyClassName="space-y-4"
        footer={(
          <>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateRolePermissions}>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </Button>
          </>
        )}
      >
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Role Information</Label>
              <div className="mt-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{editingRole?.name}</p>
                {editingRole?.description && (
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{editingRole.description}</p>
                )}
              </div>
            </div>
            <RolePermissionSelector
              filteredPermissions={filteredPermissions}
              groupedPermissions={groupedPermissions}
              searchQuery={searchQuery}
              selectedPermissions={selectedPermissions}
              setSearchQuery={setSearchQuery}
              setSelectedPermissions={setSelectedPermissions}
            />      </CrudDialog>

      {/* Clone Role Dialog */}
      <CrudDialog
        open={showCloneDialog}
        onOpenChange={setShowCloneDialog}
        title="Clone Role"
        description={`Create a copy of ${cloningRole?.name} with the same permissions`}
        bodyClassName="space-y-6"
        footer={(
          <>
            <Button variant="outline" onClick={() => {
              setShowCloneDialog(false)
              setCloningRole(null)
              setCloneForm({ name: '', description: '' })
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!cloneForm.name || !cloningRole) return
              try {
                const response = await fetch(`/api/admin/roles/${cloningRole.id}/clone`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cloneForm)
                })
                if (response.ok) {
                  toast.success('Role cloned successfully')
                  setShowCloneDialog(false)
                  setCloningRole(null)
                  setCloneForm({ name: '', description: '' })
                  loadRoles()
                } else {
                  const error = await response.json()
                  toast.error(error.error || 'Failed to clone role')
                }
              } catch (error) {
                console.error('Error cloning role:', error)
                toast.error('Failed to clone role')
              }
            }}>
              <Copy className="h-4 w-4 mr-2" />
              Clone Role
            </Button>
          </>
        )}
      >
            <div className="space-y-2">
              <Label htmlFor="clone-name" className="text-sm font-bold">New Role Name *</Label>
              <Input
                id="clone-name"
                value={cloneForm.name}
                onChange={(e) => setCloneForm({ ...cloneForm, name: e.target.value })}
                placeholder="Enter new role name"
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone-description" className="text-sm font-bold">Description</Label>
              <Textarea
                id="clone-description"
                value={cloneForm.description}
                onChange={(e) => setCloneForm({ ...cloneForm, description: e.target.value })}
                placeholder="Enter role description"
                rows={3}
                className="rounded-xl"
              />
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
               <p className="text-xs text-zinc-500 text-center">
                 Cloning will copy all {cloningRole?.permissions?.length || 0} permissions from <strong>{cloningRole?.name}</strong> to the new role.
               </p>
            </div>
      </CrudDialog>

      {/* Analytics Dialog */}
      <CrudDialog
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
        title="Role Usage Analytics"
        description="Statistics on role usage across the system"
        contentClassName="max-w-4xl max-h-[90vh]"
        bodyClassName="max-h-[70vh] overflow-y-auto"
        footer={(
          <Button variant="outline" onClick={() => setShowAnalytics(false)}>
            Close
          </Button>
        )}
      >
            <div className="space-y-6">
              <Card className="border-zinc-100 dark:border-zinc-800 shadow-none rounded-xl overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Global Role Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {analytics?.globalRoles?.map((item: any) => (
                      <div key={item.role_name} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.role_name}</span>
                        <Badge variant="secondary" className="font-black text-[10px] h-6 px-3 rounded-lg">{item.user_count} users</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-100 dark:border-zinc-800 shadow-none rounded-xl overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Space Role Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {analytics?.spaceRoles?.map((item: any) => (
                      <div key={item.role_name} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.role_name}</span>
                          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">{item.space_count} spaces</p>
                        </div>
                        <Badge variant="outline" className="font-black text-[10px] h-6 px-3 border-zinc-200 rounded-lg">{item.member_count} members</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-zinc-100 dark:border-zinc-800 shadow-none rounded-xl overflow-hidden">
                <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                  <CardTitle className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Custom Roles Usage</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {analytics?.customRoles?.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                        <div>
                          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{item.name}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] uppercase font-black tracking-widest h-5 rounded-lg">{item.level}</Badge>
                        </div>
                        <Badge className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[10px] h-6 px-3 rounded-lg font-black">{item.usage_count || 0} assignments</Badge>
                      </div>
                    ))}
                    {(!analytics?.customRoles || analytics.customRoles.length === 0) && (
                      <p className="text-sm text-muted-foreground p-8 text-center italic">No custom roles defined</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
      </CrudDialog>

      {/* Role Templates Dialog */}
      <CrudDialog
        open={showTemplatesDialog}
        onOpenChange={setShowTemplatesDialog}
        title="Create Role from Template"
        description="Select a template to quickly create a role with predefined permissions"
        contentClassName="max-w-2xl"
        bodyClassName="space-y-6"
        footer={(
          <>
            <Button variant="outline" onClick={() => {
              setShowTemplatesDialog(false)
              setSelectedTemplate(null)
            }}>
              Cancel
            </Button>
            <Button onClick={async () => {
              if (!selectedTemplate || !roleForm.name) {
                toast.error('Please select template and enter role name')
                return
              }
              try {
                const response = await fetch('/api/admin/roles/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    templateName: selectedTemplate.name,
                    level: selectedTemplate.level,
                    customName: roleForm.name,
                    customDescription: roleForm.description
                  })
                })
                if (response.ok) {
                  toast.success('Role created from template successfully')
                  setShowTemplatesDialog(false)
                  setSelectedTemplate(null)
                  setRoleForm({ name: '', description: '', level: selectedLevel })
                  loadRoles()
                } else {
                  const error = await response.json()
                  toast.error(error.error || 'Failed to create role')
                }
              } catch (error) {
                console.error('Error creating role from template:', error)
                toast.error('Failed to create role')
              }
            }} disabled={!selectedTemplate || !roleForm.name}>
              Create from Template
            </Button>
          </>
        )}
      >
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Pick a Template</Label>
              <Select value={selectedTemplate?.name || ''} onValueChange={(value) => {
                const template = [...roleTemplates.global, ...roleTemplates.space].find((t: any) => t.name === value)
                setSelectedTemplate(template)
                if (template) {
                  setRoleForm({
                    name: `${template.name}_custom`,
                    description: template.description,
                    level: template.level
                  })
                }
              }}>
                <SelectTrigger className="h-11 rounded-xl mt-1">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Global Templates</div>
                  {roleTemplates.global?.map((template: any) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-2">Space Templates</div>
                  {roleTemplates.space?.map((template: any) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplate && (
              <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Role Name *</Label>
                  <Input
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    placeholder="Enter role name"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold">Description</Label>
                  <Textarea
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Enter role description"
                    rows={3}
                    className="rounded-xl"
                  />
                </div>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Includes {selectedTemplate.permissions?.length || 0} pre-configured permissions
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1 ml-6">{selectedTemplate.description}</p>
                </div>
              </div>
            )}
      </CrudDialog>
    </>
  )
}
