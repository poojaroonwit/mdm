'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Tooltip } from './tooltip'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning' | 'success' | 'destructive' | 'default'
  size?: 'sm' | 'md' | 'lg' | 'icon' | 'default'
  tooltip?: string
  as?: 'button' | 'span'
}

export const Button = forwardRef<HTMLButtonElement | HTMLSpanElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', tooltip, children, as = 'button', ...props }, ref) => {
    const Element = as === 'span' ? 'span' : 'button'

    const baseStyles = [
      'inline-flex items-center justify-center whitespace-nowrap font-medium',
      'transition-all duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
    ].join(' ')

    const variantStyles: Record<string, string> = {
      // Solid filled — 100% opaque background + shadow
      primary:
        'bg-primary text-primary-foreground border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',
      default:
        'bg-primary text-primary-foreground border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',
      secondary:
        'bg-secondary text-secondary-foreground border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] ' +
        'hover:brightness-95 active:brightness-90 active:scale-[0.98] active:shadow-none',
      danger:
        'bg-destructive text-destructive-foreground border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',
      destructive:
        'bg-destructive text-destructive-foreground border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',
      warning:
        'bg-yellow-500 text-white border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',
      success:
        'bg-green-600 text-white border-0 ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-110 active:brightness-95 active:scale-[0.98] active:shadow-none',

      // Outline — transparent bg, visible border, no shadow
      outline:
        'bg-background text-foreground border border-border ' +
        'hover:bg-accent hover:text-accent-foreground ' +
        'active:scale-[0.98]',

      // Ghost — no bg, no border, no shadow
      ghost:
        'bg-transparent text-foreground border border-transparent ' +
        'hover:bg-accent hover:text-accent-foreground ' +
        'active:scale-[0.98]',
    }

    const sizeStyles: Record<string, string> = {
      sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
      md: 'h-9 px-4 text-sm rounded-md gap-2',
      default: 'h-9 px-4 text-sm rounded-md gap-2',
      lg: 'h-11 px-6 text-base rounded-md gap-2',
      icon: 'h-9 w-9 rounded-md',
    }

    const resolvedVariant = (variantStyles[variant] ?? variantStyles.primary)
    const resolvedSize = (sizeStyles[size] ?? sizeStyles.md)

    const button = (
      <Element
        ref={ref as any}
        className={cn(baseStyles, resolvedVariant, resolvedSize, className)}
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
