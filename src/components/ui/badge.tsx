'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center rounded-full whitespace-nowrap border font-semibold tracking-[0.01em] transition-[background-color,border-color,color,box-shadow] duration-200 ease-out'
    
    const variants = {
      default: 'bg-[color:var(--primary-blue-light)] text-[color:var(--primary-blue-hover)] border-primary/15',
      success: 'bg-[color:color-mix(in_srgb,var(--success)_14%,transparent)] text-[color:var(--success)] border-[color:color-mix(in_srgb,var(--success)_26%,transparent)]',
      warning: 'bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)] text-[color:var(--warning)] border-[color:color-mix(in_srgb,var(--warning)_26%,transparent)]',
      error: 'bg-[color:color-mix(in_srgb,var(--danger)_12%,transparent)] text-[color:var(--danger)] border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)]',
      info: 'bg-sky-500/12 text-sky-700 dark:text-sky-300 border-sky-500/20',
      outline: 'bg-transparent text-muted-foreground border-border',
      secondary: 'bg-secondary text-secondary-foreground border-border/70',
      destructive: 'bg-[color:color-mix(in_srgb,var(--danger)_12%,transparent)] text-[color:var(--danger)] border-[color:color-mix(in_srgb,var(--danger)_24%,transparent)]',
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1 text-sm',
    }

    return (
      <span
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
