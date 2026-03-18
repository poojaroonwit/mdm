'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center font-medium rounded-full'
    
    const variants = {
      default: 'bg-gray-100 text-gray-700',
      success: 'bg-green-50 text-green-700 border border-green-200/50',
      warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200/50',
      error: 'bg-red-50 text-red-700 border border-red-200/50',
      info: 'bg-blue-50 text-blue-700 border border-blue-200/50',
      outline: 'bg-transparent text-gray-700 border border-gray-200',
      secondary: 'bg-blue-100 text-blue-700',
      destructive: 'bg-red-100 text-red-700',
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
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
