// @ts-nocheck
'use client'

import { Dialog, DialogContent, DialogBody, DialogFooter, DialogHeader } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Clock, MessageSquare, Paperclip, ListChecks, GitBranch, ExternalLink, Network, AlignLeft } from 'lucide-react'
import { RichMarkdownEditor } from '@/components/knowledge-base/RichMarkdownEditor'
import { buildTicketSavePayload } from './ticket-detail-mappers'
import { showInfo } from '@/lib/toast-utils'
import { SearchableSelect } from './SearchableSelect'
import { TicketCustomFieldsPanel } from './TicketCustomFieldsPanel'
import { TicketFooterActions } from './TicketFooterActions'
import { TicketDetailsSidebar } from './TicketDetailsSidebar'
import { TicketServiceDeskTab } from './TicketServiceDeskTab'
import { AttachmentsTab, CommentsTab, DependenciesTab, RelationshipsTab, SubtasksTab, TimeTab } from './ticket-detail-activity-tabs'

export function TicketDetailModalEnhancedView(props: any) {
  const { ticket, open, onOpenChange, onSave, onDelete, displayMode, editTitle, setEditTitle, editDescription, setEditDescription, normalizedDescription, editStatus, setEditStatus, editPriority, setEditPriority, editDueDate, setEditDueDate, editStartDate, setEditStartDate, editEstimate, setEditEstimate, customFields, setCustomFields, activeTab, setActiveTab, comments, attachments, subtasks, dependencies, timeLogs, newComment, setNewComment, newSubtask, setNewSubtask, newTimeLog, setNewTimeLog, serviceDeskConfig, serviceDeskRequestId, serviceDeskComments, serviceDeskAttachments, serviceDeskTimeLogs, syncingFromServiceDesk, newServiceDeskComment, setNewServiceDeskComment, newServiceDeskResolution, setNewServiceDeskResolution, newServiceDeskTimeLog, setNewServiceDeskTimeLog, newServiceDeskLink, setNewServiceDeskLink, updatingServiceDesk, deletingServiceDesk, pushingToServiceDesk, gitLabConfig, gitLabIssueUrl, gitLabRepositories, selectedRepository, setSelectedRepository, loadingRepositories, pushingToGitLab, projects, selectedProject, setSelectedProject, projectStatuses, modules, setSelectedModule, selectedModule, milestones, setSelectedMilestone, selectedMilestone, releases, setSelectedRelease, selectedRelease, applyProjectFieldDefinitions, handlePushToServiceDesk, handlePushToGitLab, handleAddComment, handleUploadAttachment, handleAddSubtask, handleToggleSubtaskStatus, handleAddTimeLog, handleUpdateServiceDeskTicket, handleSyncFromServiceDesk, handleDeleteServiceDeskTicket, handleAddServiceDeskComment, handleUploadServiceDeskAttachment, handleLogServiceDeskTime, handleSetServiceDeskResolution, handleLinkServiceDeskTickets } = props

  if (!ticket) return null

  const isNew = !ticket.id
  const isDrawer = displayMode === 'drawer'
  const ticketAssignees = ticket.assignees || []
  const totalHours = timeLogs.reduce((sum, log) => sum + Number(log.hours), 0)

  const handleSave = async () => {
    onSave?.(buildTicketSavePayload(ticket, {
      title: editTitle,
      description: normalizedDescription,
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate,
      startDate: editStartDate,
      estimate: editEstimate,
      projectId: selectedProject,
      moduleId: selectedModule,
      milestoneId: selectedMilestone,
      releaseId: selectedRelease,
      ticketType,
      customFields,
    }))
  }

  // Common header content
  const headerContent = (
      <div className="space-y-2">
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Ticket title"
          className="h-11 rounded-md border-transparent bg-transparent px-0 text-xl font-semibold tracking-tight text-foreground shadow-none focus-visible:ring-0 dark:text-zinc-50"
        />
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="rounded-md">{isNew ? 'New ticket' : ticket.id.slice(0, 8)}</Badge>
        <span>{projectStatuses.find((status) => status.value === editStatus)?.label || editStatus}</span>
        <span>{editPriority}</span>
        {selectedProject && <span>{projects.find((project) => project.id === selectedProject)?.name}</span>}
      </div>
    </div>
  )

  const ticketDetailsFields = (
    <div className="space-y-5 text-foreground dark:text-zinc-50">
      <div className="min-h-[220px]">
        <RichMarkdownEditor
          content={editDescription}
          onChange={setEditDescription}
          placeholder='Add description, or type "/" for tools...'
          editable
          showToolbar={false}
          className="bg-transparent text-foreground dark:text-zinc-50 [&_.ProseMirror]:min-h-[220px] [&_.ProseMirror]:p-0 [&_.ProseMirror]:text-foreground dark:[&_.ProseMirror]:text-zinc-50 [&_.ProseMirror_p]:my-2"
        />
      </div>

      {!isNew && ticketAssignees.length > 0 && (
        <div>
          <Label>Assignees</Label>
          <div className="mt-2 flex gap-2">
            {ticketAssignees.map((assignee) => (
              <Avatar key={assignee.user.id} className="h-8 w-8">
                <AvatarImage src={assignee.user.avatar || undefined} />
                <AvatarFallback>
                  {assignee.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const detailsLayout = (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        {ticketDetailsFields}
      </div>
      <div className="min-w-0 xl:sticky xl:top-0 xl:self-start">
        <TicketDetailsSidebar
          isNew={isNew}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          projectStatuses={projectStatuses}
          editPriority={editPriority}
          setEditPriority={setEditPriority}
          editStartDate={editStartDate}
          setEditStartDate={setEditStartDate}
          editDueDate={editDueDate}
          setEditDueDate={setEditDueDate}
          editEstimate={editEstimate}
          setEditEstimate={setEditEstimate}
          ticketType={ticketType}
          setTicketType={setTicketType}
          projects={projects}
          modules={modules}
          milestones={milestones}
          releases={releases}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          selectedModule={selectedModule}
          setSelectedModule={setSelectedModule}
          selectedMilestone={selectedMilestone}
          setSelectedMilestone={setSelectedMilestone}
          selectedRelease={selectedRelease}
          setSelectedRelease={setSelectedRelease}
          customFields={customFields}
          setCustomFields={setCustomFields}
          applyProjectFieldDefinitions={applyProjectFieldDefinitions}
        />
      </div>
    </div>
  )

  const createTicketBodyContent = (
    <div className="flex-1 overflow-y-auto">
      <div className="pb-2">
        {detailsLayout}
      </div>
    </div>
  )

  // Common footer
  const footerContent = (
    <div className="flex flex-col items-end gap-3 border-t pt-4">
      <TicketFooterActions
        isNew={isNew}
        ticketId={ticket.id}
        serviceDeskConfig={serviceDeskConfig}
        pushingToServiceDesk={pushingToServiceDesk}
        onPushToServiceDesk={handlePushToServiceDesk}
        gitLabConfig={gitLabConfig}
        gitLabIssueUrl={gitLabIssueUrl}
        gitLabRepositories={gitLabRepositories}
        selectedRepository={selectedRepository}
        onSelectedRepositoryChange={setSelectedRepository}
        loadingRepositories={loadingRepositories}
        pushingToGitLab={pushingToGitLab}
        onPushToGitLab={handlePushToGitLab}
        onDelete={onDelete}
      />
      <div className="flex justify-end">
        <Button onClick={handleSave} className="min-w-[160px]">
          {isNew ? 'Create Ticket' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )

  // Body content — simple form for new, full tabs for existing
  const bodyContent = (
    <div className="flex-1 overflow-y-auto text-foreground dark:text-zinc-50">
      {isNew ? (
        // Simple create form — same fields, no inapplicable tabs
        <div className="space-y-4">
          <div>
            <Label>Ticket Description</Label>
            <div className="mt-2 overflow-hidden rounded-xl border border-border">
              <RichMarkdownEditor
                content={editDescription}
                onChange={setEditDescription}
                placeholder="Describe the ticket inline..."
                editable
                showToolbar
                className="min-h-[220px] bg-background"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={editPriority} onValueChange={setEditPriority}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Start Date</Label>
              <Input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Estimate (hours)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0"
                value={editEstimate}
                onChange={(e) => setEditEstimate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="project-create">Project</Label>
              <Select
                value={selectedProject || '__none__'}
                onValueChange={(value) => {
                  const nextProjectId = value === '__none__' ? '' : value
                  setSelectedProject(nextProjectId)
                  setSelectedModule('')
                  setSelectedMilestone('')
                  setSelectedRelease('')
                  applyProjectFieldDefinitions(nextProjectId, projects)
                }}
              >
                <SelectTrigger className="mt-1" id="project-create">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedProject && (
              <div>
                <Label htmlFor="module-create">Module</Label>
                <Select value={selectedModule || '__none__'} onValueChange={(value) => setSelectedModule(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="module-create">
                    <SelectValue placeholder="Select module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {modules.map((module) => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {selectedProject && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="milestone-create">Milestone</Label>
                <Select value={selectedMilestone || '__none__'} onValueChange={(value) => setSelectedMilestone(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="milestone-create">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {milestones.map((milestone) => (
                      <SelectItem key={milestone.id} value={milestone.id}>
                        {milestone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="release-create">Release</Label>
                <Select value={selectedRelease || '__none__'} onValueChange={(value) => setSelectedRelease(value === '__none__' ? '' : value)}>
                  <SelectTrigger className="mt-1" id="release-create">
                    <SelectValue placeholder="Select release" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {releases.map((release) => (
                      <SelectItem key={release.id} value={release.id}>
                        {release.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <TicketCustomFieldsPanel
            customFields={customFields}
            selectedProject={selectedProject}
            setCustomFields={setCustomFields}
          />
        </div>
      ) : (
        <div className="grid min-h-0 grid-cols-[48px_minmax(0,1fr)] gap-4">
          <div className="flex flex-col items-center gap-2 border-r border-border pr-2">
            {[
              { value: 'details', label: 'Details', icon: AlignLeft },
              { value: 'comments', label: `Comments ${comments.length > 0 ? comments.length : ''}`.trim(), icon: MessageSquare },
              { value: 'attachments', label: `Files ${attachments.length > 0 ? attachments.length : ''}`.trim(), icon: Paperclip },
              { value: 'subtasks', label: `Subtasks ${subtasks.length > 0 ? subtasks.length : ''}`.trim(), icon: ListChecks },
              { value: 'dependencies', label: 'Dependencies', icon: GitBranch },
              { value: 'relationships', label: 'Relationships', icon: Network },
              { value: 'time', label: `Time ${totalHours > 0 ? `${totalHours.toFixed(1)}h` : ''}`.trim(), icon: Clock },
              ...(serviceDeskConfig?.isConfigured ? [{ value: 'servicedesk', label: 'ServiceDesk', icon: ExternalLink }] : []),
            ].map((item) => {
              const Icon = item.icon
              return (
                <Button
                  key={item.value}
                  type="button"
                  variant={activeTab === item.value ? 'secondary' : 'ghost'}
                  size="icon"
                  title={item.label}
                  aria-label={item.label}
                  onClick={() => setActiveTab(item.value)}
                  className="h-9 w-9 rounded-md"
                >
                  <Icon className="h-4 w-4" />
                </Button>
              )
            })}
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
          <TabsList className="sr-only">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">
              Comments {comments.length > 0 && `(${comments.length})`}
            </TabsTrigger>
            <TabsTrigger value="attachments">
              Files {attachments.length > 0 && `(${attachments.length})`}
            </TabsTrigger>
            <TabsTrigger value="subtasks">
              Subtasks {subtasks.length > 0 && `(${subtasks.length})`}
            </TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="relationships">
              <Network className="h-4 w-4 mr-1" />
              Relationships
            </TabsTrigger>
            <TabsTrigger value="time">
              Time {totalHours > 0 && `(${totalHours.toFixed(1)}h)`}
            </TabsTrigger>
            {serviceDeskConfig?.isConfigured && (
              <TabsTrigger value="servicedesk">
                ServiceDesk {serviceDeskRequestId && `(${serviceDeskRequestId})`}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="details" className="mt-0">
            {detailsLayout}
          </TabsContent>

          <CommentsTab
            comments={comments}
            newComment={newComment}
            setNewComment={setNewComment}
            onAddComment={handleAddComment}
          />

          <AttachmentsTab
            attachments={attachments}
            onUploadAttachment={handleUploadAttachment}
          />

          <SubtasksTab
            subtasks={subtasks}
            newSubtask={newSubtask}
            setNewSubtask={setNewSubtask}
            onAddSubtask={handleAddSubtask}
            onToggleSubtaskStatus={handleToggleSubtaskStatus}
          />

          <DependenciesTab dependencies={dependencies} />

          <RelationshipsTab
            ticketId={ticket.id}
            onAddRelationship={() => showInfo('Feature to add relationships coming soon')}
            onViewTicket={() => showInfo('Feature to view related tickets coming soon')}
          />

          <TimeTab
            ticket={ticket}
            timeLogs={timeLogs}
            totalHours={totalHours}
            newTimeLog={newTimeLog}
            setNewTimeLog={setNewTimeLog}
            onAddTimeLog={handleAddTimeLog}
          />

          {serviceDeskConfig?.isConfigured && (
            <TicketServiceDeskTab
              ticket={ticket}
              serviceDeskRequestId={serviceDeskRequestId}
              serviceDeskComments={serviceDeskComments}
              serviceDeskAttachments={serviceDeskAttachments}
              serviceDeskTimeLogs={serviceDeskTimeLogs}
              syncingFromServiceDesk={syncingFromServiceDesk}
              updatingServiceDesk={updatingServiceDesk}
              deletingServiceDesk={deletingServiceDesk}
              pushingToServiceDesk={pushingToServiceDesk}
              newServiceDeskComment={newServiceDeskComment}
              setNewServiceDeskComment={setNewServiceDeskComment}
              newServiceDeskResolution={newServiceDeskResolution}
              setNewServiceDeskResolution={setNewServiceDeskResolution}
              newServiceDeskTimeLog={newServiceDeskTimeLog}
              setNewServiceDeskTimeLog={setNewServiceDeskTimeLog}
              newServiceDeskLink={newServiceDeskLink}
              setNewServiceDeskLink={setNewServiceDeskLink}
              onUpdateServiceDeskTicket={handleUpdateServiceDeskTicket}
              onSyncFromServiceDesk={handleSyncFromServiceDesk}
              onDeleteServiceDeskTicket={handleDeleteServiceDeskTicket}
              onAddServiceDeskComment={handleAddServiceDeskComment}
              onUploadServiceDeskAttachment={handleUploadServiceDeskAttachment}
              onLogServiceDeskTime={handleLogServiceDeskTime}
              onSetServiceDeskResolution={handleSetServiceDeskResolution}
              onLinkServiceDeskTickets={handleLinkServiceDeskTickets}
              onPushToServiceDesk={handlePushToServiceDesk}
            />
          )}
        </Tabs>
        </div>
        )}
      </div>
    )

  if (isDrawer) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[96vw] sm:max-w-[1100px] overflow-y-auto flex flex-col gap-0 bg-background p-0 text-foreground dark:bg-zinc-950 dark:text-zinc-50">
          <SheetHeader className="px-6 py-4 border-b">
            <SheetTitle className="sr-only">Ticket</SheetTitle>
            {headerContent}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isNew ? createTicketBodyContent : bodyContent}
          </div>
          <div className="px-6 py-4 border-t">
            {footerContent}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col bg-background text-foreground dark:bg-zinc-950 dark:text-zinc-50">
        <DialogHeader className="flex-shrink-0">
          {headerContent}
        </DialogHeader>
        <DialogBody className="flex-1 overflow-y-auto min-h-0 pt-0">
          {isNew ? createTicketBodyContent : bodyContent}
        </DialogBody>
        <DialogFooter className="flex-shrink-0 mt-0 pt-0 border-t-0">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}





