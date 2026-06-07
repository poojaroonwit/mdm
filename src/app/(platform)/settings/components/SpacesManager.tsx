'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSpace } from '@/contexts/space-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RoleBadge } from '@/components/ui/role-badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Plus, Users, Trash2, Crown, Shield, User, UserCog, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Helper to dynamically load icon
const loadSpaceIcon = async (iconName: string) => {
  try {
    const module = await import('lucide-react')
    return (module as any)[iconName] || Building2
  } catch {
    return Building2
  }
}

// Icon preview component
function SpaceIconPreview({ iconName }: { iconName?: string }) {
  const [IconComponent, setIconComponent] = useState<React.ComponentType<{ className?: string }>>(Building2)

  useEffect(() => {
    if (iconName) {
      loadSpaceIcon(iconName).then(setIconComponent)
    } else {
      setIconComponent(Building2)
    }
  }, [iconName])

  return IconComponent ? (
    <div className="h-10 w-10 rounded border border-border flex items-center justify-center bg-muted">
      <IconComponent className="h-5 w-5 text-foreground" />
    </div>
  ) : (
    <div className="h-10 w-10 rounded bg-muted border border-border" />
  )
}

interface Space {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
  created_by: string
  created_by_name?: string
  member_count?: number
  user_role?: string
  slug?: string
  icon?: string
  logo_url?: string
}

export default function SpacesManager() {
  const { spaces, refreshSpaces, currentSpace, setCurrentSpace } = useSpace()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    slug: ''
  })

  // Drawer removed; use dedicated page
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)

  // Members state inside drawer
  const [members, setMembers] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [inviteForm, setInviteForm] = useState<{ user_id: string; role: 'member' | 'admin' | 'owner' }>({ user_id: '', role: 'member' })
  const canManageMembers = selectedSpace?.user_role === 'owner' || selectedSpace?.user_role === 'admin'
  const [brandingMode, setBrandingMode] = useState<'icon' | 'logo'>('icon')

  const openDrawer = async (_space: Space) => { }
  const closeDrawer = () => { }

  const loadMembers = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`)
      if (!res.ok) throw new Error('Failed to load members')
      const json = await res.json()
      setMembers(json.members || [])
      // load users to invite
      const usersRes = await fetch('/api/users?page=1&limit=200')
      if (usersRes.ok) {
        const usersJson = await usersRes.json()
        const memberIds = new Set((json.members || []).map((m: any) => m.user_id))
        setAvailableUsers((usersJson.users || []).filter((u: any) => !memberIds.has(u.id) && u.is_active))
      }
    } catch (e) {
      toast.error('Failed to load members')
    }
  }

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Space name is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create space')
      }

      const result = await response.json()
      toast.success('Space created successfully')
      setIsCreateDialogOpen(false)
      setFormData({ name: '', description: '', is_default: false, slug: '' })
      await refreshSpaces()

      if (spaces.length === 0 || result.space.is_default) {
        setCurrentSpace(result.space)
      }
    } catch (error) {
      console.error('Error creating space:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create space')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSpace = async (spaceId: string) => {
    if (!confirm('Are you sure you want to delete this space? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete space')
      }

      toast.success('Space deleted successfully')
      await refreshSpaces()

      if (currentSpace?.id === spaceId) {
        const remainingSpaces = spaces.filter(s => s.id !== spaceId)
        if (remainingSpaces.length > 0) {
          const defaultSpace = remainingSpaces.find(s => s.is_default) || remainingSpaces[0]
          setCurrentSpace(defaultSpace)
        } else {
          setCurrentSpace(null)
        }
      }
    } catch (error) {
      console.error('Error deleting space:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete space')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Space Management</span>
          </h2>
          <p className="text-muted-foreground">Create and manage workspaces to organize your data and collaborate with your team.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Space
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Space</DialogTitle>
              <DialogDescription>
                Create a new workspace to organize your data and collaborate with your team.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSpace}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Space Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter space name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter space description"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded border-border"
                  />
                  <Label htmlFor="is_default">Set as default space</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="slug">Custom URL (slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. marketing-team"
                />
                <p className="text-xs text-muted-foreground mt-1">Used for URLs like /s/&lt;slug&gt;/dashboard</p>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Space'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {spaces.map((space) => (
          <Card key={space.id} className={currentSpace?.id === space.id ? 'ring-2 ring-primary' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Link href={`/${space.slug || space.id}/settings`} className="hover:underline text-left">
                        {space.name}
                      </Link>
                      {space.is_default && (
                        <Badge variant="secondary">Default</Badge>
                      )}
                      {currentSpace?.id === space.id && (
                        <Badge variant="default">Current</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      Created by {space.created_by_name || 'Unknown'}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getRoleIcon(space.user_role || 'member')}
                  <RoleBadge role={space.user_role || 'member'} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {space.description && (
                  <p className="text-sm text-muted-foreground">{space.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{space.member_count || 0} members</span>
                    </div>
                    {space.slug && (
                      <div className="flex items-center space-x-1">
                        <span className="text-muted-foreground">/{space.slug}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentSpace(space)}
                      disabled={currentSpace?.id === space.id}
                    >
                      {currentSpace?.id === space.id ? 'Current' : 'Switch to'}
                    </Button>
                    <Link href={`/${space.slug || space.id}/settings?tab=members`} title="Manage Members">
                      <Button
                        variant="outline"
                        size="sm"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                    </Link>
                    {(space.user_role === 'owner' || space.user_role === 'admin') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { openDrawer(space); setInviteForm({ user_id: '', role: 'member' }) }}
                        title="Quick Invite"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                    {space.user_role === 'owner' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSpace(space.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {spaces.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No spaces yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first space to start organizing your data and collaborating with your team.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Space
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
