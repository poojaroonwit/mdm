import { Clock } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { LogStats } from '../types'
import { formatDuration, logStatIcons } from './log-management-utils'

interface LogStatsCardsProps {
  stats: LogStats
}

export function LogStatsCards({ stats }: LogStatsCardsProps) {
  const cards = [
    {
      label: 'Total Logs',
      value: stats.total.toLocaleString(),
      helper: `${stats.errorRate.toFixed(1)}% error rate`,
      Icon: logStatIcons.total
    },
    {
      label: 'Error Rate',
      value: `${stats.errorRate.toFixed(1)}%`,
      helper: `${stats.byLevel.ERROR || 0} errors`,
      Icon: logStatIcons.errorRate
    },
    {
      label: 'Avg Response',
      value: formatDuration(stats.avgResponseTime),
      helper: 'Response time',
      Icon: Clock
    },
    {
      label: 'Services',
      value: Object.keys(stats.byService).length,
      helper: 'Active services',
      Icon: logStatIcons.services
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, helper, Icon }) => (
        <Card key={label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4 text-zinc-400" />
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
