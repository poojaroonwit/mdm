import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded-xl bg-muted/30 dark:bg-muted/10',
        'bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent',
        '[background-size:1000px_100%]',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
