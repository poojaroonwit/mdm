'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Building2, Search, ArrowRight, Settings, Layout, Grid3X3, Table as TableIcon, Plus, X, Filter } from 'lucide-react'
import { Space } from '../types'
import { Skeleton } from '@/components/ui/skeleton'

export function SpaceSelection() {
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archive'>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    slug: '',
    tags: [] as string[],
    tagInput: ''
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
        // Ensure tags are parsed correctly (handle both string and array formats)
        const spacesWithTags = (data.spaces || []).map((space: any) => ({
          ...space,
          tags: Array.isArray(space.tags) 
            ? space.tags 
            : typeof space.tags === 'string' 
              ? JSON.parse(space.tags || '[]') 
              : []
        }))
        setSpaces(spacesWithTags)
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Get all unique tags from spaces
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    spaces.forEach(space => {
      space.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [spaces])

  // Filter spaces by search, tags, and status
  const filtered = useMemo(() => {
    return spaces.filter(space => {
      // Search filter
      const matchesSearch = 
        space.name.toLowerCase().includes(search.toLowerCase()) ||
        (space.description || '').toLowerCase().includes(search.toLowerCase()) ||
        (space.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      
      // Tag filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => (space.tags || []).includes(tag))
      
      // Status filter
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'active' && space.is_active && !space.deleted_at) ||
        (statusFilter === 'inactive' && !space.is_active && !space.deleted_at) ||
        (statusFilter === 'archive' && space.deleted_at !== null)
      
      return matchesSearch && matchesTags && matchesStatus
    })
  }, [spaces, search, selectedTags, statusFilter])

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFormData.name.trim()) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: createFormData.name,
          description: createFormData.description,
          slug: createFormData.slug || createFormData.name.toLowerCase().replace(/\s+/g, '-'),
          tags: createFormData.tags,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create space')
      }

      await loadSpaces()
      setShowCreateDialog(false)
      setCreateFormData({
        name: '',
        description: '',
        slug: '',
        tags: [],
        tagInput: ''
      })
    } catch (error) {
      console.error('Error creating space:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTag = () => {
    const tag = createFormData.tagInput.trim()
    if (tag && !createFormData.tags.includes(tag)) {
      setCreateFormData({
        ...createFormData,
        tags: [...createFormData.tags, tag],
        tagInput: ''
      })
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setCreateFormData({
      ...createFormData,
      tags: createFormData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const handleSpaceSelect = (space: Space) => {
    router.push(`/${space.slug || space.id}/module`)
  }

  const handleSpaceSettings = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation()
    // Check if we're on data management page to add query param
    const isFromDataManagement = window.location.pathname?.includes('/data-management')
    const url = `/${space.slug || space.id}/settings${isFromDataManagement ? '?from=data-management' : ''}`
    router.push(url)
  }

  const handleSpaceStudio = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/${space.slug || space.id}/studio`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-full space-y-3 p-4">
  <Skeleton className="h-10 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
  <Skeleton className="h-12 w-full rounded-xl" />
</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Space Selection</h2>
          <p className="text-muted-foreground">Select a workspace to continue</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces..."
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Space Selection</h2>
          <p className="text-muted-foreground">Select a workspace to continue</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search spaces..."
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8"
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Cards
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8"
            >
              <TableIcon className="h-4 w-4 mr-2" />
              Table
            </Button>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New Space
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden">
              <DialogHeader className="p-6 pb-2">
                <DialogTitle>Create New Space</DialogTitle>
                <DialogDescription>
                  Create a new workspace to organize your data and collaborate with your team.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSpace}>
                <DialogBody className="p-6 pt-2 pb-4 space-y-4">
                  <div>
                    <Label htmlFor="name">Space Name *</Label>
                    <Input
                      id="name"
                      value={createFormData.name}
                      onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                      placeholder="Enter space name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={createFormData.description}
                      onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                      placeholder="Enter space description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Slug (Optional)</Label>
                    <Input
                      id="slug"
                      value={createFormData.slug}
                      onChange={(e) => setCreateFormData({ ...createFormData, slug: e.target.value })}
                      placeholder="my-workspace"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Used for URLs. Auto-generated from name if not provided.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="tags"
                        value={createFormData.tagInput}
                        onChange={(e) => setCreateFormData({ ...createFormData, tagInput: e.target.value })}
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddTag()
                          }
                        }}
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                        Add
                      </Button>
                    </div>
                    {createFormData.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {createFormData.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:bg-muted rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </DialogBody>
      <div className="flex items-center gap-4 flex-wrap">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Status:</span>
          <div className="flex gap-1">
            {(['all', 'active', 'inactive', 'archive'] as const).map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="h-7 text-xs capitalize"
              >
                {status === 'all' ? 'All' : status}
              </Button>
            ))}
          </div>
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground">Tags:</span>
            {allTags.map(tag => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => toggleTagFilter(tag)}
              >
                {tag}
                {selectedTags.includes(tag) && (
                  <X className="h-3 w-3 ml-1" />
                )}
              </Badge>
            ))}
            {selectedTags.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTags([])}
                className="h-7 text-xs"
              >
                Clear tags
              </Button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 && !isLoading && (
        <Card className="border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <div className="font-medium mb-1">
              {spaces.length === 0 ? 'No spaces available' : 'No spaces found'}
            </div>
            <div className="text-sm text-muted-foreground">
              {spaces.length === 0 
                ? 'You don\'t have access to any workspaces yet.'
                : 'Try adjusting your search terms'}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(space => (
            <Card 
              key={space.id} 
              className="hover:shadow-md transition-shadow group"
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    {space.name}
                    {space.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                    )}
                    {space.deleted_at && (
                      <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-1 rounded">Archive</span>
                    )}
                    {!space.deleted_at && !space.is_active && (
                      <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">Inactive</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {(space.member_count || 0)} members
                  </CardDescription>
                </div>
              </CardHeader>
              {space.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
                </CardContent>
              )}
              {(space.tags && space.tags.length > 0) && (
                <CardContent className="pt-0 pb-0">
                  <div className="flex flex-wrap gap-1">
                    {space.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <Button
                  size="sm"
                  variant="default"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSpaceSelect(space)
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Space
                </Button>
              </CardContent>
            </Card>
          ))}
          {/* Placeholder Card for Add New */}
          <Card 
            className="border-dashed border-2 border-gray-300 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group"
            onClick={() => setShowCreateDialog(true)}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] py-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                <Plus className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <CardTitle className="text-lg font-medium text-gray-600 group-hover:text-primary transition-colors">
                Add New Space
              </CardTitle>
              <CardDescription className="text-center mt-2">
                Create a new workspace
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'table' && (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(space => (
                <TableRow 
                  key={space.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSpaceSelect(space)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      {space.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-md truncate text-muted-foreground">
                      {space.description || 'No description'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(space.tags && space.tags.length > 0) ? (
                        space.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">No tags</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(space.member_count || 0)} members
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 flex-wrap">
                      {space.is_default && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                      )}
                      {space.deleted_at && (
                        <span className="text-xs bg-gray-500/10 text-gray-600 px-2 py-1 rounded">Archive</span>
                      )}
                      {!space.deleted_at && !space.is_active && (
                        <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded">Inactive</span>
                      )}
                      {!space.deleted_at && space.is_active && (
                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded">Active</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleSpaceSelect(space)}
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Go to Space
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

