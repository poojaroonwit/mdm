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
      'inline-flex items-center justify-center whitespace-nowrap font-bold uppercase tracking-wider',
      'transition-all duration-300',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-500',
      'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none',
    ].join(' ')

    const variantStyles: Record<string, string> = {
      // Solid Zinc — Professional & High Contrast
      primary:
        'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 ' +
        'hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-[1.02] ' +
        'active:scale-[0.98]',
      default:
        'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 ' +
        'hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-[1.02] ' +
        'active:scale-[0.98]',
      secondary:
        'bg-zinc-100/80 text-zinc-900 dark:bg-zinc-800/80 dark:text-zinc-50 ' +
        'border border-zinc-200/50 dark:border-zinc-700/50 backdrop-blur-sm ' +
        'hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 ' +
        'active:scale-[0.98]',
      danger:
        'bg-red-500/10 text-red-600 dark:text-red-400 ' +
        'border border-red-500/20 ' +
        'hover:bg-red-500 hover:text-white ' +
        'active:scale-[0.98]',
      destructive:
        'bg-red-500/10 text-red-600 dark:text-red-400 ' +
        'border border-red-500/20 ' +
        'hover:bg-red-500 hover:text-white ' +
        'active:scale-[0.98]',
      warning:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 ' +
        'border border-amber-500/20 ' +
        'hover:bg-amber-500 hover:text-white ' +
        'active:scale-[0.98]',
      success:
        'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ' +
        'border border-emerald-500/20 ' +
        'hover:bg-emerald-500 hover:text-white ' +
        'active:scale-[0.98]',

      // Outline — Glassmorphism Lite
      outline:
        'bg-white/40 dark:bg-zinc-950/40 text-zinc-900 dark:text-zinc-100 ' +
        'border border-zinc-200/60 dark:border-zinc-800/60 backdrop-blur-md ' +
        'hover:bg-white/60 dark:hover:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-700 ' +
        'active:scale-[0.98]',

      // Ghost — Subtle Dock Style
      ghost:
        'bg-transparent text-zinc-500 dark:text-zinc-400 ' +
        'hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100 ' +
        'active:scale-[0.98]',
    }

    const sizeStyles: Record<string, string> = {
      sm: 'h-8 px-3 text-[9px] rounded-lg gap-1.5',
      md: 'h-10 px-5 text-[10px] rounded-xl gap-2',
      default: 'h-10 px-5 text-[10px] rounded-xl gap-2',
      lg: 'h-12 px-6 text-xs rounded-2xl gap-2.5',
      icon: 'h-10 w-10 rounded-xl',
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
