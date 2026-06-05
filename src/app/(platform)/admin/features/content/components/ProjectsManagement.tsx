'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useSpace } from '@/contexts/space-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Grid3X3, KanbanSquare, LayoutList, Plus, FolderKanban, CalendarDays, Ticket, X } from 'lucide-react'
import { showError, showSuccess } from '@/lib/toast-utils'
import { cn } from '@/lib/utils'

interface ProjectFieldDefinition {
  name: string
  displayName: string
  type: string
  isRequired?: boolean
  options?: Array<{
    label: string
    value: string
  }>
}

interface ProjectRecord {
  id: string
  name: string
  description?: string | null
  status: string
  startDate?: string | null
  endDate?: string | null
  spaceId: string
  metadata?: {
    customFields?: ProjectFieldDefinition[]
  } | null
  space?: {
    id: string
    name: string
    slug: string
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
}

function createFieldMachineName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

export function ProjectsManagement() {
  const { currentSpace } = useSpace()
  const [projects, setProjects] = useState<ProjectRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('card')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedSpaceId, setSelectedSpaceId] = useState(currentSpace?.id || '')
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM)
  const [projectFields, setProjectFields] = useState<ProjectFieldDefinition[]>([])
  const [newFieldName, setNewFieldName] = useState('')
  const [newOptionDrafts, setNewOptionDrafts] = useState<Record<string, string>>({})
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (currentSpace?.id && !selectedSpaceId) {
      setSelectedSpaceId(currentSpace.id)
    }
  }, [currentSpace?.id, selectedSpaceId])

  const fetchProjects = async (spaceId?: string) => {
    setLoading(true)
    try {
      const query = spaceId ? `?space_id=${spaceId}` : ''
      const response = await fetch(`/api/projects${query}`)
      if (!response.ok) {
        throw new Error('Failed to load projects')
      }
      const data = await response.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error(error)
      showError('Failed to load projects')
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects(currentSpace?.id)
  }, [currentSpace?.id])

  const activeSpaceId = selectedSpaceId || currentSpace?.id || ''

  const totals = useMemo(() => {
    return projects.reduce(
      (acc, project) => {
        acc.projects += 1
        acc.tickets += project._count?.tickets || 0
        acc.milestones += project._count?.milestones || 0
        return acc
      },
      { projects: 0, tickets: 0, milestones: 0 }
    )
  }, [projects])

  const resetCreateState = () => {
    setProjectForm(EMPTY_PROJECT_FORM)
    setProjectFields([])
    setNewFieldName('')
    setNewOptionDrafts({})
  }

  const addFieldOption = (fieldName: string) => {
    const draft = (newOptionDrafts[fieldName] || '').trim()
    if (!draft) return

    setProjectFields((prev) =>
      prev.map((field) =>
        field.name === fieldName
          ? {
              ...field,
              options: [
                ...(field.options || []),
                {
                  label: draft,
                  value: draft,
                },
              ],
            }
          : field
      )
    )
    setNewOptionDrafts((prev) => ({ ...prev, [fieldName]: '' }))
  }

  const handleCreateProject = async () => {
    if (!projectForm.name.trim()) {
      showError('Project name is required')
      return
    }

    if (!activeSpaceId) {
      showError('Please select a space for the project')
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...projectForm,
          spaceId: activeSpaceId,
          metadata: {
            customFields: projectFields,
          },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create project')
      }

      showSuccess('Project created successfully')
      setIsCreateOpen(false)
      resetCreateState()
      fetchProjects(activeSpaceId)
    } catch (error) {
      console.error(error)
      showError('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border bg-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Project Management</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create projects from the card or grid list, configure project-level custom fields, and jump straight into each kanban board.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1">
              <Button variant={viewMode === 'card' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('card')}>
                <LayoutList className="mr-2 h-4 w-4" />
                Card
              </Button>
              <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')}>
                <Grid3X3 className="mr-2 h-4 w-4" />
                Grid
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchProjects(activeSpaceId || undefined)}
            >
              Refresh
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <FolderKanban className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-semibold">{totals.projects}</div>
                <div className="text-xs text-muted-foreground">Projects</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Ticket className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-semibold">{totals.tickets}</div>
                <div className="text-xs text-muted-foreground">Tickets</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-semibold">{totals.milestones}</div>
                <div className="text-xs text-muted-foreground">Milestones</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-16 text-center text-sm text-muted-foreground">Loading projects...</CardContent>
        </Card>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="text-lg font-semibold">No projects yet</div>
              <p className="text-sm text-muted-foreground">
                Create your first project from this view, then open its kanban board to manage tickets.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={cn(viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3' : 'space-y-4')}>
          {projects.map((project) => {
            const customFieldCount = project.metadata?.customFields?.length || 0
            const content = (
              <Card className="h-full border-border transition-shadow hover:shadow-md">
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="truncate text-lg">{project.name}</CardTitle>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {project.description || 'No description provided yet.'}
                      </p>
                    </div>
                    <Badge variant="secondary">{project.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="font-semibold">{project._count?.tickets || 0}</div>
                      <div className="text-xs text-muted-foreground">Tickets</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="font-semibold">{project._count?.milestones || 0}</div>
                      <div className="text-xs text-muted-foreground">Milestones</div>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <div className="font-semibold">{customFieldCount}</div>
                      <div className="text-xs text-muted-foreground">Project Fields</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{project.space?.name || 'Unknown space'}</span>
                    <span>•</span>
                    <span>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'No start date'}</span>
                    <span>•</span>
                    <span>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'No end date'}</span>
                  </div>

                  <div className="flex gap-2" onClick={(event) => event.stopPropagation()}>
                    <Button asChild className="flex-1">
                      <Link href={`/admin/projects/${project.id}/issues`}>
                        <KanbanSquare className="mr-2 h-4 w-4" />
                        Open Kanban Board
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/admin/projects/${project.id}`}>Overview</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )

            return (
              <div
                key={project.id}
                className={cn(viewMode === 'card' && 'cursor-pointer')}
                onClick={viewMode === 'card' ? () => { window.location.href = `/admin/projects/${project.id}/issues` } : undefined}
              >
                {content}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Create a project from this list view and define project-level custom fields that every ticket in the project will inherit.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={projectForm.name}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Billing platform migration"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  value={projectForm.description}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short summary of goals, scope, or team context"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Space</Label>
                <SpaceSelector
                  value={activeSpaceId}
                  onValueChange={setSelectedSpaceId}
                  className="w-full"
                  showAllOption={false}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={projectForm.status}
                  onValueChange={(value) => setProjectForm((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PLANNING">Planning</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_HOLD">On Hold</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={projectForm.startDate}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={projectForm.endDate}
                  onChange={(event) => setProjectForm((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border border-border p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <Label>Project-Level Custom Fields</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    These field definitions are stored on the project and applied to every ticket inside the project.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newFieldName}
                    onChange={(event) => setNewFieldName(event.target.value)}
                    placeholder="Field name"
                    className="w-48"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const trimmed = newFieldName.trim()
                      if (!trimmed) return
                      setProjectFields((prev) => [
                        ...prev,
                        {
                          name: createFieldMachineName(trimmed) || `field_${prev.length + 1}`,
                          displayName: trimmed,
                          type: 'TEXT',
                        },
                      ])
                      setNewFieldName('')
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Field
                  </Button>
                </div>
              </div>

              {projectFields.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  No project-level custom fields yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {projectFields.map((field, index) => (
                    <div key={`${field.name}-${index}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px_44px]">
                      <Input
                        value={field.displayName}
                        onChange={(event) =>
                          setProjectFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    displayName: event.target.value,
                                    name: createFieldMachineName(event.target.value) || item.name,
                                  }
                                : item
                            )
                          )
                        }
                        placeholder="Display name"
                      />
                      <Input
                        value={field.name}
                        onChange={(event) =>
                          setProjectFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index ? { ...item, name: createFieldMachineName(event.target.value) } : item
                            )
                          )
                        }
                        placeholder="machine_name"
                      />
                      <Select
                        value={field.type}
                        onValueChange={(value) =>
                          setProjectFields((prev) =>
                            prev.map((item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    type: value,
                                  }
                                : item
                            )
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TEXT">Text</SelectItem>
                          <SelectItem value="NUMBER">Number</SelectItem>
                          <SelectItem value="DATE">Date</SelectItem>
                          <SelectItem value="SELECT">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setProjectFields((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                        aria-label={`Remove ${field.displayName}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {field.type === 'SELECT' && (
                        <div className="space-y-2 rounded-xl bg-muted/30 p-3 md:col-span-4">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <Label className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              Dropdown Options
                            </Label>
                            <div className="flex gap-2">
                              <Input
                                value={newOptionDrafts[field.name] || ''}
                                onChange={(event) =>
                                  setNewOptionDrafts((prev) => ({ ...prev, [field.name]: event.target.value }))
                                }
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault()
                                    addFieldOption(field.name)
                                  }
                                }}
                                placeholder="New option"
                                className="h-8 w-40"
                              />
                              <Button type="button" size="sm" variant="outline" onClick={() => addFieldOption(field.name)}>
                                Add
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(field.options || []).length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                Add options so tickets can show a selectable dropdown.
                              </span>
                            ) : (
                              field.options?.map((option) => (
                                <span
                                  key={`${field.name}-${option.value}`}
                                  className="inline-flex items-center gap-2 rounded-md bg-background px-3 py-1 text-xs"
                                >
                                  {option.label}
                                  <button
                                    type="button"
                                    aria-label={`Remove ${option.label}`}
                                    onClick={() =>
                                      setProjectFields((prev) =>
                                        prev.map((item) =>
                                          item.name === field.name
                                            ? {
                                                ...item,
                                                options: (item.options || []).filter(
                                                  (candidate) => candidate.value !== option.value
                                                ),
                                              }
                                            : item
                                        )
                                      )
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false)
                resetCreateState()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={creating}>
              {creating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
