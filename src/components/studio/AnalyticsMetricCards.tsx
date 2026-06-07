import { Activity, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatNumber,
  formatPercentage,
  getStatusColor,
  type AnalyticsMetric,
} from './analyticsDashboardModel'

function getTrendIcon(trend: AnalyticsMetric['trend']) {
  switch (trend) {
    case 'up': return <TrendingUp className="h-4 w-4 text-primary" />
    case 'down': return <TrendingDown className="h-4 w-4 text-destructive" />
    case 'stable': return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

export function AnalyticsMetricCards({ metrics }: { metrics: AnalyticsMetric[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.slice(0, 4).map(metric => (
        <Card key={metric.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-muted-foreground">{metric.name}</div>
              <div className="flex items-center gap-1">
                {getTrendIcon(metric.trend)}
                <span className={`text-sm ${getStatusColor(metric.status)}`}>
                  {metric.change > 0 ? '+' : ''}{formatPercentage(metric.change)}
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold mb-1">
              {formatNumber(metric.value)} {metric.unit}
            </div>
            {metric.target && (
              <div className="text-xs text-muted-foreground">
                Target: {formatNumber(metric.target)} {metric.unit}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
