'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export interface CardFields {
  description?: boolean
  dueDate?: boolean
  estimate?: boolean
  assignee?: boolean
  labels?: boolean
  spaces?: boolean
  attributes?: boolean
}

const DEFAULT_FIELDS: CardFields = {
  description: true,
  dueDate: true,
  estimate: true,
  assignee: true,
  labels: true,
  spaces: true,
  attributes: true,
}

interface TicketCardProps {
  ticket: {
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
      email?: string
      avatar?: string | null
    } | null
    spaces?: Array<{
      space: {
        id: string
        name: string
        slug: string
      }
    }>
    attributes?: Array<{
      id: string
      name: string
      displayName: string
      type: string
      value?: string | null
    }>
  }
  onClick?: () => void
  showSpaces?: boolean
  visibleFields?: CardFields
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-300',
  MEDIUM: 'bg-blue-100 text-blue-700 border-blue-300',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-300',
  URGENT: 'bg-red-100 text-red-700 border-red-300'
}

const priorityDots = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
}

export function TicketCard({ ticket, onClick, showSpaces = false, visibleFields }: TicketCardProps) {
  const fields = { ...DEFAULT_FIELDS, ...visibleFields }

  return (
    <Card
      className="group cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-transparent hover:border-l-primary bg-white dark:bg-gray-900"
      onClick={onClick}
    >
      <div className="p-3 space-y-2">
        {/* Header with priority dot and title */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDots[ticket.priority as keyof typeof priorityDots] || priorityDots.MEDIUM}`} />
            <h4 className="font-medium text-sm line-clamp-2 text-gray-900 dark:text-gray-100">
              {ticket.title}
            </h4>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {/* Spaces */}
        {fields.spaces && showSpaces && ticket.spaces && ticket.spaces.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.spaces.slice(0, 2).map((spaceRelation) => (
              <Badge
                key={spaceRelation.space.id}
                variant="outline"
                className="text-xs px-1.5 py-0 h-5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                {spaceRelation.space.name}
              </Badge>
            ))}
            {ticket.spaces.length > 2 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                +{ticket.spaces.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Description */}
        {fields.description && ticket.description && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {ticket.description}
          </p>
        )}

        {/* Labels */}
        {fields.labels && ticket.labels && ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.slice(0, 3).map((label, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="text-xs px-1.5 py-0 h-5 bg-gray-50 dark:bg-gray-800"
              >
                {label}
              </Badge>
            ))}
            {ticket.labels.length > 3 && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                +{ticket.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Custom attributes preview */}
        {fields.attributes && ticket.attributes && ticket.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.attributes.slice(0, 2).map((attr) => (
              <div
                key={attr.id}
                className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded"
              >
                <span className="font-medium">{attr.displayName}:</span>{' '}
                <span>{attr.value || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer with metadata */}
        {(fields.dueDate || fields.estimate || fields.assignee) && (
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {fields.dueDate && ticket.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(ticket.dueDate), 'MMM d')}</span>
                </div>
              )}
              {fields.estimate && ticket.estimate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{ticket.estimate}h</span>
                </div>
              )}
            </div>

            {fields.assignee && ticket.assignee && (
              <Avatar className="h-6 w-6 border-2 border-white dark:border-gray-900">
                <AvatarImage src={ticket.assignee.avatar || undefined} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {ticket.assignee.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
