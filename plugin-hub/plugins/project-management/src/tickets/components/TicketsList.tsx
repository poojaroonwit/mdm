'use client'

import { useEffect, useRef, useState } from 'react'
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Plus,
  X,
  KanbanSquare,
  List,
  Clock3,
  GanttChartSquare,
  MoreVertical,
  Settings2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import { useSpace } from '@/contexts/space-context'
import {
  DEFAULT_CARD_FIELDS,
  DEFAULT_PROJECT_STATUSES,
  ProjectFieldDefinition,
  ProjectStatusDefinition,
  createFieldMachineName,
  createStatusValue,
  normalizeProjectMetadata,
  stripHtmlTags,
} from '@/components/project-management/project-config'

const DEFAULT_STATUS_STYLES: Record<string, KanbanStatusStyle> = {
  BACKLOG: { label: 'Backlog', accent: '#64748b', tone: 'bg-slate-100 text-slate-700', track: 'bg-slate-50' },
  TODO: { label: 'To Do', accent: '#2563eb', tone: 'bg-blue-100 text-blue-700', track: 'bg-blue-50' },
  IN_PROGRESS: { label: 'In Progress', accent: '#f97316', tone: 'bg-orange-100 text-orange-700', track: 'bg-orange-50' },
  IN_REVIEW: { label: 'In Review', accent: '#7c3aed', tone: 'bg-violet-100 text-violet-700', track: 'bg-violet-50' },
  DONE: { label: 'Done', accent: '#16a34a', tone: 'bg-emerald-100 text-emerald-700', track: 'bg-emerald-50' },
}

function buildStatusTone(accent: string) {
  return {
    tone: 'border-transparent',
    track: 'border-transparent',
    accent,
  }
}

function mapStatusesToStyles(statuses: ProjectStatusDefinition[]) {
  return statuses.reduce<Record<string, KanbanStatusStyle>>((acc, status) => {
    acc[status.value] = {
      label: status.label,
      ...buildStatusTone(status.accent),
    }
    return acc
  }, {})
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
  onScheduleChange,
}: {
  tickets: any[]
  statusStyles: Record<string, KanbanStatusStyle>
  onTicketClick: (ticket: any) => void
  onScheduleChange: (ticketId: string, updates: { startDate: string; dueDate: string }) => Promise<void>
}) {
  const timelineRef = useRef<HTMLDivElement | null>(null)
  const [interaction, setInteraction] = useState<{
    ticketId: string
    mode: 'move' | 'resize-start' | 'resize-end'
    originX: number
    start: Date
    end: Date
  } | null>(null)
  const [draftRanges, setDraftRanges] = useState<Record<string, { start: Date; end: Date }>>({})

  const preparedTickets = tickets.map((ticket) => {
    const draft = draftRanges[ticket.id]
    const start = draft?.start || (ticket.startDate ? new Date(ticket.startDate) : ticket.createdAt ? new Date(ticket.createdAt) : new Date())
    const rawEnd = draft?.end || (ticket.dueDate ? new Date(ticket.dueDate) : addDays(start, 2))
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

  useEffect(() => {
    if (!interaction) {
      return
    }

    const handleMove = (event: MouseEvent) => {
      if (!timelineRef.current) return
      const dayWidth = timelineRef.current.getBoundingClientRect().width / totalDays
      const deltaDays = Math.round((event.clientX - interaction.originX) / Math.max(dayWidth, 1))
      if (!deltaDays) {
        return
      }

      let nextStart = interaction.start
      let nextEnd = interaction.end

      if (interaction.mode === 'move') {
        nextStart = addDays(interaction.start, deltaDays)
        nextEnd = addDays(interaction.end, deltaDays)
      } else if (interaction.mode === 'resize-start') {
        nextStart = addDays(interaction.start, deltaDays)
        if (nextStart > nextEnd) {
          nextStart = nextEnd
        }
      } else {
        nextEnd = addDays(interaction.end, deltaDays)
        if (nextEnd < nextStart) {
          nextEnd = nextStart
        }
      }

      setDraftRanges((prev) => ({
        ...prev,
        [interaction.ticketId]: { start: nextStart, end: nextEnd },
      }))
    }

    const handleUp = async () => {
      const draft = draftRanges[interaction.ticketId]
      setInteraction(null)
      if (!draft) return

      await onScheduleChange(interaction.ticketId, {
        startDate: draft.start.toISOString(),
        dueDate: draft.end.toISOString(),
      })
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp, { once: true })

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [draftRanges, interaction, onScheduleChange, totalDays])

  return (
    <div className="overflow-auto border border-border bg-background">
      <div ref={timelineRef} className="grid min-w-[1120px]" style={{ gridTemplateColumns: `320px repeat(${days.length}, minmax(44px, 1fr))` }}>
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
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={{ backgroundColor: `${meta.accent}22`, color: meta.accent }}
                    >
                      {meta.label}
                    </span>
                    <span>{ticket._start.toLocaleDateString()} - {ticket._end.toLocaleDateString()}</span>
                  </div>
                </button>
              </div>
              {days.map((day, index) => (
                <div key={`${ticket.id}-${day.toISOString()}`} className="relative min-h-[74px] border-b border-border">
                  {index === startOffset && (
                    <div
                      className="absolute inset-y-3 left-1 rounded-md text-left text-xs font-medium text-white"
                      style={{
                        backgroundColor: meta.accent,
                        width: `calc(${span * 100}% - 8px)`,
                      }}
                    >
                      <button
                        onClick={() => onTicketClick(ticket)}
                        onMouseDown={(event) => {
                          event.stopPropagation()
                          setInteraction({
                            ticketId: ticket.id,
                            mode: 'move',
                            originX: event.clientX,
                            start: ticket._start,
                            end: ticket._end,
                          })
                        }}
                        className="flex h-full w-full cursor-grab items-center px-5 text-left active:cursor-grabbing"
                        title="Drag to move schedule"
                      >
                        <span className="line-clamp-2 block">{ticket.title}</span>
                      </button>
                      <button
                        type="button"
                        aria-label="Resize start date"
                        className="absolute inset-y-0 left-0 w-3 cursor-ew-resize rounded-l-md bg-black/20"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setInteraction({
                            ticketId: ticket.id,
                            mode: 'resize-start',
                            originX: event.clientX,
                            start: ticket._start,
                            end: ticket._end,
                          })
                        }}
                      />
                      <button
                        type="button"
                        aria-label="Resize end date"
                        className="absolute inset-y-0 right-0 w-3 cursor-ew-resize rounded-r-md bg-black/20"
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          setInteraction({
                            ticketId: ticket.id,
                            mode: 'resize-end',
                            originX: event.clientX,
                            start: ticket._start,
                            end: ticket._end,
                          })
                        }}
                      />
                    </div>
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
    viewMode === 'timesheet'
      ? 'timesheet'
      : viewMode === 'list'
        ? 'list'
        : viewMode === 'gantt'
          ? 'gantt'
          : 'kanban'
  )
  const [kanbanConfig, setKanbanConfig] = useState<KanbanConfig>({
    rows: undefined,
    columns: 'status',
    ticketDisplayMode: 'modal',
    cardFields: DEFAULT_CARD_FIELDS,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<KanbanConfig>(kanbanConfig)
  const [isManagementOpen, setIsManagementOpen] = useState(false)
  const [statusDefinitions, setStatusDefinitions] = useState<ProjectStatusDefinition[]>(DEFAULT_PROJECT_STATUSES)
  const [customFieldTemplates, setCustomFieldTemplates] = useState<ProjectFieldDefinition[]>([])
  const [newTemplateName, setNewTemplateName] = useState('')
  const [newStatusName, setNewStatusName] = useState('')
  const [newOptionDrafts, setNewOptionDrafts] = useState<Record<string, string>>({})
  const [projectMetadataSaving, setProjectMetadataSaving] = useState(false)
  const [isSpacePromptOpen, setIsSpacePromptOpen] = useState(false)
  const [pendingTicketStatus, setPendingTicketStatus] = useState(DEFAULT_PROJECT_STATUSES[0].value)
  const [spacePromptSelection, setSpacePromptSelection] = useState('')

  const statusStyles = mapStatusesToStyles(statusDefinitions)
  const defaultStatusValue = statusDefinitions[0]?.value || DEFAULT_PROJECT_STATUSES[0].value

  useEffect(() => {
    if (spaceId) {
      setSelectedSpaceId(spaceId)
      return
    }

    if (currentSpace?.id && selectedSpaceId === 'all') {
      setSelectedSpaceId(currentSpace.id)
    }
  }, [currentSpace?.id, selectedSpaceId, spaceId])

  useEffect(() => {
    let cancelled = false

    const loadProjectMetadata = async () => {
      if (!projectId) {
        setStatusDefinitions(DEFAULT_PROJECT_STATUSES)
        setCustomFieldTemplates([])
        setKanbanConfig((prev) => ({
          ...prev,
          cardFields: DEFAULT_CARD_FIELDS,
        }))
        return
      }

      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error('Failed to load project')
        }

        const data = await response.json()
        const project = data.project
        const metadata = normalizeProjectMetadata(project?.metadata)

        if (cancelled) return

        setStatusDefinitions(metadata.ticketConfig?.statuses || DEFAULT_PROJECT_STATUSES)
        setCustomFieldTemplates(metadata.customFields || [])
        setKanbanConfig((prev) => ({
          ...prev,
          cardFields: {
            ...DEFAULT_CARD_FIELDS,
            ...(metadata.ticketConfig?.cardFields || {}),
          },
        }))

        if (project?.spaceId) {
          setSelectedSpaceId(project.spaceId)
        }
      } catch (error) {
        if (!cancelled) {
          setStatusDefinitions(DEFAULT_PROJECT_STATUSES)
          setCustomFieldTemplates([])
        }
      }
    }

    loadProjectMetadata()

    return () => {
      cancelled = true
    }
  }, [projectId])

  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  const openConfig = () => {
    setLocalConfig(kanbanConfig)
    setIsConfigOpen(true)
  }

  const persistProjectMetadata = async (
    updates: Partial<{
      statuses: ProjectStatusDefinition[]
      customFields: ProjectFieldDefinition[]
      cardFields: KanbanConfig['cardFields']
    }>
  ) => {
    if (!projectId) return

    try {
      setProjectMetadataSaving(true)
      const response = await fetch(`/api/projects/${projectId}`)
      if (!response.ok) {
        throw new Error('Failed to load project metadata')
      }
      const data = await response.json()
      const project = data.project
      const metadata = normalizeProjectMetadata(project?.metadata)
      const body = {
        metadata: {
          ...metadata,
          customFields: updates.customFields || customFieldTemplates,
          ticketConfig: {
            ...metadata.ticketConfig,
            statuses: updates.statuses || statusDefinitions,
            cardFields: {
              ...DEFAULT_CARD_FIELDS,
              ...(updates.cardFields || kanbanConfig.cardFields || {}),
            },
          },
        },
      }

      const updateResponse = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!updateResponse.ok) {
        throw new Error('Failed to save project metadata')
      }
    } finally {
      setProjectMetadataSaving(false)
    }
  }

  const handleConfigSave = async () => {
    setKanbanConfig(localConfig)
    if (projectId) {
      await persistProjectMetadata({ cardFields: localConfig.cardFields })
    }
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

  const openNewTicketModal = (status: string) => {
    setSelectedTicket({
      title: '',
      description: '',
      status: status || defaultStatusValue,
      priority: 'MEDIUM',
      attributes: customFieldTemplates.map((field, index) => ({
        name: field.name,
        displayName: field.displayName,
        type: field.type,
        value: '',
        sortOrder: index,
        options: field.options || [],
      })),
    })
    setIsModalOpen(true)
  }

  const handleAddTicket = async (status: string) => {
    const effectiveSpace = effectiveSpaceId || currentSpace?.id
    if (!effectiveSpace) {
      setPendingTicketStatus(status)
      setSpacePromptSelection(selectedSpaceId !== 'all' ? selectedSpaceId : '')
      setIsSpacePromptOpen(true)
      return
    }

    openNewTicketModal(status)
  }

  const handleSaveTicket = async (ticketData: any) => {
    const isNew = !ticketData.id
    const effectiveSpace = effectiveSpaceId || currentSpace?.id

    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      status: ticketData.status || defaultStatusValue,
      priority: ticketData.priority,
      dueDate: ticketData.dueDate,
      startDate: ticketData.startDate,
      estimate: ticketData.estimate,
      labels: ticketData.labels || [],
      spaceId: effectiveSpace,
      assignedTo: ticketData.assignee?.id ? [ticketData.assignee.id] : [],
      attributes: ticketData.attributes || [],
      projectId: ticketData.projectId || projectId || null,
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

  const handleGanttScheduleChange = async (ticketId: string, updates: { startDate: string; dueDate: string }) => {
    await updateTicket(ticketId, updates)
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

  const handleConfirmSpacePrompt = () => {
    if (!spacePromptSelection) return
    setSelectedSpaceId(spacePromptSelection)
    setIsSpacePromptOpen(false)
    openNewTicketModal(pendingTicketStatus)
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

  const addNewStatus = () => {
    const trimmed = newStatusName.trim()
    if (!trimmed) return
    setStatusDefinitions((prev) => [
      ...prev,
      {
        value: createStatusValue(trimmed),
        label: trimmed,
        accent: '#64748b',
      },
    ])
    setNewStatusName('')
  }

  const addFieldOption = (fieldName: string) => {
    const draft = (newOptionDrafts[fieldName] || '').trim()
    if (!draft) return

    setCustomFieldTemplates((prev) =>
      prev.map((field) =>
        field.name === fieldName
          ? {
              ...field,
              options: [...(field.options || []), { label: draft, value: draft }],
            }
          : field
      )
    )
    setNewOptionDrafts((prev) => ({ ...prev, [fieldName]: '' }))
  }

  const activeFilterCount = Number(Boolean(filters.status)) + Number(Boolean(filters.priority))

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setIsManagementOpen(true)}>
            <Settings2 className="mr-2 h-4 w-4" />
            Manage Project
          </Button>
          {view === 'kanban' && (
            <Button variant="outline" onClick={openConfig}>
              <Settings2 className="mr-2 h-4 w-4" />
              Configure Cards
            </Button>
          )}
        </div>
        <Button onClick={() => handleAddTicket(defaultStatusValue)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      </div>

      <Dialog open={isSpacePromptOpen} onOpenChange={setIsSpacePromptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select or Create a Space</DialogTitle>
            <DialogDescription>
              Tickets must belong to a space. Choose an existing space or create a new data management space first.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label>Select Space</Label>
              <SpaceSelector
                value={spacePromptSelection}
                onValueChange={setSpacePromptSelection}
                className="w-full"
                showAllOption={false}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              The create action inside the dropdown will open a space creation form and auto-select the new space for this ticket.
            </p>
          </DialogBody>
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setIsSpacePromptOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSpacePrompt} disabled={!spacePromptSelection}>
              Continue to Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Card Display</DialogTitle>
            <DialogDescription>
              Choose how the board groups tickets and which fields appear on each card.
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
                <p className="text-sm font-semibold text-foreground">Card Display</p>
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
                {customFieldTemplates.length > 0 && (
                  <div className="space-y-2 rounded-md border border-border/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Attributes On Card</p>
                    <div className="space-y-2">
                      {customFieldTemplates.map((field) => (
                        <div key={field.name} className="flex items-center gap-2">
                          <Checkbox
                            id={`attribute-${field.name}`}
                            checked={localConfig.cardFields?.attributeNames?.includes(field.name) || false}
                            onCheckedChange={(checked) =>
                              setLocalConfig({
                                ...localConfig,
                                cardFields: {
                                  ...localConfig.cardFields,
                                  attributeNames: checked
                                    ? [...(localConfig.cardFields?.attributeNames || []), field.name]
                                    : (localConfig.cardFields?.attributeNames || []).filter((name) => name !== field.name),
                                },
                              })
                            }
                          />
                          <label htmlFor={`attribute-${field.name}`} className="cursor-pointer text-sm">
                            {field.displayName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>Cancel</Button>
            <Button onClick={handleConfigSave} disabled={projectMetadataSaving}>Apply Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isManagementOpen} onOpenChange={setIsManagementOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Project Configuration</DialogTitle>
            <DialogDescription>
              Manage statuses, shared custom attributes, and which attributes appear on ticket cards.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Statuses</p>
                    <p className="text-xs text-muted-foreground">Create, rename, recolor, and reorder ticket statuses for this project.</p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newStatusName}
                      onChange={(event) => setNewStatusName(event.target.value)}
                      placeholder="New status"
                      className="w-44"
                    />
                    <Button type="button" onClick={addNewStatus}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Status
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {statusDefinitions.map((status, index) => (
                    <div key={status.value} className="grid grid-cols-[32px_minmax(0,1fr)_180px_54px_54px_54px] items-center gap-3 rounded-md border border-border px-3 py-3">
                      <div className="text-center text-xs font-semibold text-muted-foreground">{index + 1}</div>
                      <Input
                        value={status.label}
                        onChange={(event) =>
                          setStatusDefinitions((prev) =>
                            prev.map((item) =>
                              item.value === status.value
                                ? {
                                    ...item,
                                    label: event.target.value,
                                    value: createStatusValue(event.target.value),
                                  }
                                : item
                            )
                          )
                        }
                      />
                      <div className="flex items-center gap-3">
                        <Input
                          type="color"
                          value={status.accent}
                          onChange={(event) =>
                            setStatusDefinitions((prev) =>
                              prev.map((item) =>
                                item.value === status.value ? { ...item, accent: event.target.value } : item
                              )
                            )
                          }
                          className="h-10 p-1"
                        />
                        <span className="rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${status.accent}22`, color: status.accent }}>
                          {status.label}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() =>
                          setStatusDefinitions((prev) => {
                            const next = [...prev]
                            ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
                            return next
                          })
                        }
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === statusDefinitions.length - 1}
                        onClick={() =>
                          setStatusDefinitions((prev) => {
                            const next = [...prev]
                            ;[next[index + 1], next[index]] = [next[index], next[index + 1]]
                            return next
                          })
                        }
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={statusDefinitions.length <= 1}
                        onClick={() =>
                          setStatusDefinitions((prev) => prev.filter((item) => item.value !== status.value))
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">Shared Custom Attributes</p>
                    <p className="text-xs text-muted-foreground">These attributes are preloaded into new tickets for this project.</p>
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
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Attribute
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {customFieldTemplates.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                      No reusable custom fields yet.
                    </div>
                  ) : (
                    customFieldTemplates.map((field, index) => (
                      <div key={`${field.name}-${index}`} className="space-y-3 rounded-md border border-border px-3 py-3">
                        <div className="grid grid-cols-[minmax(0,1fr)_160px_44px] gap-3">
                        <Input
                          value={field.displayName}
                          onChange={(event) =>
                            setCustomFieldTemplates((prev) =>
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
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                        {field.type === 'SELECT' && (
                          <div className="space-y-2 rounded-md bg-muted/30 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <Label className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Options</Label>
                              <div className="flex gap-2">
                                <Input
                                  value={newOptionDrafts[field.name] || ''}
                                  onChange={(event) =>
                                    setNewOptionDrafts((prev) => ({ ...prev, [field.name]: event.target.value }))
                                  }
                                  placeholder="New option"
                                  className="h-8 w-36"
                                />
                                <Button type="button" size="sm" variant="outline" onClick={() => addFieldOption(field.name)}>
                                  Add
                                </Button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(field.options || []).length === 0 ? (
                                <span className="text-xs text-muted-foreground">No options yet.</span>
                              ) : (
                                field.options?.map((option) => (
                                  <span key={`${field.name}-${option.value}`} className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-xs">
                                    {option.label}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setCustomFieldTemplates((prev) =>
                                          prev.map((item) =>
                                            item.name === field.name
                                              ? {
                                                  ...item,
                                                  options: (item.options || []).filter((candidate) => candidate.value !== option.value),
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
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="text-sm font-semibold">Card Attribute Selection</p>
                <p className="text-xs text-muted-foreground">Choose which project attributes appear directly on ticket cards.</p>
                {customFieldTemplates.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                    No project attributes are available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {customFieldTemplates.map((field) => (
                      <div key={`card-${field.name}`} className="flex items-center gap-2">
                        <Checkbox
                          id={`card-field-${field.name}`}
                          checked={kanbanConfig.cardFields?.attributeNames?.includes(field.name) || false}
                          onCheckedChange={(checked) =>
                            setKanbanConfig((prev) => ({
                              ...prev,
                              cardFields: {
                                ...prev.cardFields,
                                attributeNames: checked
                                  ? [...(prev.cardFields?.attributeNames || []), field.name]
                                  : (prev.cardFields?.attributeNames || []).filter((name) => name !== field.name),
                              },
                            }))
                          }
                        />
                        <label htmlFor={`card-field-${field.name}`} className="cursor-pointer text-sm">
                          {field.displayName}
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="justify-end">
            <Button variant="outline" onClick={() => setIsManagementOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                await persistProjectMetadata({
                  statuses: statusDefinitions,
                  customFields: customFieldTemplates,
                  cardFields: kanbanConfig.cardFields,
                })
                setIsManagementOpen(false)
              }}
              disabled={projectMetadataSaving}
            >
              {projectMetadataSaving ? 'Saving...' : 'Save Project Config'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showFilters && (
        <div className="flex flex-wrap items-center gap-4">
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
                        {statusDefinitions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
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

            <div className="flex items-center rounded-md border border-border bg-background p-1">
              <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="rounded-md" onClick={() => setView('kanban')}>
                <KanbanSquare className="mr-2 h-4 w-4" />
                Board
              </Button>
              <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="rounded-md" onClick={() => setView('list')}>
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button variant={view === 'gantt' ? 'default' : 'ghost'} size="sm" className="rounded-md" onClick={() => setView('gantt')}>
                <GanttChartSquare className="mr-2 h-4 w-4" />
                Gantt
              </Button>
              <Button variant={view === 'timesheet' ? 'default' : 'ghost'} size="sm" className="rounded-md" onClick={() => setView('timesheet')}>
                <Clock3 className="mr-2 h-4 w-4" />
                Timesheet
              </Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm text-muted-foreground">Loading tickets...</div>
        </div>
      ) : view === 'kanban' ? (
        <div className="min-h-0 flex-1 overflow-auto">
          <ConfigurableKanbanBoard
            tickets={filteredTickets as any}
            config={kanbanConfig}
            onConfigChange={setKanbanConfig}
            onTicketClick={handleTicketClick}
            onTicketDelete={handleDeleteTicket}
            onAddTicket={handleAddTicket}
            onTicketMove={handleTicketMove}
            showSpaces={showSpaceSelector && selectedSpaceId === 'all'}
            statusStyles={statusStyles}
            statusColumns={statusDefinitions.map((status) => status.value)}
          />
        </div>
      ) : view === 'gantt' ? (
        <ProjectGanttView
          tickets={filteredTickets as any}
          statusStyles={statusStyles}
          onTicketClick={handleTicketClick}
          onScheduleChange={handleGanttScheduleChange}
        />
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
        <div className="overflow-hidden rounded-md border border-border bg-background shadow-sm">
          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No tickets found. Create your first ticket to get started.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="grid cursor-pointer grid-cols-[minmax(0,1fr)_160px_180px_64px] items-center border-b border-border px-4 py-4 last:border-b-0 hover:bg-muted/40"
              >
                <div className="min-w-0" onClick={() => handleTicketClick(ticket)}>
                  <h3 className="font-medium">{ticket.title}</h3>
                  {ticket.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{stripHtmlTags(ticket.description)}</p>
                  )}
                </div>
                <div className="flex justify-center" onClick={() => handleTicketClick(ticket)}>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{
                      backgroundColor: `${(statusStyles[ticket.status]?.accent || DEFAULT_STATUS_STYLES.BACKLOG.accent)}22`,
                      color: statusStyles[ticket.status]?.accent || DEFAULT_STATUS_STYLES.BACKLOG.accent,
                    }}
                  >
                    {statusStyles[ticket.status]?.label || ticket.status}
                  </span>
                </div>
                <div className="text-right text-xs text-muted-foreground" onClick={() => handleTicketClick(ticket)}>
                  {ticket.startDate ? new Date(ticket.startDate).toLocaleDateString() : 'No start'} - {ticket.dueDate ? new Date(ticket.dueDate).toLocaleDateString() : 'No due'}
                </div>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-md">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleTicketClick(ticket)}>Open Ticket</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteTicket(ticket.id)}>Delete Ticket</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
