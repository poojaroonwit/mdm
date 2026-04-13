'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Database, 
  Settings,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Lock,
  Unlock,
  Star,
  Archive,
  RefreshCw,
  Grid3X3,
  List
} from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Space {
  id: string
  name: string
  description: string
  slug: string
  isDefault: boolean
  isActive: boolean
  icon?: string
  logoUrl?: string
  features: Record<string, any>
  memberCount: number
  dataModelCount: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  createdByName: string
}

export function SpaceManagement() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  const [newSpace, setNewSpace] = useState({
    name: '',
    description: '',
    slug: '',
    isDefault: false,
    isActive: true,
    icon: '',
    features: {}
  })

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces.map((space: any) => ({
          ...space,
          createdAt: new Date(space.createdAt),
          updatedAt: new Date(space.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createSpace = async () => {
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSpace)
      })

      if (response.ok) {
        setShowCreateDialog(false)
        setNewSpace({
          name: '',
          description: '',
          slug: '',
          isDefault: false,
          isActive: true,
          icon: '',
          features: {}
        })
        loadSpaces()
      }
    } catch (error) {
      console.error('Error creating space:', error)
    }
  }

  const updateSpace = async (spaceId: string, updates: Partial<Space>) => {
    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        loadSpaces()
        setShowEditDialog(false)
        setSelectedSpace(null)
      }
    } catch (error) {
      console.error('Error updating space:', error)
    }
  }

  const deleteSpace = async (spaceId: string) => {
    if (!confirm('Are you sure you want to delete this space? This action cannot be undone.')) return

    try {
      const response = await fetch(`/api/spaces/${spaceId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadSpaces()
      }
    } catch (error) {
      console.error('Error deleting space:', error)
    }
  }

  const toggleSpaceStatus = async (spaceId: string, isActive: boolean) => {
    await updateSpace(spaceId, { isActive })
  }

  const setDefaultSpace = async (spaceId: string) => {
    // First, unset all other default spaces
    const defaultSpaces = spaces.filter(space => space.isDefault)
    for (const space of defaultSpaces) {
      await updateSpace(space.id, { isDefault: false })
    }
    
    // Then set the selected space as default
    await updateSpace(spaceId, { isDefault: true })
  }

  const filteredSpaces = spaces.filter(space => {
    const matchesSearch = space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         space.slug.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && space.isActive) ||
                         (statusFilter === 'inactive' && !space.isActive) ||
                         (statusFilter === 'default' && space.isDefault)
    
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Building className="h-6 w-6" />
            Space Management
          </h2>
          <p className="text-muted-foreground">
            Manage spaces, workspaces, and their configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('grid')}
              aria-pressed={viewMode === 'grid'}
              title="Grid view"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode('table')}
              aria-pressed={viewMode === 'table'}
              title="Table view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={loadSpaces} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Space
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Space</DialogTitle>
                <DialogDescription>
                  Create a new workspace for your team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="space-name">Space Name</Label>
                  <Input
                    id="space-name"
                    value={newSpace.name}
                    onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
                    placeholder="My Workspace"
                  />
                </div>
                <div>
                  <Label htmlFor="space-description">Description</Label>
                  <Textarea
                    id="space-description"
                    value={newSpace.description}
                    onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
                    placeholder="Workspace description"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="space-slug">Slug</Label>
                  <Input
                    id="space-slug"
                    value={newSpace.slug}
                    onChange={(e) => setNewSpace({ ...newSpace, slug: e.target.value })}
                    placeholder="my-workspace"
                  />
                </div>
                <div>
                  <Label htmlFor="space-icon">Icon (Emoji)</Label>
                  <Input
                    id="space-icon"
                    value={newSpace.icon}
                    onChange={(e) => setNewSpace({ ...newSpace, icon: e.target.value })}
                    placeholder="🏢"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={newSpace.isDefault} 
                    onCheckedChange={(checked) => setNewSpace({ ...newSpace, isDefault: checked })}
                  />
                  <Label>Set as Default Space</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createSpace} disabled={!newSpace.name || !newSpace.slug}>
                  Create Space
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search spaces..."
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Spaces</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="default">Default</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Spaces List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSpaces.map(space => (
            <Card key={space.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {space.icon && (
                      <span className="text-2xl">{space.icon}</span>
                    )}
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {space.name}
                        {space.isDefault && (
                          <Badge variant="default" className="text-xs">Default</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {space.slug} • {space.memberCount} members
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedSpace(space)
                        setShowEditDialog(true)
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteSpace(space.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {space.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {space.memberCount}
                      </div>
                      <div className="flex items-center gap-1">
                        <Database className="h-3 w-3" />
                        {space.dataModelCount}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {space.isActive ? (
                        <Badge variant="outline" className="text-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600">Inactive</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleSpaceStatus(space.id, !space.isActive)}
                    >
                      {space.isActive ? (
                        <>
                          <Lock className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    {!space.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDefaultSpace(space.id)}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Data Models</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSpaces.map(space => (
                <TableRow key={space.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {space.icon && <span className="text-xl leading-none">{space.icon}</span>}
                      <span>{space.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{space.slug}</TableCell>
                  <TableCell>{space.memberCount}</TableCell>
                  <TableCell>{space.dataModelCount}</TableCell>
                  <TableCell>
                    {space.isActive ? (
                      <Badge variant="outline" className="text-green-600">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-600">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {space.isDefault && (
                      <Badge variant="default" className="text-xs">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleSpaceStatus(space.id, !space.isActive)}
                      >
                        {space.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      {!space.isDefault && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDefaultSpace(space.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSpace(space)
                          setShowEditDialog(true)
                        }}
                        aria-label="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteSpace(space.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Space</DialogTitle>
            <DialogDescription>
              Update space settings and configuration
            </DialogDescription>
          </DialogHeader>
          {selectedSpace && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Space Name</Label>
                <Input
                  id="edit-name"
                  value={selectedSpace.name}
                  onChange={(e) => setSelectedSpace({ ...selectedSpace, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedSpace.description}
                  onChange={(e) => setSelectedSpace({ ...selectedSpace, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="edit-slug">Slug</Label>
                <Input
                  id="edit-slug"
                  value={selectedSpace.slug}
                  onChange={(e) => setSelectedSpace({ ...selectedSpace, slug: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={selectedSpace.isActive} 
                  onCheckedChange={(checked) => setSelectedSpace({ ...selectedSpace, isActive: checked })}
                />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedSpace && updateSpace(selectedSpace.id, selectedSpace)}
              disabled={!selectedSpace?.name || !selectedSpace?.slug}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
