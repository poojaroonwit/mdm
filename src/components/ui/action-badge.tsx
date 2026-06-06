'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'

const ACTION_VARIANTS: Record<string, BadgeVariant> = {
  create: 'success',
  member_added: 'success',
  invitation_accepted: 'success',
  read: 'info',
  update: 'info',
  role_changed: 'info',
  permissions_updated: 'info',
  login: 'secondary',
  logout: 'secondary',
  invitation_sent: 'secondary',
  delete: 'destructive',
  member_removed: 'destructive',
  remove: 'destructive',
}

function normalizeAction(action: string) {
  return action.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function formatAction(action: string) {
  return action.replace(/[_-]/g, ' ')
}

interface ActionBadgeProps {
  action: string
  label?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function getActionBadgeVariant(action: string): BadgeVariant {
  return ACTION_VARIANTS[normalizeAction(action)] ?? 'secondary'
}

export function ActionBadge({ action, label, children, className, size = 'md' }: ActionBadgeProps) {
  return (
    <Badge
      variant={getActionBadgeVariant(action)}
      size={size}
      className={cn('capitalize', className)}
    >
      {children ?? label ?? formatAction(action)}
    </Badge>
  )
}
