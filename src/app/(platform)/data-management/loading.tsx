import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in-0 duration-500 w-full h-full">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[250px]" />
        <Skeleton className="h-10 w-[140px]" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
        ))}
      </div>
      
      <div className="space-y-4 shadow-lg border border-border/50 rounded-2xl p-6 bg-card/50 backdrop-blur-sm">
        <Skeleton className="h-6 w-[200px] mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={`row-${i}`} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  )
}
