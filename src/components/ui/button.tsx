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
      'transition-all duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
    ].join(' ')

    const variantStyles: Record<string, string> = {
      // Solid filled — 100% opaque background + layered shadow with hover lift
      primary:
        'bg-primary text-primary-foreground border-0 ' +
        'shadow-[0_2px_8px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      default:
        'bg-primary text-primary-foreground border-0 ' +
        'shadow-[0_2px_8px_rgba(0,0,0,0.18),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(0,0,0,0.22),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      secondary:
        'bg-secondary text-secondary-foreground border-0 ' +
        'shadow-[0_2px_6px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.08)] ' +
        'hover:brightness-95 hover:shadow-[0_4px_12px_rgba(0,0,0,0.14),0_2px_5px_rgba(0,0,0,0.10)] ' +
        'active:brightness-90 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.08)]',
      danger:
        'bg-destructive text-destructive-foreground border-0 ' +
        'shadow-[0_2px_8px_rgba(239,68,68,0.30),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(239,68,68,0.38),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      destructive:
        'bg-destructive text-destructive-foreground border-0 ' +
        'shadow-[0_2px_8px_rgba(239,68,68,0.30),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(239,68,68,0.38),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      warning:
        'bg-yellow-500 text-white border-0 ' +
        'shadow-[0_2px_8px_rgba(234,179,8,0.35),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(234,179,8,0.42),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',
      success:
        'bg-green-600 text-white border-0 ' +
        'shadow-[0_2px_8px_rgba(22,163,74,0.30),0_1px_3px_rgba(0,0,0,0.12)] ' +
        'hover:brightness-110 hover:shadow-[0_4px_14px_rgba(22,163,74,0.38),0_2px_6px_rgba(0,0,0,0.14)] ' +
        'active:brightness-95 active:scale-[0.98] active:shadow-[0_1px_3px_rgba(0,0,0,0.12)]',

      // Outline — transparent bg, visible border, subtle shadow
      outline:
        'bg-background text-foreground border border-border ' +
        'shadow-[0_1px_3px_rgba(0,0,0,0.07),0_1px_2px_rgba(0,0,0,0.05)] ' +
        'hover:bg-accent hover:text-accent-foreground hover:shadow-[0_2px_6px_rgba(0,0,0,0.10)] ' +
        'active:scale-[0.98] active:shadow-none',

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
      icon: 'h-9 w-9 rounded-full',
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
