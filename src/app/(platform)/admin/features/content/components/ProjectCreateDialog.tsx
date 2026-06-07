import type { Dispatch, SetStateAction } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { createFieldMachineName, type ProjectFieldDefinition, type ProjectForm } from './projectsManagementModel'

interface ProjectCreateDialogProps {
  activeSpaceId: string
  creating: boolean
  isOpen: boolean
  newFieldName: string
  newOptionDrafts: Record<string, string>
  projectFields: ProjectFieldDefinition[]
  projectForm: ProjectForm
  addFieldOption: (fieldName: string) => void
  handleCreateProject: () => void
  resetCreateState: () => void
  setIsOpen: (open: boolean) => void
  setNewFieldName: (value: string) => void
  setNewOptionDrafts: Dispatch<SetStateAction<Record<string, string>>>
  setProjectFields: Dispatch<SetStateAction<ProjectFieldDefinition[]>>
  setProjectForm: Dispatch<SetStateAction<ProjectForm>>
  setSelectedSpaceId: (value: string) => void
}

export function ProjectCreateDialog({
  activeSpaceId,
  creating,
  isOpen,
  newFieldName,
  newOptionDrafts,
  projectFields,
  projectForm,
  addFieldOption,
  handleCreateProject,
  resetCreateState,
  setIsOpen,
  setNewFieldName,
  setNewOptionDrafts,
  setProjectFields,
  setProjectForm,
  setSelectedSpaceId,
}: ProjectCreateDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
              setIsOpen(false)
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
  )
}
