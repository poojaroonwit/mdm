'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Calendar, Clock, MoreHorizontal, Trash2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { stripHtmlTags } from './project-config'

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
  onOpenAction?: () => void
  onDeleteAction?: () => void
  showSpaces?: boolean
  visibleFields?: CardFields
  flat?: boolean
  accentColor?: string
}

export function TicketCard({
  ticket,
  onClick,
  onOpenAction,
  onDeleteAction,
  showSpaces = false,
  visibleFields,
  flat = false,
  accentColor,
}: TicketCardProps) {
  const fields = { ...DEFAULT_FIELDS, ...visibleFields }
  const Container = flat ? 'div' : Card
  const plainDescription = stripHtmlTags(ticket.description)

  return (
    <Container
      className={cn(
        'group cursor-pointer bg-card text-card-foreground shadow-sm',
        flat
          ? 'rounded-2xl border border-border/80 transition-all duration-200 hover:bg-muted/30 hover:shadow-md'
          : 'rounded-2xl border border-border/80 transition-all duration-200 hover:border-primary/40 hover:shadow-md'
      )}
      style={flat && accentColor ? { boxShadow: `inset 3px 0 0 ${accentColor}` } : undefined}
      onClick={onClick}
    >
      <div className="space-y-2 p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h4 className="line-clamp-2 text-sm font-medium text-foreground">
              {ticket.title}
            </h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(event) => {
                  event.stopPropagation()
                }}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={(event) => {
                  event.stopPropagation()
                  ;(onOpenAction || onClick)?.()
                }}
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Open Ticket
              </DropdownMenuItem>
              {onDeleteAction && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDeleteAction()
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Ticket
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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

        {fields.description && plainDescription && (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {plainDescription}
          </p>
        )}

        {fields.labels && ticket.labels && ticket.labels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ticket.labels.slice(0, 3).map((label, index) => (
              <Badge
                key={index}
                variant="outline"
                className="h-5 bg-muted px-1.5 py-0 text-xs text-muted-foreground"
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
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                <span className="font-medium">{attr.displayName}:</span>{' '}
                <span>{attr.value || '--'}</span>
              </div>
            ))}
          </div>
        )}

        {(fields.dueDate || fields.estimate || fields.assignee) && (
          <div className="flex items-center justify-between border-t border-border/70 pt-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
              <Avatar className="h-6 w-6 border-2 border-background">
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
