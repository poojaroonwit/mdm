'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'

type Taxonomy =
  | 'backup'
  | 'collaboration'
  | 'notification'
  | 'relationship'
  | 'sql'
  | 'ticket-relationship'

const TAXONOMY_VARIANTS: Record<Taxonomy, Record<string, BadgeVariant>> = {
  backup: {
    full: 'info',
    incremental: 'success',
    differential: 'warning',
  },
  collaboration: {
    announcement: 'info',
    conversation: 'secondary',
    task: 'info',
    discussion: 'secondary',
    comment: 'secondary',
  },
  notification: {
    email: 'info',
    push: 'success',
    sms: 'warning',
    webhook: 'default',
  },
  relationship: {
    one_to_one: 'info',
    one_to_many: 'success',
    many_to_many: 'default',
  },
  sql: {
    security: 'destructive',
    performance: 'warning',
    best_practice: 'info',
    style: 'secondary',
    safety: 'destructive',
  },
  'ticket-relationship': {
    blocks: 'destructive',
    blocked_by: 'warning',
    relates_to: 'info',
    parent: 'default',
    child: 'success',
    duplicate: 'warning',
    clones: 'secondary',
  },
}

function normalizeTaxonomyValue(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function formatTaxonomyValue(value: string) {
  return value.replace(/[_-]/g, ' ')
}

interface TaxonomyBadgeProps {
  taxonomy: Taxonomy
  value: string
  label?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function getTaxonomyBadgeVariant(taxonomy: Taxonomy, value: string): BadgeVariant {
  return TAXONOMY_VARIANTS[taxonomy][normalizeTaxonomyValue(value)] ?? 'secondary'
}

export function TaxonomyBadge({
  taxonomy,
  value,
  label,
  children,
  className,
  size = 'md',
}: TaxonomyBadgeProps) {
  return (
    <Badge
      variant={getTaxonomyBadgeVariant(taxonomy, value)}
      size={size}
      className={cn('capitalize', className)}
    >
      {children ?? label ?? formatTaxonomyValue(value)}
    </Badge>
  )
}
