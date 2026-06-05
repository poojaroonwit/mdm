'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { 
  Shield, 
  Users, 
  Database, 
  FileText, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  CheckCircle,
  XCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Permission {
  id: string
  name: string
  description: string
  category: string
  resource: string
  action: string
}

interface MemberPermission {
  user_id: string
  user_name: string
  user_email: string
  avatar?: string
  role: string
  permissions: string[]
  custom_permissions: string[]
}

interface MemberPermissionsPanelProps {
  spaceId: string
  members: MemberPermission[]
  onUpdatePermissions: (userId: string, permissions: string[]) => Promise<void>
  canManagePermissions: boolean
}

const PERMISSION_CATEGORIES = {
  'space': {
    name: 'Space Management',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-primary/10 text-primary'
  },
  'data': {
    name: 'Data Management',
    icon: <Database className="h-4 w-4" />,
    color: 'bg-primary/10 text-primary'
  },
  'user': {
    name: 'User Management',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-primary/10 text-primary'
  },
  'content': {
    name: 'Content Management',
    icon: <FileText className="h-4 w-4" />,
    color: 'bg-warning/20 text-warning'
  }
}

const PERMISSIONS: Permission[] = [
  // Space Management
  { id: 'space:view', name: 'View Space', description: 'View space details and settings', category: 'space', resource: 'space', action: 'view' },
  { id: 'space:edit', name: 'Edit Space', description: 'Modify space settings and configuration', category: 'space', resource: 'space', action: 'edit' },
  { id: 'space:delete', name: 'Delete Space', description: 'Delete the space permanently', category: 'space', resource: 'space', action: 'delete' },
  
  // Data Management
  { id: 'data:view', name: 'View Data', description: 'View data models and records', category: 'data', resource: 'data', action: 'view' },
  { id: 'data:create', name: 'Create Data', description: 'Create new data models and records', category: 'data', resource: 'data', action: 'create' },
  { id: 'data:edit', name: 'Edit Data', description: 'Modify existing data models and records', category: 'data', resource: 'data', action: 'edit' },
  { id: 'data:delete', name: 'Delete Data', description: 'Delete data models and records', category: 'data', resource: 'data', action: 'delete' },
  { id: 'data:export', name: 'Export Data', description: 'Export data to various formats', category: 'data', resource: 'data', action: 'export' },
  { id: 'data:import', name: 'Import Data', description: 'Import data from external sources', category: 'data', resource: 'data', action: 'import' },
  
  // User Management
  { id: 'user:invite', name: 'Invite Users', description: 'Invite new users to the space', category: 'user', resource: 'user', action: 'invite' },
  { id: 'user:manage', name: 'Manage Users', description: 'Manage user roles and permissions', category: 'user', resource: 'user', action: 'manage' },
  { id: 'user:remove', name: 'Remove Users', description: 'Remove users from the space', category: 'user', resource: 'user', action: 'remove' },
  
  // Content Management
  { id: 'content:view', name: 'View Content', description: 'View pages and content', category: 'content', resource: 'content', action: 'view' },
  { id: 'content:create', name: 'Create Content', description: 'Create new pages and content', category: 'content', resource: 'content', action: 'create' },
  { id: 'content:edit', name: 'Edit Content', description: 'Modify existing content', category: 'content', resource: 'content', action: 'edit' },
  { id: 'content:delete', name: 'Delete Content', description: 'Delete pages and content', category: 'content', resource: 'content', action: 'delete' }
]

export function MemberPermissionsPanel({
  spaceId,
  members,
  onUpdatePermissions,
  canManagePermissions
}: MemberPermissionsPanelProps) {
  const [selectedMember, setSelectedMember] = useState<MemberPermission | null>(null)
  const [memberPermissions, setMemberPermissions] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (selectedMember) {
      setMemberPermissions(selectedMember.permissions || [])
    }
  }, [selectedMember])

  const handlePermissionToggle = (permissionId: string, enabled: boolean) => {
    if (enabled) {
      setMemberPermissions(prev => [...prev, permissionId])
    } else {
      setMemberPermissions(prev => prev.filter(p => p !== permissionId))
    }
  }

  const handleSavePermissions = async () => {
    if (!selectedMember) return

    try {
      setSaving(true)
      await onUpdatePermissions(selectedMember.user_id, memberPermissions)
      toast.success('Permissions updated successfully')
    } catch (error) {
      toast.error('Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  const getPermissionsByCategory = (category: string) => {
    return PERMISSIONS.filter(p => p.category === category)
  }

  const getRolePermissions = (role: string) => {
    const rolePermissions: Record<string, string[]> = {
      'owner': PERMISSIONS.map(p => p.id),
      'admin': PERMISSIONS.filter(p => !p.id.includes('space:delete')).map(p => p.id),
      'member': PERMISSIONS.filter(p => 
        p.id.includes('data:view') || 
        p.id.includes('content:view') || 
        p.id.includes('space:view')
      ).map(p => p.id)
    }
    return rolePermissions[role] || []
  }

  const isPermissionInherited = (permissionId: string) => {
    if (!selectedMember) return false
    const rolePermissions = getRolePermissions(selectedMember.role)
    return rolePermissions.includes(permissionId)
  }

  const getPermissionStatus = (permissionId: string) => {
    if (!selectedMember) return false
    return memberPermissions.includes(permissionId)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Member Permissions
          </CardTitle>
          <CardDescription>
            Manage individual permissions for space members. Role-based permissions are inherited automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Member Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold">Select Member</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedMember?.user_id === member.user_id
                        ? 'border-primary bg-primary/10'
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => setSelectedMember(member)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.user_name ? member.user_name[0].toUpperCase() : member.user_email[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{member.user_name}</div>
                        <div className="text-sm text-muted-foreground truncate">{member.user_email}</div>
                      </div>
                      <RoleBadge role={member.role} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Permission Management */}
            <div className="space-y-4">
              {selectedMember ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">
                      Permissions for {selectedMember.user_name}
                    </h3>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={saving}
                      size="sm"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>

                  <div className="w-full">
                  <Tabs defaultValue="permissions">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="permissions">Permissions</TabsTrigger>
                      <TabsTrigger value="summary">Summary</TabsTrigger>
                    </TabsList>

                    <TabsContent value="permissions" className="space-y-4">
                      {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => (
                        <Card key={categoryKey}>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              {category.icon}
                              {category.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {getPermissionsByCategory(categoryKey).map((permission) => {
                              const isInherited = isPermissionInherited(permission.id)
                              const isEnabled = getPermissionStatus(permission.id)
                              
                              return (
                                <div key={permission.id} className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={permission.id} className="font-medium">
                                        {permission.name}
                                      </Label>
                                      {isInherited && (
                                        <Badge variant="secondary" className="text-xs">
                                          Inherited
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {permission.description}
                                    </p>
                                  </div>
                                  <Switch
                                    id={permission.id}
                                    checked={isEnabled}
                                    onCheckedChange={(checked) => handlePermissionToggle(permission.id, checked)}
                                    disabled={!canManagePermissions || isInherited}
                                  />
                                </div>
                              )
                            })}
                          </CardContent>
                        </Card>
                      ))}
                    </TabsContent>

                    <TabsContent value="summary" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Permission Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Total Permissions</span>
                              <Badge variant="outline">{memberPermissions.length}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Inherited from Role</span>
                              <Badge variant="secondary">
                                {getRolePermissions(selectedMember.role).length}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Custom Permissions</span>
                              <Badge variant="outline">
                                {memberPermissions.filter(p => !getRolePermissions(selectedMember.role).includes(p)).length}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a member to manage their permissions</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
