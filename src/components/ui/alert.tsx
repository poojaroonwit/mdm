'use client'

import * as React from 'react'
import { clsx } from 'clsx'

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: 'default' | 'destructive' }
>(({ className, variant = 'default', ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={clsx(
      'relative w-full rounded-xl border border-zinc-100/60 dark:border-zinc-800/60 p-4 backdrop-blur-md [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
      {
        'bg-white/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100': variant === 'default',
        'bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-900/50 text-red-600 dark:text-red-400 [&>svg]:text-red-600 dark:[&>svg]:text-red-400':
          variant === 'destructive',
      },
      className
    )}
    {...props}
  />
))
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={clsx('mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] leading-none', className)}
    {...props}
  />
))
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={clsx('text-xs font-medium text-zinc-500 dark:text-zinc-400 [&_p]:leading-relaxed', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
