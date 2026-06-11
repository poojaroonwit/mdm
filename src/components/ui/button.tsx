'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { ButtonHTMLAttributes, cloneElement, forwardRef, isValidElement, type ReactElement } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { Tooltip } from './tooltip'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-medium transition-[background-color,border-color,box-shadow,color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none select-none active:translate-y-px [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--primary-blue)] text-white border border-transparent shadow-[var(--shadow-blue-glow)] hover:bg-[var(--primary-blue-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-blue-glow-hover)]',
        default:
          'bg-[var(--primary-blue)] text-white border border-transparent shadow-[var(--shadow-blue-glow)] hover:bg-[var(--primary-blue-hover)] hover:-translate-y-px hover:shadow-[var(--shadow-blue-glow-hover)]',
        luxury:
          'bg-[var(--primary-navy)] text-white border border-white/10 shadow-[var(--shadow-blue-glow)] hover:bg-[var(--primary-blue-hover)] hover:shadow-[var(--shadow-blue-glow-hover)]',
        gradient:
          'bg-gradient-to-r from-[#3b82f6] to-[#4f46e5] text-white border border-transparent hover:opacity-90 hover:shadow-lg',
        glass:
          'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 shadow-xl',
        soft:
          'bg-[var(--primary-blue-soft)] text-[var(--primary-blue)] border border-transparent hover:bg-[color-mix(in_srgb,var(--primary-blue-soft)_80%,var(--primary-blue))]',
        'soft-blue':
          'bg-[color:color-mix(in_srgb,var(--primary-blue)_10%,transparent)] text-[var(--primary-blue)] border border-transparent hover:bg-[color:color-mix(in_srgb,var(--primary-blue)_16%,transparent)]',
        secondary:
          'bg-card text-foreground border border-border shadow-sm hover:bg-muted/70 hover:border-border',
        danger:
          'bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground',
        destructive:
          'bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive hover:text-destructive-foreground',
        warning:
          'bg-[color:color-mix(in_srgb,var(--warning)_14%,transparent)] text-[color:var(--warning)] border border-[color:color-mix(in_srgb,var(--warning)_26%,transparent)] hover:bg-[color:var(--warning)] hover:text-[color:var(--text-primary)]',
        success:
          'bg-[color:color-mix(in_srgb,var(--success)_14%,transparent)] text-[color:var(--success)] border border-[color:color-mix(in_srgb,var(--success)_26%,transparent)] hover:bg-[color:var(--success)] hover:text-white',
        outline:
          'bg-transparent text-foreground border border-border hover:bg-accent hover:text-accent-foreground',
        ghost:
          'bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        link:
          'h-auto bg-transparent p-0 text-primary underline-offset-4 shadow-none hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
        md: 'h-10 px-4 text-sm rounded-lg gap-2 max-md:min-h-11',
        default: 'h-10 px-4 text-sm rounded-lg gap-2 max-md:min-h-11',
        lg: 'h-11 px-6 text-base rounded-lg gap-2 max-md:min-h-11',
        icon: 'h-10 w-10 rounded-lg max-md:h-11 max-md:w-11',
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
  asChild?: boolean
}

export const Button = forwardRef<HTMLButtonElement | HTMLSpanElement, ButtonProps>(
  ({ className, variant, size, tooltip, children, as = 'button', asChild = false, ...props }, ref) => {
    const composedClassName = buttonVariants({ variant, size, className })

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<any>
      const button = cloneElement(child, {
        ...props,
        ref,
        className: cn(composedClassName, child.props.className),
      })

      if (tooltip) {
        return <Tooltip content={tooltip}>{button}</Tooltip>
      }

      return button
    }

    const Element = as === 'span' ? 'span' : 'button'

    const button = (
      <Element
        ref={ref as any}
        className={cn(composedClassName)}
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
