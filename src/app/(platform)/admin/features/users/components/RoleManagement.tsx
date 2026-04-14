'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Globe,
  Folder,
  Search,
  Copy,
  BarChart3,
  Download,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Role, Permission } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState<'global' | 'space'>('global')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<any>(null)
  const [showCloneDialog, setShowCloneDialog] = useState(false)
  const [cloningRole, setCloningRole] = useState<Role | null>(null)
  const [cloneForm, setCloneForm] = useState({ name: '', description: '' })
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false)
  const [roleTemplates, setRoleTemplates] = useState<any>({ global: [], space: [] })
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    level: 'global' as 'global' | 'space'
  })

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [selectedLevel])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/roles?level=${selectedLevel}`)
      if (response.ok) {
        const data = await response.json()
        setRoles(data.roles || [])
      } else {
        toast.error('Failed to load roles')
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      // Load all permissions - we'll filter in the UI based on level
      const response = await fetch('/api/permissions')
      if (response.ok) {
        const data = await response.json()
        // Filter permissions based on level
        if (selectedLevel === 'global') {
          // Global roles can have system permissions
          setPermissions(data.permissions.filter((p: Permission) => p.resource === 'system'))
        } else {
          // Space roles can have all non-system permissions
          setPermissions(data.permissions.filter((p: Permission) => p.resource !== 'system'))
        }
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
    }
  }

  const openCreateDialog = () => {
    setRoleForm({ name: '', description: '', level: selectedLevel })
    setSelectedPermissions([])
    setShowCreateDialog(true)
  }

  const openEditDialog = (role: Role) => {
    setEditingRole(role)
    setRoleForm({
      name: role.name,
      description: role.description || '',
      level: role.level
    })
    setSelectedPermissions(role.permissions.map(p => p.id))
    setShowEditDialog(true)
  }

  const createRole = async () => {
    if (!roleForm.name) {
      toast.error('Role name is required')
      return
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roleForm)
      })

      if (response.ok) {
        const data = await response.json()
        const roleId = data.role.id

        // Assign permissions
        if (selectedPermissions.length > 0) {
          await fetch(`/api/roles/${roleId}/permissions`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissionIds: selectedPermissions })
          })
        }

        toast.success('Role created successfully')
        setShowCreateDialog(false)
        loadRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Failed to create role')
    }
  }

  const updateRolePermissions = async () => {
    if (!editingRole) return

    try {
      const response = await fetch(`/api/roles/${editingRole.id}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissionIds: selectedPermissions })
      })

      if (response.ok) {
        toast.success('Role permissions updated successfully')
        setShowEditDialog(false)
        loadRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      toast.error('Failed to update permissions')
    }
  }

  const deleteRole = async (roleId: string, isSystem: boolean) => {
    if (isSystem) {
      toast.error('Cannot delete system roles')
      return
    }

    if (!confirm('Are you sure you want to delete this role?')) return

    try {
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Role deleted successfully')
        loadRoles()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete role')
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error('Failed to delete role')
    }
  }

  const filteredPermissions = permissions.filter(p => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.resource.toLowerCase().includes(query) ||
      p.action.toLowerCase().includes(query)
    )
  })

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    if (!acc[perm.resource]) {
      acc[perm.resource] = []
    }
    acc[perm.resource].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Role & Permission Management
          </h2>
          <p className="text-muted-foreground">
            Manage roles and their permissions for global and space levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={async () => {
            try {
              const response = await fetch('/api/admin/roles/analytics')
              if (response.ok) {
                const data = await response.json()
                setAnalytics(data)
                setShowAnalytics(true)
              }
            } catch (error) {
              toast.error('Failed to load analytics')
            }
          }}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" onClick={async () => {
            try {
              const response = await fetch('/api/admin/roles/templates')
              if (response.ok) {
                const data = await response.json()
                // Show template selection dialog
                setShowTemplatesDialog(true)
                setRoleTemplates(data.templates)
              }
            } catch (error) {
              toast.error('Failed to load templates')
            }
          }}>
            <Upload className="h-4 w-4 mr-2" />
            Use Template
          </Button>
          <input
            type="file"
            accept=".json"
            id="import-role"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                const text = await file.text()
                const data = JSON.parse(text)
                const response = await fetch('/api/admin/roles/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data)
                })
                if (response.ok) {
                  toast.success('Role imported successfully')
                  loadRoles()
                } else {
                  const error = await response.json()
                  toast.error(error.error || 'Failed to import role')
                }
              } catch (error) {
                toast.error('Failed to import role')
              }
              e.target.value = ''
            }}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById('import-role')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>
      </div>

      <Tabs value={selectedLevel} onValueChange={(v) => setSelectedLevel(v as 'global' | 'space')}>
        <TabsList>
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Roles
          </TabsTrigger>
          <TabsTrigger value="space" className="flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Space Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value={selectedLevel} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedLevel === 'global' ? 'Global' : 'Space'} Roles
              </CardTitle>
              <CardDescription>
                {selectedLevel === 'global' 
                  ? 'System-wide roles that apply across all spaces'
                  : 'Space-specific roles that apply within individual spaces'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
              ) : (
                <div className="space-y-2">
                  {roles.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-4 rounded-md hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="secondary" className="text-xs">System</Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {role.permissions.length} permissions
                          </Badge>
                        </div>
                        {role.description && (
                          <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/admin/roles/${role.id}/export`)
                              if (response.ok) {
                                const data = await response.json()
                                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `${role.name}_export.json`
                                a.click()
                                URL.revokeObjectURL(url)
                                toast.success('Role exported successfully')
                              }
                            } catch (error) {
                              toast.error('Failed to export role')
                            }
                          }}
                          title="Export role"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setCloningRole(role)
                            setCloneForm({ name: `${role.name}_copy`, description: role.description || '' })
                            setShowCloneDialog(true)
                          }}
                          title="Clone role"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(role)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.isSystem && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteRole(role.id, role.isSystem)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {roles.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No {selectedLevel} roles found
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Role Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create New {selectedLevel === 'global' ? 'Global' : 'Space'} Role</DialogTitle>
            <DialogDescription>
              Create a new role and assign permissions
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
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
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Permissions</Label>
              <div className="mt-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
                <ScrollArea className="h-[400px] border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="mb-6">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        {resource}
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map(perm => (
                          <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <Checkbox
                              id={`perm-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.id])
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id))
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`perm-${perm.id}`}
                                className="text-sm font-bold cursor-pointer text-zinc-900 dark:text-zinc-100"
                              >
                                {perm.name}
                              </label>
                              {perm.description && (
                                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{perm.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {filteredPermissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm font-medium">No permissions found</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createRole}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Role Permissions Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Edit Role Permissions</DialogTitle>
            <DialogDescription>
              Update permissions for {editingRole?.name}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 p-6 pt-2 pb-4">
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Role Information</Label>
              <div className="mt-1 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{editingRole?.name}</p>
                {editingRole?.description && (
                  <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mt-1">{editingRole.description}</p>
                )}
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Permissions</Label>
              <div className="mt-2 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search permissions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl"
                  />
                </div>
                <ScrollArea className="h-[400px] border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
                  {Object.entries(groupedPermissions).map(([resource, perms]) => (
                    <div key={resource} className="mb-6">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                        {resource}
                        <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {perms.map(perm => (
                          <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                            <Checkbox
                              id={`edit-perm-${perm.id}`}
                              checked={selectedPermissions.includes(perm.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedPermissions([...selectedPermissions, perm.id])
                                } else {
                                  setSelectedPermissions(selectedPermissions.filter(id => id !== perm.id))
                                }
                              }}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={`edit-perm-${perm.id}`}
                                className="text-sm font-bold cursor-pointer text-zinc-900 dark:text-zinc-100 block truncate"
                              >
                                {perm.name}
                              </label>
                              {perm.description && (
                                <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{perm.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateRolePermissions}>
              <Save className="h-4 w-4 mr-2" />
              Save Permissions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Role Dialog */}
      <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
        <DialogContent className="p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Clone Role</DialogTitle>
            <DialogDescription>
              Create a copy of {cloningRole?.name} with the same permissions
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 p-6 pt-2 pb-4">
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
          </DialogBody>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={showAnalytics} onOpenChange={setShowAnalytics}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Role Usage Analytics</DialogTitle>
            <DialogDescription>
              Statistics on role usage across the system
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="max-h-[70vh] overflow-y-auto p-6 pt-2 pb-4">
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
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAnalytics(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Templates Dialog */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Role from Template</DialogTitle>
            <DialogDescription>
              Select a template to quickly create a role with predefined permissions
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6 p-6 pt-2 pb-4">
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
          </DialogBody>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

