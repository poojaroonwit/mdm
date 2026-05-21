'use client'

import { useState } from 'react'
import { useTickets } from '../hooks/useTickets'
import { useTicketsWithTimeLogs } from '../hooks/useTicketsWithTimeLogs'
import { useTicketActions } from '../hooks/useTicketActions'
import { useTimeLogActions } from '../hooks/useTimeLogActions'
import { TicketsListProps, TicketFilters } from '../types'
import {
  ConfigurableKanbanBoard,
  KanbanConfig,
  KanbanStatusStyle,
} from '@/components/project-management/ConfigurableKanbanBoard'
import { TicketDetailModalEnhanced } from '@/components/project-management/TicketDetailModalEnhanced'
import { TimesheetView } from '@/components/project-management/TimesheetView'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogBody,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import {
  Plus,
  X,
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import { cn } from '@/lib/utils'

const DEFAULT_STATUS_STYLES: Record<string, KanbanStatusStyle> = {
  BACKLOG: { label: 'Backlog', accent: '#64748b', tone: 'bg-slate-100 text-slate-700', track: 'bg-slate-50' },
  TODO: { label: 'To Do', accent: '#2563eb', tone: 'bg-blue-100 text-blue-700', track: 'bg-blue-50' },
  IN_PROGRESS: { label: 'In Progress', accent: '#f97316', tone: 'bg-orange-100 text-orange-700', track: 'bg-orange-50' },
  IN_REVIEW: { label: 'In Review', accent: '#7c3aed', tone: 'bg-violet-100 text-violet-700', track: 'bg-violet-50' },
  DONE: { label: 'Done', accent: '#16a34a', tone: 'bg-emerald-100 text-emerald-700', track: 'bg-emerald-50' },
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function dayDiff(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

function ProjectGanttView({
  tickets,
  statusStyles,
  onTicketClick,
}: {
  tickets: any[]
  statusStyles: Record<string, KanbanStatusStyle>
  onTicketClick: (ticket: any) => void
}) {
  const preparedTickets = tickets.map((ticket) => {
    const start = ticket.startDate ? new Date(ticket.startDate) : ticket.createdAt ? new Date(ticket.createdAt) : new Date()
    const rawEnd = ticket.dueDate ? new Date(ticket.dueDate) : addDays(start, 2)
    const end = rawEnd < start ? start : rawEnd
    return { ...ticket, _start: start, _end: end }
  })

  const startRange = preparedTickets.length
    ? new Date(Math.min(...preparedTickets.map((ticket) => ticket._start.getTime())))
    : new Date()
  const endRange = preparedTickets.length
    ? new Date(Math.max(...preparedTickets.map((ticket) => ticket._end.getTime())))
    : addDays(startRange, 6)
  const totalDays = Math.max(7, dayDiff(startRange, endRange) + 1)
  const days = Array.from({ length: totalDays }, (_, index) => addDays(startRange, index))

  return (
    <div className="overflow-auto border border-border bg-background">
      <div className="grid min-w-[1120px]" style={{ gridTemplateColumns: `320px repeat(${days.length}, minmax(44px, 1fr))` }}>
        <div className="sticky left-0 z-20 border-b border-r border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ticket Timeline
        </div>
        {days.map((day) => (
          <div key={day.toISOString()} className="border-b border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
            <div className="font-semibold">{day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
            <div>{day.toLocaleDateString(undefined, { weekday: 'short' })}</div>
          </div>
        ))}

        {preparedTickets.map((ticket) => {
          const startOffset = dayDiff(startRange, ticket._start)
          const span = Math.max(1, dayDiff(ticket._start, ticket._end) + 1)
          const meta = statusStyles[ticket.status] || DEFAULT_STATUS_STYLES.TODO

          return (
            <div key={ticket.id} className="contents">
              <div className="sticky left-0 z-10 flex min-h-[74px] flex-col justify-center border-b border-r border-border bg-background px-4">
                <button className="min-w-0 text-left" onClick={() => onTicketClick(ticket)}>
                  <div className="truncate text-sm font-semibold">{ticket.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn('rounded-full px-2 py-0.5', meta.tone)}>{meta.label}</span>
                    <span>{ticket._start.toLocaleDateString()} - {ticket._end.toLocaleDateString()}</span>
                  </div>
                </button>
              </div>
              {days.map((day, index) => (
                <div key={`${ticket.id}-${day.toISOString()}`} className="relative min-h-[74px] border-b border-border">
                  {index === startOffset && (
                    <button
                      onClick={() => onTicketClick(ticket)}
                      className="absolute inset-y-3 left-1 rounded-md px-3 text-left text-xs font-medium text-white"
                      style={{
                        backgroundColor: meta.accent,
                        width: `calc(${span * 100}% - 8px)`,
                      }}
                    >
                      <span className="line-clamp-2 block">{ticket.title}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TicketsList({
  spaceId = null,
  viewMode = 'kanban',
  showFilters = true,
  showSpaceSelector = false,
  projectId,
  cycleId,
}: TicketsListProps) {
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(spaceId || currentSpace?.id || 'all')
  const [filters, setFilters] = useState<TicketFilters>({})
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useState<'kanban' | 'list' | 'timesheet' | 'gantt'>(
    viewMode === 'timesheet' ? 'timesheet' : viewMode === 'list' ? 'list' : 'kanban'
  )
  const [kanbanConfig, setKanbanConfig] = useState<KanbanConfig>({
    rows: undefined,
    columns: 'status',
    ticketDisplayMode: 'modal',
    cardFields: {
      description: true,
      dueDate: true,
      estimate: true,
      assignee: true,
      labels: true,
      spaces: true,
      attributes: true,
    },
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<KanbanConfig>(kanbanConfig)
  const [isManagementOpen, setIsManagementOpen] = useState(false)
  const [statusStyles, setStatusStyles] = useState<Record<string, KanbanStatusStyle>>(DEFAULT_STATUS_STYLES)
  const [customFieldTemplates, setCustomFieldTemplates] = useState<Array<{ name: string; displayName: string; type: string }>>([])
  const [newTemplateName, setNewTemplateName] = useState('')

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const openConfig = () => {
    setLocalConfig(kanbanConfig)
    setIsConfigOpen(true)
  }

  const handleConfigSave = () => {
    setKanbanConfig(localConfig)
    setIsConfigOpen(false)
  }

  const ticketsWithTimeLogsResult = useTicketsWithTimeLogs({
    spaceId: effectiveSpaceId,
    filters: { ...filters, projectId, cycleId },
    includeTimeLogs: view === 'timesheet',
    autoFetch: view === 'timesheet',
  })

  const regularTicketsResult = useTickets({
    spaceId: effectiveSpaceId,
    filters: { ...filters, projectId, cycleId },
    autoFetch: view !== 'timesheet',
  })

  const ticketsData = view === 'timesheet' ? ticketsWithTimeLogsResult : regularTicketsResult
  const { tickets, loading, refetch } = ticketsData

  const { createTicket, updateTicket, deleteTicket, moveTicket } = useTicketActions()
  const { addTimeLog, deleteTimeLog } = useTimeLogActions()

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket)
    setIsModalOpen(true)
  }

  const handleAddTicket = async (status: string) => {
    const effectiveSpace = effectiveSpaceId || currentSpace?.id
    if (!effectiveSpace) {
      alert('Please select a space to create a ticket')
      return
    }

    setSelectedTicket({
      title: '',
      description: '',
      status,
      priority: 'MEDIUM',
      attributes: customFieldTemplates.map((field, index) => ({
        name: field.name,
        displayName: field.displayName,
        type: field.type,
        value: '',
        sortOrder: index,
      })),
    })
    setIsModalOpen(true)
  }

  const handleSaveTicket = async (ticketData: any) => {
    const isNew = !ticketData.id
    const effectiveSpace = effectiveSpaceId || currentSpace?.id

    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      status: ticketData.status,
      priority: ticketData.priority,
      dueDate: ticketData.dueDate,
      startDate: ticketData.startDate,
      estimate: ticketData.estimate,
      labels: ticketData.labels || [],
      spaceId: effectiveSpace,
      assignedTo: ticketData.assignee?.id ? [ticketData.assignee.id] : [],
      attributes: ticketData.attributes || [],
      projectId: ticketData.projectId || null,
      moduleId: ticketData.moduleId || null,
      milestoneId: ticketData.milestoneId || null,
      releaseId: ticketData.releaseId || null,
    }

    if (isNew) {
      await createTicket(payload as any)
    } else {
      await updateTicket(ticketData.id, payload as any)
    }

    setIsModalOpen(false)
    setSelectedTicket(null)
    refetch()
  }

  const handleDeleteTicket = async (ticketId: string) => {
    if (confirm('Are you sure you want to delete this ticket?')) {
      await deleteTicket(ticketId)
      setIsModalOpen(false)
      setSelectedTicket(null)
      refetch()
    }
  }

  const handleTicketMove = async (ticketId: string, newStatus: string) => {
    await moveTicket(ticketId, newStatus)
    refetch()
  }

  const handleAddTimeLog = async (ticketId: string, hours: number, description: string, loggedAt: Date) => {
    const result = await addTimeLog(ticketId, { hours, description, loggedAt })
    if (result) refetch()
  }

  const handleDeleteTimeLog = async (ticketId: string, timeLogId: string) => {
    const success = await deleteTimeLog(ticketId, timeLogId)
    if (success) refetch()
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      ticket.title?.toLowerCase().includes(query) ||
      ticket.description?.toLowerCase().includes(query)
    )
  })

  const cardFieldOptions: Array<{ key: 'description' | 'dueDate' | 'estimate' | 'assignee' | 'labels' | 'spaces' | 'attributes'; label: string }> = [
    { key: 'description', label: 'Description' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'estimate', label: 'Estimate' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'labels', label: 'Labels' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'attributes', label: 'Custom Attributes' },
  ]

  const activeFilterCount = Number(Boolean(filters.status)) + Number(Boolean(filters.priority))

  return (
    <div className="flex h-full min-h-0 flex-col space-y-4">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
          <p className="text-muted-foreground">Grid-first project tracking with drag, gantt, and custom management controls.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsManagementOpen(true)}>Management</Button>
          {view === 'kanban' && (
            <Button variant="outline" onClick={openConfig}>Configure Board</Button>
          )}
          <Button onClick={() => handleAddTicket('BACKLOG')} disabled={!effectiveSpaceId}>
            New Ticket
          </Button>
        </div>
      </div>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Kanban Board</DialogTitle>
            <DialogDescription>
              Customize grouping, display behavior, and which details appear in the grid.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Grouping</p>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Group by Rows</Label>
                  <Select
                    value={localConfig.rows || 'none'}
                    onValueChange={(value) =>
                      setLocalConfig({ ...localConfig, rows: value === 'none' ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="assignee">Assignee</SelectItem>
                      <SelectItem value="tags">Tags</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 block text-xs text-muted-foreground">Group by Columns</Label>
                  <Select
                    value={localConfig.columns || 'status'}
                    onValueChange={(value) => setLocalConfig({ ...localConfig, columns: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="assignee">Assignee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Ticket Detail View</p>
                <Label className="mb-1 block text-xs text-muted-foreground">Open tickets as</Label>
                <Select
                  value={localConfig.ticketDisplayMode || 'modal'}
                  onValueChange={(value) =>
                    setLocalConfig({ ...localConfig, ticketDisplayMode: value as 'modal' | 'drawer' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modal">Modal</SelectItem>
                    <SelectItem value="drawer">Drawer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Visible Ticket Fields</p>
                <div className="grid grid-cols-2 gap-2">
                  {cardFieldOptions.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2">
                      <Checkbox
                        id={`field-${key}`}
                        checked={localConfig.cardFields?.[key as keyof typeof localConfig.cardFields] !== false}
                        onCheckedChange={(checked) =>
                          setLocalConfig({
                            ...localConfig,
                            cardFields: {
                              ...localConfig.cardFields,
                              [key]: !!checked,
                            },
                          })
                        }
                      />
                      <label htmlFor={`field-${key}`} className="cursor-pointer text-sm">
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
            <Button onClick={handleConfigSave}>Apply Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManagementOpen} onOpenChange={setIsManagementOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Management Options</DialogTitle>
            <DialogDescription>
              Adjust status colors, create reusable custom fields, and tune the board for your workflow.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Status Colors</p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(statusStyles).map(([status, meta]) => (
                    <div key={status} className="rounded-xl border border-border p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-sm font-medium">{meta.label}</span>
                        <span className={cn('rounded-full px-2 py-0.5 text-xs', meta.tone)}>{meta.label}</span>
                      </div>
                      <Label className="text-xs text-muted-foreground">Accent</Label>
                      <Input
                        type="color"
                        value={meta.accent}
                        onChange={(event) =>
                          setStatusStyles((prev) => ({
                            ...prev,
                            [status]: { ...prev[status], accent: event.target.value },
                          }))
                        }
                        className="mt-2 h-10 p-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Reusable Custom Fields</p>
                    <p className="text-xs text-muted-foreground">These fields are preloaded into new tickets.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newTemplateName}
                      onChange={(event) => setNewTemplateName(event.target.value)}
                      placeholder="Field name"
                      className="w-48"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        const trimmed = newTemplateName.trim()
                        if (!trimmed) return
                        setCustomFieldTemplates((prev) => [
                          ...prev,
                          {
                            name: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''),
                            displayName: trimmed,
                            type: 'TEXT',
                          },
                        ])
                        setNewTemplateName('')
                      }}
                    >Add Field</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {customFieldTemplates.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No reusable custom fields yet.
                    </div>
                  ) : (
                    customFieldTemplates.map((field, index) => (
                      <div key={`${field.name}-${index}`} className="grid grid-cols-[minmax(0,1fr)_160px_44px] gap-3 rounded-xl border border-border px-3 py-3">
                        <Input
                          value={field.displayName}
                          onChange={(event) =>
                            setCustomFieldTemplates((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, displayName: event.target.value } : item
                              )
                            )
                          }
                        />
                        <Select
                          value={field.type}
                          onValueChange={(value) =>
                            setCustomFieldTemplates((prev) =>
                              prev.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, type: value } : item
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
                          onClick={() =>
                            setCustomFieldTemplates((prev) => prev.filter((_, itemIndex) => itemIndex !== index))
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setIsManagementOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 px-6">
          {showSpaceSelector && (
            <SpaceSelector
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
              className="w-[200px]"
              showAllOption={true}
            />
          )}

          <div className="flex flex-1 items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-3"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[140px] justify-between">
                  <span className="flex items-center gap-2">
                    All Filters
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Filters</p>
                      <p className="text-xs text-muted-foreground">Refine the ticket list from one place.</p>
                    </div>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={() => setFilters({})}>
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={filters.status || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, status: value === 'all' ? undefined : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="BACKLOG">Backlog</SelectItem>
                        <SelectItem value="TODO">To Do</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="IN_REVIEW">In Review</SelectItem>
                        <SelectItem value="DONE">Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select
                      value={filters.priority || 'all'}
                      onValueChange={(value) =>
                        setFilters({ ...filters, priority: value === 'all' ? undefined : value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                        <SelectItem value="URGENT">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center border border-border bg-background">
              <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('kanban')}>Grid</Button>
              <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('list')}>List</Button>
              <Button variant={view === 'gantt' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('gantt')}>
                Gantt
              </Button>
              <Button variant={view === 'timesheet' ? 'default' : 'ghost'} size="sm" className="rounded-none" onClick={() => setView('timesheet')}>Timesheet</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading tickets...</div>
        </div>
      ) : view === 'kanban' ? (
        <ConfigurableKanbanBoard
          tickets={filteredTickets as any}
          config={kanbanConfig}
          onConfigChange={setKanbanConfig}
          onTicketClick={handleTicketClick}
          onAddTicket={handleAddTicket}
          onTicketMove={handleTicketMove}
          showSpaces={showSpaceSelector && selectedSpaceId === 'all'}
          statusStyles={statusStyles}
        />
      ) : view === 'gantt' ? (
        <ProjectGanttView tickets={filteredTickets as any} statusStyles={statusStyles} onTicketClick={handleTicketClick} />
      ) : view === 'timesheet' ? (
        <TimesheetView
          tickets={(ticketsWithTimeLogsResult.ticketsWithTimeLogs || filteredTickets).map((ticket) => ({
            ...ticket,
            timeLogs: ticket.timeLogs?.map((log: any) => ({
              ...log,
              hours: typeof log.hours === 'string' ? parseFloat(log.hours) || 0 : log.hours,
              loggedAt: typeof log.loggedAt === 'string' ? log.loggedAt : log.loggedAt.toISOString(),
              ticket: { id: ticket.id, title: ticket.title },
            })),
          }))}
          onAddTimeLog={handleAddTimeLog}
          onDeleteTimeLog={handleDeleteTimeLog}
          onTicketClick={handleTicketClick}
          loading={loading}
        />
      ) : (
        <div className="border border-border bg-background">
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No tickets found. Create your first ticket to get started.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="grid cursor-pointer grid-cols-[minmax(0,1fr)_160px_180px] items-center border-b border-border px-4 py-4 last:border-b-0 hover:bg-muted/40"
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="min-w-0">
                  <h3 className="font-medium">{ticket.title}</h3>
                  {ticket.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                  )}
                </div>
                <div className="flex justify-center">
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', statusStyles[ticket.status]?.tone || statusStyles.BACKLOG.tone)}>
                    {statusStyles[ticket.status]?.label || ticket.status}
                  </span>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {ticket.startDate ? new Date(ticket.startDate).toLocaleDateString() : 'No start'} - {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'No due'}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <TicketDetailModalEnhanced
        ticket={selectedTicket}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSave={handleSaveTicket}
        onDelete={selectedTicket?.id ? handleDeleteTicket : undefined}
        displayMode={kanbanConfig.ticketDisplayMode || 'modal'}
      />
    </div>
  )
}
