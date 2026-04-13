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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'owner':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Owner</Badge>
      case 'admin':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Admin</Badge>
      default:
        return <Badge variant="outline">Member</Badge>
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
                  {getRoleBadge(space.user_role || 'member')}
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

      {/* Drawer removed; disabled rendering */}
      {false && selectedSpace && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-full max-w-3xl bg-background shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedSpace!.name}</h3>
                <p className="text-sm text-muted-foreground">Configure this space</p>
              </div>
              <Button variant="outline" onClick={closeDrawer}>Close</Button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 flex flex-col">
                <Tabs value={'details'}>
                  <div className="border-b border-border px-6 py-3">
                    <TabsList>
                      <TabsTrigger value="details">Space detail</TabsTrigger>
                      <TabsTrigger value="members" onClick={() => loadMembers(selectedSpace!.id)}>Space member</TabsTrigger>
                      <TabsTrigger value="sidebar">Sidebar</TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="details" className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Branding</Label>
                        <div className="flex items-center gap-2">
                          <Button variant={brandingMode === 'icon' ? 'default' : 'outline'} size="sm" onClick={async () => {
                            setBrandingMode('icon')
                            if (selectedSpace?.logo_url) {
                              await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: null }) })
                              await refreshSpaces()
                            }
                          }}>Use icon</Button>
                          <Button variant={brandingMode === 'logo' ? 'default' : 'outline'} size="sm" onClick={async () => {
                            setBrandingMode('logo')
                            if (selectedSpace?.icon) {
                              await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: null }) })
                              await refreshSpaces()
                            }
                          }}>Use logo</Button>
                        </div>
                      </div>
                      {brandingMode === 'icon' && (
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <IconPickerPopover
                            value={selectedSpace!.icon || ''}
                            onChange={async (iconName) => {
                              const res = await fetch(`/api/spaces/${selectedSpace!.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ icon: iconName, logo_url: null })
                              })
                              if (res.ok) {
                                toast.success('Icon selected')
                                await refreshSpaces()
                              } else {
                                toast.error('Failed to set icon')
                              }
                            }}
                          />
                          <div className="flex items-center gap-3">
                            {selectedSpace!.icon ? (
                              <SpaceIconPreview iconName={selectedSpace!.icon} />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted border border-border flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <Button variant="outline" size="sm">
                              Select Icon
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">Choose an icon from the icon library. Picking an icon will clear the logo.</p>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label className={brandingMode === 'logo' ? '' : 'opacity-50'}>Logo</Label>
                        <div className="flex items-center gap-3">
                          {selectedSpace!.logo_url ? (
                            <img src={selectedSpace!.logo_url} alt={selectedSpace!.name} className="h-10 w-10 rounded" />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted" />
                          )}
                          <form onChange={async (e: any) => {
                            const file = e.target?.files?.[0]
                            if (!file) return
                            if (brandingMode !== 'logo') return
                            const fd = new FormData()
                            fd.append('logo', file)
                            const uploadRes = await fetch('/api/upload/logo', { method: 'POST', body: fd })
                            if (!uploadRes.ok) { toast.error('Upload failed'); return }
                            const { url } = await uploadRes.json()
                            const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url: url, icon: null }) })
                            if (res.ok) { toast.success('Logo updated'); await refreshSpaces() } else { toast.error('Failed to save logo url') }
                          }}>
                            <Input type="file" accept="image/*" disabled={brandingMode !== 'logo'} />
                          </form>
                        </div>
                        <Input defaultValue={selectedSpace!.logo_url || ''} placeholder="https://..." disabled={brandingMode !== 'logo'} onBlur={async (e) => {
                          const logo_url = e.currentTarget.value.trim()
                          if (logo_url === (selectedSpace!.logo_url || '')) return
                          const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ logo_url, icon: null }) })
                          if (res.ok) { toast.success('Logo updated'); await refreshSpaces() } else { toast.error('Failed to update logo') }
                        }} />
                        <p className="text-xs text-muted-foreground">Upload an image or paste a URL. Shown in sidebar and UI.</p>
                      </div>
                      <div>
                        <Label htmlFor="space-name">Name</Label>
                        <Input id="space-name" defaultValue={selectedSpace!.name} onBlur={async (e) => {
                          const name = e.currentTarget.value.trim()
                          if (!name || name === selectedSpace!.name) return
                          const res = await fetch(`/api/spaces/${selectedSpace!.id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ name })
                          })
                          if (res.ok) { toast.success('Space name updated'); await refreshSpaces() } else { toast.error('Failed to update name') }
                        }} />
                      </div>
                      <div>
                        <Label htmlFor="space-desc">Description</Label>
                        <Textarea id="space-desc" defaultValue={selectedSpace!.description || ''} rows={3} onBlur={async (e) => {
                          const description = e.currentTarget.value
                          if (description === (selectedSpace!.description || '')) return
                          const res = await fetch(`/api/spaces/${selectedSpace!.id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ description })
                          })
                          if (res.ok) { toast.success('Description updated'); await refreshSpaces() } else { toast.error('Failed to update description') }
                        }} />
                      </div>
                      <div>
                        <Label htmlFor="space-slug">Custom URL (slug)</Label>
                        <Input id="space-slug" defaultValue={selectedSpace!.slug || ''} onBlur={async (e) => {
                          const slug = e.currentTarget.value.trim()
                          if (slug === (selectedSpace!.slug || '')) return
                          const res = await fetch(`/api/spaces/${selectedSpace!.id}`, {
                            method: 'PUT', headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ slug })
                          })
                          if (res.ok) { toast.success('Slug updated'); await refreshSpaces() } else { toast.error('Failed to update slug') }
                        }} />
                        <p className="text-xs text-muted-foreground mt-1">URL will be /s/{selectedSpace!.slug || 'your-slug'}/dashboard</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="members" className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label htmlFor="invite-user">Invite user</Label>
                        <Select value={inviteForm.user_id} onValueChange={(v) => setInviteForm({ ...inviteForm, user_id: v })}>
                          <SelectTrigger id="invite-user"><SelectValue placeholder="Select user" /></SelectTrigger>
                          <SelectContent>
                            {availableUsers.map((u: any) => (
                              <SelectItem key={u.id} value={u.id}>{u.name} ({u.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={inviteForm.role} onValueChange={(v: any) => setInviteForm({ ...inviteForm, role: v })}>
                          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {selectedSpace!.user_role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button disabled={!canManageMembers || !inviteForm.user_id} onClick={async () => {
                        const res = await fetch(`/api/spaces/${selectedSpace!.id}/members`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(inviteForm) })
                        if (res.ok) { toast.success('User invited'); await loadMembers(selectedSpace!.id) } else { toast.error('Failed to invite') }
                      }}>Invite</Button>
                    </div>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-5 gap-2 px-3 py-2 text-xs text-muted-foreground border-b">
                        <div>User</div><div>Email</div><div>System role</div><div>Space role</div><div>Actions</div>
                      </div>
                      {members.map((m: any) => (
                        <div key={m.id || m.user_id} className="grid grid-cols-5 gap-2 px-3 py-2 items-center border-b border-border last:border-b-0">
                          <div className="font-medium">{m.user_name || 'Unknown'}</div>
                          <div>{m.user_email || 'N/A'}</div>
                          <div><Badge variant="outline">{m.user_system_role || 'N/A'}</Badge></div>
                          <div>
                            {canManageMembers && m.role !== 'owner' ? (
                              <Select value={m.role} onValueChange={async (role) => {
                                const r = await fetch(`/api/spaces/${selectedSpace!.id}/members/${m.user_id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
                                if (r.ok) { toast.success('Role updated'); await loadMembers(selectedSpace!.id) } else { toast.error('Failed to update') }
                              }}>
                                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  {selectedSpace!.user_role === 'owner' && <SelectItem value="owner">Owner</SelectItem>}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant="outline">{m.role}</Badge>
                            )}
                          </div>
                          <div>
                            {canManageMembers && m.role !== 'owner' && (
                              <Button variant="outline" size="sm" className="text-red-600" onClick={async () => {
                                if (!confirm('Remove this member?')) return
                                const r = await fetch(`/api/spaces/${selectedSpace!.id}/members/${m.user_id}`, { method: 'DELETE' })
                                if (r.ok) { toast.success('Member removed'); await loadMembers(selectedSpace!.id) } else { toast.error('Failed to remove') }
                              }}>Remove</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="sidebar" className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="font-medium">Styles</h4>
                        <div className="grid gap-3">
                          <div>
                            <Label>Background type</Label>
                            <Select defaultValue={(selectedSpace as any).sidebar_config?.style?.backgroundType || 'color'} onValueChange={async (v) => {
                              const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), backgroundType: v } } }) })
                              if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                            }}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="gradient">Gradient</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Background color</Label>
                            <Input type="text" placeholder="#0f172a" defaultValue={(selectedSpace as any).sidebar_config?.style?.backgroundColor || ''} onBlur={async (e) => {
                              const v = e.currentTarget.value
                              const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), backgroundColor: v } } }) })
                              if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                            }} />
                          </div>
                          <div>
                            <Label>Background image URL</Label>
                            <Input type="text" placeholder="https://..." defaultValue={(selectedSpace as any).sidebar_config?.style?.backgroundImage || ''} onBlur={async (e) => {
                              const v = e.currentTarget.value
                              const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), backgroundImage: v || null } } }) })
                              if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                            }} />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <Label>Gradient from</Label>
                              <Input type="text" placeholder="#0f172a" defaultValue={(selectedSpace as any).sidebar_config?.style?.gradient?.from || ''} onBlur={async (e) => {
                                const v = e.currentTarget.value
                                const g = { ...(((selectedSpace as any).sidebar_config?.style?.gradient) || {}), from: v }
                                const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), gradient: g } } }) })
                                if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                              }} />
                            </div>
                            <div>
                              <Label>Gradient to</Label>
                              <Input type="text" placeholder="#1e293b" defaultValue={(selectedSpace as any).sidebar_config?.style?.gradient?.to || ''} onBlur={async (e) => {
                                const v = e.currentTarget.value
                                const g = { ...(((selectedSpace as any).sidebar_config?.style?.gradient) || {}), to: v }
                                const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), gradient: g } } }) })
                                if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                              }} />
                            </div>
                            <div>
                              <Label>Gradient angle</Label>
                              <Input type="number" placeholder="180" defaultValue={(selectedSpace as any).sidebar_config?.style?.gradient?.angle ?? ''} onBlur={async (e) => {
                                const v = parseInt(e.currentTarget.value || '180', 10)
                                const g = { ...(((selectedSpace as any).sidebar_config?.style?.gradient) || {}), angle: v }
                                const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), gradient: g } } }) })
                                if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                              }} />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Font color</Label>
                              <Input type="text" placeholder="#ffffff" defaultValue={(selectedSpace as any).sidebar_config?.style?.fontColor || ''} onBlur={async (e) => {
                                const v = e.currentTarget.value
                                const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), fontColor: v } } }) })
                                if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                              }} />
                            </div>
                            <div>
                              <Label>Width</Label>
                              <Select defaultValue={(selectedSpace as any).sidebar_config?.style?.size || 'medium'} onValueChange={async (v) => {
                                const res = await fetch(`/api/spaces/${selectedSpace!.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sidebar_config: { ...(selectedSpace as any).sidebar_config, style: { ...((selectedSpace as any).sidebar_config?.style || {}), size: v } } }) })
                                if (res.ok) { toast.success('Updated'); await refreshSpaces() } else { toast.error('Failed') }
                              }}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="small">Small</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="large">Large</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Menu (drag to reorder)</h4>
                        <p className="text-sm text-muted-foreground">Add labels, links, and arrange items. Changes save on blur/drop.</p>
                        <MenuEditor space={selectedSpace} onSaved={refreshSpaces} />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuEditor({ space, onSaved }: { space: any, onSaved: () => Promise<void> }) {
  const [menu, setMenu] = useState<Array<any>>(() => space.sidebar_config?.menu || [])

  const save = async (next: any[]) => {
    setMenu(next)
    const res = await fetch(`/api/spaces/${space.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sidebar_config: { ...(space.sidebar_config || {}), menu: next } })
    })
    if (res.ok) { toast.success('Menu saved'); await onSaved() } else { toast.error('Failed to save menu') }
  }

  const addLabel = () => {
    const next = [...menu, { title: 'New Label', children: [] }]
    save(next)
  }
  const addLink = () => {
    const next = [...menu, { title: 'New Link', href: '/', icon: 'Settings' }]
    save(next)
  }
  const onReorder = (from: number, to: number) => {
    const next = [...menu]
    const [m] = next.splice(from, 1)
    next.splice(to, 0, m)
    save(next)
  }
  const updateItem = (idx: number, patch: any) => {
    const next = menu.map((m, i) => i === idx ? { ...m, ...patch } : m)
    save(next)
  }
  const removeItem = (idx: number) => {
    const next = menu.filter((_, i) => i !== idx)
    save(next)
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button size="sm" onClick={addLabel}>Add Label</Button>
        <Button size="sm" variant="outline" onClick={addLink}>Add Link</Button>
      </div>
      <div className="border rounded">
        {menu.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 p-2 border-b border-border last:border-b-0">
            <button className="cursor-grab px-2 text-xs" draggable onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)) }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { const from = parseInt(e.dataTransfer.getData('text/plain') || '-1', 10); if (from >= 0) { onReorder(from, idx) } }}>↕</button>
            <Input className="w-48" defaultValue={item.title} onBlur={(e) => updateItem(idx, { title: e.currentTarget.value })} />
            <Input className="flex-1" placeholder="/path or leave blank for label" defaultValue={item.href || ''} onBlur={(e) => updateItem(idx, { href: e.currentTarget.value || undefined })} />
            <Input className="w-40" placeholder="Icon name (optional)" defaultValue={item.icon || ''} onBlur={(e) => updateItem(idx, { icon: e.currentTarget.value || undefined })} />
            <Button size="sm" variant="outline" className="text-red-600" onClick={() => removeItem(idx)}>Remove</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
