'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import {
  Blocks,
  BriefcaseBusiness,
  Building2,
  FolderKanban,
  ImagePlus,
  Layers3,
  Sparkles,
} from 'lucide-react'

export const PROJECT_ICONS = [
  { value: 'folder-kanban', label: 'Project', Icon: FolderKanban },
  { value: 'briefcase', label: 'Work', Icon: BriefcaseBusiness },
  { value: 'building', label: 'Business', Icon: Building2 },
  { value: 'layers', label: 'Platform', Icon: Layers3 },
  { value: 'blocks', label: 'Modules', Icon: Blocks },
  { value: 'sparkles', label: 'Initiative', Icon: Sparkles },
]

export interface ProjectFormState {
  name: string
  description: string
  status: string
  startDate: string
  endDate: string
  icon: string
  thumbnailUrl: string
}

export function ProjectIconPreview({
  icon,
  thumbnailUrl,
  className = 'h-10 w-10',
}: {
  icon?: string
  thumbnailUrl?: string
  className?: string
}) {
  const iconDefinition = PROJECT_ICONS.find((item) => item.value === icon) || PROJECT_ICONS[0]
  const Icon = iconDefinition.Icon

  if (thumbnailUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={thumbnailUrl} alt="" className={`${className} rounded-md object-cover`} />
    )
  }

  return (
    <div className={`${className} flex items-center justify-center rounded-md bg-primary/10 text-primary`}>
      <Icon className="h-5 w-5" />
    </div>
  )
}

interface ProjectWorkspaceDialogProps {
  open: boolean
  editingProjectId: string | null
  projectForm: ProjectFormState
  selectedSpaceId: string
  uploadingThumbnail: boolean
  isSaving: boolean
  onOpenChange: (open: boolean) => void
  onProjectFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void
  onSelectedSpaceChange: (spaceId: string) => void
  onThumbnailUpload: (file: File) => void
  onSave: () => void
  onCancel: () => void
}

export function ProjectWorkspaceDialog({
  open,
  editingProjectId,
  projectForm,
  selectedSpaceId,
  uploadingThumbnail,
  isSaving,
  onOpenChange,
  onProjectFormChange,
  onSelectedSpaceChange,
  onThumbnailUpload,
  onSave,
  onCancel,
}: ProjectWorkspaceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="space-y-1.5">
            <DialogTitle>{editingProjectId ? 'Edit Project' : 'Create Project'}</DialogTitle>
            <DialogDescription>
              Add the project basics here. Statuses, card fields, and custom attributes can be managed from the ticket workspace.
            </DialogDescription>
          </div>
        </DialogHeader>
        <DialogBody className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Project Name</Label>
              <div className="flex items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="icon" className="h-10 w-10 rounded-md">
                      <ProjectIconPreview icon={projectForm.icon} thumbnailUrl={projectForm.thumbnailUrl} className="h-8 w-8" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[320px] space-y-4">
                    <div className="space-y-3">
                      <Label>Project Icon</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {PROJECT_ICONS.map(({ value, label, Icon }) => (
                          <Button
                            key={value}
                            type="button"
                            variant={projectForm.icon === value ? 'default' : 'outline'}
                            className="h-12 rounded-md"
                            title={label}
                            onClick={() => onProjectFormChange((prev) => ({ ...prev, icon: value }))}
                          >
                            <Icon className="h-5 w-5" />
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <Label>Thumbnail</Label>
                      {projectForm.thumbnailUrl ? (
                        <ProjectIconPreview icon={projectForm.icon} thumbnailUrl={projectForm.thumbnailUrl} className="h-28 w-full" />
                      ) : (
                        <div className="flex h-28 items-center justify-center rounded-md bg-muted/50 text-sm text-muted-foreground">
                          No thumbnail uploaded
                        </div>
                      )}
                      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                        <ImagePlus className="h-4 w-4" />
                        {uploadingThumbnail ? 'Uploading...' : 'Upload Thumbnail'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            if (file) {
                              onThumbnailUpload(file)
                            }
                          }}
                        />
                      </label>
                    </div>
                  </PopoverContent>
                </Popover>
                <Input
                  value={projectForm.name}
                  onChange={(event) => onProjectFormChange((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Billing platform migration"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={projectForm.description}
                onChange={(event) => onProjectFormChange((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                placeholder="Short project summary"
              />
            </div>

            <div className="space-y-2">
              <Label>Space</Label>
              <SpaceSelector
                value={selectedSpaceId}
                onValueChange={onSelectedSpaceChange}
                className="w-full"
                showAllOption={false}
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={projectForm.status}
                onValueChange={(value) => onProjectFormChange((prev) => ({ ...prev, status: value }))}
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
                onChange={(event) => onProjectFormChange((prev) => ({ ...prev, startDate: event.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={projectForm.endDate}
                onChange={(event) => onProjectFormChange((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
          </div>
        </DialogBody>
        <DialogFooter className="justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : editingProjectId ? 'Save Project' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
