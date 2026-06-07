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
import { CrudDialog } from '@/components/ui/crud-dialog'
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
import { RoleManagementDialogs } from './RoleManagementDialogs'

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

      <RoleManagementDialogs
        analytics={analytics}
        cloneForm={cloneForm}
        cloningRole={cloningRole}
        createRole={createRole}
        editingRole={editingRole}
        filteredPermissions={filteredPermissions}
        groupedPermissions={groupedPermissions}
        loadRoles={loadRoles}
        roleForm={roleForm}
        roleTemplates={roleTemplates}
        selectedPermissions={selectedPermissions}
        selectedTemplate={selectedTemplate}
        setCloneForm={setCloneForm}
        setCloningRole={setCloningRole}
        setRoleForm={setRoleForm}
        setSelectedPermissions={setSelectedPermissions}
        setSelectedTemplate={setSelectedTemplate}
        setSearchQuery={setSearchQuery}
        setShowAnalytics={setShowAnalytics}
        setShowCloneDialog={setShowCloneDialog}
        setShowCreateDialog={setShowCreateDialog}
        setShowEditDialog={setShowEditDialog}
        setShowTemplatesDialog={setShowTemplatesDialog}
        showAnalytics={showAnalytics}
        showCloneDialog={showCloneDialog}
        showCreateDialog={showCreateDialog}
        showEditDialog={showEditDialog}
        showTemplatesDialog={showTemplatesDialog}
        updateRolePermissions={updateRolePermissions}
        searchQuery={searchQuery}
        selectedLevel={selectedLevel}
      />    </div>
  )
}

