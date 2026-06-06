'use client'

import type { Dispatch, SetStateAction } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { ProjectStatusDefinition } from './project-config'
import { SearchableSelect } from './SearchableSelect'
import {
  ATTRIBUTE_FIELD_CLASS,
  ATTRIBUTE_GROUP_CLASS,
  ATTRIBUTE_INPUT_CLASS,
  NONE_SELECT_OPTION,
  PRIORITY_OPTIONS,
  SERVICE_DESK_TICKET_TYPE_OPTIONS,
} from './ticket-detail-helpers'
import type {
  ProjectChildOption,
  ProjectOption,
  TicketAttribute,
  TicketCustomField,
} from './ticket-detail-types'
import { TicketCustomFieldInput } from './TicketCustomFieldsPanel'

interface TicketDetailsSidebarProps {
  isNew: boolean
  editStatus: string
  setEditStatus: (value: string) => void
  projectStatuses: ProjectStatusDefinition[]
  editPriority: string
  setEditPriority: (value: string) => void
  editStartDate: string
  setEditStartDate: (value: string) => void
  editDueDate: string
  setEditDueDate: (value: string) => void
  editEstimate: string
  setEditEstimate: (value: string) => void
  ticketType: string
  setTicketType: (value: string) => void
  projects: ProjectOption[]
  modules: ProjectChildOption[]
  milestones: ProjectChildOption[]
  releases: ProjectChildOption[]
  selectedProject: string
  setSelectedProject: (value: string) => void
  selectedModule: string
  setSelectedModule: (value: string) => void
  selectedMilestone: string
  setSelectedMilestone: (value: string) => void
  selectedRelease: string
  setSelectedRelease: (value: string) => void
  customFields: TicketCustomField[]
  setCustomFields: Dispatch<SetStateAction<TicketCustomField[]>>
  applyProjectFieldDefinitions: (
    projectId: string,
    availableProjects: ProjectOption[],
    sourceAttributes?: TicketAttribute[]
  ) => void
}

export function TicketDetailsSidebar({
  isNew,
  editStatus,
  setEditStatus,
  projectStatuses,
  editPriority,
  setEditPriority,
  editStartDate,
  setEditStartDate,
  editDueDate,
  setEditDueDate,
  editEstimate,
  setEditEstimate,
  ticketType,
  setTicketType,
  projects,
  modules,
  milestones,
  releases,
  selectedProject,
  setSelectedProject,
  selectedModule,
  setSelectedModule,
  selectedMilestone,
  setSelectedMilestone,
  selectedRelease,
  setSelectedRelease,
  customFields,
  setCustomFields,
  applyProjectFieldDefinitions,
}: TicketDetailsSidebarProps) {
  const projectOptions = [
    NONE_SELECT_OPTION,
    ...projects.map((project) => ({ value: project.id, label: project.name })),
  ]
  const moduleOptions = [
    NONE_SELECT_OPTION,
    ...modules.map((module) => ({ value: module.id, label: module.name })),
  ]
  const milestoneOptions = [
    NONE_SELECT_OPTION,
    ...milestones.map((milestone) => ({ value: milestone.id, label: milestone.name })),
  ]
  const releaseOptions = [
    NONE_SELECT_OPTION,
    ...releases.map((release) => ({ value: release.id, label: release.name })),
  ]
  const projectFields = customFields.filter((field) => field.attributeType !== 'system')

  return (
    <div className="space-y-6 text-foreground dark:text-zinc-50">
      <div className={ATTRIBUTE_GROUP_CLASS}>
        <h3 className="text-sm font-medium">Details</h3>
        <div className="grid gap-3">
          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Status</Label>
            <SearchableSelect
              value={editStatus}
              onValueChange={setEditStatus}
              options={projectStatuses.map((status) => ({ value: status.value, label: status.label }))}
              placeholder="Select status"
              searchPlaceholder="Search statuses..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Priority</Label>
            <SearchableSelect
              value={editPriority}
              onValueChange={setEditPriority}
              options={PRIORITY_OPTIONS}
              placeholder="Select priority"
              searchPlaceholder="Search priorities..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(event) => setEditStartDate(event.target.value)}
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(event) => setEditDueDate(event.target.value)}
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
          </div>

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label>Estimate (hours)</Label>
            <Input
              type="number"
              min="0"
              step="0.5"
              placeholder="0"
              value={editEstimate}
              onChange={(event) => setEditEstimate(event.target.value)}
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          {!isNew && (
            <div className={ATTRIBUTE_FIELD_CLASS}>
              <Label htmlFor="ticketType">Ticket Type</Label>
              <SearchableSelect
                id="ticketType"
                value={ticketType}
                onValueChange={setTicketType}
                options={SERVICE_DESK_TICKET_TYPE_OPTIONS}
                placeholder="Select ticket type"
                searchPlaceholder="Search ticket types..."
                className={ATTRIBUTE_INPUT_CLASS}
              />
            </div>
          )}

          <div className={ATTRIBUTE_FIELD_CLASS}>
            <Label htmlFor={isNew ? 'project-create' : 'project'}>Project</Label>
            <SearchableSelect
              id={isNew ? 'project-create' : 'project'}
              value={selectedProject || '__none__'}
              onValueChange={(value) => {
                const nextProjectId = value === '__none__' ? '' : value
                setSelectedProject(nextProjectId)
                setSelectedModule('')
                setSelectedMilestone('')
                setSelectedRelease('')
                applyProjectFieldDefinitions(nextProjectId, projects)
              }}
              options={projectOptions}
              placeholder="Select project"
              searchPlaceholder="Search projects..."
              className={ATTRIBUTE_INPUT_CLASS}
            />
          </div>

          {selectedProject && (
            <>
              <div className={ATTRIBUTE_FIELD_CLASS}>
                <Label htmlFor={isNew ? 'module-create' : 'module'}>Module</Label>
                <SearchableSelect
                  id={isNew ? 'module-create' : 'module'}
                  value={selectedModule || '__none__'}
                  onValueChange={(value) => setSelectedModule(value === '__none__' ? '' : value)}
                  options={moduleOptions}
                  placeholder="Select module"
                  searchPlaceholder="Search modules..."
                  className={ATTRIBUTE_INPUT_CLASS}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                <div className={ATTRIBUTE_FIELD_CLASS}>
                  <Label htmlFor={isNew ? 'milestone-create' : 'milestone'}>Milestone</Label>
                  <SearchableSelect
                    id={isNew ? 'milestone-create' : 'milestone'}
                    value={selectedMilestone || '__none__'}
                    onValueChange={(value) => setSelectedMilestone(value === '__none__' ? '' : value)}
                    options={milestoneOptions}
                    placeholder="Select milestone"
                    searchPlaceholder="Search milestones..."
                    className={ATTRIBUTE_INPUT_CLASS}
                  />
                </div>

                <div className={ATTRIBUTE_FIELD_CLASS}>
                  <Label htmlFor={isNew ? 'release-create' : 'release'}>Release</Label>
                  <SearchableSelect
                    id={isNew ? 'release-create' : 'release'}
                    value={selectedRelease || '__none__'}
                    onValueChange={(value) => setSelectedRelease(value === '__none__' ? '' : value)}
                    options={releaseOptions}
                    placeholder="Select release"
                    searchPlaceholder="Search releases..."
                    className={ATTRIBUTE_INPUT_CLASS}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`${ATTRIBUTE_GROUP_CLASS} border-t border-border pt-5 dark:border-zinc-800`}>
        <h3 className="text-sm font-medium">Project attributes</h3>
        {!selectedProject ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            Select a project to load project attributes.
          </div>
        ) : projectFields.length === 0 ? (
          <div className="rounded-md border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
            This project has no configured attributes yet.
          </div>
        ) : (
          <div className="space-y-3">
            {projectFields.map((field) => {
              const index = customFields.findIndex((item) => item.name === field.name)
              return (
                <div key={field.name} className={ATTRIBUTE_FIELD_CLASS}>
                  <Label>{field.displayName}</Label>
                  <TicketCustomFieldInput
                    field={field}
                    index={index}
                    setCustomFields={setCustomFields}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
