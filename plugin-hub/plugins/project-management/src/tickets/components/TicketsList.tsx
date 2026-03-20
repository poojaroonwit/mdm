'use client'

import { useState } from 'react'
import { useTickets } from '../hooks/useTickets'
import { useTicketsWithTimeLogs } from '../hooks/useTicketsWithTimeLogs'
import { useTicketActions } from '../hooks/useTicketActions'
import { useTimeLogActions } from '../hooks/useTimeLogActions'
import { TicketsListProps, TicketFilters } from '../types'
import { ConfigurableKanbanBoard, KanbanConfig } from '@/components/project-management/ConfigurableKanbanBoard'
import { TicketDetailModalEnhanced } from '@/components/project-management/TicketDetailModalEnhanced'
import { TimesheetView } from '@/components/project-management/TimesheetView'
import { SpaceSelector } from '@/components/project-management/SpaceSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Plus, Search, List, Kanban as KanbanIcon, Clock, Loader, Settings } from 'lucide-react'
import { useSpace } from '@/contexts/space-context'

/**
 * Single-source TicketsList component
 * Can be used in both space-scoped and admin views
 */
export function TicketsList({
  spaceId = null,
  viewMode = 'kanban',
  showFilters = true,
  showSpaceSelector = false,
  projectId,
  cycleId,
}: TicketsListProps) {
  const { currentSpace } = useSpace()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>(
    spaceId || currentSpace?.id || 'all'
  )
  const [filters, setFilters] = useState<TicketFilters>({})
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useState<'kanban' | 'list' | 'timesheet'>(
    (viewMode === 'timesheet' ? 'timesheet' : viewMode === 'list' ? 'list' : 'kanban')
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

  // Configure Board dialog state
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [localConfig, setLocalConfig] = useState<KanbanConfig>(kanbanConfig)

  const openConfig = () => {
    setLocalConfig(kanbanConfig)
    setIsConfigOpen(true)
  }

  const handleConfigSave = () => {
    setKanbanConfig(localConfig)
    setIsConfigOpen(false)
  }

  // Determine effective spaceId for filtering
  const effectiveSpaceId = showSpaceSelector
    ? selectedSpaceId === 'all'
      ? null
      : selectedSpaceId
    : spaceId

  // Use tickets with time logs when in timesheet view, regular tickets otherwise
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
  const { tickets, loading, refetch, spaceFilter } = ticketsData

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

    const newTicket: Partial<any> = {
      title: '',
      description: '',
      status,
      priority: 'MEDIUM',
      attributes: [],
    }

    setSelectedTicket(newTicket)
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
      assignedTo: ticketData.assignee?.id || null,
      attributes: ticketData.attributes || [],
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

  const handleAddTimeLog = async (
    ticketId: string,
    hours: number,
    description: string,
    loggedAt: Date
  ) => {
    const result = await addTimeLog(ticketId, { hours, description, loggedAt })
    if (result) refetch()
  }

  const handleDeleteTimeLog = async (ticketId: string, timeLogId: string) => {
    const success = await deleteTimeLog(ticketId, timeLogId)
    if (success) refetch()
  }

  const filteredTickets = tickets.filter((ticket) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = ticket.title?.toLowerCase().includes(query)
      const matchesDescription = ticket.description?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDescription) return false
    }
    return true
  })

  const cardFieldOptions: Array<{ key: keyof KanbanConfig['cardFields'] & string; label: string }> = [
    { key: 'description', label: 'Description' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'estimate', label: 'Estimate' },
    { key: 'assignee', label: 'Assignee' },
    { key: 'labels', label: 'Labels' },
    { key: 'spaces', label: 'Spaces' },
    { key: 'attributes', label: 'Custom Attributes' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tickets</h2>
          <p className="text-muted-foreground">Manage your tickets and tasks</p>
        </div>
        <div className="flex items-center gap-2">
          {view === 'kanban' && (
            <Button variant="outline" onClick={openConfig}>
              <Settings className="mr-2 h-4 w-4" />
              Configure Board
            </Button>
          )}
          <Button
            onClick={() => handleAddTicket('BACKLOG')}
            disabled={!effectiveSpaceId}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Configure Board Dialog */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Kanban Board</DialogTitle>
            <DialogDescription>
              Customize how tickets are grouped, displayed, and what appears on each card.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Grouping */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Grouping</p>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Group by Rows</Label>
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
                <Label className="text-xs text-muted-foreground mb-1 block">Group by Columns</Label>
                <Select
                  value={localConfig.columns || 'status'}
                  onValueChange={(value) =>
                    setLocalConfig({ ...localConfig, columns: value })
                  }
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

            {/* Ticket display mode */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Ticket Detail View</p>
              <Label className="text-xs text-muted-foreground mb-1 block">Open tickets as</Label>
              <Select
                value={localConfig.ticketDisplayMode || 'modal'}
                onValueChange={(value: 'modal' | 'drawer') =>
                  setLocalConfig({ ...localConfig, ticketDisplayMode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modal">Modal (centered dialog)</SelectItem>
                  <SelectItem value="drawer">Drawer (side panel)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Card fields */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Card Fields</p>
              <p className="text-xs text-muted-foreground">Choose which fields appear on each ticket card.</p>
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
                    <label
                      htmlFor={`field-${key}`}
                      className="text-sm cursor-pointer"
                    >
                      {label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t mt-4">
            <Button onClick={handleConfigSave} className="flex-1">
              Apply
            </Button>
            <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filters and Controls */}
      {showFilters && (
        <div className="flex items-center gap-4 flex-wrap">
          {showSpaceSelector && (
            <SpaceSelector
              value={selectedSpaceId}
              onValueChange={setSelectedSpaceId}
              className="w-[200px]"
              showAllOption={true}
            />
          )}

          <div className="flex-1 flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === 'all' ? undefined : (value as any) })
              }
            >
              <SelectTrigger className="w-[150px]">
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

            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) =>
                setFilters({ ...filters, priority: value === 'all' ? undefined : (value as any) })
              }
            >
              <SelectTrigger className="w-[150px]">
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

            <div className="flex items-center border rounded-md">
              <Button
                variant={view === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('kanban')}
              >
                <KanbanIcon className="mr-2 h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={view === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                variant={view === 'timesheet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('timesheet')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Timesheet
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
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
        />
      ) : view === 'timesheet' ? (
        <TimesheetView
          tickets={(ticketsWithTimeLogsResult.ticketsWithTimeLogs || filteredTickets).map(ticket => ({
            ...ticket,
            timeLogs: ticket.timeLogs?.map((log: any) => ({
              ...log,
              hours: typeof log.hours === 'string' ? parseFloat(log.hours) || 0 : log.hours,
              loggedAt: typeof log.loggedAt === 'string' ? log.loggedAt : log.loggedAt.toISOString(),
              ticket: { id: ticket.id, title: ticket.title }
            }))
          }))}
          onAddTimeLog={handleAddTimeLog}
          onDeleteTimeLog={handleDeleteTimeLog}
          onTicketClick={handleTicketClick}
          loading={loading}
        />
      ) : (
        <div className="space-y-2">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No tickets found. Create your first ticket to get started.
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="p-4 border rounded-lg hover:bg-accent cursor-pointer"
                onClick={() => handleTicketClick(ticket)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{ticket.title}</h3>
                    {ticket.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {ticket.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{ticket.status}</span>
                    <span className="text-xs text-muted-foreground">{ticket.priority}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Ticket Detail Modal / Drawer */}
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
