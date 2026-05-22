'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketCard, CardFields } from './TicketCard'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  estimate?: number | null
  assignees?: Array<{
    user: {
      id: string
      name: string
      avatar?: string | null
    }
  }>
  spaces?: Array<{
    space: {
      id: string
      name: string
      slug: string
    }
  }>
  tags?: Array<{
    id: string
    name: string
    color?: string | null
  }>
  [key: string]: any
}

export interface KanbanConfig {
  rows?: string
  columns?: string
  grouping?: string
  ticketDisplayMode?: 'modal' | 'drawer'
  cardFields?: CardFields
}

export interface KanbanStatusStyle {
  label: string
  accent: string
  tone: string
  track: string
}

interface ConfigurableKanbanBoardProps {
  tickets: Ticket[]
  config: KanbanConfig
  onConfigChange?: (config: KanbanConfig) => void
  onTicketClick?: (ticket: Ticket) => void
  onTicketDelete?: (ticketId: string) => void
  onAddTicket?: (status: string, groupKey?: string) => void
  onTicketMove?: (ticketId: string, newStatus: string, newGroupKey?: string) => void
  showSpaces?: boolean
  statusStyles?: Record<string, KanbanStatusStyle>
  statusColumns?: string[]
}

const FALLBACK_STATUS_STYLES: Record<string, KanbanStatusStyle> = {
  BACKLOG: {
    label: 'Backlog',
    accent: '#64748b',
    tone: 'bg-slate-100 text-slate-700',
    track: 'bg-slate-50',
  },
  TODO: {
    label: 'To Do',
    accent: '#2563eb',
    tone: 'bg-blue-100 text-blue-700',
    track: 'bg-blue-50',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    accent: '#f97316',
    tone: 'bg-orange-100 text-orange-700',
    track: 'bg-orange-50',
  },
  IN_REVIEW: {
    label: 'In Review',
    accent: '#7c3aed',
    tone: 'bg-violet-100 text-violet-700',
    track: 'bg-violet-50',
  },
  DONE: {
    label: 'Done',
    accent: '#16a34a',
    tone: 'bg-emerald-100 text-emerald-700',
    track: 'bg-emerald-50',
  },
}

export function ConfigurableKanbanBoard({
  tickets,
  config,
  onTicketClick,
  onTicketDelete,
  onAddTicket,
  onTicketMove,
  showSpaces = false,
  statusStyles,
  statusColumns,
}: ConfigurableKanbanBoardProps) {
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null)
  const palette = { ...FALLBACK_STATUS_STYLES, ...statusStyles }
  const resolvedStatusColumns = statusColumns && statusColumns.length > 0
    ? statusColumns
    : Object.keys(palette)

  const groupedTickets = useMemo(() => {
    const { rows, columns } = config

    if (!rows && !columns) {
      const statusGroups: Record<string, Ticket[]> = {}
      tickets.forEach((ticket) => {
        const key = ticket.status || 'BACKLOG'
        if (!statusGroups[key]) statusGroups[key] = []
        statusGroups[key].push(ticket)
      })
      return { '': statusGroups }
    }

    const result: Record<string, Record<string, Ticket[]>> = {}

    tickets.forEach((ticket) => {
      const rowKey = rows ? (ticket[rows] || 'Unassigned') : ''
      const colKey = columns ? (ticket[columns] || 'Unassigned') : ticket.status || 'BACKLOG'

      if (!result[rowKey]) result[rowKey] = {}
      if (!result[rowKey][colKey]) result[rowKey][colKey] = []
      result[rowKey][colKey].push(ticket)
    })

    return result
  }, [tickets, config])

  const handleDrop = (status: string) => {
    if (!draggedTicket) return
    onTicketMove?.(draggedTicket, status)
    setDraggedTicket(null)
  }

  const renderTicketRow = (ticket: Ticket) => (
    <div
      key={ticket.id}
      draggable
      onDragStart={() => setDraggedTicket(ticket.id)}
      onDragEnd={() => setDraggedTicket(null)}
      className="group"
    >
      <div className="border-b border-border bg-background/70 px-3 py-3 hover:bg-muted/30">
        <TicketCard
          ticket={ticket}
          onClick={() => onTicketClick?.(ticket)}
          onOpenAction={() => onTicketClick?.(ticket)}
          onDeleteAction={onTicketDelete ? () => onTicketDelete(ticket.id) : undefined}
          showSpaces={showSpaces}
          visibleFields={config.cardFields}
          flat
          accentColor={palette[ticket.status]?.accent}
        />
      </div>
    </div>
  )

  const renderColumn = (
    status: string,
    columnTickets: Ticket[],
    onAdd: () => void
  ) => {
    const meta = palette[status] || FALLBACK_STATUS_STYLES.BACKLOG

    return (
      <div
        key={status}
        className="border-l border-border first:border-l-0"
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleDrop(status)}
      >
        <div
          className="sticky top-0 z-10 border-b border-border px-3 py-3"
          style={{ backgroundColor: `${meta.accent}14` }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.accent }} />
              <span className="text-sm font-semibold">{meta.label}</span>
            </div>
            <Badge
              variant="secondary"
              className="rounded-full border-0 px-2 py-0.5 text-[11px]"
              style={{
                backgroundColor: `${meta.accent}22`,
                color: meta.accent,
              }}
            >
              {columnTickets.length}
            </Badge>
          </div>
        </div>

        <div className="min-h-[520px]">
          {columnTickets.map(renderTicketRow)}
          <Button
            variant="ghost"
            size="sm"
            className="h-12 w-full justify-start rounded-none px-3 text-muted-foreground hover:text-foreground"
            onClick={onAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add ticket
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {config.rows ? (
        <div className="space-y-6">
          {Object.entries(groupedTickets).map(([rowKey, columns]) => (
            <div key={rowKey} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {rowKey || 'Unassigned'}
              </h3>
              <div
                className="grid min-w-[1120px] overflow-x-auto border border-border bg-background"
                style={{ gridTemplateColumns: `repeat(${resolvedStatusColumns.length}, minmax(224px, 1fr))` }}
              >
                {resolvedStatusColumns.map((status) =>
                  renderColumn(status, columns[status] || [], () => onAddTicket?.(status, rowKey))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid min-w-[1120px] overflow-x-auto border border-border bg-background"
          style={{ gridTemplateColumns: `repeat(${resolvedStatusColumns.length}, minmax(224px, 1fr))` }}
        >
          {resolvedStatusColumns.map((status) =>
            renderColumn(status, groupedTickets['']?.[status] || [], () => onAddTicket?.(status))
          )}
        </div>
      )}
    </div>
  )
}
