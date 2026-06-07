'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TicketsList } from '@/features/plugin-adapters/project-management'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { DEFAULT_CARD_FIELDS, DEFAULT_PROJECT_STATUSES, normalizeProjectFields, normalizeProjectMetadata, normalizeProjectStatuses } from '@/components/project-management/project-config'
import { PROJECT_ICONS, ProjectIconPreview, ProjectWorkspaceDialog } from '@/components/project-management/ProjectWorkspaceDialog'
import {
  FolderKanban,
  MoreVertical,
  Pencil,
  Plus,
  Settings2,
  Ticket,
  Trash2,
} from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'

interface ProjectRecord {
  id: string
  name: string
  description?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  spaceId: string
  metadata?: Record<string, any> | null
  space?: {
    id: string
    name: string
    slug?: string
  }
  _count?: {
    tickets: number
    milestones: number
  }
}

const EMPTY_PROJECT_FORM = {
  name: '',
  description: '',
  status: 'PLANNING',
  startDate: '',
  endDate: '',
  icon: PROJECT_ICONS[0].value,
  thumbnailUrl: '',
}

export function ProjectsWorkspace({ projectId }: { projectId?: string }) {
  const router = useRouter()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSpaceId, setSelectedSpaceId] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)

  const fetchProjects = async (spaceId?: string) => {
    try {
      setLoading(true)
      const query = spaceId ? `?space_id=${encodeURIComponent(spaceId)}` : ''
      const response = await fetch(`/api/projects${query}`)
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      setProjects([])
      showError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects(selectedSpaceId || undefined)
  }, [selectedSpaceId])

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projectId, projects]
  )

  const resetProjectForm = () => {
    setProjectForm(EMPTY_PROJECT_FORM)
    setEditingProjectId(null)
  }

  const openCreateDialog = () => {
    resetProjectForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (project: ProjectRecord) => {
    const metadata = normalizeProjectMetadata(project.metadata)
    setEditingProjectId(project.id)
    setProjectForm({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
      icon: metadata.icon || PROJECT_ICONS[0].value,
      thumbnailUrl: metadata.thumbnailUrl || '',
    })
    setSelectedSpaceId(project.spaceId)
    setIsDialogOpen(true)
  }

  const handleThumbnailUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('image', file)

    try {
      setUploadingThumbnail(true)
      const response = await fetch('/api/upload/project-thumbnail', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      setProjectForm((prev) => ({ ...prev, thumbnailUrl: data.url || '' }))
      showSuccess('Thumbnail uploaded')
    } catch (error) {
      showError('Failed to upload thumbnail')
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const handleSaveProject = async () => {
    if (!projectForm.name.trim()) {
      showError('Project name is required')
      return
    }

    if (!selectedSpaceId) {
      showError('Please select a space')
      return
    }

    const existingProject = editingProjectId
      ? projects.find((project) => project.id === editingProjectId)
      : null
    const existingMetadata = normalizeProjectMetadata(existingProject?.metadata)
    const payload = {
      name: projectForm.name.trim(),
      description: projectForm.description.trim(),
      status: projectForm.status,
      startDate: projectForm.startDate || null,
      endDate: projectForm.endDate || null,
      spaceId: selectedSpaceId,
      metadata: {
        ...existingMetadata,
        icon: projectForm.icon,
        thumbnailUrl: projectForm.thumbnailUrl,
        customFields: normalizeProjectFields(existingMetadata.customFields),
        ticketConfig: {
          statuses: normalizeProjectStatuses(existingMetadata.ticketConfig?.statuses || DEFAULT_PROJECT_STATUSES),
          cardFields: {
            ...DEFAULT_CARD_FIELDS,
            ...(existingMetadata.ticketConfig?.cardFields || {}),
          },
        },
      },
    }

    try {
      setIsSaving(true)
      const response = await fetch(editingProjectId ? `/api/projects/${editingProjectId}` : '/api/projects', {
        method: editingProjectId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Failed to save project')
      }

      await fetchProjects(selectedSpaceId || undefined)
      setIsDialogOpen(false)
      showSuccess(editingProjectId ? 'Project updated' : 'Project created')
      resetProjectForm()
    } catch (error) {
      showError('Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Failed to delete project')
      }
      showSuccess('Project deleted')
      if (projectId === id) {
        router.push('/tools/projects')
      }
      fetchProjects(selectedSpaceId || undefined)
    } catch (error) {
      showError('Failed to delete project')
    }
  }

  if (projectId) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-border px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/tools/projects" className="hover:text-foreground">Projects</Link>
            <span>/</span>
            <span className="font-medium text-foreground">{selectedProject?.name || 'Tickets'}</span>
          </div>
        </div>
        <TicketsList
          spaceId={selectedProject?.spaceId || null}
          viewMode="kanban"
          showFilters={true}
          showSpaceSelector={true}
          projectId={projectId}
        />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col px-6 py-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <SpaceSelector
          value={selectedSpaceId || 'all'}
          onValueChange={setSelectedSpaceId}
          className="w-[240px]"
          showAllOption={true}
        />
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col rounded-md border-border shadow-sm">
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          <div className="grid grid-cols-[minmax(0,2fr)_140px_140px_180px_72px] border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <div>Project</div>
            <div>Tickets</div>
            <div>Status</div>
            <div>Space</div>
            <div className="text-right">Action</div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Loading projects...
              </div>
            ) : projects.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderKanban className="h-8 w-8" />
                </div>
                <div>
                  <div className="text-lg font-semibold">No projects yet</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Start with a project, then open its ticket workspace from the project list.
                  </div>
                </div>
                <Button onClick={openCreateDialog}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Project
                </Button>
              </div>
            ) : (
              projects.map((project) => {
                const metadata = normalizeProjectMetadata(project.metadata)
                return (
                  <div
                    key={project.id}
                    className="grid grid-cols-[minmax(0,2fr)_140px_140px_180px_72px] items-center border-b border-border px-6 py-4 last:border-b-0"
                  >
                    <Link href={`/tools/projects/${project.id}`} className="flex min-w-0 items-center gap-4">
                      {metadata.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <ProjectIconPreview icon={metadata.icon} thumbnailUrl={metadata.thumbnailUrl} className="h-12 w-12" />
                      ) : (
                        <ProjectIconPreview icon={metadata.icon} className="h-12 w-12" />
                      )}
                      <div className="min-w-0">
                        <div className="truncate text-base font-semibold">{project.name}</div>
                        <div className="line-clamp-2 text-sm text-muted-foreground">
                          {project.description || 'No description yet.'}
                        </div>
                      </div>
                    </Link>
                    <div className="text-sm">{project._count?.tickets || 0}</div>
                    <div className="text-sm text-muted-foreground">{project.status}</div>
                    <div className="truncate text-sm text-muted-foreground">{project.space?.name || 'Unknown space'}</div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-md">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/tools/projects/${project.id}`}>
                              <Ticket className="mr-2 h-4 w-4" />
                              Open Tickets
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(project)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/tools/projects/${project.id}`}>
                              <Settings2 className="mr-2 h-4 w-4" />
                              Manage Statuses & Attributes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <ProjectWorkspaceDialog
        open={isDialogOpen}
        editingProjectId={editingProjectId}
        projectForm={projectForm}
        selectedSpaceId={selectedSpaceId}
        uploadingThumbnail={uploadingThumbnail}
        isSaving={isSaving}
        onOpenChange={setIsDialogOpen}
        onProjectFormChange={setProjectForm}
        onSelectedSpaceChange={setSelectedSpaceId}
        onThumbnailUpload={handleThumbnailUpload}
        onSave={handleSaveProject}
        onCancel={() => {
          setIsDialogOpen(false)
          resetProjectForm()
        }}
      />
    </div>
  )
}
