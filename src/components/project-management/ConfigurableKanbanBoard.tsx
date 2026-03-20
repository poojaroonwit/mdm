'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketCard, CardFields } from './TicketCard'
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

interface ConfigurableKanbanBoardProps {
  tickets: Ticket[]
  config: KanbanConfig
  onConfigChange?: (config: KanbanConfig) => void
  onTicketClick?: (ticket: Ticket) => void
  onAddTicket?: (status: string, groupKey?: string) => void
  onTicketMove?: (ticketId: string, newStatus: string, newGroupKey?: string) => void
  showSpaces?: boolean
}

export function ConfigurableKanbanBoard({
  tickets,
  config,
  onConfigChange,
  onTicketClick,
  onAddTicket,
  onTicketMove,
  showSpaces = false,
}: ConfigurableKanbanBoardProps) {
  // Group tickets based on configuration
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

  const statusColumns = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

  return (
    <div className="space-y-4">
      {config.rows ? (
        // Row-based grouping
        <div className="space-y-6">
          {Object.entries(groupedTickets).map(([rowKey, columns]) => (
            <div key={rowKey} className="space-y-2">
              <h3 className="text-lg font-semibold">{rowKey || 'Unassigned'}</h3>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {statusColumns.map((status) => {
                  const columnTickets = columns[status] || []
                  return (
                    <div key={status} className="flex-shrink-0 w-80">
                      <Card className="h-full flex flex-col">
                        <CardHeader className="pb-3 border-b">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-semibold">{status}</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                              {columnTickets.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[300px]">
                          {columnTickets.map((ticket) => (
                            <TicketCard
                              key={ticket.id}
                              ticket={ticket}
                              onClick={() => onTicketClick?.(ticket)}
                              showSpaces={showSpaces}
                              visibleFields={config.cardFields}
                            />
                          ))}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start border-dashed"
                            onClick={() => onAddTicket?.(status, rowKey)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add ticket
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Standard column-based view
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => {
            const columnTickets = groupedTickets['']?.[status] || []
            return (
              <div key={status} className="flex-shrink-0 w-80">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{status}</CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {columnTickets.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
                    {columnTickets.map((ticket) => (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        onClick={() => onTicketClick?.(ticket)}
                        showSpaces={showSpaces}
                        visibleFields={config.cardFields}
                      />
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start border-dashed"
                      onClick={() => onAddTicket?.(status)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add ticket
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
