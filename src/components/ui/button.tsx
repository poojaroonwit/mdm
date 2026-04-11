'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Tooltip } from './tooltip'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none select-none [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  {
    variants: {
        primary:
          'bg-gradient-to-br from-[var(--primary-navy)] to-[var(--primary-blue)] text-primary-foreground border border-transparent shadow-[var(--shadow-blue-glow)] hover:-translate-y-px hover:shadow-[var(--shadow-blue-glow-hover)]',
        default:
          'bg-gradient-to-br from-[var(--primary-navy)] to-[var(--primary-blue)] text-primary-foreground border border-transparent shadow-[var(--shadow-blue-glow)] hover:-translate-y-px hover:shadow-[var(--shadow-blue-glow-hover)]',
        luxury:
          'bg-gradient-to-b from-[#1e40af] to-[#172554] text-white border border-white/10 shadow-[var(--shadow-blue-glow)] hover:shadow-[var(--shadow-blue-glow-hover)] hover:scale-[1.02] active:scale-[0.98]',
        gradient:
          'bg-gradient-to-r from-[#3b82f6] to-[#4f46e5] text-white border border-transparent hover:opacity-90 hover:shadow-lg',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-xl',
        soft:
          'bg-[var(--primary-blue-light)] text-[var(--primary-blue)] border border-transparent hover:bg-[color-mix(in_srgb,var(--primary-blue-light)_88%,black)]',
        secondary:
          'bg-secondary text-secondary-foreground border border-border shadow-md hover:bg-secondary/80',
        danger:
          'bg-[color:color-mix(in_srgb,var(--destructive)_12%,transparent)] text-[color:var(--destructive)] border border-[color:color-mix(in_srgb,var(--destructive)_24%,transparent)] hover:bg-[color:var(--destructive)] hover:text-white',
        destructive:
          'bg-[color:color-mix(in_srgb,var(--destructive)_12%,transparent)] text-[color:var(--destructive)] border border-[color:color-mix(in_srgb,var(--destructive)_24%,transparent)] hover:bg-[color:var(--destructive)] hover:text-white',
        warning:
          'bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)] text-[color:var(--warning)] border border-[color:color-mix(in_srgb,var(--warning)_26%,transparent)] hover:bg-[color:var(--warning)] hover:text-[color:var(--text-primary)]',
        success:
          'bg-[color:color-mix(in_srgb,var(--success)_14%,transparent)] text-[color:var(--success)] border border-[color:color-mix(in_srgb,var(--success)_26%,transparent)] hover:bg-[color:var(--success)] hover:text-white',
        outline:
          'bg-transparent text-foreground border border-border hover:bg-accent hover:text-accent-foreground',
        ghost:
          'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      size: {
        sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
        md: 'h-10 px-4 py-2 text-sm rounded-md gap-2',
        default: 'h-10 px-4 py-2 text-sm rounded-md gap-2',
        lg: 'h-11 px-8 text-base rounded-md gap-2',
        icon: 'h-10 w-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  tooltip?: string
  as?: 'button' | 'span'
}

export const Button = forwardRef<HTMLButtonElement | HTMLSpanElement, ButtonProps>(
  ({ className, variant, size, tooltip, children, as = 'button', ...props }, ref) => {
    const Element = as === 'span' ? 'span' : 'button'

    const button = (
      <Element
        ref={ref as any}
        className={cn(buttonVariants({ variant, size, className }))}
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
