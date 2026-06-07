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
import { ProjectOverviewTab } from '@/components/projects/project-overview-tab'
import { ProjectResourcesTabs } from '@/components/projects/project-resources-tabs'
import { ProjectToolsTabs } from '@/components/projects/project-tools-tabs'
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
            <ProjectOverviewTab project={project} editMode={editMode} formData={formData} setFormData={setFormData} setActiveTab={setActiveTab} />

            <ProjectResourcesTabs project={project} addMemberOpen={addMemberOpen} setAddMemberOpen={setAddMemberOpen} handleAddMember={handleAddMember} handleUpdateMemberRole={handleUpdateMemberRole} handleRemoveMember={handleRemoveMember} addLinkOpen={addLinkOpen} setAddLinkOpen={setAddLinkOpen} handleAddLink={handleAddLink} handleRemoveLink={handleRemoveLink} addAssetOpen={addAssetOpen} setAddAssetOpen={setAddAssetOpen} handleAddAsset={handleAddAsset} addDataModelOpen={addDataModelOpen} setAddDataModelOpen={setAddDataModelOpen} handleAddDataModel={handleAddDataModel} handleRemoveDataModel={handleRemoveDataModel} spaceId={spaceId} />

            <ProjectToolsTabs project={project} />
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

