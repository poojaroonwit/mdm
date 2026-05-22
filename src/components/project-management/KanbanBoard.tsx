'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TicketCard } from './TicketCard'
import { Plus } from 'lucide-react'
import { useState } from 'react'

interface Ticket {
  id: string
  title: string
  description?: string | null
  status: string
  priority: string
  dueDate?: string | null
  startDate?: string | null
  estimate?: number | null
  labels?: string[]
  assignee?: {
    id: string
    name: string
    email: string
    avatar?: string | null
  } | null
  attributes?: Array<{
    id: string
    name: string
    displayName: string
    type: string
    value?: string | null
  }>
}

interface KanbanBoardProps {
  tickets: Ticket[]
  onTicketClick?: (ticket: Ticket) => void
  onAddTicket?: (status: string) => void
  onTicketMove?: (ticketId: string, newStatus: string) => void
}

const statusColumns = [
  { id: 'BACKLOG', title: 'Backlog', color: 'bg-gray-100 dark:bg-gray-800' },
  { id: 'TODO', title: 'To Do', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'IN_REVIEW', title: 'In Review', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'DONE', title: 'Done', color: 'bg-green-50 dark:bg-green-900/20' }
]

export function KanbanBoard({ tickets, onTicketClick, onAddTicket, onTicketMove }: KanbanBoardProps) {
  const [draggedTicket, setDraggedTicket] = useState<string | null>(null)

  const getTicketsByStatus = (status: string) => {
    return tickets.filter((ticket) => ticket.status === status)
  }

  const handleDragStart = (ticketId: string) => {
    setDraggedTicket(ticketId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault()
    if (draggedTicket && onTicketMove) {
      onTicketMove(draggedTicket, targetStatus)
    }
    setDraggedTicket(null)
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {statusColumns.map((column) => {
        const columnTickets = getTicketsByStatus(column.id)
        return (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full flex flex-col bg-card/80 text-card-foreground">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-semibold text-foreground">
                      {column.title}
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs font-medium">
                    {columnTickets.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[400px]">
                {columnTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    draggable
                    onDragStart={() => handleDragStart(ticket.id)}
                    className="cursor-move"
                  >
                    <TicketCard
                      ticket={ticket}
                      onClick={() => onTicketClick?.(ticket)}
                    />
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-foreground border-dashed border-2 hover:border-primary"
                  onClick={() => onAddTicket?.(column.id)}
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
  )
}

