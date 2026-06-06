'use client'

import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'

const ROLE_VARIANTS: Record<string, BadgeVariant> = {
  owner: 'destructive',
  super_admin: 'destructive',
  superadmin: 'destructive',
  admin: 'warning',
  commenter: 'info',
  manager: 'info',
  editor: 'info',
  member: 'success',
  user: 'success',
  viewer: 'secondary',
}

function normalizeRole(role: string) {
  return role.trim().toLowerCase().replace(/[\s-]+/g, '_')
}

function formatRole(role: string) {
  return role.replace(/[_-]/g, ' ')
}

interface RoleBadgeProps {
  role: string
  label?: string
  children?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function getRoleBadgeVariant(role: string): BadgeVariant {
  return ROLE_VARIANTS[normalizeRole(role)] ?? 'secondary'
}

export function RoleBadge({ role, label, children, className, size = 'md' }: RoleBadgeProps) {
  return (
    <Badge
      variant={getRoleBadgeVariant(role)}
      size={size}
      className={cn('capitalize', className)}
    >
      {children ?? label ?? formatRole(role)}
    </Badge>
  )
}
