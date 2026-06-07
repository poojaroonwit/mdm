import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

import type { QueryPerformance } from '../types'
import { formatDuration } from './database-management-utils'

interface DatabasePerformanceTabProps {
  performance: QueryPerformance[]
}

export function DatabasePerformanceTab({ performance }: DatabasePerformanceTabProps) {
  return (
    <>
      <h3 className="text-lg font-semibold">Query Performance</h3>
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
          <CardDescription>Query execution performance and slow queries</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {performance.map((query) => (
                <div key={query.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm mb-1 truncate">
                      {query.query.substring(0, 100)}...
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {query.timestamp.toLocaleString()} - {query.rowsAffected} rows
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="font-medium">{formatDuration(query.executionTime)}</div>
                      {query.isSlow && (
                        <Badge variant="destructive" className="text-xs">Slow</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </>
  )
}
