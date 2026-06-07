import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, HardDrive, Link, Zap } from 'lucide-react'

import type { DatabaseStats } from '../types'
import { formatBytes, formatDuration } from './database-management-utils'

interface DatabaseStatsCardsProps {
  stats: DatabaseStats
}

export function DatabaseStatsCards({ stats }: DatabaseStatsCardsProps) {
  const cards = [
    {
      label: 'Connections',
      value: stats.activeConnections,
      helper: `${stats.totalConnections} total`,
      Icon: Link
    },
    {
      label: 'Avg Query Time',
      value: formatDuration(stats.avgQueryTime),
      helper: `${stats.slowQueries} slow queries`,
      Icon: Clock
    },
    {
      label: 'Cache Hit Rate',
      value: `${stats.cacheHitRate.toFixed(1)}%`,
      helper: 'Cache efficiency',
      Icon: Zap
    },
    {
      label: 'Database Size',
      value: formatBytes(stats.databaseSize),
      helper: `${stats.tableCount} tables`,
      Icon: HardDrive
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, helper, Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">{helper}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
