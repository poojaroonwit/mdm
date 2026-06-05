'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { AddAssetDialog, AddDataModelDialog, AddLinkDialog, AddMemberDialog } from '@/components/projects/project-detail-dialogs'
import { ASSET_TYPES, LINK_TYPES, PROJECT_ROLES } from '@/lib/project-types'
import { toast } from 'react-hot-toast'
import {
  FolderKanban,
  Users,
  Link as LinkIcon,
  GitBranch,
  HardDrive,
  Server,
  Database,
  BookOpen,
  Bot,
  Search,
  Ticket,
  Flag,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  MoreVertical,
  Calendar,
  Clock,
  Network,
  Box,
  LayoutGrid,
  List,
  RefreshCw,
  ChevronRight,
  Settings,
  Eye,
  X,
} from 'lucide-react'
import {
  Project,
  ProjectLink,
  ProjectAsset,
  ProjectDataModel,
  ProjectNotebook,
  ProjectChatbot,
  ProjectStatus,
  ProjectRole,
  DataModelRelationship,
  PROJECT_STATUSES,
  LinkType,
  AssetType,
} from '@/lib/project-types'

interface ProjectDetailPageProps {
  projectId: string
  spaceId?: string
  onViewChange?: (view: 'detail' | 'ontology') => void
}

export function ProjectDetailPage({ projectId, spaceId, onViewChange }: ProjectDetailPageProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [editMode, setEditMode] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'PLANNING' as ProjectStatus,
    startDate: '',
    endDate: '',
  })
  
  // Dialog states
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [addLinkOpen, setAddLinkOpen] = useState(false)
  const [addAssetOpen, setAddAssetOpen] = useState(false)
  const [addDataModelOpen, setAddDataModelOpen] = useState(false)

  // Fetch project data
  const fetchProject = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setFormData({
          name: data.project.name || '',
          description: data.project.description || '',
          status: data.project.status || 'PLANNING',
          startDate: data.project.startDate?.split('T')[0] || '',
          endDate: data.project.endDate?.split('T')[0] || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
      toast.error('Failed to load project')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchProject()
  }, [fetchProject])

  // Save project
  const handleSave = async () => {
    if (!project) return
    
    try {
      setSaving(true)
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        const data = await response.json()
        setProject(data.project)
        setEditMode(false)
        toast.success('Project updated successfully')
      } else {
        throw new Error('Failed to update')
      }
    } catch (error) {
      console.error('Failed to save project:', error)
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  // Add member
  const handleAddMember = async (member: { identifier: string; role: ProjectRole }) => {
    if (!project) return
    
    const members = [...(project.members || []), {
      userId: member.identifier,
      role: member.role,
    }]
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      })
      
      if (response.ok) {
        await fetchProject()
        setAddMemberOpen(false)
        toast.success('Member added')
      } else {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to add member')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add member')
    }
  }

  const handleUpdateMemberRole = async (memberId: string, role: ProjectRole) => {
    if (!project) return

    const members = (project.members || []).map((member) =>
      member.id === memberId ? { ...member, role } : member
    )

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      })

      if (response.ok) {
        await fetchProject()
        toast.success('Member role updated')
      } else {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to update member role')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!project) return

    const members = (project.members || []).filter((member) => member.id !== memberId)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      })

      if (response.ok) {
        await fetchProject()
        toast.success('Member removed')
      } else {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to remove member')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove member')
    }
  }

  // Add link
  const handleAddLink = async (link: { type: LinkType; name: string; url: string; description?: string }) => {
    if (!project) return
    
    const links = [...(project.links || []), {
      id: `link-${Date.now()}`,
      projectId: project.id,
      ...link,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      })
      
      if (response.ok) {
        await fetchProject()
        setAddLinkOpen(false)
        toast.success('Link added')
      }
    } catch (error) {
      toast.error('Failed to add link')
    }
  }

  // Remove link
  const handleRemoveLink = async (linkId: string) => {
    if (!project) return
    
    const links = (project.links || []).filter(l => l.id !== linkId)
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      })
      
      if (response.ok) {
        await fetchProject()
        toast.success('Link removed')
      }
    } catch (error) {
      toast.error('Failed to remove link')
    }
  }

  // Add asset
  const handleAddAsset = async (asset: { assetType: AssetType; assetName: string; assetDescription?: string }) => {
    if (!project) return
    
    const assets = [...(project.assets || []), {
      id: `asset-${Date.now()}`,
      projectId: project.id,
      assetId: `${asset.assetType}-${Date.now()}`,
      ...asset,
      createdAt: new Date().toISOString(),
    }]
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets }),
      })
      
      if (response.ok) {
        await fetchProject()
        setAddAssetOpen(false)
        toast.success('Asset added')
      }
    } catch (error) {
      toast.error('Failed to add asset')
    }
  }

  const handleAddDataModel = async (dataModel: { dataModelId: string; relationship: DataModelRelationship }) => {
    if (!project) return

    const dataModels = [...(project.dataModels || []), dataModel]

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataModels }),
      })

      if (response.ok) {
        await fetchProject()
        setAddDataModelOpen(false)
        toast.success('Data model linked')
      } else {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to link data model')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to link data model')
    }
  }

  const handleRemoveDataModel = async (dataModelId: string) => {
    if (!project) return

    const dataModels = (project.dataModels || []).filter((item) => item.dataModelId !== dataModelId)

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataModels }),
      })

      if (response.ok) {
        await fetchProject()
        toast.success('Data model removed')
      } else {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || 'Failed to remove data model')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove data model')
    }
  }

  if (loading) {
    return <ProjectDetailSkeleton />
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>
            <div>
              {editMode ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-xl font-semibold h-8 w-64"
                />
              ) : (
                <h1 className="text-xl font-semibold">{project.name}</h1>
              )}
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge
                  status={project.status}
                  label={PROJECT_STATUSES.find(s => s.value === project.status)?.label}
                />
                {project.space && (
                  <span className="text-sm text-muted-foreground">
                    in {project.space.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewChange?.('ontology')}
            >
              <Network className="h-4 w-4 mr-2" />
              View Ontology
            </Button>
            
            {editMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            <Button variant="ghost" size="icon" onClick={fetchProject}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="h-12">
              <TabsTrigger value="overview" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="members" className="gap-2">
                <Users className="h-4 w-4" />
                Members
                {project.members && project.members.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{project.members.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="links" className="gap-2">
                <LinkIcon className="h-4 w-4" />
                Links & Repos
                {project.links && project.links.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{project.links.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="assets" className="gap-2">
                <Server className="h-4 w-4" />
                Assets
                {project.assets && project.assets.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{project.assets.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Database className="h-4 w-4" />
                Data Models
                {project.dataModels && project.dataModels.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{project.dataModels.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="tools" className="gap-2">
                <Bot className="h-4 w-4" />
                Tools & Agents
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <Ticket className="h-4 w-4" />
                Tickets
                {project._count?.tickets && (
                  <Badge variant="secondary" className="ml-1">{project._count.tickets}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-4">
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 h-full">
              <div className="grid grid-cols-3 gap-4">
                {/* Main Info */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Description</Label>
                      {editMode ? (
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {project.description || 'No description'}
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Status</Label>
                        {editMode ? (
                          <Select
                            value={formData.status}
                            onValueChange={(v) => setFormData({ ...formData, status: v as ProjectStatus })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROJECT_STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="mt-1">
                            {PROJECT_STATUSES.find(s => s.value === project.status)?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <Label>Created By</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.creator?.avatar} />
                            <AvatarFallback>{project.creator?.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{project.creator?.name}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label>End Date</Label>
                        {editMode ? (
                          <Input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">
                            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Team Members</span>
                          <Badge variant="secondary">{project.members?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tickets</span>
                          <Badge variant="secondary">{project._count?.tickets || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Milestones</span>
                          <Badge variant="secondary">{project._count?.milestones || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Assets</span>
                          <Badge variant="secondary">{project.assets?.length || 0}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Data Models</span>
                          <Badge variant="secondary">{project.dataModels?.length || 0}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Recent Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {project.tickets && project.tickets.length > 0 ? (
                        <div className="space-y-2">
                          {project.tickets.slice(0, 5).map((ticket: any) => (
                            <div key={ticket.id} className="flex items-center justify-between text-sm">
                              <span className="truncate flex-1">{ticket.title}</span>
                              <Badge variant="outline" className="text-xs">
                                {ticket.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tickets yet</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Links Preview */}
                <Card className="col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Quick Links</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('links')}>
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-2">
                      {(project.links || []).slice(0, 4).map((link) => (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted transition-colors"
                        >
                          {link.type === 'git_repository' && <GitBranch className="h-4 w-4" />}
                          {link.type === 'shared_drive' && <HardDrive className="h-4 w-4" />}
                          {link.type === 'documentation' && <BookOpen className="h-4 w-4" />}
                          {!['git_repository', 'shared_drive', 'documentation'].includes(link.type) && <LinkIcon className="h-4 w-4" />}
                          <span className="text-sm truncate">{link.name}</span>
                        </a>
                      ))}
                      {(!project.links || project.links.length === 0) && (
                        <p className="text-sm text-muted-foreground col-span-4">No links added</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones Preview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Milestones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.milestones && project.milestones.length > 0 ? (
                      <div className="space-y-2">
                        {project.milestones.slice(0, 3).map((milestone: any) => (
                          <div key={milestone.id} className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm flex-1 truncate">{milestone.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {milestone.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No milestones</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage project team members and their roles</CardDescription>
                  </div>
                  <AddMemberDialog
                    open={addMemberOpen}
                    onOpenChange={setAddMemberOpen}
                    onAdd={handleAddMember}
                  />
                </CardHeader>
                <CardContent>
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-3">
                      {project.members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member.user?.avatar} />
                              <AvatarFallback>{member.user?.name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {PROJECT_ROLES.find(r => r.value === member.role)?.label || member.role}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {PROJECT_ROLES.map((roleOption) => (
                                  <DropdownMenuItem
                                    key={roleOption.value}
                                    onClick={() => handleUpdateMemberRole(member.id, roleOption.value)}
                                  >
                                    Set as {roleOption.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No team members added yet</p>
                      <Button className="mt-4" onClick={() => setAddMemberOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Links Tab */}
            <TabsContent value="links" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Links & Repositories</CardTitle>
                    <CardDescription>Git repos, shared drives, documentation, and other links</CardDescription>
                  </div>
                  <AddLinkDialog
                    open={addLinkOpen}
                    onOpenChange={setAddLinkOpen}
                    onAdd={handleAddLink}
                  />
                </CardHeader>
                <CardContent>
                  {project.links && project.links.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {project.links.map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg group">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {link.type === 'git_repository' && <GitBranch className="h-5 w-5" />}
                              {link.type === 'shared_drive' && <HardDrive className="h-5 w-5" />}
                              {link.type === 'documentation' && <BookOpen className="h-5 w-5" />}
                              {!['git_repository', 'shared_drive', 'documentation'].includes(link.type) && <LinkIcon className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{link.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {LINK_TYPES.find(t => t.value === link.type)?.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" asChild>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleRemoveLink(link.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No links added yet</p>
                      <Button className="mt-4" onClick={() => setAddLinkOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Link
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assets Tab */}
            <TabsContent value="assets" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Infrastructure Assets</CardTitle>
                    <CardDescription>VMs, containers, services, and other infrastructure</CardDescription>
                  </div>
                  <AddAssetDialog
                    open={addAssetOpen}
                    onOpenChange={setAddAssetOpen}
                    onAdd={handleAddAsset}
                  />
                </CardHeader>
                <CardContent>
                  {project.assets && project.assets.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {project.assets.map((asset) => (
                        <div key={asset.id} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                              {asset.assetType === 'vm' && <Server className="h-5 w-5" />}
                              {asset.assetType === 'container' && <Box className="h-5 w-5" />}
                              {asset.assetType === 'storage' && <HardDrive className="h-5 w-5" />}
                              {asset.assetType === 'database' && <Database className="h-5 w-5" />}
                              {!['vm', 'container', 'storage', 'database'].includes(asset.assetType) && <Server className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{asset.assetName}</p>
                              <Badge variant="outline" className="text-xs">
                                {ASSET_TYPES.find(t => t.value === asset.assetType)?.label}
                              </Badge>
                            </div>
                          </div>
                          {asset.assetDescription && (
                            <p className="text-sm text-muted-foreground">{asset.assetDescription}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No assets linked yet</p>
                      <Button className="mt-4" onClick={() => setAddAssetOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Asset
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Models Tab */}
            <TabsContent value="data" className="mt-0">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Data Models & Tables</CardTitle>
                    <CardDescription>Associated data models and database tables</CardDescription>
                  </div>
                  <Button onClick={() => setAddDataModelOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Link Data Model
                  </Button>
                </CardHeader>
                <CardContent>
                  {project.dataModels && project.dataModels.length > 0 ? (
                    <div className="space-y-4">
                      {project.dataModels.map((dm) => (
                        <div key={dm.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Database className="h-5 w-5 text-purple-600" />
                            </div>
                          <div>
                              <p className="font-medium">{dm.dataModel?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {dm.dataModel?.description || 'No description'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{dm.relationship}</Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveDataModel(dm.dataModelId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No data models linked yet</p>
                      <Button className="mt-4" onClick={() => setAddDataModelOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Link Data Model
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              <AddDataModelDialog
                open={addDataModelOpen}
                onOpenChange={setAddDataModelOpen}
                onAdd={handleAddDataModel}
                spaceId={spaceId || project.spaceId}
                linkedDataModelIds={(project.dataModels || []).map((item) => item.dataModelId)}
              />
            </TabsContent>

            {/* Tools & Agents Tab */}
            <TabsContent value="tools" className="mt-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Notebooks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Notebooks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.notebooks && project.notebooks.length > 0 ? (
                      <div className="space-y-2">
                        {project.notebooks.map((nb) => (
                          <div key={nb.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{nb.notebook?.name}</span>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No notebooks</p>
                    )}
                  </CardContent>
                </Card>

                {/* AI Agents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      AI Agents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.chatbots && project.chatbots.length > 0 ? (
                      <div className="space-y-2">
                        {project.chatbots.map((cb) => (
                          <div key={cb.id} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{cb.chatbot?.name}</span>
                            <StatusBadge status={cb.chatbot?.isPublished ? 'published' : 'draft'} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No AI agents</p>
                    )}
                  </CardContent>
                </Card>

                {/* Queries */}
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Queries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project.queries && project.queries.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {project.queries.map((q) => (
                          <div key={q.id} className="flex items-center gap-2 p-2 border rounded">
                            <Badge variant="outline">{q.queryType}</Badge>
                            <span className="text-sm truncate">{q.queryName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">No queries</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Project Tickets</CardTitle>
                  <CardDescription>All tickets associated with this project</CardDescription>
                </CardHeader>
                <CardContent>
                  {project.tickets && project.tickets.length > 0 ? (
                    <div className="space-y-2">
                      {project.tickets.map((ticket: any) => (
                        <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-3">
                            <Ticket className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{ticket.title}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{ticket.priority}</Badge>
                            <Badge>{ticket.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Ticket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No tickets yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  )
}

// Skeleton loader
function ProjectDetailSkeleton() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-64 col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}
