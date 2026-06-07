import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { GovernanceMetrics } from '../types'

interface GovernanceMetricsGridProps {
  metrics: GovernanceMetrics
}

const metricCards = [
  { label: 'Total Assets', value: (metrics: GovernanceMetrics) => metrics.totalAssets },
  { label: 'With Policies', value: (metrics: GovernanceMetrics) => metrics.assetsWithPolicies },
  { label: 'Quality Checks', value: (metrics: GovernanceMetrics) => metrics.assetsWithQualityChecks },
  { label: 'Avg Quality Score', value: (metrics: GovernanceMetrics) => metrics.averageQualityScore.toFixed(1) },
  { label: 'Policy Compliance', value: (metrics: GovernanceMetrics) => `${metrics.policyComplianceRate.toFixed(1)}%` },
  {
    label: 'Classification Coverage',
    value: (metrics: GovernanceMetrics) => `${metrics.dataClassificationCoverage.toFixed(1)}%`
  }
]

export function GovernanceMetricsGrid({ metrics }: GovernanceMetricsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metricCards.map((card) => (
        <Card key={card.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value(metrics)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
