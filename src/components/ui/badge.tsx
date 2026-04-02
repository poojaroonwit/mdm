'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-black uppercase tracking-wider rounded-md whitespace-nowrap transition-all duration-300'
    
    const variants = {
      default: 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900',
      success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
      warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      error: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
      info: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
      outline: 'bg-transparent text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800',
      secondary: 'bg-zinc-100/80 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50 border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm',
      destructive: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    }
    
    const sizes = {
      sm: 'px-1.5 py-0.5 text-[8px]',
      md: 'px-2 py-0.5 text-[9px]',
      lg: 'px-2.5 py-1 text-[10px]',
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
