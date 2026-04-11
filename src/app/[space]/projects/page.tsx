'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogBody } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import {
  FolderKanban,
  Plus,
  Search,
  LayoutGrid,
  List,
  Calendar,
  Users,
  Ticket,
  Flag,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Network,
  Filter,
  SortAsc,
  Clock,
} from 'lucide-react'
import { ProjectDetailPage } from '@/components/projects/project-detail-page'
import { OntologyGraphView } from '@/components/ontology/ontology-graph'
import { 
  Project, 
  ProjectStatus, 
  PROJECT_STATUSES,
} from '@/lib/project-types'

export default function ProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const spaceId = params?.space as string
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [viewType, setViewType] = useState<'projects' | 'detail' | 'ontology'>('projects')
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  // Form state for new project
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    status: 'PLANNING' as ProjectStatus,
    startDate: '',
    endDate: '',
  })

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (spaceId) params.set('spaceId', spaceId)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      
      const response = await fetch(`/api/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [spaceId, statusFilter])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // Create project
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required')
      return
    }

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          spaceId,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Project created successfully')
        setCreateDialogOpen(false)
        setNewProject({
          name: '',
          description: '',
          status: 'PLANNING',
          startDate: '',
          endDate: '',
        })
        fetchProjects()
        // Navigate to the new project
        setSelectedProjectId(data.project.id)
        setViewType('detail')
      } else {
        throw new Error('Failed to create project')
      }
    } catch (error) {
      console.error('Failed to create project:', error)
      toast.error('Failed to create project')
    }
  }

  // Filter projects by search
  const filteredProjects = projects.filter(project => {
    const matchesSearch = !searchQuery || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'PLANNING': return 'bg-blue-100 text-blue-700'
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-700'
      case 'COMPLETED': return 'bg-muted text-muted-foreground'
      case 'CANCELLED': return 'bg-red-100 text-red-700'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  // Show project detail view
  if (viewType === 'detail' && selectedProjectId) {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background p-2 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setViewType('projects')
              setSelectedProjectId(null)
            }}
          >
            ← Back to Projects
          </Button>
        </div>
        <div className="flex-1">
          <ProjectDetailPage 
            projectId={selectedProjectId}
            spaceId={spaceId}
            onViewChange={(view) => {
              if (view === 'ontology') {
                setViewType('ontology')
              }
            }}
          />
        </div>
      </div>
    )
  }

  // Show ontology view
  if (viewType === 'ontology') {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b bg-background p-2 flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              setViewType(selectedProjectId ? 'detail' : 'projects')
            }}
          >
            ← Back
          </Button>
          <span className="text-sm text-muted-foreground">Project Ontology View</span>
        </div>
        <div className="flex-1">
          <OntologyGraphView 
            projectId={selectedProjectId || undefined}
            spaceId={spaceId}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <FolderKanban className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Projects</h1>
              <p className="text-muted-foreground">
                Manage your projects, resources, and deliverables
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setViewType('ontology')}
            >
              <Network className="h-4 w-4 mr-2" />
              View Ontology
            </Button>
            
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start a new project to organize your work
                  </DialogDescription>
                </DialogHeader>
                <DialogBody>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Project Name *</Label>
                      <Input
                        placeholder="Enter project name"
                        value={newProject.name}
                        onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Describe your project..."
                        value={newProject.description}
                        onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={newProject.startDate}
                          onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={newProject.endDate}
                          onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={newProject.status}
                        onValueChange={(v) => setNewProject({ ...newProject, status: v as ProjectStatus })}
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
                    </div>
                  </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateProject}>Create Project</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as ProjectStatus | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {PROJECT_STATUSES.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-6">
        {loading ? (
          <ProjectsGridSkeleton />
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first project to get started
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id}
                className="hover:border-primary/50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setViewType('detail')
                }}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{project.name}</CardTitle>
                        <Badge className={`${getStatusColor(project.status)} mt-1`}>
                          {PROJECT_STATUSES.find(s => s.value === project.status)?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description || 'No description'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Ticket className="h-3 w-3" />
                        {project._count?.tickets || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {project._count?.milestones || 0}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {project.creator && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.creator.avatar} />
                        <AvatarFallback>{project.creator.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground">{project.creator.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id}
                className="hover:border-primary/50 cursor-pointer transition-all"
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setViewType('detail')
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FolderKanban className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{project.name}</h3>
                          <Badge className={getStatusColor(project.status)}>
                            {PROJECT_STATUSES.find(s => s.value === project.status)?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Ticket className="h-4 w-4" />
                          {project._count?.tickets || 0} tickets
                        </span>
                        <span className="flex items-center gap-1">
                          <Flag className="h-4 w-4" />
                          {project._count?.milestones || 0} milestones
                        </span>
                      </div>
                      
                      {project.creator && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={project.creator.avatar} />
                            <AvatarFallback>{project.creator.name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span>{project.creator.name}</span>
                        </div>
                      )}
                      
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

function ProjectsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-4 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
