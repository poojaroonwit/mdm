import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-zinc-100/50 dark:bg-zinc-800/50',
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
