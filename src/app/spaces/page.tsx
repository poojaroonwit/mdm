'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Building2, Search, Plus, ArrowRight, Layout, Settings, FolderPlus, Shield, Database, BarChart3 } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import toast from 'react-hot-toast'

interface Space {
  id: string
  name: string
  description?: string
  slug?: string
  is_default: boolean
  member_count?: number
}

export default function SpaceSelectionPage() {
  const router = useRouter()
  const { currentSpace, spaces, setCurrentSpace, isLoading, error, refreshSpaces } = useSpace()
  const [search, setSearch] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    is_default: false
  })

  // Removed automatic redirects to allow users to stay on spaces selection page

  const filtered = spaces.filter(s => (
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description || '').toLowerCase().includes(search.toLowerCase())
  ))

  const handleSpaceSelect = async (space: Space) => {
    await setCurrentSpace(space as any)
    router.push(`/${space.slug || space.id}/dashboard`)
  }

  const handleSpaceStudio = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentSpace(space as any)
    router.push(`/${space.slug || space.id}/studio`)
  }

  const handleSpaceSettings = (space: Space, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    setCurrentSpace(space as any)
    router.push(`/${space.slug || space.id}/settings`)
  }

  const handleAdminConsole = () => {
    router.push('/')
  }

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createFormData.name.trim()) {
      toast.error('Space name is required')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/spaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createFormData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create space')
      }

      const result = await response.json()
      toast.success('Space created successfully')
      setIsCreateDialogOpen(false)
      setCreateFormData({ name: '', description: '', is_default: false })
      await refreshSpaces()

      // If this is the first space or it's set as default, navigate to it
      if (spaces.length === 0 || result.space.is_default) {
        setCurrentSpace(result.space)
        router.push(`/${result.space.slug || result.space.id}/dashboard`)
      }
    } catch (error) {
      console.error('Error creating space:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create space')
    } finally {
      setIsCreating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading spaces...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Unable to load workspaces</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/auth/signin">
              <Button>Sign in</Button>
            </Link>
            <Button variant="outline" onClick={() => router.refresh()}>Try again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Select a workspace</h1>
            <p className="text-muted-foreground">Choose a workspace to continue</p>
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/system/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                System settings
              </Button>
            </div>
          </div>
          <div className="w-64 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workspaces..."
                className="pl-8"
              />
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  New
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
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
                  </div>
                  <DialogFooter className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Space'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {filtered.length === 0 && !isLoading && (
          <Card className="border-dashed border-2">
            <CardContent className="py-16 text-center">
              {spaces.length === 0 ? (
                <>
                  <FolderPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <div className="text-xl font-semibold mb-2">No spaces available</div>
                  <div className="text-muted-foreground mb-6 max-w-md mx-auto">
                    You don't have access to any workspaces yet. Create your first space to get started with organizing your data and collaborating with your team.
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Create your first space
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New Space</DialogTitle>
                        <DialogDescription>
                          Create your first workspace to organize your data and collaborate with your team.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateSpace}>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Space Name</Label>
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
                        </div>
                        <DialogFooter className="mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={isCreating}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isCreating}>
                            {isCreating ? 'Creating...' : 'Create Space'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <>
                  <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <div className="font-medium mb-1">No workspaces found</div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Try adjusting your search terms
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Admin Space Card */}
          <Card
            className="border-2 border-dashed border-primary/20 bg-primary/5 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={handleAdminConsole}
          >
            <CardHeader className="flex flex-row items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  Unified Data Platform
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">System</span>
                </CardTitle>
                <CardDescription>
                  System administration & management
                </CardDescription>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdminConsole()
                  }}
                >
                  <Database className="h-4 w-4 mr-2" />
                  BigQuery
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAdminConsole()
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {filtered.map(space => (
            <Card
              key={space.id}
              className="hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleSpaceSelect(space)}
            >
              <CardHeader className="flex flex-row items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {space.name}
                    {space.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">Default</span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {(space.member_count || 0)} members
                  </CardDescription>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              {space.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{space.description}</p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleSpaceStudio(space, e)}
                  >
                    <Layout className="h-4 w-4 mr-2" />
                    Studio
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => handleSpaceSettings(space, e)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
