'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

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
  flat?: boolean
  accentColor?: string
}

const priorityDots = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500',
}

export function TicketCard({
  ticket,
  onClick,
  showSpaces = false,
  visibleFields,
  flat = false,
  accentColor,
}: TicketCardProps) {
  const fields = { ...DEFAULT_FIELDS, ...visibleFields }
  const Container = flat ? 'div' : Card

  return (
    <Container
      className={cn(
        'group cursor-pointer bg-white dark:bg-gray-900',
        flat
          ? 'border-l-2 border-transparent hover:bg-muted/30'
          : 'border-l-4 border-l-transparent transition-all duration-200 hover:border-l-primary hover:shadow-md'
      )}
      style={flat && accentColor ? { borderLeftColor: accentColor } : undefined}
      onClick={onClick}
    >
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className={cn('h-2 w-2 flex-shrink-0 rounded-full', priorityDots[ticket.priority as keyof typeof priorityDots] || priorityDots.MEDIUM)} />
            <h4 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {ticket.title}
            </h4>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>

        {fields.spaces && showSpaces && ticket.spaces && ticket.spaces.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.spaces.slice(0, 2).map((spaceRelation) => (
              <Badge
                key={spaceRelation.space.id}
                variant="outline"
                className="h-5 border-blue-200 bg-blue-50 px-1.5 py-0 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
              >
                {spaceRelation.space.name}
              </Badge>
            ))}
            {ticket.spaces.length > 2 && (
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-xs">
                +{ticket.spaces.length - 2}
              </Badge>
            )}
          </div>
        )}

        {fields.description && ticket.description && (
          <p className="line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
            {ticket.description}
          </p>
        )}

        {fields.labels && ticket.labels && ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.slice(0, 3).map((label, index) => (
              <Badge
                key={index}
                variant="outline"
                className="h-5 bg-gray-50 px-1.5 py-0 text-xs dark:bg-gray-800"
              >
                {label}
              </Badge>
            ))}
            {ticket.labels.length > 3 && (
              <Badge variant="outline" className="h-5 px-1.5 py-0 text-xs">
                +{ticket.labels.length - 3}
              </Badge>
            )}
          </div>
        )}

        {fields.attributes && ticket.attributes && ticket.attributes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.attributes.slice(0, 2).map((attr) => (
              <div
                key={attr.id}
                className="rounded bg-gray-50 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                <span className="font-medium">{attr.displayName}:</span>{' '}
                <span>{attr.value || '--'}</span>
              </div>
            ))}
          </div>
        )}

        {(fields.dueDate || fields.estimate || fields.assignee) && (
          <div className="flex items-center justify-between border-t border-gray-100 pt-1 dark:border-gray-800">
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
                <AvatarFallback className="bg-primary/10 text-xs text-primary">
                  {ticket.assignee.name
                    .split(' ')
                    .map((name) => name[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        )}
      </div>
    </Container>
  )
}
