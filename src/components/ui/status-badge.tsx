'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  active: 'success',
  applied: 'success',
  approved: 'success',
  available: 'success',
  compliant: 'success',
  configured: 'success',
  completed: 'success',
  connected: 'success',
  current: 'success',
  enabled: 'success',
  good: 'success',
  healthy: 'success',
  internal: 'success',
  info: 'info',
  low: 'success',
  merged: 'success',
  new: 'success',
  online: 'success',
  passed: 'success',
  primary: 'success',
  public: 'info',
  published: 'success',
  resolved: 'success',
  saved: 'success',
  sent: 'success',
  success: 'success',
  valid: 'success',
  yes: 'success',
  done: 'success',

  default: 'info',
  enforced: 'info',
  pending: 'warning',
  queued: 'warning',
  required: 'warning',
  scheduled: 'warning',
  medium: 'warning',
  'on-hold': 'warning',
  paused: 'warning',
  'unsaved-changes': 'warning',
  warn: 'warning',
  warning: 'warning',
  'in-progress': 'warning',
  'in-review': 'warning',

  cancelled: 'error',
  critical: 'destructive',
  corrupted: 'error',
  error: 'error',
  expired: 'error',
  failed: 'error',
  fatal: 'destructive',
  high: 'error',
  invalid: 'error',
  rejected: 'error',
  'rolled-back': 'error',
  unhealthy: 'error',
  unavailable: 'error',

  processing: 'info',
  planning: 'info',
  running: 'info',
  todo: 'info',
  urgent: 'destructive',

  archived: 'secondary',
  assigned: 'secondary',
  backlog: 'secondary',
  debug: 'secondary',
  disabled: 'secondary',
  disconnected: 'secondary',
  draft: 'secondary',
  external: 'secondary',
  idle: 'secondary',
  inactive: 'secondary',
  'not-configured': 'secondary',
  'not-enforced': 'secondary',
  'not-unique': 'secondary',
  no: 'secondary',
  off: 'secondary',
  offline: 'secondary',
  on: 'success',
  'on-demand': 'secondary',
  optional: 'secondary',
  private: 'secondary',
  standard: 'secondary',
  stopped: 'secondary',
  unique: 'secondary',
  'unpublished-changes': 'warning',
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s_]+/g, '-')
}

export function getStatusBadgeVariant(status: string): BadgeVariant {
  return STATUS_VARIANTS[normalizeStatus(status)] ?? 'outline'
}

interface StatusBadgeProps {
  status: string
  label?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function StatusBadge({ status, label, children, className, size = 'md' }: StatusBadgeProps) {
  return (
    <Badge
      variant={getStatusBadgeVariant(status)}
      size={size}
      className={cn('capitalize', className)}
    >
      {children ?? label ?? status}
    </Badge>
  )
}
