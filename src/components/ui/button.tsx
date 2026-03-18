'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Tooltip } from './tooltip'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'success' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  tooltip?: string
  as?: 'button' | 'span'
}

export const Button = forwardRef<HTMLButtonElement | HTMLSpanElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', tooltip, children, as = 'button', ...props }, ref) => {
    const Element = as === 'span' ? 'span' : 'button'
    
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
    
    const variantStyles = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-transparent',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm border border-transparent',
      outline: 'bg-transparent text-foreground border border-input hover:bg-accent hover:text-accent-foreground',
      ghost: 'bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground border border-transparent',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent',
      warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-sm border border-transparent',
      success: 'bg-green-500 text-white hover:bg-green-600 shadow-sm border border-transparent',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm border border-transparent',
    }
    
    const sizeStyles = {
      sm: 'h-8 px-3 text-xs rounded-md',
      md: 'h-10 px-4 py-2 text-sm rounded-md',
      lg: 'h-11 px-8 text-base rounded-md',
      icon: 'h-10 w-10 rounded-md',
    }

    const button = (
      <Element
        ref={ref as any}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...(as === 'button' ? (props as any) : {})}
      >
        {children}
      </Element>
    )

    if (tooltip) {
      return <Tooltip content={tooltip}>{button}</Tooltip>
    }

    return button
  }
)

Button.displayName = 'Button'
